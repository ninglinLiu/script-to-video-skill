from pathlib import Path
import zipfile,os,json
P=Path(__file__).resolve().parent
out=P/'决策频率_完整交付.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for folder in ['工程','source','evidence','out']:
  for root,dirs,files in os.walk(P/folder):
   dirs[:]=[d for d in dirs if d not in ['node_modules','.git','.remotion','build']]
   for f in files:
    p=Path(root)/f;z.write(p,p.relative_to(P))
 for f in ['voice.py','mix_audio.py','finish.py','build_delivery.py','check_viewer.py','package.py','README.txt','watch.html']:
  z.write(P/f,f)
 for f in ['voice.mp3','word-boundaries.json','timeline.json']:z.write(P/'assets'/f,'assets/'+f)
 for f in ['poster.jpg','final-contact-1.jpg','final-contact-2.jpg','final-contact-3.jpg','technical-checks.json','voice.json','voice-iterations.json','voice-subtitles.json','audio-master.json','viewer-check.json','production-review.json','subtitle-layout.json','subtitle-layer-repair.json','pipeline-audit.json']:
  if (P/'qa'/f).exists():z.write(P/'qa'/f,'qa/'+f)
with zipfile.ZipFile(out) as z:assert z.testzip() is None;count=len(z.namelist())
print(json.dumps({'path':str(out),'bytes':out.stat().st_size,'entries':count,'CRC':'pass'}))


