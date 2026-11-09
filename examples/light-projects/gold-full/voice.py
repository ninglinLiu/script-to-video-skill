from pathlib import Path
import asyncio,json,subprocess,time,hashlib,math
import edge_tts
P=Path(__file__).resolve().parent
spec=json.loads((P/'source/script.json').read_text(encoding='utf-8'))
norm=lambda s:''.join(x for x in s if x.isalnum()).lower()
async def main():
    chunks=[x for ch in spec['chapters'] for x in ch['cues']]
    text=''.join(''.join(a+b for a,b in zip(ch['cues'],ch['p'])) for ch in spec['chapters'])
    key=hashlib.sha256((text+spec['voice']+spec['rate']+edge_tts.__version__).encode()).hexdigest()
    mp3=P/'assets/voice.mp3';bp=P/'assets/word-boundaries.json';meta=P/'qa/voice.json';start=time.time()
    cached=meta.exists() and mp3.exists() and bp.exists() and json.loads(meta.read_text(encoding='utf-8'))['key']==key
    if not cached:
        events=[]
        talk=edge_tts.Communicate(text,spec['voice'],rate=spec['rate'],boundary='WordBoundary',connect_timeout=20,receive_timeout=90)
        with mp3.open('wb') as f:
            async for e in talk.stream():
                if e['type']=='audio':f.write(e['data'])
                elif e['type']=='WordBoundary':events.append(e)
        if not events:raise RuntimeError('No boundaries, no substitute voice')
        bp.write_text(json.dumps(events,ensure_ascii=False,indent=2),encoding='utf-8')
    else:events=json.loads(bp.read_text(encoding='utf-8'))
    cues=[];acc='';words=[];i=0
    for e in events:
        acc+=e['text'];words.append(e)
        if norm(acc)==norm(chunks[i]):
            cues.append({'text':chunks[i],'start':spec['delay']+words[0]['offset']/1e7,'end':spec['delay']+(words[-1]['offset']+words[-1]['duration'])/1e7})
            acc='';words=[];i+=1
            if i==len(chunks):break
        elif not norm(chunks[i]).startswith(norm(acc)):raise RuntimeError(f'Boundary mismatch: {acc} / {chunks[i]}')
    assert len(cues)==len(chunks)
    vd=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(mp3)],text=True))
    duration=math.ceil((max(vd+spec['delay'],cues[-1]['end'])+spec['tail'])*30)/30
    chapters=[];idx=0
    for ch in spec['chapters']:
        n=len(ch['cues']);chapters.append({'id':ch['id'],'title':ch['title'],'cueStart':idx,'cueEnd':idx+n-1,'start':0 if idx==0 else max(0,cues[idx]['start']-.13),'voiceStart':cues[idx]['start'],'voiceEnd':cues[idx+n-1]['end']});idx+=n
    for i,ch in enumerate(chapters):ch['end']=chapters[i+1]['start'] if i+1<len(chapters) else duration
    # Keep semantic units and chapter boundaries intact; short fragments belong to their sentence.
    groups=[[0,1],[2],[3],[4],[5],[6],[7,8],[9,10],[11],[12,13],[14],[15],[16,17],[18,19],[20],[21],[22,23,24],[25],[26],[27,28],[29],[30,31],[32,33],[34],[35],[36,37],[38],[39],[40,41],[42,43,44],[45],[46,47]]
    punctuation=[p for ch in spec['chapters'] for p in ch['p']]
    subtitles=[{'text':''.join(cues[i]['text']+punctuation[i] for i in group).rstrip('，；：、'),'start':cues[group[0]]['start'],'end':cues[group[-1]]['end']} for group in groups]
    assert [i for g in groups for i in g]==list(range(len(cues)))
    tl={'cues':cues,'subtitles':subtitles,'chapters':chapters,'seconds':duration,'frames':round(duration*30),'fps':30,'wordBoundarySource':'real edge-tts WordBoundary','voiceRate':spec['rate'],'key':key}
    for dest in ['工程/src/timing.json','assets/timeline.json']:(P/dest).write_text(json.dumps(tl,ensure_ascii=False,indent=2),encoding='utf-8')
    def stamp(t):
        m=round(t*1000);return f'00:{m//60000:02}:{m//1000%60:02},{m%1000:03}'
    (P/'out/黄金三道传导.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(subtitles)),encoding='utf-8-sig')
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(mp3),'-af',f'adelay=250:all=1,apad=whole_dur={duration},loudnorm=I=-16:TP=-2:LRA=7','-t',str(duration),'-ar','48000','-ac','2',str(P/'assets/voice-track.wav')],check=True)
    meta.write_text(json.dumps({'key':key,'voice':spec['voice'],'rate':spec['rate'],'cached':cached,'successfulRequests':0 if cached else 1,'wallSeconds':time.time()-start,'duration':vd,'speakerPlayback':False,'manualListening':False,'paidAPICalls':0},ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'duration':duration,'cues':len(cues),'chapters':chapters},ensure_ascii=True))
asyncio.run(main())
