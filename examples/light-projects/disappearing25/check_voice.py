from pathlib import Path
import json,time
from faster_whisper import WhisperModel
P=Path(__file__).resolve().parent
model=WhisperModel('<home>/.cache/huggingface/hub/models--Systran--faster-whisper-medium/snapshots/08e178d48790749d25932bbc082711ddcfdfbc4f',device='cpu',compute_type='int8',cpu_threads=4,local_files_only=True)
start=time.time();segs,info=model.transcribe(str(P/'assets/voice-track.wav'),language='zh',beam_size=3,vad_filter=True,word_timestamps=True)
rows=[{'start':s.start,'end':s.end,'text':s.text,'words':[dict(start=w.start,end=w.end,word=w.word) for w in s.words]} for s in segs]
(P/'qa/voice-asr.json').write_text(json.dumps({'method':'local faster-whisper medium, CPU, uncorrected; not a listening review','seconds':time.time()-start,'segments':rows},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'segments':len(rows),'seconds':time.time()-start,'text':''.join(s['text'] for s in rows)},ensure_ascii=False))
