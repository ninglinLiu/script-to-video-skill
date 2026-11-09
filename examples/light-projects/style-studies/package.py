from pathlib import Path
import hashlib,json,zipfile
P=Path(__file__).resolve().parent
files=[p for p in P.iterdir() if p.is_file() and p.suffix!='.zip']
for directory in ['assets','vendor','source']:
    files += [p for p in (P/directory).rglob('*') if p.is_file()]
files += list((P/'out').glob('*.mp4'))
files += [p for p in (P/'qa').iterdir() if p.is_file() and
          (p.suffix in ['.json','.txt'] or '-final' in p.name or '-continuous-' in p.name or '-poster' in p.name)]
files=sorted({p for p in files if p.name!='package-manifest.json'})
manifest={str(p.relative_to(P)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
(P/'source/package-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
files=sorted(set(files+[P/'source/package-manifest.json']))
target=P/'三风格样片与工程.zip'
with zipfile.ZipFile(target,'w') as z:
    for p in files:
        if p.name=='package-manifest.json':compress=zipfile.ZIP_DEFLATED
        else:compress=zipfile.ZIP_STORED if p.suffix in ['.mp4','.wav','.mp3','.png','.jpg','.woff2'] else zipfile.ZIP_DEFLATED
        z.write(p,str(p.relative_to(P)),compress_type=compress)
with zipfile.ZipFile(target) as z:
    assert z.testzip() is None
    assert all(z.getinfo('out/'+s+'-silent.mp4').file_size>0 for s in ['editorial','spatial','pixel'])
    assert not any(n.startswith('references/') for n in z.namelist())
print(target.name,len(files),'files',target.stat().st_size,'bytes')
