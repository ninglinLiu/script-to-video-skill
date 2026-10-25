"""Observable delivery checks. Does not score aesthetics or invent approval."""
import argparse,hashlib,json,re,subprocess,importlib.util
from pathlib import Path

def audit(episode,profile):
    ep=Path(episode).resolve(); checks=[]
    def add(name,ok,detail,required=True):checks.append(dict(name=name,passed=bool(ok),required=required,detail=detail))
    short=profile=='task-short'; chapter=profile=='chapter-proof'
    low,high=(90,150) if chapter else (60,90) if short else (165,195)
    media=ep/'out/final-with-audio.mp4'
    add('narrated_mp4',media.is_file(),str(media))
    sha=None
    if media.is_file():
        try:
            r=subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(media)],capture_output=True,text=True,encoding='utf-8',check=True,timeout=60)
            p=json.loads(r.stdout);v=next(s for s in p['streams'] if s['codec_type']=='video');a=[s for s in p['streams'] if s['codec_type']=='audio'];dur=float(v.get('duration',p['format']['duration']))
            add('duration',low<=dur<=high,dict(actual=dur,min=low,max=high,profile=profile))
            dimensions=(1920,1080) if chapter else (1080,1920)
            add('video_format',(v['width'],v['height'],v['codec_name'],v.get('pix_fmt'),v['r_frame_rate'])==(*dimensions,'h264','yuv420p','30/1'),v)
            rate=int(v.get('bit_rate',0));add('video_bitrate',rate>0 if chapter else rate>=8_000_000,dict(actual=rate,policy='CRF-based chapter; visual inspection separate' if chapter else 'minimum 8Mbps'))
            add('audio',len(a)==1 and a[0]['codec_name']=='aac',[s.get('codec_name') for s in a])
            d=subprocess.run(['ffmpeg','-v','error','-i',str(media),'-f','null','-'],capture_output=True,timeout=240);add('full_decode',d.returncode==0,d.stderr.decode('utf-8','replace')[:500])
            sha=hashlib.file_digest(media.open('rb'),'sha256').hexdigest()
        except Exception as e:add('media_probe',False,str(e))
    timeline=ep/'assets/timeline.json'
    if timeline.is_file():
        j=json.loads(timeline.read_text(encoding='utf-8-sig'));subs=j.get('subtitles',[]);cues=j.get('cues',[])
        add('real_voice_timestamps',j.get('wordBoundarySource')=='real edge-tts WordBoundary',j.get('wordBoundarySource'))
        add('subtitle_intervals',bool(subs) and all(0<=s['start']<s['end']<=j['seconds'] for s in subs) and all(a['end']<=b['start'] for a,b in zip(subs,subs[1:])),len(subs))
        add('subtitle_voice_alignment',bool(cues) and all(any(abs(s['start']-c['start'])<1e-6 for c in cues) and any(abs(s['end']-c['end'])<1e-6 for c in cues) for s in subs),'SRT groups must start/end on measured voice cues')
        add('srt_file',bool(list((ep/'out').glob('*.srt'))),'one or more authored SRT files')
    else:add('voice_timeline',False,str(timeline))
    for name,rel in [('source_evidence','evidence/source-manifest.json'),('script_review','evidence/script-review.json'),('shot_contracts','source/storyboard.json')]:
        f=ep/rel;add(name,f.is_file(),str(f))
    review_file=ep/'evidence/script-review.json';draft_file=ep/'source/draft.txt';spec_file=ep/'source/script.json'
    if review_file.is_file() and draft_file.is_file() and spec_file.is_file():
        reviewed=json.loads(review_file.read_text(encoding='utf-8-sig'));spec=json.loads(spec_file.read_text(encoding='utf-8-sig'))
        draft_hash=hashlib.file_digest(draft_file.open('rb'),'sha256').hexdigest()
        hash_ok=any(f.get('path')=='source/draft.txt' and f.get('sha256','').lower()==draft_hash for f in reviewed.get('reviewedFiles',[]))
        bodies=re.split(r'【[^】]+】\n',draft_file.read_text(encoding='utf-8-sig'))[1:]
        written=''.join(''.join(a+b for a,b in zip(c['cues'],c['p'])) for c in spec['chapters'])
        add('approved_script_unchanged',reviewed.get('ttsAllowed') is True and hash_ok and ''.join(x.strip() for x in bodies)==written,'Review hash and actual spoken content both checked')
    else:add('approved_script_unchanged',False,'Missing hash-bound draft and approval record')
    story=ep/'source/storyboard.json'
    if story.is_file():
        shots=json.loads(story.read_text(encoding='utf-8-sig'));fields=['objectId','before','after','cue','entry','exit','numericInvariant','verificationTime']
        add('shot_state_contracts',bool(shots) and all(all(f in s for f in fields) for s in shots),len(shots))
        if short:add('task_shot_count',5<=len(shots)<=8,dict(actual=len(shots),min=5,max=8))
    render=ep/'qa/render-full.json';add('render_record',render.is_file(),str(render))
    review=ep/'qa/production-review.json'
    if review.is_file():
        j=json.loads(review.read_text(encoding='utf-8-sig'));add('final_visual_review',j.get('status')=='reviewed_with_fixes' and j.get('reviewedFinalSha256')==sha and bool(j.get('framesReviewed')),j)
    else:add('final_visual_review',False,'No timecoded actual-frame review of final MP4')
    native=ep/'qa/editor-import.json'
    ok=False;detail='No verified native editor import. Remotion source is not a substitute.'
    if native.is_file():
        j=json.loads(native.read_text(encoding='utf-8-sig'));project=j.get('project')
        ok=(isinstance(project,str) and bool(project.strip())
            and (ep/project).is_file() and j.get('openedSuccessfully') is True
            and j.get('editor') in ['Premiere Pro','Jianying','Final Cut Pro'])
        detail=j
    acknowledged=False
    if native.is_file():
        acknowledged=(j.get('status')=='user_reported_already_verified'
                      and j.get('validationOwner')=='user'
                      and j.get('repeatValidationWaived') is True
                      and bool(j.get('userInstruction')))
    add('native_editor_project',ok,detail,required=short and not acknowledged)
    if acknowledged:
        add('editor_repeat_validation_waived',True,{'basis':'explicit_user_instruction','instruction':j['userInstruction'],'agentImportVerified':ok,'scope':j.get('verifiedScope','unspecified')})
    src=ep/'工程/src';texts='\n'.join(f.read_text(encoding='utf-8-sig') for f in src.glob('*.tsx')) if src.is_dir() else ''
    add('deterministic_source',bool(texts) and not re.search(r'Math\.random\(|Date\.now\(|requestAnimationFrame\(',texts),'Static check only; no aesthetic claim')
    # Motion prerequisites are evaluated separately from frame-level producer notes.
    # Older episodes report missing evidence rather than being silently grandfathered in.
    gate_spec=importlib.util.spec_from_file_location('production_gate',Path(__file__).with_name('production.py'))
    gate=importlib.util.module_from_spec(gate_spec);gate_spec.loader.exec_module(gate)
    checks.extend(gate.check(ep,'render'))
    ready=all(c['passed'] for c in checks if c['required'])
    return dict(profile=profile,episode=str(ep),status='technical_and_producer_checks_passed' if ready else 'incomplete',checks=checks,userAestheticAcceptance='not_implied',universalPipelineValidated=False)

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--episode',required=True);ap.add_argument('--profile',choices=['task-short','extended','chapter-proof'],default='task-short');ap.add_argument('--output');a=ap.parse_args()
    report=audit(a.episode,a.profile)
    if a.output:
        dest=Path(a.output);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'profile':report['profile'],'status':report['status'],'failed':[c['name'] for c in report['checks'] if c['required'] and not c['passed']]},ensure_ascii=True))
    raise SystemExit(0 if report['status']=='technical_and_producer_checks_passed' else 2)
