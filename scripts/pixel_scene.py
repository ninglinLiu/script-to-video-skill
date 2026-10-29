#!/usr/bin/env python3
"""Compile and render the full-environment pixel route. No model/API or media playback."""
import argparse, hashlib, json, math, os, shutil, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
KIT=ROOT/'assets/pixel-scene-map'
def read(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def write(p,d):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def run(args): subprocess.run([str(x) for x in args],check=True)
def segment_signature(f,lo,hi,format):
    """Only a segment's visible shot/cue graph; changing another shot keeps its cache."""
    shots=[];t=0
    for s in f['shots']:
        end=t+s['dur']
        if t<hi/30 and end>lo/30:shots.append({'start':t,'end':end,'shot':s})
        t=end
    data={k:v for k,v in f.items() if k not in ['shots','timeline','timelineFile','audio']}
    data.update(shots=shots,cues=[c for c in f['timeline']['cues'] if c['start']<hi/30 and c['end']>lo/30],range=[lo,hi],format=format)
    return hashlib.sha256(json.dumps(data,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
def validate(f):
    assert f['shots'] and f['duration']>0
    assert abs(sum(s['dur'] for s in f['shots'])-f['duration'])<.04,'Shot duration mismatch'
    ids=[s['id'] for s in f['shots']];assert len(set(ids))==len(ids),'Duplicate shot IDs'
    assert all(s['dur']>0 for s in f['shots'])
    for s in f['shots']:
        if s['type']!='map': assert s['plate'] in f['assets'],f"Missing plate {s['id']}"
        assert 'cameraPortrait' in s or s['type']=='map',f"No portrait layout {s['id']}"
        if s['type']=='map':assert s.get('map') and s.get('mapPortrait'),f"No portrait map layout {s['id']}"
    last=0
    for c in f['timeline']['cues']:
        assert c['text'] and 0<=c['start']<c['end']<=f['duration']+.04
        assert c['start']>=last,'Overlapping cues';last=c['end']
    if f.get('audio'): assert f['timeline'].get('wordBoundarySource')=='real edge-tts WordBoundary','Narration must carry real timing provenance'
def build(ep):
    for p in (ep/'source').glob('*.json'):
        f=read(p)
        if 'shots' not in f:continue
        timeline=f.get('timelineFile')
        if timeline: f['timeline']=read(ep/timeline)
        validate(f)
        for asset in f['assets'].values():assert (ep/'工程'/asset).is_file(),asset
        write(ep/'工程/films'/p.name,f)
    print('Compiled:',ep/'工程/films')
def prepare(ep):
    if (ep/'工程').exists():raise ValueError('Destination already contains an engine; use build to update config')
    for d in ['source','assets','evidence','plans','qa','out']: (ep/d).mkdir(parents=True,exist_ok=True)
    shutil.copytree(KIT/'runtime',ep/'工程')
    for d in ['plates','layers','fonts']: shutil.copytree(KIT/d,ep/'工程'/d)
    for p in (KIT/'configs').glob('*.json'):shutil.copy2(p,ep/'source'/p.name)
    src=ROOT/'examples/chapter-01'
    for name in ['timeline.json','word-boundaries.json','voice-track.wav']:shutil.copy2(src/'assets'/name,ep/'assets'/name)
    shutil.copy2(src/'source/draft.txt',ep/'source/original-draft.txt')
    shutil.copytree(src/'evidence',ep/'evidence/chapter-01',dirs_exist_ok=True)
    shutil.copy2(KIT/'provenance.json',ep/'plans/asset-provenance.json')
    (ep/'tools').mkdir(exist_ok=True)
    for name in ['pixel_scene.py','pixel_inspect.py','film_delivery.py']:
        shutil.copy2(Path(__file__).with_name(name),ep/'tools'/name)
    (ep/'requirements.txt').write_text('Pillow>=10,<13\n',encoding='utf-8')
    files=[p for p in (ep/'工程').rglob('*') if p.is_file()]
    write(ep/'plans/migration.json',{'source':'pixel-scene-map','base':'5e2e38d','files':[{'path':str(p.relative_to(ep)).replace('\\','/'),'sha256':sha(p)} for p in files]})
    build(ep)
    print('Prepared. In',ep/'工程','run: npm ci --ignore-scripts')

def output_path(ep,film,format,start=None,end=None):
    suffix='' if start is None and end is None else f'-clip-{start or 0:g}-{end if end is not None else "end"}'
    return ep/'out'/f'{film}-{format}{suffix}-silent.mp4'
def render(ep,a):
    build(ep);out=output_path(ep,a.film,a.format,a.start,a.end);out.parent.mkdir(parents=True,exist_ok=True)
    f=read(ep/'工程/films'/f'{a.film}.json')
    common=['node',ep/'工程/render.mjs','render','--film',a.film,'--format',a.format]
    if a.master and a.format=='original':common+=['--width','2160','--height','2880','--bitrate','20M']
    # Include only this film's input graph. Other configs may render independently.
    graph=[ep/'工程'/n for n in ['index.html','scene-runtime.js','render.mjs','vendor/engine.js','vendor/util.js','fonts/NotoSansSC-VF.ttf']]+[ep/'工程/films'/f'{a.film}.json']+[ep/'工程'/n for n in f['assets'].values()]
    digest=lambda:hashlib.sha256(''.join(sha(p) for p in graph).encode()).hexdigest()
    source_hash=digest()
    engine_hash=hashlib.sha256((''.join(sha(p) for p in graph if p.suffix!='.json')+str(common)).encode()).hexdigest()
    key=hashlib.sha256((engine_hash+str(common)).encode()).hexdigest()[:16]
    cache=ep/'qa/segments'/key;cache.mkdir(parents=True,exist_ok=True)
    start=round((a.start or 0)*30);stop=round((a.end if a.end is not None else f['duration'])*30)
    parts=[];merged=[]
    for lo in range(start,stop,360):
        hi=min(stop,lo+360);part=cache/f'{lo:06}-{hi:06}.mp4';record=part.with_suffix('.json')
        signature=segment_signature(f,lo,hi,a.format)
        cached=part.exists() and record.exists() and read(record).get('sha256')==sha(part) and read(record).get('segmentSignature')==signature
        if not cached:
            # A previously verified identical segment can be reused across cache folders.
            for old in (ep/'qa/segments').glob(f'*/{part.stem}.json'):
                info=read(old);prior=old.with_suffix('.mp4')
                if info.get('engineSha256')==engine_hash and info.get('segmentSignature')==signature and prior.exists() and info.get('sha256')==sha(prior):
                    if prior!=part:
                        shutil.copy2(prior,part);shutil.copy2(str(prior)+'.trace.json',str(part)+'.trace.json');shutil.copy2(old,record)
                    cached=True;break
        if not cached:
            print(f'Segment {lo/30:.2f}–{hi/30:.2f}s',flush=True)
            run(common+['--start',lo/30,'--end',hi/30,'--out',part])
            if digest()!=source_hash:raise RuntimeError('Production inputs changed during render; segment not certified')
            probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=nb_frames','-of','json',str(part)]))
            assert int(probe['streams'][0]['nb_frames'])==hi-lo,'Incomplete segment'
            write(record,{'sha256':sha(part),'frames':hi-lo,'sourceSha256':source_hash,'engineSha256':engine_hash,'segmentSignature':signature})
        else: print(f'Reuse {lo/30:.2f}–{hi/30:.2f}s',flush=True)
        t=read(str(part)+'.trace.json');assert not t['errors'];assert len(t['trace'])==hi-lo
        merged.extend([{**x,'frame':round(x['t']*30)-start} for x in t['trace']]);parts.append(part)
    concat=cache/'concat.txt';concat.write_text('\n'.join("file '"+p.as_posix().replace("'","'\\''")+"'" for p in parts),encoding='utf-8')
    run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',concat,'-c','copy','-movflags','+faststart',out])
    trace={'film':a.film,'format':a.format,'start':start/30,'end':stop/30,'frames':stop-start,'sourceSha256':source_hash,'mediaSha256':sha(out),'segments':[str(p.relative_to(ep)) for p in parts],'errors':[],'trace':merged}
    if f.get('audio') and a.start is None and a.end is None:
        final=out.with_name(out.name.replace('-silent','-with-audio'))
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',out,'-i',ep/f['audio'],'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',f['duration'],'-movflags','+faststart',final])
        trace.update(narratedSha256=sha(final),audioSha256=sha(ep/f['audio']))
    write(str(out)+'.trace.json',trace)
    def stamp(t):
        n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'
    (ep/'out'/f'{a.film}.srt').write_text('\n\n'.join(f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}" for i,c in enumerate(f['timeline']['cues']))+'\n',encoding='utf-8')
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=['prepare','build','render']);p.add_argument('--episode',type=Path,required=True);p.add_argument('--film',default='caesar');p.add_argument('--format',choices=['original','portrait'],default='original');p.add_argument('--start',type=float);p.add_argument('--end',type=float);p.add_argument('--master',action='store_true');a=p.parse_args();ep=a.episode.resolve()
    {'prepare':lambda:prepare(ep),'build':lambda:build(ep),'render':lambda:render(ep,a)}[a.command]()
if __name__=='__main__': main()
