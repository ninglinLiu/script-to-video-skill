"""Local-only soundtrack mix. Never plays audio, fetches media, or overwrites inputs.

--voice 传"旁白 + 音效"的混合轨：音乐让位于它，它本身不被改动比例。
不传 --voice 就是纯音乐片（如临界点风格）：音乐直接做到总轨响度，默认 −14 LUFS、淡入 0.5 秒、淡出 3 秒。
--track 用 assets/music/catalog.json 里的曲目预设，并校验音乐文件哈希、把署名写进报告。
"""
import argparse
import array
import hashlib
import json
import math
import statistics
import subprocess
import tempfile
import wave
from pathlib import Path

CATALOG = Path(__file__).resolve().parents[1] / 'assets/music/catalog.json'
MODIFIED = 'Music trimmed, loudness-normalized, faded and ducked beneath narration and sound effects.'
MODIFIED_ONLY = 'Music trimmed, loudness-normalized and faded.'


def run(args):
    result = subprocess.run(args, capture_output=True, text=True, encoding='utf-8')
    if result.returncode:
        raise RuntimeError(result.stderr[-4000:])
    return result


def probe(path):
    return json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]).stdout)


def fingerprint(path):
    with Path(path).open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def video_hash(path):
    return run(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v:0', '-c', 'copy', '-f', 'hash', '-hash', 'sha256', '-']).stdout.strip()


def level_db(path, window=.1, rate=8000):
    """整段音频每 window 秒的 RMS（dBFS）。只用标准库，用来核对避让量，不判断听感。"""
    mono = Path(str(path) + '.mono.wav')
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(path), '-ac', '1', '-ar', str(rate), '-c:a', 'pcm_s16le', str(mono)])
    with wave.open(str(mono), 'rb') as w:
        samples = array.array('h', w.readframes(w.getnframes()))
    mono.unlink()
    size = int(window * rate)
    out = []
    for i in range(0, len(samples) - size + 1, size):
        energy = sum(x * x for x in samples[i:i + size]) / size
        out.append(10 * math.log10(energy / 32768 ** 2) if energy > 0 else -120.0)
    return out


def lufs(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(path), '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8').stderr
    return float(out[out.rfind('I:'):].split()[1])


def ducking_measure(voice, bed, ducked):
    """音乐在有声段比无声段多压低多少，以及有声段里人声比音乐高多少。"""
    v, b, d = level_db(voice), level_db(bed), level_db(ducked)
    n = min(len(v), len(b), len(d))
    active = [i for i in range(n) if v[i] > -45]
    quiet = [i for i in range(n) if v[i] <= -45]
    pick = lambda xs: round(statistics.median(xs), 2) if xs else None
    return dict(windowSeconds=.1, activeWindows=len(active), quietWindows=len(quiet),
                reductionWhileVoiceDB=pick([b[i] - d[i] for i in active]),
                reductionWhileQuietDB=pick([b[i] - d[i] for i in quiet]),
                rmsVoiceOverMusicDB=pick([v[i] - d[i] for i in active]),
                voiceLUFS=lufs(voice), bedLUFS=lufs(bed), duckedMusicLUFS=lufs(ducked),
                series=dict(voice=[round(x, 1) for x in v[:n]], bed=[round(x, 1) for x in b[:n]], ducked=[round(x, 1) for x in d[:n]]))


def load_track(track_id, music):
    item = next((t for t in json.loads(CATALOG.read_text('utf-8'))['tracks'] if t['id'] == track_id), None)
    if item is None:
        raise ValueError('Unknown track: ' + track_id)
    if fingerprint(music) != item['sha256']:
        raise ValueError('Music file does not match the catalog hash for ' + track_id)
    return item


def mix(video, voice, music, output, report, music_lufs=None, crossfade=.12, allow_loop=False, fade_in=None, fade_out=None, track=None, credit_out=None, master_lufs=None):
    video, music, output, report = map(lambda p: Path(p).resolve(), [video, music, output, report])
    voice = Path(voice).resolve() if voice else None
    only = voice is None
    item = load_track(track, music) if track else None
    preset = (item.get('music_only', {}) if only else item['mix']) if item else {}
    master_lufs = preset.get('master_lufs', -14 if only else -16) if master_lufs is None else master_lufs
    music_lufs = (master_lufs if only else preset.get('music_lufs', -27)) if music_lufs is None else music_lufs
    fade_in = preset.get('fade_in', .5 if only else .25) if fade_in is None else fade_in
    fade_out = preset.get('fade_out', 3.0 if only else 1.2) if fade_out is None else fade_out
    if output in (video, voice, music) or report in (video, voice, music, output):
        raise ValueError('Outputs must be distinct from inputs.')
    vp, mp = probe(video), probe(music)
    duration = float(vp['format']['duration'])
    music_duration = float(mp['format']['duration'])
    if not 0 < crossfade < min(1, music_duration / 4):
        raise ValueError('Crossfade must be positive and shorter than a quarter of the source.')
    repeats = max(1, math.ceil((duration - crossfade) / (music_duration - crossfade)))
    if repeats > 1 and not allow_loop:
        raise ValueError('Music is shorter than the video. Obtain the full track, or explicitly accept looping with --allow-loop.')
    if repeats > 240:
        raise ValueError('Source too short for this duration; select a longer music source.')
    output.parent.mkdir(parents=True, exist_ok=True)
    report.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='audio-mix-', dir=output.parent) as temp:
        bed = Path(temp) / 'bed.wav'
        mixed = Path(temp) / 'mixed.wav'
        filters = [f'[0:a]aresample=48000,loudnorm=I={music_lufs}:TP={-1.5 if only else -9}:LRA=7,asplit={repeats}' + ''.join(f'[m{i}]' for i in range(repeats))]
        previous = 'm0'
        for i in range(1, repeats):
            next_label = f'x{i}'
            filters.append(f'[{previous}][m{i}]acrossfade=d={crossfade}:c1=tri:c2=tri[{next_label}]')
            previous = next_label
        filters.append(f'[{previous}]atrim=duration={duration},afade=t=in:d={fade_in},afade=t=out:st={max(0,duration-fade_out)}:d={fade_out}[bed]')
        run(['ffmpeg','-v','error','-y','-i',str(music),'-filter_complex',';'.join(filters),'-map','[bed]','-ar','48000','-ac','2',str(bed)])
        if only:
            mixed = bed
        else:
            chain = ('[0:a]aresample=48000,apad,asplit=2[voice][side];'
                     '[1:a][side]sidechaincompress=threshold=0.035:ratio=8:attack=15:release=350[ducked];'
                     f'[voice][ducked]amix=inputs=2:duration=first:normalize=0,loudnorm=I={master_lufs}:TP=-1.5:LRA=7[mix]')
            run(['ffmpeg','-v','error','-y','-i',str(voice),'-i',str(bed),'-filter_complex',chain,'-map','[mix]','-t',str(duration),'-ar','48000','-ac','2',str(mixed)])
        run(['ffmpeg','-v','error','-y','-i',str(video),'-i',str(mixed),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-t',str(duration),'-movflags','+faststart',str(output)])
        measured = None
        if not only:
            ducked = Path(temp) / 'ducked.wav'
            run(['ffmpeg','-v','error','-y','-i',str(voice),'-i',str(bed),'-filter_complex','[0:a]aresample=48000,apad[side];[1:a][side]sidechaincompress=threshold=0.035:ratio=8:attack=15:release=350[ducked]','-map','[ducked]','-t',str(duration),'-ar','48000','-ac','2',str(ducked)])
            measured = ducking_measure(voice, bed, ducked)
    decoded = run(['ffmpeg','-v','error','-i',str(output),'-f','null','-'])
    loudness = run(['ffmpeg','-hide_banner','-i',str(output),'-vn','-af',f'loudnorm=I={master_lufs}:TP=-1.5:LRA=7:print_format=json','-f','null','-']).stderr
    measurement = json.loads(loudness[loudness.rfind('{'):loudness.rfind('}')+1])
    same = video_hash(video) == video_hash(output)
    result = dict(status='technical_checks_passed' if same else 'failed',
        inputVideo=video.name, inputVoice=voice.name if voice else None, musicOnly=only, inputMusic=music.name, output=output.name,
        outputSha256=fingerprint(output), sourceMusicSha256=fingerprint(music),
        seconds=duration, sourceMusicSeconds=music_duration, repeats=repeats,
        loopCrossfadeSeconds=crossfade, musicTargetLUFS=music_lufs, musicTruePeakCeilingDBTP=-1.5 if only else -9, musicLRA=7,
        fadeInSeconds=fade_in, fadeOutSeconds=fade_out,
        masterTargetLUFS=master_lufs, masterTruePeakCeilingDBTP=-1.5, masterLRA=7, audioCodec='aac', audioBitrate='192k', sampleRate=48000,
        ducking=None if only else dict(threshold=.035,ratio=8,attackMs=15,releaseMs=350,sidechainSource='--voice 整轨（旁白 + 音效）'),
        duckingMeasured=None if only else {k: v for k, v in measured.items() if k != 'series'},
        measuredIntegratedLUFS=float(measurement['input_i']), measuredTruePeakDBTP=float(measurement['input_tp']),
        originalVideoStreamPreserved=same, fullDecode=decoded.returncode==0,
        speakerPlayback=False, manualListening=False,
        limitations=['Signal measurements do not verify musical phrasing or listening comfort.',
                     'Looped short original sound is not a recovered full-length instrumental.' if repeats > 1
                     else 'The supplied audio source must be identified separately; this tool does not certify an instrumental master.'])
    if item:
        result.update(track=track, license=item['license'], licenseUrl=item['license_url'], sourcePage=item['source_page'],
                      credit=item['credit'] + '\n' + (MODIFIED_ONLY if only else MODIFIED))
        if credit_out:
            Path(credit_out).write_text(result['credit'] + '\n', encoding='utf-8')
    report.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    if measured:
        Path(str(report) + '.levels.json').write_text(json.dumps(measured['series']), encoding='utf-8')
    if not same or result['measuredTruePeakDBTP'] > 0:
        raise RuntimeError('Mix validation failed; see report.')
    return result


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('video','music','output','report'):
        p.add_argument('--'+name, required=True)
    p.add_argument('--voice',help='旁白 + 音效混合轨；不传就是纯音乐片')
    p.add_argument('--track',help='assets/music/catalog.json 的曲目 id：校验音乐哈希，取预设，把署名写进报告')
    p.add_argument('--credit-out',help='把发布用署名写到这个文件（需要 --track）')
    p.add_argument('--music-lufs',type=float,help='默认 -27；用 --track 时取曲目预设')
    p.add_argument('--fade-in',type=float,help='音乐淡入秒数，默认 0.25')
    p.add_argument('--fade-out',type=float,help='音乐淡出秒数，默认 1.2；纯音乐 3.0')
    p.add_argument('--master-lufs',type=float,help='总轨响度，默认 -16；纯音乐 -14')
    p.add_argument('--crossfade',type=float,default=.12)
    p.add_argument('--allow-loop',action='store_true',help='Only use when short-source looping was explicitly accepted.')
    a=p.parse_args()
    print(json.dumps(mix(a.video,a.voice,a.music,a.output,a.report,a.music_lufs,a.crossfade,a.allow_loop,a.fade_in,a.fade_out,a.track,a.credit_out,a.master_lufs),ensure_ascii=False))
