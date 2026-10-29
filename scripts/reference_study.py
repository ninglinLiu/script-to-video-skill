"""Read one observed route or prepare local reference media; not a film renderer."""
import argparse,hashlib,json,pathlib,subprocess,sys,shutil,urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[1]
PLAN=ROOT/'references/reference-study-20261029/plan.json'
WEB='examples/reference-study-20261029/'
REMOTE='https://raw.githubusercontent.com/ninglinLiu/script-to-video-skill/main/'

def read_json(relative):
    p=ROOT/relative
    if p.exists():return json.loads(p.read_text('utf8'))
    with urllib.request.urlopen(REMOTE+relative,timeout=60) as r:return json.load(r)

def acquire(relative,dest,expected=None):
    dest.parent.mkdir(parents=True,exist_ok=True)
    if dest.exists() and expected and digest(dest)==expected:return dest
    local=ROOT/relative
    if local.exists():
        if local.resolve()!=dest.resolve():shutil.copy2(local,dest)
    else:
        temporary=dest.with_suffix(dest.suffix+'.partial')
        try:
            with urllib.request.urlopen(REMOTE+relative,timeout=120) as r,temporary.open('wb') as f:shutil.copyfileobj(r,f)
            if expected and digest(temporary)!=expected:raise ValueError('Downloaded media hash mismatch: '+relative)
            temporary.replace(dest)
        finally:
            if temporary.exists():temporary.unlink()
    if expected and digest(dest)!=expected:raise ValueError('Media hash mismatch: '+relative)
    return dest

def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()

def main():
    ap=argparse.ArgumentParser(description=__doc__);sub=ap.add_subparsers(dest='command',required=True)
    show=sub.add_parser('show');show.add_argument('--route',required=True,choices=['particle-document','pixel-scene-map'])
    fetch=sub.add_parser('fetch',help='Get real MP4s, consecutive frames and motion phases; no manual original-file prerequisite')
    fetch.add_argument('--route',required=True,choices=['particle-document','pixel-scene-map'])
    fetch.add_argument('--output',type=pathlib.Path,default=ROOT/'local-only/reference-cache')
    fetch.add_argument('--clip',action='append',help='Optional selected clip IDs; default is the route priority spans')
    fetch.add_argument('--all-clips',action='store_true')
    fetch.add_argument('--full',action='store_true',help='Also obtain the full-length web study copy')
    prep=sub.add_parser('prepare');prep.add_argument('--ref',required=True,choices=['R26','R27']);prep.add_argument('--input',type=pathlib.Path,required=True)
    prep.add_argument('--clip',action='append',help='Repeat for selected IDs; omitted prepares all clips for this source')
    prep.add_argument('--allow-derived-input',action='store_true',help='Allow a full-length remux/transcode after checking duration and dimensions; record that it differs from the original hash')
    prep.add_argument('--dry-run',action='store_true')
    args=ap.parse_args();plan=read_json('references/reference-study-20261029/plan.json')
    if args.command=='fetch':
        route=next(r for r in plan['routes'] if r['id']==args.route)
        events=read_json(WEB+'motion-events.json')
        key='shuangge' if route['reference']=='R26' else 'lifeos'
        candidates=[c for c in events['clips'] if c['reference']==key]
        ids=args.clip or ([c['id'] for c in candidates] if args.all_clips else route['priority_spans'])
        if set(ids)-{c['id'] for c in candidates}:raise ValueError('Requested clip is not part of this route')
        dest=args.output.resolve()/args.route;selected=[]
        for c in candidates:
            if c['id'] not in ids:continue
            acquire(WEB+c['video'],dest/c['video'],c['sha256'])
            for f in c['frames']:acquire(WEB+f['image'],dest/f['image'],f.get('sha256'))
            acquire(WEB+c['contact_sheet'],dest/c['contact_sheet'],c.get('contact_sheet_sha256'))
            selected.append(c)
        bundle={'route':args.route,'source':next(s for s in plan['sources'] if s['key']==key),
            'timing_note':events['timing_note'],'clips':selected,'paths_relative_to':'this bundle.json',
            'required_viewing':'Inspect the continuous MP4 and consecutive frames before coding. If no video/vision viewer is available, report that limitation; do not claim visual verification.',
            'reproduction_verified':False}
        if args.full:
            cat=read_json(WEB+'catalog.json');e=next(e for e in cat['entries'] if e['id']==route['reference'])
            acquire(WEB+e['media'],dest/'full-silent.mp4',e['media_sha256'])
            bundle['full_video']='full-silent.mp4';bundle['full_video_dimensions']=e['web_dimensions']
        dest.mkdir(parents=True,exist_ok=True);(dest/'bundle.json').write_text(json.dumps(bundle,ensure_ascii=False,indent=2),'utf8')
        print(json.dumps({'bundle':str(dest/'bundle.json'),'clips':[{'id':c['id'],'video':str(dest/c['video']),'frames':len(c['frames']),'phases':len(c['phases'])} for c in selected]},ensure_ascii=False,indent=2));return
    if args.command=='show':
        route=next(r for r in plan['routes'] if r['id']==args.route)
        source=next(s for s in plan['sources'] if s['key']==('shuangge' if route['reference']=='R26' else 'lifeos'))
        print(json.dumps({'route':route,'source':source,'clips':[c for c in plan['clips'] if c['id'] in route['priority_spans']],
            'next_command':'python scripts/reference_study.py fetch --route '+args.route,
            'visual_evidence':WEB+'motion-events.json',
            'status':'Observed and planned only; no 1:1 reproduction has passed.'},ensure_ascii=False,indent=2));return
    key='shuangge' if args.ref=='R26' else 'lifeos';source=next(s for s in plan['sources'] if s['key']==key)
    candidates=[c for c in plan['clips'] if c['reference']==key]
    unknown=set(args.clip or [])-{c['id'] for c in candidates}
    if unknown:raise ValueError('Clip IDs do not belong to this source: '+', '.join(sorted(unknown)))
    selected=[c for c in candidates if not args.clip or c['id'] in args.clip]
    input_file=args.input.resolve(strict=True)
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(input_file)]))
    video=next(s for s in probe['streams'] if s['codec_type']=='video');duration=float(probe['format']['duration'])
    if abs(duration-source['duration'])>=1 or (video['width'],video['height'])!=(source['width'],source['height']):
        raise ValueError('Reference duration or dimensions do not match; use the correct full-length file.')
    sha=digest(input_file);original=sha==source['sha256']
    if not original and not args.allow_derived_input:raise ValueError('SHA256 differs from the downloaded original. For its full-length remux/transcode, explicitly add --allow-derived-input.')
    dest=ROOT/'local-only/reference-study'/key;preview=dest/'preview-silent.mp4'
    cmd=['ffmpeg','-v','error','-y','-i',str(input_file),'-map','0:v:0','-an']
    cmd+=['-c:v','copy'] if video['codec_name']=='h264' else ['-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p']
    cmd+=['-movflags','+faststart',str(preview)]
    commands=[cmd]
    for c in selected:
        commands.append(['ffmpeg','-v','error','-y','-ss',str(c['start']),'-i',str(input_file),'-t',str(c['end']-c['start']),
            '-map','0:v:0','-an','-vf','scale=720:-2','-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(dest/(c['id']+'-silent.mp4'))])
    result={'reference':args.ref,'source_sha256':sha,'matches_downloaded_original':original,'duration':duration,'size':[video['width'],video['height']],
        'clips':[c['id'] for c in selected],'output':str(dest),'commands':commands,'production_replication_verified':False}
    if not args.dry_run:
        dest.mkdir(parents=True,exist_ok=True)
        for command in commands:subprocess.run(command,check=True)
        result['outputs']=[{'file':str(pathlib.Path(c[-1]).relative_to(dest)),'sha256':digest(pathlib.Path(c[-1]))} for c in commands]
        (dest/'prepared.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf8')
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=='__main__':
    try:main()
    except (ValueError,FileNotFoundError,subprocess.CalledProcessError,StopIteration) as exc:
        print('Reference preparation failed: '+str(exc),file=sys.stderr);sys.exit(1)
