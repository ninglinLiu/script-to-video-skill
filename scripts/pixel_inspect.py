#!/usr/bin/env python3
"""Encoded-pixel caption tests and whole-film contact sheets for the pixel route.
Reuses film_delivery.pixel_check; does not assign an aesthetic grade.
"""
import argparse,hashlib,importlib.util,json,math,subprocess
from pathlib import Path
from PIL import Image,ImageDraw
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def write(p,v):Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
def run(v):
    v=[str(x) for x in v]
    if v[0]=='ffmpeg':v[1:1]=['-threads','2','-filter_threads','1']
    result=subprocess.run(v,capture_output=True)
    if result.returncode:raise RuntimeError(result.stderr.decode('utf-8','replace')[-6000:])
    return result
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def inspect(ep,film,fmt):
    ep=Path(ep).resolve();f=read(ep/'工程/films'/f'{film}.json');media=ep/'out'/f'{film}-{fmt}-with-audio.mp4'
    if not media.exists():media=ep/'out'/f'{film}-{fmt}-silent.mp4'
    trace=read(ep/'out'/f'{film}-{fmt}-silent.mp4.trace.json')
    q=ep/'qa'/f'{film}-{fmt}';q.mkdir(parents=True,exist_ok=True)
    refs=q/'caption-reference';refs.mkdir(exist_ok=True)
    run(['node',ep/'工程/render.mjs','captions','--film',film,'--format',fmt,'--out',refs/'index.jpg'])
    ref=read(refs/'samples.json');frames=sorted({round(s['t']*30) for s in ref['samples']});seq=q/'encoded-caption';seq.mkdir(exist_ok=True)
    # FFmpeg's expression parser limits recursion depth; a flat 128-term sum
    # builds a left-deep tree and misleadingly reports "Cannot allocate memory".
    terms=[f'eq(n\\,{x})' for x in frames]
    while len(terms)>1:terms=[f'({terms[i]}+{terms[i+1]})' if i+1<len(terms) else terms[i] for i in range(0,len(terms),2)]
    expression=terms[0]
    run(['ffmpeg','-v','error','-y','-i',media,'-vf',f'select={expression},scale={ref["W"]}:{ref["H"]}:flags=neighbor','-fps_mode','vfr','-threads','1',seq/'%03d.png'])
    spec=importlib.util.spec_from_file_location('film_delivery',Path(__file__).with_name('film_delivery.py'));lib=importlib.util.module_from_spec(spec);spec.loader.exec_module(lib)
    report=[]
    for s in ref['samples']:
        n=round(s['t']*30);actual=seq/f'{frames.index(n)+1:03d}.png';box=s['box']
        if box is None:report.append({'index':s['i'],'edge':s['edge'],'passed':False,'reason':'No rendered caption box'});continue
        region=[round(box[k]) for k in ['x','y','w','h']]
        v=lib.pixel_check(Image.open(actual),Image.open(refs/f'{s["i"]}-{s["edge"]}-on.jpg'),Image.open(refs/f'{s["i"]}-{s["edge"]}-off.jpg'),region)
        report.append({'index':s['i'],'edge':s['edge'],'frame':n,'text':s['text'],**v})
    errors=[]
    for row in trace['trace']:
        cue=next((c for c in f['timeline']['cues'] if c['start']<=row['t']<c['end']),None);actual=row.get('caption')
        if (cue and (not actual or actual['text']!=cue['text'])) or (not cue and actual):errors.append(row['frame'])
        if actual and not(0<=actual['x'] and actual['x']+actual['w']<=ref['W']+1 and 0<=actual['y'] and actual['y']+actual['h']<ref['H']):errors.append(row['frame'])
    probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',media]).stdout);v=next(x for x in probe['streams'] if x['codec_type']=='video');aud=[x for x in probe['streams'] if x['codec_type']=='audio']
    count=int(v.get('nb_frames',0));expected=round(f['duration']*30)
    graph=[ep/'工程'/n for n in ['index.html','scene-runtime.js','render.mjs','vendor/engine.js','vendor/util.js','fonts/NotoSansSC-VF.ttf']]+[ep/'工程/films'/f'{film}.json']+[ep/'工程'/n for n in f['assets'].values()]
    source_hash=hashlib.sha256(''.join(sha(p) for p in graph).encode()).hexdigest()
    checks={'frames':count==expected==len(trace['trace']),'format':v['pix_fmt']=='yuv420p' and v['r_frame_rate']=='30/1' and v['codec_name']=='h264','audio':bool(aud) if f.get('audio') else not aud,'captions':not errors and all(x['passed'] for x in report),'sourceBinding':trace['sourceSha256']==source_hash}
    if trace.get('mediaSha256'):checks['encodedBinding']=trace.get('narratedSha256',trace['mediaSha256'])==sha(media)
    caps={'media':str(media.relative_to(ep)),'mediaSha256':sha(media),'configSha256':sha(ep/'工程/films'/f'{film}.json'),'cueCount':len(f['timeline']['cues']),'traceFrames':len(trace['trace']),'traceErrors':errors,'samples':report,'checks':checks,'passed':all(checks.values())};write(q/'caption-verification.json',caps)
    # Review every half-second. Excludes no segment. Not a substitute for audio review.
    shots=q/'sequence';shots.mkdir(exist_ok=True);tw=270;th=480 if fmt=='portrait' else 360
    run(['ffmpeg','-v','error','-y','-i',media,'-vf',f'fps=2,scale={tw}:{th}',shots/'%04d.jpg'])
    paths=sorted(shots.glob('*.jpg'));sheets=[];cols=8;rows=5
    for page in range(math.ceil(len(paths)/(cols*rows))):
        picked=paths[page*cols*rows:(page+1)*cols*rows];sheet=Image.new('RGB',(cols*tw,math.ceil(len(picked)/cols)*(th+24)),(17,20,30));d=ImageDraw.Draw(sheet)
        for i,p in enumerate(picked):
            x=i%cols*tw;y=i//cols*(th+24);sheet.paste(Image.open(p),(x,y));d.text((x+8,y+th+3),f'{(page*cols*rows+i)*.5:.1f}s',fill='white')
        dest=q/f'sequence-{page+1:02}.jpg';sheet.save(dest,quality=91);sheets.append(dest.name)
    cropheight=int(v['height']*.81)//2*2
    proc=run(['ffmpeg','-hide_banner','-i',media,'-vf',f'crop={v["width"]}:{cropheight}:0:0,scale=270:-2,freezedetect=n=-50dB:d=3','-an','-f','null','-'])
    holds=lib.intervals(proc.stderr.decode('utf-8','replace'),f['duration']);write(q/'coverage.json',{'mediaSha256':sha(media),'samplesPerSecond':2,'sequenceFrames':len(paths),'range':[0,f['duration']],'sheets':sheets,'nearStaticIntervals':holds,'limitation':'Frame coverage and freeze location are diagnostics, not aesthetic approval; ambient camera movement can hide weak explanation.'})
    print(json.dumps({'film':film,'format':fmt,'checks':checks,'samples':len(report),'failures':[x for x in report if not x['passed']][:5],'sheets':len(sheets),'nearStatic':holds},ensure_ascii=False))
    if not all(checks.values()):raise SystemExit(1)
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--episode',required=True);p.add_argument('--film',default='caesar');p.add_argument('--format',choices=['original','portrait'],default='original');a=p.parse_args();inspect(a.episode,a.film,a.format)
