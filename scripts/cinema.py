"""Portable, data-driven shot adaptation from the existing Poisson film.

No model, TTS, playback, or network call. This is a renderer branch, not an art grader.
"""
import argparse, hashlib, json, math, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RECIPES = {'spatial','events','histogram','windows','formula','curve','filters'}

def read(p): return json.loads(Path(p).read_text('utf-8-sig'))
def write(p,v):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def need(ok,message):
    if not ok: raise ValueError(message)
def number(x): return type(x) in (int,float) and math.isfinite(x)
def text(x,n=36): return isinstance(x,str) and bool(x.strip()) and len(x)<=n
def values(xs,low,high): return isinstance(xs,list) and all(number(x) and low<=x<=high for x in xs)

def validate_data(s):
    r=s['recipe'];d=s['data']
    need(isinstance(d,dict),'data must be an object')
    if r=='spatial': need(2<=len(d.get('labels',[]))<=5 and all(text(v,10) for v in d['labels']),'spatial requires 2–5 short labels')
    elif r=='events':
        need(values(d.get('positions'),0,1) and 3<=len(d['positions'])<=24,'events positions: 3–24 values within [0,1]')
        need(all(text(d.get(k),14) for k in ['before','after']),'events needs before/after captions')
    elif r=='histogram':
        labels=d.get('labels',[]);samples=d.get('samples',[])
        need(2<=len(labels)<=7 and all(text(v,8) for v in labels),'histogram needs 2–7 bin labels')
        need(3<=len(samples)<=120 and all(type(x)==int and 0<=x<len(labels) for x in samples),'samples must be bin indices; bar counts are derived, not supplied')
        need(isinstance(d.get('unit'),str) and len(d['unit'])<=4,'histogram unit required')
    elif r=='windows':
        need(len(d.get('labels',[]))==2 and all(text(x,12) for x in d['labels']),'windows requires two labels')
        need(values(d.get('values'),.0001,1e6) and len(d['values'])==2,'windows requires two positive, same-unit measurements')
        need(text(d.get('unit'),6),'windows unit required')
    elif r=='formula':
        for key in ['before','after']:
            ts=d.get(key,[])
            need(1<=len(ts)<=10 and all(text(v.get('id'),30) and text(v.get('text'),16) for v in ts),'formula requires named, short tokens')
            need(len({v['id'] for v in ts})==len(ts),'duplicate token id')
            need(sum(len(v['text'])*36+26 for v in ts)<1500,'formula too wide; split the derivation')
        old={x['id']:x['text'] for x in d['before']}
        need(all(x['id'] not in old or x['text']==old[x['id']] for x in d['after']),'retained token id cannot silently change its mathematical value')
        need(text(d.get('explanation'),32),'formula explanation required')
    elif r=='curve':
        pts=d.get('points',[])
        need(2<=len(pts)<=8 and all(values(x,0,1e9) and len(x)==2 for x in pts),'curve needs 2–8 nonnegative measured points')
        need(all(a[0]<b[0] for a,b in zip(pts,pts[1:])),'curve x must increase')
        need(number(d.get('yMax')) and d['yMax']>0 and max(y for x,y in pts)<=d['yMax'],'invalid curve y scale')
        need(text(d.get('xLabel'),12) and isinstance(d.get('unit'),str) and len(d['unit'])<=6,'curve axis labels required')
    elif r=='filters':
        n=len(d.get('stages',[]));items=d.get('items',[])
        need(1<=n<=3 and all(text(v,8) for v in d['stages']),'filters requires 1–3 labeled gates')
        need(3<=len(items)<=70 and all(type(x)==int and 0<=x<=n for x in items),'items = number of gates actually passed, no random success claims')

def count(s):
    return len(s['data'][{'events':'positions','histogram':'samples','filters':'items'}[s['recipe']]])

def compile_spec(spec,tl):
    need(spec.get('schema')==1,'Unsupported film schema')
    need(spec.get('width')==1920 and spec.get('height')==1080,'This branch supports 1920×1080 only; no silent portrait scaling')
    need(text(spec.get('title'),36),'A short film title is required')
    need(tl.get('fps')==30 and type(tl.get('frames'))==int and tl['frames']>0,'Timeline must contain measured frames and fps=30')
    duration=tl['frames']/30;need(abs(tl.get('seconds',-1)-duration)<.001,'Timeline seconds/frames disagree')
    cues=tl.get('cues',[]);subs=tl.get('subtitles',[])
    need(cues and subs,'Real cues and subtitles are required; no estimated equal splitting')
    for rows,name in [(cues,'cues'),(subs,'subtitles')]:
        end=0
        for c in rows:
            need(text(c.get('text'),80) and number(c.get('start')) and number(c.get('end')) and 0<=c['start']<c['end']<=duration and c['start']>=end-.001,'Invalid/overlapping '+name)
            end=c['end']
    # A subtitle file with only a subset of the narration is not accepted.
    normalize=lambda x: ''.join(c for c in x if c.isalnum())
    need(normalize(''.join(x['text'] for x in cues))==normalize(''.join(x['text'] for x in subs)),'Subtitles omit or change spoken cue text')
    shots=spec.get('shots',[]);need(shots,'No shots supplied')
    need(len({s.get('id') for s in shots})==len(shots),'Duplicate shot IDs')
    compiled=[];cursor=0
    for i,shot in enumerate(shots):
        s=json.loads(json.dumps(shot));r=s.get('recipe')
        need(r in RECIPES,'Unsupported recipe: '+str(r))
        need(text(s.get('id'),32) and text(s.get('object'),32),'Shot and object IDs required')
        need(text(s.get('headline'),20) and text(s.get('label'),24),'Headlines/labels too long or missing')
        need(s.get('surface') in ['dark','paper'],'Choose dark or paper explicitly')
        a,b=s.get('fromCue'),s.get('toCue')
        need(type(a)==int and type(b)==int and a==cursor and a<=b<len(cues),'Shots must cover every cue once, in order')
        cursor=b+1;s['start']=0 if i==0 else cues[a]['start'];s['end']=duration if b==len(cues)-1 else cues[b+1]['start']
        act=s.get('action',{});ca,cb=act.get('fromCue'),act.get('toCue')
        need(type(ca)==int and type(cb)==int and a<=ca<=cb<=b,'Action must bind to cues inside its shot')
        s['actionStart']=cues[ca]['start'];s['actionEnd']=cues[cb]['end']
        need(s['actionEnd']-s['actionStart']>=.4,'Action too short to render legibly')
        need(text(s.get('explains'),160),'State what viewers learn from the action')
        tr=s.get('transition',{});need(tr.get('mode') in ['cut','carry'] and text(tr.get('reason'),160),'Every seam needs an explicit explanatory relationship')
        if tr['mode']=='carry':
            need(i>0,'First shot cannot inherit an absent object')
            prev=compiled[-1];allowed={'events','histogram','filters'}
            need(r in allowed and prev['recipe'] in allowed and s['object']==prev['object'],'Carry is supported only between point recipes with the same object ID')
            validate_data(s);need(count(s)==count(prev),'Carry cannot silently add/remove sample identities')
            need(number(tr.get('seconds')) and .2<=tr['seconds']<=1.5 and tr['seconds']<s['end']-s['start'],'Invalid carry duration')
        validate_data(s);compiled.append(s)
    need(cursor==len(cues),'Uncovered narration cues')
    return {'schema':1,'title':spec['title'],'width':1920,'height':1080,'fps':30,'duration':duration,'frames':tl['frames'],'shots':compiled,'subtitles':subs,'fixture':bool(tl.get('fixture'))}

def source_digest(ep):
    ep=Path(ep);files=[ep/'source/film.json',ep/'assets/timeline.json']
    files += [f for f in (ep/'工程').rglob('*') if f.is_file() and not any(p in {'node_modules','.tmp'} for p in f.relative_to(ep).parts) and f.name not in {'film.compiled.json','render-input.sha256'}]
    h=hashlib.sha256()
    for f in sorted(files):h.update(f.relative_to(ep).as_posix().encode()+b'\0'+f.read_bytes())
    return h.hexdigest()

def compile_episode(ep):
    ep=Path(ep);data=compile_spec(read(ep/'source/film.json'),read(ep/'assets/timeline.json'))
    data['sourceSha256']=source_digest(ep);write(ep/'工程/film.compiled.json',data)
    def stamp(t):
        v=round(t*1000);return f'{v//3600000:02}:{v//60000%60:02}:{v//1000%60:02},{v%1000:03}'
    (ep/'out').mkdir(exist_ok=True)
    (ep/'out/subtitles.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(data['subtitles']))+'\n',encoding='utf-8-sig')
    return {'compiled':True,'seconds':data['duration'],'shots':len(data['shots']),'fixture':data['fixture'],'sourceSha256':data['sourceSha256']}

def init(ep):
    ep=Path(ep).resolve();need(not ep.exists() or not any(ep.iterdir()),'Destination must be empty; original film is preserved')
    pack=ROOT/'assets/poisson-cinema';need(pack.exists(),'Run init from the installed skill/repository, not the copied episode tool')
    ep.mkdir(parents=True,exist_ok=True);shutil.copytree(pack/'runtime',ep/'工程',ignore=shutil.ignore_patterns('node_modules','.tmp','film.compiled.json'))
    shutil.copytree(pack/'reference-source',ep/'工程/original')
    fonts=ep/'工程/assets/fonts';fonts.mkdir(parents=True)
    for name in ['NotoSansSC-VF.ttf','NotoSerifSC-VF.ttf','Noto-OFL.txt']:shutil.copy2(ROOT/'examples/chapter-01/工程/public/fonts'/name,fonts/name)
    for folder in ['source','assets','evidence','plans','tools','qa','out','reference']:(ep/folder).mkdir(exist_ok=True)
    for name in ['cinema.py','film_delivery.py']:shutil.copy2(ROOT/'scripts'/name,ep/'tools'/name)
    for name in ['voice.py','requirements.txt']:shutil.copy2(ROOT/'examples/chapter-01'/name,ep/name)
    for name in ['film.json','timeline.json']:shutil.copy2(pack/'fixtures'/('sampling-'+name),ep/'reference'/name)
    write(ep/'source/film.json',{'schema':1,'title':'','width':1920,'height':1080,'shots':[]})
    write(ep/'source/script.json',{'title':'','voice':'zh-CN-YunxiNeural','rate':'+18%','delay':.15,'tail':.65,'subtitleMaxChineseChars':28,'factsStatus':'unreviewed','chapters':[]})
    (ep/'source/draft.txt').write_text('',encoding='utf-8')
    write(ep/'plans/project.json',{'workflow':'cinema-recipes','styleReference':'poisson-cinema','captionMode':'visible-in-video','fullFilmReview':'required','status':'unwritten'})
    write(ep/'plans/captions.json',{'region':[150,924,1620,128],'mode':'visible-in-video'})
    write(ep/'plans/migration.json',{'workflow':'cinema-recipes','source':'poisson_90s','files':[{'path':p.relative_to(ep).as_posix(),'sha256':sha(p)} for p in sorted((ep/'工程').rglob('*')) if p.is_file()],'reviewStatus':'unreviewed-adaptation','voiceStatus':'not-generated'})
    return {'episode':str(ep),'next':'Write the new script and shot plan. reference/ contains synthetic timing examples, not production-approved content. No old narration/evidence/approval was copied.'}

def check(ep):
    ep=Path(ep);f=read(ep/'工程/film.compiled.json')
    need(f['sourceSha256']==source_digest(ep),'Source changed: compile and rerender')
    need(not f['fixture'],'Synthetic fixtures cannot pass production checks')
    need((ep/'assets/word-boundaries.json').is_file() and (ep/'assets/voice-track.wav').is_file(),'Measured word boundaries and actual voice track are required')
    evidence=read(ep/'evidence/script-review.json');draft=ep/'source/draft.txt'
    need(draft.is_file() and any(x.get('path')=='source/draft.txt' and x.get('sha256')==sha(draft) for x in evidence.get('reviewedFiles',[])),'Current script review is missing/stale')
    script=read(ep/'source/script.json');tl=read(ep/'assets/timeline.json')
    authored=[x for ch in script['chapters'] for x in ch['cues']]
    need(authored==[x['text'] for x in tl['cues']],'Current script does not match measured narration')
    motion=read(ep/'qa/cinema-motion.json');need(motion.get('sourceSha256')==f['sourceSha256'] and motion.get('passed') is True,'Actual semantic motion probes are missing, static, or stale')
    # This remains a technical preflight, not aesthetic approval or delivery acceptance.
    return {'passed':True,'scope':'runtime, current evidence, actual shot motion; whole-film review still required'}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=['init','compile','digest','check']);p.add_argument('--episode',required=True);a=p.parse_args()
    try:
        result={'sha256':source_digest(a.episode)} if a.command=='digest' else {'init':init,'compile':compile_episode,'check':check}[a.command](a.episode)
        print(json.dumps(result,ensure_ascii=False,indent=2))
    except (ValueError,OSError,KeyError,TypeError) as e:p.error(str(e))
