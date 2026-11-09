from pathlib import Path
import asyncio, json, subprocess, time, hashlib, re
import edge_tts
P=Path(__file__).resolve().parent
spec=json.loads((P/'source/script.json').read_text(encoding='utf-8'))
text=''.join(c+p for ch in spec['chapters'] for c,p in zip(ch['cues'],ch['punctuation']))
norm=lambda s: ''.join(c for c in s if c.isalnum()).lower()
for phrase in spec['required_phrases']:
    assert norm(phrase) in norm(text), f'Missing required qualification: {phrase}'
(P/'source/narration.txt').write_text(text,encoding='utf-8')
key=hashlib.sha256((text+spec['voice']+spec['rate']+edge_tts.__version__).encode()).hexdigest()
async def main():
    start=time.time(); cached=False; meta=P/'qa/voice-production.json'
    if meta.exists() and json.loads(meta.read_text())['key']==key and (P/'assets/voice.mp3').exists():
        events=json.loads((P/'assets/voice-boundaries.json').read_text(encoding='utf-8'));cached=True
    else:
        events=[]
        talk=edge_tts.Communicate(text,spec['voice'],rate=spec['rate'],boundary='WordBoundary',connect_timeout=15,receive_timeout=60)
        with (P/'assets/voice.mp3').open('wb') as f:
            async for item in talk.stream():
                if item['type']=='audio':f.write(item['data'])
                elif item['type']=='WordBoundary':events.append(item)
        if not events:raise RuntimeError('No real TTS word boundaries')
        (P/'assets/voice-boundaries.json').write_text(json.dumps(events,ensure_ascii=False,indent=2),encoding='utf-8')
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(P/'assets/voice.mp3'),'-ar','48000','-ac','2',str(P/'assets/voice.wav')],check=True)
    vd=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(P/'assets/voice.wav')],text=True))
    delay=spec['voice_delay'];duration=round((vd+delay+.35)*30)/30
    if not 60<=duration<=90:raise RuntimeError(f'Actual duration {duration} outside 60–90; revise script, do not stretch visuals.')
    targets=[(ch['id'],i,s) for ch in spec['chapters'] for i,s in enumerate(ch['cues'])]
    cues=[];acc='';current=[];gi=0
    for event in events:
        acc+=event['text'];current.append(event)
        cid,i,target=targets[gi]
        if norm(acc)==norm(target):
            cues.append({'id':f'{cid}_{i}','chapter':cid,'text':target,'start':delay+current[0]['offset']/1e7,'end':delay+(current[-1]['offset']+current[-1]['duration'])/1e7})
            gi+=1;acc='';current=[]
            if gi==len(targets):break
        elif not norm(target).startswith(norm(acc)):
            raise RuntimeError(f'TTS grouping mismatch at {cid}_{i}: {acc} / {target}')
    if len(cues)!=len(targets):raise RuntimeError('Incomplete subtitle alignment')
    chapters=[]
    for ch in spec['chapters']:
        cc=[c for c in cues if c['chapter']==ch['id']]
        chapters.append({**ch,'start':max(0,cc[0]['start']-.12),'speechEnd':cc[-1]['end']})
    chapters[0]['start']=0
    for i,ch in enumerate(chapters):ch['end']=chapters[i+1]['start'] if i+1<len(chapters) else duration
    timeline={'title':spec['title'],'duration':duration,'fps':30,'voice':spec['voice'],'rate':spec['rate'],'voiceDelay':delay,'voiceDuration':vd,'text':text,'cues':cues,'chapters':chapters}
    (P/'assets/timeline.json').write_text(json.dumps(timeline,ensure_ascii=False,indent=2),encoding='utf-8')
    (P/'timeline.js').write_text('window.FILM='+json.dumps(timeline,ensure_ascii=False)+';',encoding='utf-8')
    def stamp(t):
        m=round(t*1000);return f'{m//3600000:02}:{m//60000%60:02}:{m//1000%60:02},{m%1000:03}'
    (P/'out/subtitles.srt').write_text('\n\n'.join(f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}" for i,c in enumerate(cues))+'\n',encoding='utf-8-sig')
    meta.write_text(json.dumps({'key':key,'cached':cached,'successful_requests':0 if cached else 1,'voiceDuration':vd,'duration':duration,'elapsed_seconds':time.time()-start,'provider':'edge-tts','version':edge_tts.__version__},indent=2),encoding='utf-8')
    print(json.dumps({'duration':duration,'characters':len(text),'cues':len(cues),'chapters':[{k:ch[k] for k in ['id','start','end']} for ch in chapters]},ensure_ascii=True))
asyncio.run(main())
