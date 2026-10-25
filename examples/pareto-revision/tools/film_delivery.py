"""Verify captions in encoded pixels and prepare whole-film review.

Requires Pillow and FFmpeg. This locates delivery defects; it does not grade art.
Caption references must come from the same render with captions on and off.
"""
import argparse,hashlib,json,math,re,subprocess
from pathlib import Path
from PIL import Image,ImageChops,ImageDraw,ImageStat

def read(p):return json.loads(Path(p).read_text('utf-8-sig'))
def write(p,v):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def run(args):return subprocess.run(args,check=True,capture_output=True)
def source_hash(ep):
    import importlib.util
    script=ep/'tools/production.py'
    if not script.exists():script=Path(__file__).with_name('production.py')
    spec=importlib.util.spec_from_file_location('film_source',script);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
    return m.source_digest(ep)

def pixel_check(actual,expected,without,region):
    x,y,w,h=region;box=(x,y,x+w,y+h)
    actual=actual.convert('RGB').crop(box);expected=expected.convert('RGB').crop(box);without=without.convert('RGB').crop(box)
    changed=ImageChops.difference(expected,without).convert('L').point(lambda x:255 if x>20 else 0)
    bbox=changed.getbbox()
    if bbox is None:raise ValueError('Caption-on and caption-off references are identical')
    pixels=sum(changed.histogram()[1:])
    if pixels<500:raise ValueError('Caption reference has insufficient visible pixels')
    error=ImageStat.Stat(ImageChops.difference(actual,expected).convert('L'),changed).mean[0]
    separation=ImageStat.Stat(ImageChops.difference(actual,without).convert('L'),changed).mean[0]
    # The bundled caption style has light glyphs on a dark plate. Check both,
    # so an empty dark rectangle cannot pass merely by matching the plate.
    interior=Image.new('L',actual.size);ImageDraw.Draw(interior).rectangle((bbox[0]+8,bbox[1]+8,bbox[2]-8,bbox[3]-8),fill=255)
    glyph=ImageChops.multiply(expected.convert('L').point(lambda x:255 if x>190 else 0),interior)
    glyph_pixels=sum(glyph.histogram()[1:])
    glyph_error=ImageStat.Stat(ImageChops.difference(actual,expected).convert('L'),glyph).mean[0] if glyph_pixels else 255
    return {'passed':error<12 and separation>20 and glyph_pixels>100 and glyph_error<18,'changedPixels':pixels,'glyphPixels':glyph_pixels,'expectedError':round(error,3),'withoutCaptionDistance':round(separation,3),'glyphError':round(glyph_error,3)}

def intervals(log,duration):
    result=[];start=None
    for key,value in re.findall(r'freeze_(start|end):\s*([0-9.]+)',log):
        if key=='start':start=float(value)
        elif start is not None:
            result.append({'start':start,'end':float(value)});start=None
    if start is not None:result.append({'start':start,'end':duration})
    return [dict(id=f'hold-{i}',**x,seconds=round(x['end']-x['start'],3)) for i,x in enumerate(result) if x['end']-x['start']>=4]

def cover(sections,duration):
    cursor=0
    for x in sorted(sections,key=lambda s:s['start']):
        if not 0<=x['start']<x['end']<=duration+.05 or x['start']>cursor+.12:return False
        if not x.get('observed') or not x.get('newInformation'):return False
        cursor=max(cursor,x['end'])
    return cursor>=duration-.12

def mux(ep):
    ep=Path(ep).resolve();video=ep/'out/final-silent.mp4';voice=ep/'assets/voice-track.wav';output=ep/'out/final-with-audio.mp4'
    # Flat artwork often undershoots a VBR target. Honor the task's actual minimum
    # bitrate at encoding time instead of accepting a requested encoder setting.
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(video),'-i',str(voice),
         '-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-threads','4','-pix_fmt','yuv420p',
         '-b:v','10M','-minrate','10M','-maxrate','10M','-bufsize','20M','-x264-params','nal-hrd=cbr:filler=1',
         '-af','apad','-c:a','aac','-b:a','192k','-movflags','+faststart','-shortest',str(output)])
    return {'output':str(output),'sha256':sha(output),'next':'inspect the newly encoded film; never reuse old media approval'}

def inspect(ep):
    ep=Path(ep).resolve();media=ep/'out/final-with-audio.mp4';tl=read(ep/'assets/timeline.json');ref=read(ep/'qa/caption-reference.json');region=read(ep/'plans/captions.json')['region']
    if ref['sourceSha256']!=source_hash(ep):raise ValueError('Caption references are stale')
    probe=json.loads(run(['ffprobe','-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=nb_read_frames','-of','json',str(media)]).stdout)
    encoded_frames=int(probe['streams'][0]['nb_read_frames'])
    if encoded_frames!=tl['frames']:raise ValueError('Encoded frame count differs from full timeline; check audio padding and mux duration')
    trace={x['frame']:x for x in read(ep/'qa/caption-trace.json')}
    trace_errors=[]
    for frame in range(tl['frames']):
        t=frame/tl['fps'];sub=next((s for s in tl['subtitles'] if s['start']<=t<s['end']),None);row=trace.get(frame)
        if row is None or (sub and (row.get('text')!=sub['text'] or not row.get('visible'))):trace_errors.append(frame)
    sample_indices={s['subtitle'] for s in ref['samples']}
    if sample_indices!=set(range(len(tl['subtitles']))):raise ValueError('Caption references do not cover every subtitle')
    frames=sorted({s['frame'] for s in ref['samples']});folder=ep/'qa/encoded-caption-frames';folder.mkdir(parents=True,exist_ok=True)
    select='+'.join(f'eq(n\\,{n})' for n in frames)
    run(['ffmpeg','-v','error','-y','-i',str(media),'-vf',f'select={select}','-fps_mode','vfr',str(folder/'%03d.png')])
    frame_paths={frame:folder/f'{i+1:03}.png' for i,frame in enumerate(frames)}
    rows=[]
    for s in ref['samples']:
        result=pixel_check(Image.open(frame_paths[s['frame']]),Image.open(ep/s['expected']),Image.open(ep/s['without']),region)
        rows.append({**s,**result,'encoded':frame_paths[s['frame']].relative_to(ep).as_posix()})
    captions={'mediaSha256':sha(media),'sourceSha256':ref['sourceSha256'],'referenceSha256':sha(ep/'qa/caption-reference.json'),'traceSha256':sha(ep/'qa/caption-trace.json'),'planSha256':sha(ep/'plans/captions.json'),'timelineSha256':sha(ep/'assets/timeline.json'),'subtitleCount':len(tl['subtitles']),'encodedFrames':encoded_frames,'traceFrames':len(trace),'traceErrors':trace_errors,'samples':rows,'passed':not trace_errors and all(s['passed'] for s in rows)}
    write(ep/'qa/caption-verification.json',captions)
    # Crop out subtitles and footer so changing text/progress cannot hide a frozen scene.
    size=json.loads(run(['ffprobe','-v','error','-show_entries','stream=codec_type,width,height','-of','json',str(media)]).stdout)
    v=next(s for s in size['streams'] if s['codec_type']=='video');h=int(min(region[1]-40,v['height']*.82)//2*2)
    vf=f'crop={v["width"]}:{h}:0:0,scale=270:-2,freezedetect=n=-50dB:d=4'
    process=run(['ffmpeg','-hide_banner','-i',str(media),'-vf',vf,'-an','-f','null','-'])
    log=process.stderr.decode('utf8','replace');(ep/'qa/pace.log').write_text(log,encoding='utf8')
    holds=intervals(log,tl['seconds']);write(ep/'qa/pace.json',{'mediaSha256':sha(media),'method':vf,'intervals':holds,'scope':'Candidate near-static intervals for editorial review; no aesthetic score or fixed cut cadence.'})
    # Whole-film contact sheets at 2 fps, including the opening and tail.
    frames_dir=ep/'qa/full-frames';frames_dir.mkdir(exist_ok=True)
    run(['ffmpeg','-v','error','-y','-i',str(media),'-vf','fps=2,scale=180:-2','-q:v','3',str(frames_dir/'%04d.jpg')])
    files=sorted(frames_dir.glob('*.jpg'));sheets=[]
    for first in range(0,len(files),30):
        group=files[first:first+30];height=Image.open(group[0]).height;board=Image.new('RGB',(180*6,(height+22)*math.ceil(len(group)/6)),'#161616');d=ImageDraw.Draw(board)
        for i,f in enumerate(group):
            x=(i%6)*180;y=(i//6)*(height+22);board.paste(Image.open(f),(x,y+22));d.text((x+8,y+4),f'{(first+i)/2:.1f}s',fill='white')
        path=ep/f'qa/full-sequence-{first//30:02}.jpg';board.save(path);sheets.append(path.relative_to(ep).as_posix())
    review={'status':'pending','mediaSha256':sha(media),'method':'','sections':[],'holds':[dict(x,decision='pending',reason='') for x in holds],'unresolved':[],'contactSheets':sheets,'scope':'Producer full-film observation; not user acceptance.'}
    write(ep/'qa/full-review.json',review)
    return {'captionsPassed':captions['passed'],'subtitleCount':len(tl['subtitles']),'pixelSamples':len(rows),'nearStaticIntervals':holds,'review':'pending'}

def check(ep):
    ep=Path(ep).resolve();checks=[]
    def test(name,fn):
        try:detail=fn();checks.append({'name':name,'passed':True,'required':True,'detail':detail})
        except (ValueError,KeyError,TypeError,OSError) as e:checks.append({'name':name,'passed':False,'required':True,'detail':str(e)})
    def require(ok,msg):
        if not ok:raise ValueError(msg)
    def captions():
        r=read(ep/'qa/caption-verification.json');tl=read(ep/'assets/timeline.json')
        require(r['mediaSha256']==sha(ep/'out/final-with-audio.mp4'),'Caption check belongs to another MP4')
        require(r['sourceSha256']==source_hash(ep),'Caption check is stale after source changes')
        for k,f in [('referenceSha256','qa/caption-reference.json'),('traceSha256','qa/caption-trace.json'),('planSha256','plans/captions.json'),('timelineSha256','assets/timeline.json')]:require(r[k]==sha(ep/f),'Caption evidence changed')
        require(r['passed'] and not r['traceErrors'] and r['traceFrames']==tl['frames'] and r.get('encodedFrames')==tl['frames'],'Rendered caption trace or encoded frame count failed')
        require({s['subtitle'] for s in r['samples'] if s['passed']}==set(range(len(tl['subtitles']))),'Encoded pixels do not cover every subtitle')
        return {'subtitles':r['subtitleCount'],'pixelSamples':len(r['samples']),'scope':'Actual encoded pixels vs caption-on/off render references, plus full-frame text trace.'}
    def full():
        v=read(ep/'qa/full-review.json');pace=read(ep/'qa/pace.json');duration=read(ep/'assets/timeline.json')['seconds'];h=sha(ep/'out/final-with-audio.mp4')
        require(v.get('status')=='reviewed' and v['mediaSha256']==h and pace['mediaSha256']==h,'Full-film review missing, pending or stale')
        require(v.get('method') in ['muted-playback','whole-film-dense-sequence'],'Whole film must be reviewed, not one proof window')
        require(cover(v['sections'],duration),'Review intervals do not cover the complete film')
        require(not v.get('unresolved'),'Unresolved full-film issues')
        decisions={x['id']:x for x in v['holds']}
        for hold in pace['intervals']:require(hold['id'] in decisions and decisions[hold['id']].get('decision')=='keep' and bool(decisions[hold['id']].get('reason')),'Near-static interval needs an editorial observation')
        return {'seconds':duration,'scope':'Complete interval coverage and reviewed holds; not a measure of artistic quality.'}
    test('captions_visible_in_encoded_video',captions);test('whole_film_review',full)
    return checks

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=['mux','inspect','check']);p.add_argument('--episode',required=True);a=p.parse_args()
    try:
        result={'mux':mux,'inspect':inspect,'check':check}[a.command](a.episode);print(json.dumps(result,ensure_ascii=False,indent=2))
        if a.command=='check':raise SystemExit(0 if all(x['passed'] for x in result) else 2)
    except (ValueError,OSError,KeyError,subprocess.SubprocessError) as e:p.error(str(e))
