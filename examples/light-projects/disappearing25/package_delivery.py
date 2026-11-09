from pathlib import Path
import zipfile,os,json,hashlib
P=Path(__file__).resolve().parent
files=[]
for folder in ['工程','source']:
 for current,dirs,names in os.walk(P/folder,followlinks=False):
  dirs[:]=[d for d in dirs if d not in ['node_modules','.cache','dist','build']]
  for name in names:files.append(Path(current)/name)
files += [P/x for x in ['brief.md','打开与修改说明.md','watch.html','prepare_audio.py','fit_audio.py','mix_audio.py','qa/review_log.md','qa/final-checks.json','qa/audio-master.json','qa/audio-events.json','qa/voice-asr.json','qa/poster.jpg','qa/final-contact.jpg','qa/preview-page.png','out/消失的25元-60秒-静音.mp4','out/消失的25元-60秒-带声音.mp4','out/消失的25元.srt','assets/voice-missing25.mp3','assets/voice-missing25.wav','assets/voice-missing25-boundaries.json','assets/timeline-missing25.json','assets/voice-track.wav','assets/music-track.wav','assets/sfx-track.wav','assets/mix.wav']]
manifest=[dict(path=str(p.relative_to(P)).replace('\\','/'),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in files]
(P/'package-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
with zipfile.ZipFile(P/'消失的25元-样片与工程.zip','w',zipfile.ZIP_DEFLATED,compresslevel=3) as z:
 for p in files+[P/'package-manifest.json']:z.write(p,p.relative_to(P))
print(json.dumps({'files':len(files),'zipBytes':(P/'消失的25元-样片与工程.zip').stat().st_size}))
