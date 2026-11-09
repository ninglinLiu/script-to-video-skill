from pathlib import Path
import json,re,subprocess,hashlib,cv2,numpy as np
P=Path(__file__).resolve().parent;f=P/'out/video.mp4';T=json.loads((P/'assets/timeline.json').read_text(encoding='utf-8'));D=T['duration'];N=round(D*30)
p=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_type,width,height,avg_frame_rate,nb_frames,duration,sample_rate,channels,bit_rate','-of','json',str(f)],text=True))
v=next(s for s in p['streams'] if s['codec_type']=='video');a=next(s for s in p['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['avg_frame_rate'])==(1080,1920,'30/1')
assert int(v['nb_frames'])==N and 60<=D<=90 and abs(float(v['duration'])-D)<.04 and abs(float(a['duration'])-D)<.05
r=subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'],capture_output=True,text=True);assert r.returncode==0 and not r.stderr.strip(),r.stderr
cap=cv2.VideoCapture(str(f));n=0;lum=[];diff=[];old=None
while True:
    ok,frame=cap.read()
    if not ok:break
    small=cv2.resize(frame,(108,192)).astype(float);lum.append(float(small.mean()))
    if old is not None:diff.append(float(np.mean(abs(small-old))))
    old=small;n+=1
cap.release();assert n==N and min(lum)>8
r=subprocess.run(['ffmpeg','-hide_banner','-i',str(f),'-vn','-af','loudnorm=I=-16:TP=-1:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
levels=json.loads(re.findall(r'\{\s*"input_i".*?\}',r.stderr,re.S)[-1]);assert -18<=float(levels['input_i'])<=-14 and float(levels['input_tp'])<=-.5
for i,c in enumerate(T['cues']):
    assert 0<=c['start']<c['end']<D
    if i:assert T['cues'][i-1]['end']<=c['start']
spec=json.loads((P/'source/script.json').read_text(encoding='utf-8'));norm=lambda x:''.join(c for c in x if c.isalnum()).lower()
assert norm(''.join(c['text'] for c in T['cues']))==norm(T['text'])
for phrase in spec['required_phrases']:assert norm(phrase) in norm(T['text'])
srt=(P/'out/subtitles.srt').read_text(encoding='utf-8-sig');assert srt.count('-->')==len(T['cues'])
report={'status':'technical_checks_passed','media':p,'decoded_frames':n,'loudness':levels,'mean_luma_range':[min(lum),max(lum)],'max_adjacent_frame_difference':max(diff),'subtitle_cues':len(T['cues']),'alignment':'actual word boundaries from one complete TTS request, with 120 ms placement','qualifications_retained':spec['required_phrases'],'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'independent_human_listening':False,'editor_import_verified':False,'user_full_film_acceptance':'pending'}
(P/'qa/final.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'duration':D,'frames':n,'LUFS':levels['input_i'],'dBTP':levels['input_tp'],'subtitle_cues':len(T['cues']),'sha256':report['sha256']}))
