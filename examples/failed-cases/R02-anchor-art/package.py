from pathlib import Path
import zipfile,hashlib,json
P=Path(__file__).resolve().parent
files=[f for f in P.iterdir() if f.is_file() and f.suffix in ['.mjs','.py','.ps1','.html','.md','.json'] and f.name!='setup_project.py']
for directory in ['assets','vendor','source','out']:
 files.extend(f for f in (P/directory).rglob('*') if f.is_file() and f.name not in ['vastness.mp3','package-manifest.json'])
files.extend(f for f in (P/'qa').iterdir() if f.is_file() and (f.suffix in ['.md','.json'] or f.name in ['poster.jpg','ending.jpg','final-contact-sheet.jpg'] or f.name.startswith('continuous-')))
files=sorted(set(files))
manifest=[{'path':f.relative_to(P).as_posix(),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in files]
mp=P/'source/package-manifest.json';mp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
z=P/'价签之外-60秒样片与工程.zip'
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED,compresslevel=3) as out:
 for f in files+[mp]:out.write(f,f.relative_to(P).as_posix())
with zipfile.ZipFile(z) as out:
 assert out.testzip() is None
 for f in ['out/anchor.mp4','out/anchor-silent.mp4','out/anchor.srt','out/premiere.xml','assets/shop.png','assets/shopper.png','assets/coat.png']:assert f in out.namelist()
print(json.dumps({'zip':str(z),'files':len(files)+1,'bytes':z.stat().st_size},ensure_ascii=False))
