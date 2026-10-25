"""Materialized visual kits, shared content bindings and encoded-motion gates.

Standard-library CLI; rendering uses the existing pinned Remotion project.
Checks establish observable prerequisites, never aesthetic acceptance.
"""
import argparse
import hashlib
import json
import math
import re
import shutil
import statistics
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPORTS = re.compile(r'''(?:\bfrom\s*|\bimport\s*|\bimport\s*\(\s*)["'](\.[^"']+)["']''')
TOKEN = re.compile(r'\{\{([\w.-]+)\}\}')


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def inside(root, rel):
    p = (root / rel).resolve()
    if not p.is_relative_to(root.resolve()):
        raise ValueError(f'Path escapes project: {rel}')
    return p


def dependencies(entry, boundary):
    """Resolve local static imports, including side-effect imports, with cycle handling."""
    seen = set()
    def visit(p):
        p = p.resolve()
        if not p.is_relative_to(boundary.resolve()):
            raise ValueError(f'Import escapes source root: {p.name}')
        if p in seen:
            return
        if not p.is_file():
            raise ValueError(f'Missing import: {p.name}')
        seen.add(p)
        if p.suffix not in {'.ts', '.tsx', '.js', '.jsx', '.mjs'}:
            return
        for ref in IMPORTS.findall(p.read_text(encoding='utf-8-sig')):
            base = p.parent / ref
            choices = [base] + [Path(str(base) + s) for s in ('.tsx', '.ts', '.js', '.json', '.css')]
            choices += [base / ('index' + s) for s in ('.tsx', '.ts', '.js')]
            found = next((x for x in choices if x.is_file()), None)
            if found is None:
                raise ValueError(f'Unresolved import {ref} in {p.name}')
            visit(found)
    visit(entry)
    return seen


def compile_content(ep, save=False):
    spec = read(ep / 'source/content.json')
    values = dict(spec['values'])
    for key, rule in spec.get('derived', {}).items():
        args = [values[k] for k in rule['inputs']]
        op = rule['op']
        if op == 'mean': result = statistics.mean(args[0])
        elif op == 'median': result = statistics.median(args[0])
        elif op == 'sum': result = sum(args[0])
        elif op == 'multiply': result = math.prod(args)
        elif op == 'divide': result = args[0] / args[1]
        elif op == 'power': result = args[0] ** args[1]
        elif op == 'subtract': result = args[0] - args[1]
        else: raise ValueError(f'Unknown operation: {op}')
        if not math.isfinite(result): raise ValueError(f'Non-finite value: {key}')
        values[key] = result
    labels = {}
    for key, fmt in spec['labels'].items():
        value = values[key]
        labels[key] = format(value, fmt['format']) + fmt.get('unit', '')
    def bind(text):
        def replace(match):
            key = match[1]
            if key not in labels: raise ValueError(f'Unbound content token: {key}')
            return labels[key]
        return TOKEN.sub(replace, text)
    chapters = []
    for c in spec['chapters']:
        if len(c['cues']) != len(c['p']): raise ValueError('cue / punctuation count mismatch')
        chapters.append({**c, 'cues': [bind(x) for x in c['cues']]})
    script = {**spec.get('voice', {}), 'factsStatus': spec.get('factsStatus','draft-needs-review'), 'chapters': chapters}
    draft = '\n'.join(f"【{c['id']}｜{c['title']}】\n" + ''.join(a+b for a,b in zip(c['cues'], c['p'])) for c in chapters) + '\n'
    compiled = {'values': values, 'labels': labels, 'text': {k: bind(v) for k,v in spec.get('text', {}).items()}}
    if save:
        write(ep / '工程/src/content.generated.json', compiled)
        write(ep / 'source/script.json', script)
        (ep / 'source/draft.txt').write_text(draft, encoding='utf-8')
        write(ep / 'plans/content-binding.json', {'inputSha256': sha(ep / 'source/content.json'),
            'outputs': {p: sha(ep / p) for p in ['工程/src/content.generated.json','source/script.json','source/draft.txt']}})
    return compiled, script, draft


def source_digest(ep):
    """Hash render inputs, never qa/out, absolute paths, caches or installed dependencies."""
    files = []
    for folder in ['工程/src', '工程/public', 'source']:
        p = ep / folder
        if p.exists(): files.extend(x for x in p.rglob('*') if x.is_file())
    files += [ep / p for p in ['工程/render.mjs','工程/package-lock.json','plans/edit-plan.json','plans/assets.json'] if (ep/p).is_file()]
    h = hashlib.sha256()
    for p in sorted(set(files)):
        h.update(p.relative_to(ep).as_posix().encode()); h.update(b'\0'); h.update(p.read_bytes())
    return h.hexdigest()


def init(ep, kit, aspect, edit='match-move'):
    if ep.exists() and any(ep.iterdir()): raise ValueError('Destination must be empty; existing episodes are never overwritten')
    registry = read(ROOT / 'assets/production-kit/registry.json')
    selected = registry[kit]
    base = ROOT / 'examples/chapter-01'
    template = ROOT / 'assets/production-kit/template'
    ep.mkdir(parents=True, exist_ok=True)
    shutil.copytree(template, ep / '工程', dirs_exist_ok=True)
    for name in ['package.json','package-lock.json','tsconfig.json']:
        if not (ep / '工程' / name).exists():shutil.copy2(base / '工程' / name, ep / '工程' / name)
    for name in ['voice.py','requirements.txt']:
        shutil.copy2(base / name, ep / name)
    up = ROOT / 'assets/weilanx/upstream'
    selected_files = set()
    for entry in [selected['entry'], *selected['extra']]:
        selected_files |= dependencies(up / entry, up)
    manifest = []
    def copy(src, rel, origin):
        dest = ep / rel; dest.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(src, dest)
        manifest.append({'path': rel, 'origin': origin, 'sha256': sha(dest)})
    for f in sorted(selected_files):
        rel = f.relative_to(up).as_posix()
        copy(f, '工程/src/vendor/' + rel, 'assets/weilanx/upstream/' + rel)
    # These fonts are loaded by upstream theme side effects; preserve their licenses too.
    for f in (up / 'public/fonts/vox').iterdir():
        if f.is_file(): copy(f, '工程/public/fonts/vox/' + f.name, 'assets/weilanx/upstream/public/fonts/vox/' + f.name)
    for f in (base / '工程/public/fonts').iterdir():
        if f.name in {'NotoSansSC-VF.ttf','NotoSerifSC-VF.ttf','Noto-OFL.txt'}:
            copy(f, '工程/public/fonts/' + f.name, 'examples/chapter-01/工程/public/fonts/' + f.name)
    copy(up / 'LICENSE', '工程/src/vendor/LICENSE', 'assets/weilanx/upstream/LICENSE')
    symbol = selected['symbol']; rel = selected['entry'].removesuffix('.tsx')
    bodies = {
        'gilded': '<GoldCoin size={100} />',
        'blackgold': '<svg width={180} height={120} viewBox="-90 -160 180 180"><GlowPawnG size={140} tone="lit" /></svg>',
        'pixel': '<svg width={180} height={120} viewBox="-190 -290 380 330"><PixelBuddy eyes="open" /></svg>'
    }
    adapter = f"import React from 'react';\nimport {{{symbol}}} from './vendor/{rel}';\nexport const Asset = () => {bodies[kit]};\n"
    (ep / '工程/src/Asset.tsx').write_text(adapter, encoding='utf-8')
    write(ep / '工程/src/profile.json', {'kit': kit, 'aspect': aspect,
        'width': 1080 if aspect == 'portrait' else 1920, 'height': 1920 if aspect == 'portrait' else 1080,
        **{k:selected[k] for k in ['background','ink','accent']}})
    write(ep / 'plans/assets.json', {'version': 1, 'kit': kit, 'entry': '工程/src/entry.tsx',
        'visualModule': '工程/src/vendor/' + selected['entry'], 'files': manifest,
        'license': 'MIT upstream; OFL fonts', 'role': 'Existing visual objects retained through comparison and regrouping'})
    for name in ['content.json','edit-plan.json']:
        src = ROOT / 'assets/production-kit' / name
        dest = ep / ('source' if name=='content.json' else 'plans') / name
        dest.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(src,dest)
    plan = read(ep / 'plans/edit-plan.json')
    plan['transitions'][1]['kind'] = edit
    if edit == 'evidence-cut':
        plan['transitions'][1]['answer'] = '保留同一组账户，硬切柱形证据到两个统计结果'
    write(ep / 'plans/edit-plan.json', plan)
    (ep / 'tools').mkdir(exist_ok=True)
    shutil.copy2(Path(__file__), ep / 'tools/production.py')
    compile_content(ep, save=True)
    print(json.dumps({'episode':str(ep),'kit':kit,'upstreamFiles':len(selected_files),
        'next':['edit source/content.json and plans/edit-plan.json', 'python tools/production.py compile --episode .',
                'cd 工程; npm ci; node render.mjs proof', 'inspect qa/motion-proof.mp4 and fill qa/motion-review.json',
                'node render.mjs final'], 'scope':'12-second mechanism starter, not a finished article video'}, ensure_ascii=False))


def probe(path):
    r = subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)],capture_output=True,check=True,text=True,encoding='utf-8',timeout=30)
    return json.loads(r.stdout)


def align(ep):
    """Resolve explicitly selected measured cues; never guess equal-duration timing."""
    tl=read(ep/'assets/timeline.json');plan=read(ep/'plans/edit-plan.json')
    if tl.get('wordBoundarySource')!='real edge-tts WordBoundary': raise ValueError('Expected measured voice timeline')
    for t in plan['transitions']:
        if 'cueIndex' not in t: raise ValueError(f"Assign cueIndex to {t['id']} before align")
        i=t['cueIndex']
        if not isinstance(i,int) or not 0<=i<len(tl['cues']): raise ValueError('cueIndex outside timeline')
        t['at']=tl['cues'][i]['start']+t.get('offset',0)
    plan['duration']=tl['seconds'];plan['fps']=tl['fps'];plan['timingStatus']='measured-voice'
    write(ep/'plans/edit-plan.json',plan)
    return 'Transition cues aligned; choose an 8–13s proof interval containing two handoffs and update explanatory beats.'


def capture(ep):
    plan = read(ep / 'plans/edit-plan.json')
    media = ep / 'qa/motion-proof.mp4'; trace = ep / 'qa/motion-trace.json'
    p = probe(media); v = next(x for x in p['streams'] if x['codec_type']=='video')
    duration = float(p['format']['duration'])
    start,end = plan['proof']['start'],plan['proof']['end']
    if not (8 <= duration <= 13 and abs(duration-(end-start)) < .1): raise ValueError('Proof must be a continuous 8–13 second encoded clip of the declared interval')
    report={'media':'qa/motion-proof.mp4','mediaSha256':sha(media),'trace':'qa/motion-trace.json',
        'traceSha256':sha(trace),'sourceSha256':source_digest(ep),'start':start,'end':end,
        'duration':duration,'width':v['width'],'height':v['height'],'fps':v['r_frame_rate']}
    write(ep / 'qa/motion-proof.json', report)
    # Every new render invalidates the previous human/agent observation; never auto-approve.
    write(ep / 'qa/motion-review.json', {'status':'pending','proofSha256':sha(media),
        'method':'', 'observations':[], 'transitions':[], 'unresolved':[],
        'requiredTransitionIds':[x['id'] for x in plan['transitions'] if start <= x['at'] <= end]})
    (ep/'qa/watch.html').write_text('<!doctype html><meta charset="utf-8"><title>静音连续样片</title><body style="background:#111;color:white"><p>默认暂停；无音轨。按时间检查解释动作与前后交接。</p><video controls muted playsinline style="max-width:90vw;max-height:85vh" src="motion-proof.mp4"></video>',encoding='utf-8')
    return report


def check(ep, stage='render'):
    checks=[]
    def run(name, fn):
        try:
            detail=fn();checks.append({'name':name,'passed':True,'required':True,'detail':detail})
        except (ValueError,KeyError,TypeError,ArithmeticError,IndexError,OSError,StopIteration,subprocess.SubprocessError) as e:
            checks.append({'name':name,'passed':False,'required':True,'detail':str(e)})
    def require(ok,msg):
        if not ok: raise ValueError(msg)
    def assets():
        m=read(ep/'plans/assets.json'); require(bool(m['files']),'No packaged assets')
        for f in m['files']:
            require(sha(inside(ep,f['path']))==f['sha256'],f"Asset changed/missing: {f['path']}; explicitly update provenance after adaptation")
        graph=dependencies(inside(ep,m['entry']), ep)
        require(inside(ep,m['visualModule']) in graph,'Visual module is not reachable from render entry; fonts/copying alone do not count')
        return {'kit':m['kit'],'importReachable':True,'files':len(m['files'])}
    def bindings():
        compiled,script,draft=compile_content(ep)
        require(read(ep/'工程/src/content.generated.json')==compiled,'Generated values stale: run compile')
        require(read(ep/'source/script.json')==script,'Spoken script drifted from source/content.json')
        require((ep/'source/draft.txt').read_text('utf-8-sig')==draft,'Draft drifted from content bindings')
        return {'labels':compiled['labels'],'scope':'bound fields only; untagged/manual numbers still require review'}
    def plan_check():
        p=read(ep/'plans/edit-plan.json');a,b=p['proof']['start'],p['proof']['end']
        require(0<=a<b<=p['duration'] and 8<=b-a<=13,'Invalid proof interval')
        ts=[t for t in p['transitions'] if a+0.3<=t['at']<=b-0.3]
        require(len(ts)>=2,'Proof needs two interior transitions')
        require(len({t['id'] for t in ts})==len(ts),'Duplicate transition IDs')
        for t in ts:
            require(t['kind'] in ['match-move','evidence-cut'],'Unknown edit grammar')
            require(bool(t['objectIds']) and bool(t['question']) and bool(t['answer']),'Transition needs object IDs and explanatory handoff')
        require(any(x['start']>=a and x['end']<=b and x['end']>x['start'] and x.get('newInformation') for x in p['beats']),'No explanation beat inside proof')
        return {'transitions':[t['id'] for t in ts]}
    run('visual_asset_imports',assets);run('shared_content_bindings',bindings);run('edit_plan',plan_check)
    if stage=='prepare': return checks
    def encoded():
        r=read(ep/'qa/motion-proof.json');media=inside(ep,r['media']);trace=inside(ep,r['trace'])
        require(sha(media)==r['mediaSha256'] and sha(trace)==r['traceSha256'],'Proof/trace changed after capture')
        require(source_digest(ep)==r['sourceSha256'],'Proof is stale after render inputs changed')
        p=probe(media);require(not any(x['codec_type']=='audio' for x in p['streams']),'Proof must be silent')
        video=next(x for x in p['streams'] if x['codec_type']=='video');plan=read(ep/'plans/edit-plan.json')
        numerator,denominator=map(int,video['r_frame_rate'].split('/'))
        require(abs(numerator/denominator-plan['fps'])<.001,'Encoded FPS differs from motion timeline')
        duration=float(p['format']['duration']);require(8<=duration<=13 and abs(duration-(r['end']-r['start']))<.1,'Not a continuous proof interval')
        d=subprocess.run(['ffmpeg','-v','error','-i',str(media),'-f','null','-'],capture_output=True,timeout=90)
        require(d.returncode==0,'Proof decoding failed')
        return {'duration':duration,'hash':r['mediaSha256']}
    def runtime():
        r=read(ep/'qa/motion-proof.json');rows=read(inside(ep,r['trace']));p=read(ep/'plans/edit-plan.json')
        rows={x['frame']:x for x in rows};fps=p['fps'];first=round(r['start']*fps);last=round(r['end']*fps)-1
        require(all(i in rows for i in range(first,last+1)),'Missing per-frame browser traces')
        kit=read(ep/'plans/assets.json')['kit']
        require(any(o.get('asset')==kit and o['visible'] and o.get('shapes',0)>0 for row in rows.values() for o in row['objects']),'No visible asset recorded in rendered DOM')
        labels=read(ep/'工程/src/content.generated.json')['labels']
        seen=set()
        for row in rows.values():
            for c in row['claims']:
                require(c['key'] in labels and c['text']==labels[c['key']],'Visible bound value differs from shared content')
                seen.add(c['key'])
        require(set(p['proof']['claimKeys'])<=seen,'Required bound labels never appeared')
        for t in p['transitions']:
            f=round(t['at']*fps)
            if not first+2<=f<=last-2: continue
            window=t.get('window',[t['at']-.8,t['at']+.8]);lo=max(first,round(window[0]*fps));hi=min(last,round(window[1]*fps))
            require(lo<f<hi,'Invalid transition inspection window')
            ids=set(t['objectIds'])
            for i in range(lo,hi+1):
                require(ids<={o['id'] for o in rows[i]['objects'] if o['visible']},f"Missing handoff object near {t['id']}")
            if t['kind']=='match-move':
                for i in range(lo,hi):
                    left={o['id']:o for o in rows[i]['objects']};right={o['id']:o for o in rows[i+1]['objects']}
                    for key in ids:
                        dist=math.hypot(left[key]['x']-right[key]['x'],left[key]['y']-right[key]['y'])
                        require(dist<=t.get('maxStep',.08),f"Position jump at {t['id']} / {key}")
        return {'frames':len(rows),'boundLabels':sorted(seen),'scope':'DOM presence, value and local position continuity; not perceptual quality'}
    def observation():
        r=read(ep/'qa/motion-proof.json');v=read(ep/'qa/motion-review.json');p=read(ep/'plans/edit-plan.json')
        require(v.get('status')=='reviewed' and v.get('proofSha256')==r['mediaSha256'],'Motion review missing, pending or stale')
        require(v.get('method') in ['muted-playback','dense-sequence-review'],'Sparse stills cannot substitute for continuous motion review')
        require(bool(v.get('observations')) and not v.get('unresolved'),'No observations or unresolved issues remain')
        for o in v['observations']:
            require(r['start']<=o['start']<o['end']<=r['end'] and bool(o['observed']) and bool(o['newInformation']),'Observation needs a real interval and information change')
        observed={x['id']:x for x in v['transitions']}
        for t in p['transitions']:
            if not r['start']<=t['at']<=r['end']:continue
            require(t['id'] in observed and observed[t['id']].get('verdict')=='keep' and bool(observed[t['id']].get('observed')),f"Unreviewed transition: {t['id']}")
        return 'Producer observation bound to clip; not independent approval or user acceptance'
    run('encoded_motion_proof',encoded);run('rendered_motion_trace',runtime);run('continuous_motion_review',observation)
    return checks


def main():
    ap=argparse.ArgumentParser(description=__doc__);sub=ap.add_subparsers(dest='command',required=True)
    p=sub.add_parser('init');p.add_argument('--episode',required=True);p.add_argument('--kit',choices=['gilded','blackgold','pixel'],required=True);p.add_argument('--aspect',choices=['portrait','landscape'],default='portrait');p.add_argument('--edit',choices=['match-move','evidence-cut'],default='match-move')
    for name in ['compile','align','digest','capture','check']:
        p=sub.add_parser(name);p.add_argument('--episode',required=True)
        if name=='check':p.add_argument('--stage',choices=['prepare','render'],default='render')
    a=ap.parse_args();ep=Path(a.episode).resolve()
    try:
        if a.command=='init':init(ep,a.kit,a.aspect,a.edit)
        elif a.command=='compile':compile_content(ep,True);print('Bound draft + script + visual data rebuilt; re-review changed claims before TTS.')
        elif a.command=='align':print(align(ep))
        elif a.command=='digest':print(source_digest(ep))
        elif a.command=='capture':print(json.dumps(capture(ep),ensure_ascii=False))
        else:
            checks=check(ep,a.stage);print(json.dumps({'checks':checks,'aestheticAcceptance':'not_implied'},ensure_ascii=False,indent=2))
            return 0 if all(c['passed'] for c in checks) else 2
    except (ValueError,KeyError,TypeError,ArithmeticError,IndexError,OSError,subprocess.SubprocessError) as e:
        print(json.dumps({'error':str(e)},ensure_ascii=False));return 2
    return 0


if __name__=='__main__':raise SystemExit(main())
