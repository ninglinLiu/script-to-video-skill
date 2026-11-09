from pathlib import Path
import os,zipfile,hashlib,json
P=Path(__file__).resolve().parent
package=P/'黄金三道传导_完整交付包.zip'
exclude_dirs={'node_modules','.git','.remotion','__pycache__','stills','proof-frames','final-frames','hook-handoff','camera-return','expectation-gap'}
exclude_files={'render-full-range.mp4','premix.wav','package.json.tmp'}
manifest=[]
for root,dirs,files in os.walk(P):
 dirs[:]=[d for d in dirs if d not in exclude_dirs and not (Path(root)/d).is_symlink()]
 for name in files:
  f=Path(root)/name
  if f==package or f.suffix=='.zip' or name in exclude_files or name=='交付文件清单.json':continue
  if name.startswith('contact-') or name.startswith('proof-') and f.suffix=='.jpg':continue
  manifest.append({'path':f.relative_to(P).as_posix(),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
(P/'交付文件清单.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
with zipfile.ZipFile(package,'w',zipfile.ZIP_DEFLATED,compresslevel=5) as z:
 for item in manifest:z.write(P/item['path'],item['path'])
 z.write(P/'交付文件清单.json','交付文件清单.json')
with zipfile.ZipFile(package) as z:
 assert z.testzip() is None
 assert not any('node_modules/' in n for n in z.namelist())
 assert {'out/final-silent.mp4','out/final-with-audio.mp4','out/黄金三道传导.srt','工程/src/FullFilm.tsx','README.txt','watch.html'}.issubset(z.namelist())
 print(json.dumps({'path':str(package),'bytes':package.stat().st_size,'files':len(z.namelist()),'crc':'pass'},ensure_ascii=True))
