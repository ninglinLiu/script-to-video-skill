from pathlib import Path
import json,subprocess
P=Path(__file__).resolve().parent
raw=json.loads((P/'assets/timeline-missing25.json').read_text(encoding='utf-8'))
scale=56.6/raw['voiceDuration']; delay=.6
cues=[dict(i=i+1,text=c['text'],start=delay+(c['start']-delay)*scale,end=delay+(c['end']-delay)*scale) for i,c in enumerate(raw['cues'])]
data=dict(cues=cues,scale=scale,delay=delay,duration=60,voice='zh-CN-YunxiNeural',original=raw)
(P/'工程/src/timing.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
subprocess.run(['ffmpeg','-v','error','-y','-i',str(P/'assets/voice-missing25.wav'),'-af',f'atempo={1/scale},asetpts=N/SR/TB,adelay=600|600,apad','-t','60','-ar','48000','-ac','2',str(P/'assets/voice-track.wav')],check=True)
def stamp(t):
    n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'
(P/'out/消失的25元.srt').write_text('\n\n'.join(f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}" for i,c in enumerate(cues)),encoding='utf-8-sig')
print(json.dumps({'scale':scale,'lastCueEnd':cues[-1]['end'],'duration':60}))
