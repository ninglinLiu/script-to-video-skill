from pathlib import Path
import zipfile,hashlib,json
P=Path(__file__).resolve().parent
files=[]
for f in P.iterdir():
    if f.is_file() and f.suffix in ['.mjs','.py','.ps1','.html','.txt','.md']:files.append(f)
for d in ['assets','vendor','source','out']:
    files += [f for f in (P/d).rglob('*') if f.is_file() and f.name!='package-manifest.json']
files += [f for f in (P/'qa').glob('*') if f.suffix in ['.txt','.json','.md'] or '-final-sheet' in f.name or '-continuous-' in f.name or '-poster' in f.name]
files=sorted(set(files))
manifest=[{'path':f.relative_to(P).as_posix(),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in files]
(P/'source/package-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
z=P/'三个半分钟样片与工程.zip'
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as out:
    for f in files+[P/'source/package-manifest.json']:out.write(f,f.relative_to(P).as_posix())
with zipfile.ZipFile(z) as out:
    assert out.testzip() is None
    for s in ['editorial','spatial','pixel']:assert f'out/{s}-silent.mp4' in out.namelist()
print(json.dumps({'zip':str(z),'bytes':z.stat().st_size,'files':len(files)+1},ensure_ascii=False))
