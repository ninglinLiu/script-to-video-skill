from pathlib import Path
import asyncio,json,subprocess,time,hashlib
import edge_tts
P=Path(__file__).resolve().parent
spec=json.loads((P/'source/sample-script.json').read_text(encoding='utf-8'))
norm=lambda s:''.join(x for x in s if x.isalnum()).lower()
async def main():
    text=''.join(s+p for s,p in zip(spec['cues'],spec['punctuation']))
    path=P/'assets/voice.mp3'; bounds=P/'assets/word-boundaries.json'
    key=hashlib.sha256((text+spec['voice']+spec['rate']).encode()).hexdigest()
    oldmeta=P/'qa/voice.json'
    started=time.time();cached=path.exists() and path.stat().st_size>0 and bounds.exists() and oldmeta.exists() and json.loads(oldmeta.read_text(encoding='utf-8')).get('key')==key
    if not cached:
        events=[]
        voice=edge_tts.Communicate(text,spec['voice'],rate=spec['rate'],boundary='WordBoundary',connect_timeout=15,receive_timeout=60)
        with path.open('wb') as f:
            async for item in voice.stream():
                if item['type']=='audio':f.write(item['data'])
                elif item['type']=='WordBoundary':events.append(item)
        if not events:raise RuntimeError('No real WordBoundary events')
        bounds.write_text(json.dumps(events,ensure_ascii=False,indent=2),encoding='utf-8')
    else:events=json.loads(bounds.read_text(encoding='utf-8'))
    duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(path)],text=True))
    cues=[];acc='';current=[];i=0
    for ev in events:
        current.append(ev);acc+=ev['text']
        if norm(acc)==norm(spec['cues'][i]):
            cues.append({'text':spec['cues'][i],'start':.35+current[0]['offset']/1e7,'end':.35+(current[-1]['offset']+current[-1]['duration'])/1e7})
            i+=1;acc='';current=[]
            if i==len(spec['cues']):break
        elif not norm(spec['cues'][i]).startswith(norm(acc)):raise RuntimeError(f'Cannot map {acc}')
    assert len(cues)==len(spec['cues'])
    seconds=round((max(duration+.35,cues[-1]['end'])+1.2)*30+0.5)/30
    timing={'cues':cues,'seconds':seconds,'frames':round(seconds*30),'fps':30,'voiceDelay':.35,'wordBoundarySource':'edge-tts real WordBoundary; not character interpolation','key':key}
    (P/'工程/src/timing.json').write_text(json.dumps(timing,ensure_ascii=False,indent=2),encoding='utf-8')
    (P/'assets/timeline.json').write_text(json.dumps(timing,ensure_ascii=False,indent=2),encoding='utf-8')
    def stamp(t):
        m=round(t*1000);return f'00:{m//60000:02}:{(m//1000)%60:02},{m%1000:03}'
    (P/'out/两种工具_样片.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(cues)),encoding='utf-8-sig')
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(path),'-af',f'adelay=350:all=1,apad=whole_dur={seconds},loudnorm=I=-16:TP=-2:LRA=7','-t',str(seconds),'-ar','48000','-ac','2',str(P/'assets/voice-track.wav')],check=True)
    (P/'qa/voice.json').write_text(json.dumps({'service':'edge-tts','version':edge_tts.__version__,'voice':spec['voice'],'cached':cached,'successfulRequests':0 if cached else 1,'requestElapsed':time.time()-started,'duration':duration,'text':text,'key':key,'manualListening':False,'speakerPlayback':False,'billing':'无付费API请求；本地算力/电费未计价'},ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(timing,ensure_ascii=False))
asyncio.run(main())
