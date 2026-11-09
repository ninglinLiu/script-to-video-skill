from pathlib import Path
import json,subprocess,hashlib,shutil,cv2,numpy as np,zipfile,os,time
P=Path(__file__).resolve().parent
silent=P/'out/消失的25元-60秒-静音.mp4';master=P/'out/消失的25元-60秒-带声音.mp4'
shutil.copy2(P/'out/final-silent.mp4',silent)
def probe(p):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels','-of','json',str(p)],text=True))
sp=probe(silent);mp=probe(master)
assert len(sp['streams'])==1 and sp['streams'][0]['codec_type']=='video'
assert float(sp['format']['duration'])==60
assert sp['streams'][0]['width']==1080 and sp['streams'][0]['height']==1920
assert sp['streams'][0]['nb_frames']=='1800' and sp['streams'][0]['r_frame_rate']=='30/1'
assert len([s for s in mp['streams'] if s['codec_type']=='audio'])==1
for file in [silent,master]:subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True)
timing=json.loads((P/'工程/src/timing.json').read_text(encoding='utf-8'))
assert all(0<=c['start']<c['end']<=60 for c in timing['cues'])
assert all(a['end']<=b['start'] for a,b in zip(timing['cues'],timing['cues'][1:]))
cap=cv2.VideoCapture(str(silent));lumas=[];frames=0
while True:
 ok,bgr=cap.read()
 if not ok:break
 if frames%30==0:lumas.append(float(cv2.cvtColor(cv2.resize(bgr,(108,192)),cv2.COLOR_BGR2GRAY).mean()))
 frames+=1
cap.release();assert frames==1800 and min(lumas)>12
subprocess.run(['ffmpeg','-v','error','-y','-ss','4.3','-i',str(silent),'-vf','scale=540:960','-frames:v','1',str(P/'qa/poster.jpg')],check=True)
html=(P/'watch.html').read_text(encoding='utf-8').replace('src="out/draft-silent.mp4"','poster="qa/poster.jpg" src="out/消失的25元-60秒-静音.mp4"')
(P/'watch.html').write_text(html,encoding='utf-8')
audio=json.loads((P/'qa/audio-master.json').read_text(encoding='utf-8'))
assert float(audio['measurement']['input_tp'])<=-0.9
assert -15<float(audio['measurement']['input_i'])<-13
report={'technical':'passed','visualReview':'production_review_complete; final contact sheets and transition strips retained','userAcceptance':'pending','scope':'60-second vertical sample; not the 8–10 minute assignment','silent':sp,'master':mp,'decodedFrames':frames,'audio':audio,'subtitleCount':len(timing['cues']),'subtitleRange':[timing['cues'][0]['start'],timing['cues'][-1]['end']],'math':{'forward':100*.5*1.5,'reverse':100*1.5*.5,'recoveryPercent':(100-50)/50*100},'browser':{'draftPlayedToEnd':True,'defaultPaused':True,'muted':True,'autoplay':False,'finalBrowserCheck':'pending'},'limitations':['No speaker playback or subjective listening review','Remotion source, not native Jianying project','ASR has homophone errors; it is not an authoritative transcript'],'reuse':{'weilanxCommit':'fb2f5e429744470e10b242b84c0f8aeaf00e280a','engine':'Remotion','source':'anim.ts, cues.ts, redshift/theme.ts, vox/theme.ts, synth.mjs, bgm.mjs'}}
(P/'qa/final-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'technical':'passed','frames':frames,'duration':60,'silentAudioStreams':0,'lufs':audio['measurement']['input_i'],'truePeak':audio['measurement']['input_tp']},ensure_ascii=False))
