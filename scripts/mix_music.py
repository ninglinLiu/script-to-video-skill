"""Local-only soundtrack mix. Never plays audio, fetches media, or overwrites inputs."""
import argparse
import hashlib
import json
import math
import subprocess
import tempfile
from pathlib import Path


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


def mix(video, voice, music, output, report, music_lufs=-27, crossfade=.12, allow_loop=False):
    video, voice, music, output, report = map(lambda p: Path(p).resolve(), [video, voice, music, output, report])
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
        filters = [f'[0:a]aresample=48000,loudnorm=I={music_lufs}:TP=-9:LRA=7,asplit={repeats}' + ''.join(f'[m{i}]' for i in range(repeats))]
        previous = 'm0'
        for i in range(1, repeats):
            next_label = f'x{i}'
            filters.append(f'[{previous}][m{i}]acrossfade=d={crossfade}:c1=tri:c2=tri[{next_label}]')
            previous = next_label
        filters.append(f'[{previous}]atrim=duration={duration},afade=t=in:d=0.25,afade=t=out:st={max(0,duration-1.2)}:d=1.2[bed]')
        run(['ffmpeg','-v','error','-y','-i',str(music),'-filter_complex',';'.join(filters),'-map','[bed]','-ar','48000','-ac','2',str(bed)])
        chain = ('[0:a]aresample=48000,apad,asplit=2[voice][side];'
                 '[1:a][side]sidechaincompress=threshold=0.035:ratio=8:attack=15:release=350[ducked];'
                 '[voice][ducked]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7[mix]')
        run(['ffmpeg','-v','error','-y','-i',str(voice),'-i',str(bed),'-filter_complex',chain,'-map','[mix]','-t',str(duration),'-ar','48000','-ac','2',str(mixed)])
        run(['ffmpeg','-v','error','-y','-i',str(video),'-i',str(mixed),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-t',str(duration),'-movflags','+faststart',str(output)])
    decoded = run(['ffmpeg','-v','error','-i',str(output),'-f','null','-'])
    loudness = run(['ffmpeg','-hide_banner','-i',str(output),'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-']).stderr
    measurement = json.loads(loudness[loudness.rfind('{'):loudness.rfind('}')+1])
    same = video_hash(video) == video_hash(output)
    result = dict(status='technical_checks_passed' if same else 'failed',
        inputVideo=video.name, inputVoice=voice.name, inputMusic=music.name, output=output.name,
        outputSha256=fingerprint(output), sourceMusicSha256=fingerprint(music),
        seconds=duration, sourceMusicSeconds=music_duration, repeats=repeats,
        loopCrossfadeSeconds=crossfade, musicTargetLUFS=music_lufs,
        ducking=dict(threshold=.035,ratio=8,attackMs=15,releaseMs=350),
        measuredIntegratedLUFS=float(measurement['input_i']), measuredTruePeakDBTP=float(measurement['input_tp']),
        originalVideoStreamPreserved=same, fullDecode=decoded.returncode==0,
        speakerPlayback=False, manualListening=False,
        limitations=['Signal measurements do not verify musical phrasing or listening comfort.',
                     'Looped short original sound is not a recovered full-length instrumental.' if repeats > 1
                     else 'The supplied audio source must be identified separately; this tool does not certify an instrumental master.'])
    report.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    if not same or result['measuredTruePeakDBTP'] > 0:
        raise RuntimeError('Mix validation failed; see report.')
    return result


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('video','voice','music','output','report'):
        p.add_argument('--'+name, required=True)
    p.add_argument('--music-lufs',type=float,default=-27)
    p.add_argument('--crossfade',type=float,default=.12)
    p.add_argument('--allow-loop',action='store_true',help='Only use when short-source looping was explicitly accepted.')
    a=p.parse_args()
    print(json.dumps(mix(a.video,a.voice,a.music,a.output,a.report,a.music_lufs,a.crossfade,a.allow_loop),ensure_ascii=False))
