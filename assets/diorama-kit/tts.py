# 逐句 edge-tts，记录真实 WordBoundary；句间留白后拼接，输出 voice.wav 与 timeline.json
import asyncio, json, subprocess, sys
from pathlib import Path
import edge_tts
E = Path(sys.argv[1]); spec = json.loads((E/'source/script.json').read_text(encoding='utf-8'))
A = E/'audio'; A.mkdir(exist_ok=True)
GAP = 0.32
async def one(i, line):
    mp3 = A/f"{line['id']}.mp3"; words = []
    c = edge_tts.Communicate(line['text'], spec['voice'], rate=spec['rate'], boundary='WordBoundary')
    with mp3.open('wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio': f.write(ch['data'])
            elif ch['type'] == 'WordBoundary': words.append({'t': ch['offset']/1e7, 'd': ch['duration']/1e7, 'w': ch['text']})
    return mp3, words
async def main():
    t = 0.6; cues = []; parts = []
    for i, line in enumerate(spec['lines']):
        mp3, words = await one(i, line)
        wav = A/f"{line['id']}.wav"
        subprocess.check_call(['ffmpeg','-v','error','-y','-i',str(mp3),'-ar','48000','-ac','1',str(wav)])
        dur = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(wav)]).decode().strip())
        cues.append({'id': line['id'], 'start': round(t,3), 'end': round(t+dur,3), 'words': [{'t': round(t+w['t'],3), 'd': round(w['d'],3), 'w': w['w']} for w in words], 'sub': line['sub'], 'text': line['text']})
        parts.append((wav, t)); t += dur + GAP
    total = t + 1.4
    inputs = []; filt = []
    for k,(wav,st) in enumerate(parts):
        inputs += ['-i', str(wav)]; filt.append(f"[{k}]adelay={int(st*1000)}:all=1[a{k}]")
    filt.append(''.join(f'[a{k}]' for k in range(len(parts))) + f"amix=inputs={len(parts)}:normalize=0,apad=whole_dur={total}[out]")
    subprocess.check_call(['ffmpeg','-v','error','-y',*inputs,'-filter_complex',';'.join(filt),'-map','[out]','-ar','48000','-ac','2',str(A/'voice.wav')])
    (A/'timeline.json').write_text(json.dumps({'fps':30,'seconds':round(total,3),'frames':int(round(total*30)),'voice':spec['voice'],'rate':spec['rate'],'edge_tts':edge_tts.__version__,'cues':cues},ensure_ascii=False,indent=1),encoding='utf-8')
    print('total', round(total,2), 'cues', [(c['id'],c['start'],c['end']) for c in cues])
asyncio.run(main())
