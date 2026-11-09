"""Reuse the whole-paragraph Yunxi / real WordBoundary path. No playback."""
from pathlib import Path
import asyncio,json,subprocess,time,hashlib
import edge_tts
P=Path(__file__).resolve().parent
specs=json.loads((P/'source/scripts.json').read_text(encoding='utf-8'))
norm=lambda s:''.join(x for x in s if x.isalnum()).lower()
async def one(spec):
    name=spec['id'];base=P/'assets';text=''.join(s+p for s,p in zip(spec['cues'],spec['punctuation']))
    key=hashlib.sha256((text+spec['voice']+spec['rate']+edge_tts.__version__).encode()).hexdigest()
    start=time.time();meta=P/'qa'/f'{name}-voice.json';cached=False
    mp3=base/f'voice-{name}.mp3';bounds=base/f'voice-{name}-boundaries.json'
    if meta.exists() and json.loads(meta.read_text())['key']==key and mp3.exists():
        events=json.loads(bounds.read_text(encoding='utf-8'));cached=True
    else:
        events=[];talk=edge_tts.Communicate(text,spec['voice'],rate=spec['rate'],boundary='WordBoundary',connect_timeout=15,receive_timeout=60)
        with mp3.open('wb') as f:
            async for item in talk.stream():
                if item['type']=='audio':f.write(item['data'])
                elif item['type']=='WordBoundary':events.append(item)
        if not events:raise RuntimeError('No real word boundaries')
        bounds.write_text(json.dumps(events,ensure_ascii=False,indent=2),encoding='utf-8')
    wav=base/f'voice-{name}.wav'
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(mp3),'-ar','48000','-ac','2',str(wav)],check=True)
    vd=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(wav)],text=True))
    if vd+spec['voice_delay']>58.8:raise RuntimeError(f'{name}: voice too long: {vd}')
    cues=[];acc='';current=[];gi=0
    for ev in events:
        acc+=ev['text'];current.append(ev);target=spec['cues'][gi]
        if norm(acc)==norm(target):
            cues.append({'text':target,'start':spec['voice_delay']+current[0]['offset']/1e7,'end':spec['voice_delay']+(current[-1]['offset']+current[-1]['duration'])/1e7})
            gi+=1;acc='';current=[]
            if gi==len(spec['cues']):break
        elif not norm(target).startswith(norm(acc)):raise RuntimeError(f'Boundary mismatch {name}: {acc} / {target}')
    assert len(cues)==len(spec['cues'])
    tl={**spec,'text':text,'cues':cues,'voiceDuration':vd,'chapters':[{'start':0,'end':60}]}
    (base/f'timeline-{name}.json').write_text(json.dumps(tl,ensure_ascii=False,indent=2),encoding='utf-8')
    def stamp(t):
        m=round(t*1000);return f'00:00:{m//1000:02},{m%1000:03}'
    (P/'out'/f'{name}.srt').write_text('\n\n'.join(f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}" for i,c in enumerate(cues)),encoding='utf-8-sig')
    meta.write_text(json.dumps({'key':key,'cached':cached,'successfulRequests':0 if cached else 1,'seconds':time.time()-start,'voiceDuration':vd,'speakerPlayback':False}),encoding='utf-8')
    print(name,vd,json.dumps(cues,ensure_ascii=False),flush=True)
async def main():
    for s in specs:await one(s)
asyncio.run(main())
