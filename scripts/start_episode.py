"""Migrate a complete episode into an empty workspace, preserving its working visual system.

No style is selected by keyword. The source is an explicit editorial choice.
Old QA approvals are never copied into the new episode.
"""
import argparse,hashlib,json,shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def start(source,dest):
    source=Path(source).resolve();dest=Path(dest).resolve()
    required=['工程/src','工程/package.json','工程/package-lock.json','assets/timeline.json','source/script.json']
    for rel in required:
        if not (source/rel).exists():raise ValueError('Incomplete source episode: '+rel)
    source_entry=source/'工程/src/entry.tsx'
    text=source_entry.read_text(encoding='utf8')
    if 'component={Chapter}' not in text and 'component={ObservedChapter}' not in text:
        raise ValueError('Source engine needs an adapter: expected Chapter compositions')
    if "import timing from './timing.json';" not in text:raise ValueError('Unsupported entry: measured timing import missing')
    if dest.exists() and any(dest.iterdir()):raise ValueError('Destination must be empty')
    if dest.is_relative_to(source):raise ValueError('Destination cannot be inside its source episode')
    dest.mkdir(parents=True,exist_ok=True);files=[]
    # Copy the actual film, not a reduced demonstration. Keep only production inputs.
    for folder in ['工程/src','工程/public','source','evidence','assets']:
        for f in (source/folder).rglob('*'):
            if not f.is_file() or any(x in f.parts for x in ['node_modules','.tmp','music-local','local-only']):continue
            if f.suffix.lower() in {'.mp4','.mov','.zip'}:continue
            rel=f.relative_to(source);target=dest/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,target)
            files.append({'path':rel.as_posix(),'sha256':sha(f)})
    for rel in ['工程/package.json','工程/package-lock.json','工程/tsconfig.json','工程/render.mjs','voice.py','requirements.txt']:
        if (source/rel).is_file():
            target=dest/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source/rel,target)
            files.append({'path':rel,'sha256':sha(target)})
    # The script and evidence are reference material until the new text is reviewed.
    review=dest/'evidence/script-review.json'
    if review.exists():
        original=dest/'reference/script-review.json';original.parent.mkdir(exist_ok=True);shutil.move(review,original)
    (dest/'plans').mkdir(exist_ok=True);(dest/'qa').mkdir(exist_ok=True);(dest/'tools').mkdir(exist_ok=True)
    for name in ['production.py','film_delivery.py']:
        if (ROOT/'scripts'/name).exists():shutil.copy2(ROOT/'scripts'/name,dest/'tools'/name)
    # Install working film-level instrumentation into the known complete engine.
    # Unknown engines are rejected rather than returning a falsely ready workspace.
    entry=dest/'工程/src/entry.tsx';text=entry.read_text(encoding='utf8')
    if 'component={ObservedChapter}' not in text:
        text=text.replace("import timing from './timing.json';", "import timing from './timing.json';\nimport {CaptionProbe} from './CaptionProbe';\nconst ObservedChapter:React.FC<{captions?:boolean}>=(props)=><><Chapter {...props}/><CaptionProbe/></>;")
    entry.write_text(text.replace('component={Chapter}','component={ObservedChapter}'),encoding='utf8')
    shutil.copy2(ROOT/'assets/film-tools/CaptionProbe.tsx',dest/'工程/src/CaptionProbe.tsx')
    shutil.copy2(ROOT/'assets/film-tools/render.mjs',dest/'工程/render.mjs')
    caption_source=source/'plans/captions.json'
    if caption_source.exists():shutil.copy2(caption_source,dest/'plans/captions.json')
    else:(dest/'plans/captions.json').write_text(json.dumps({'region':[120,915,1680,125],'mode':'visible-in-video','layout':'chapter-01 landscape; update region if layout changes'}),encoding='utf8')
    requirements=dest/'requirements.txt'
    requirements.write_text(requirements.read_text(encoding='utf8').rstrip()+'\nPillow>=10,<12\n',encoding='utf8')
    record={'workflow':'adapted-film','sourceEpisode':source.name,'sourceScriptSha256':sha(source/'source/script.json'),
            'files':files,'reviewStatus':'unreviewed-adaptation','scope':'Complete source design carried over; adapt content, layout and timing. No prior acceptance transferred.'}
    (dest/'plans/migration.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    (dest/'plans/project.json').write_text(json.dumps({'workflow':'adapted-film','styleReference':source.name,'captionMode':'visible-in-video','fullFilmReview':'required'},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    return {'copied':len(files),'sourceEpisode':source.name,'episode':str(dest),'next':'Adapt the actual film and captions; review the new script, render the whole film, run film_delivery inspect/check.'}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source',required=True,help='chapter-01 or an existing complete episode directory');p.add_argument('--episode',required=True);a=p.parse_args()
    source=ROOT/'examples/chapter-01' if a.source=='chapter-01' else Path(a.source)
    try:
        if a.source=='poisson-cinema':
            from cinema import init
            result=init(a.episode)
        else:result=start(source,a.episode)
        print(json.dumps(result,ensure_ascii=False,indent=2))
    except (ValueError,OSError) as e:p.error(str(e))
