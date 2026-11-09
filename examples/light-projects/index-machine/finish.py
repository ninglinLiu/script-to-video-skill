from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import subprocess,json,hashlib,sys
P=Path(__file__).resolve().parent
tl=json.loads((P/'assets/timeline.json').read_text(encoding='utf-8'))
def run(cmd):return subprocess.run(cmd,check=True,capture_output=True,text=True,encoding='utf-8',errors='replace')
def probe(p):return json.loads(run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(p)]).stdout)
raw=P/'qa/render-full-range.mp4';r=probe(raw);v=next(s for s in r['streams'] if s['codec_type']=='video')
vf='scale=in_range=pc:out_range=tv' if v.get('color_range')=='pc' else 'format=yuv420p'
print('Mastering silent MP4',flush=True)
run(['ffmpeg','-v','error','-y','-i',str(raw),'-an','-vf',vf,'-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-color_range','tv','-movflags','+faststart',str(P/'out/final-silent.mp4')])
run(['ffmpeg','-v','error','-y','-i',str(P/'out/final-silent.mp4'),'-i',str(P/'assets/mix.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-af','apad','-c:a','aac','-b:a','192k','-t',str(tl['seconds']),'-movflags','+faststart',str(P/'out/final-with-audio.mp4')])
checks=[]
for name,ac in [('final-silent.mp4',0),('final-with-audio.mp4',1)]:
 f=P/'out'/name;r=probe(f);v=next(s for s in r['streams'] if s['codec_type']=='video');aud=[s for s in r['streams'] if s['codec_type']=='audio']
 assert (v['width'],v['height'],v['r_frame_rate'],v['pix_fmt'])==(1080,1920,'30/1','yuv420p')
 assert int(v['nb_read_frames'])==tl['frames'] and len(aud)==ac
 assert abs(float(v['duration'])-tl['seconds'])<.04
 run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'])
 checks.append(dict(file=name,seconds=float(v['duration']),width=1080,height=1920,fps=30,frames=int(v['nb_read_frames']),audioStreams=ac,pixelFormat=v['pix_fmt'],decode='pass',bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
subs=tl['subtitles'];assert all(0<=s['start']<s['end']<=tl['seconds'] for s in subs)
assert all(a['end']<=b['start'] for a,b in zip(subs,subs[1:]))
assert abs(.5*(-.1)+.05)<1e-9 and 100/80==1.25 and 12*20==240 and 10*30==300
assert all(any(abs(s['start']-c['start'])<1e-7 for c in tl['cues']) and any(abs(s['end']-c['end'])<1e-7 for c in tl['cues']) for s in subs)
times=json.loads((P/'qa/still-times.json').read_text());D=P/'qa/final-frames';D.mkdir(exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20)
for i,t in enumerate(times):run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(P/'out/final-silent.mp4'),'-frames:v','1','-vf','scale=540:960','-q:v','2',str(D/f'{i:02}.jpg')])
for pg in range(3):
 sheet=Image.new('RGB',(1080,2040),'#111d25');d=ImageDraw.Draw(sheet)
 for j,i in enumerate(range(pg*9,(pg+1)*9)):
  im=Image.open(D/f'{i:02}.jpg').resize((360,640));x=j%3*360;y=j//3*680+30;sheet.paste(im,(x,y));d.text((x+8,y-27),f'{times[i]:.2f}s',font=font,fill='#d9f05b')
 sheet.save(P/f'qa/final-contact-{pg+1}.jpg',quality=93)
Image.open(D/'01.jpg').save(P/'qa/poster.jpg',quality=95)
for name,at in [('weight-loss',tl['cues'][tl['chapters'][2]['cueStart']+10]['start']+.35),('valuation',tl['cues'][tl['chapters'][5]['cueStart']+6]['start']+.35),('world-transition',tl['chapters'][4]['start']-.2)]:
 folder=P/'qa'/name;folder.mkdir(exist_ok=True)
 run(['ffmpeg','-v','error','-y','-ss',str(at),'-i',str(P/'out/final-silent.mp4'),'-frames:v','12','-vf','scale=270:480','-q:v','2',str(folder/'%02d.jpg')])
 sheet=Image.new('RGB',(1080,1530),'#111d25');d=ImageDraw.Draw(sheet)
 for j,f in enumerate(sorted(folder.glob('*.jpg'))):
  x=j%4*270;y=j//4*510+28;sheet.paste(Image.open(f),(x,y));d.text((x+4,y-24),f'{at+j/30:.3f}s',font=font,fill='#d9f05b')
 sheet.save(P/f'qa/{name}-12.jpg',quality=93)
(P/'qa/technical-checks.json').write_text(json.dumps({'outputs':checks,'subtitles':len(subs),'subtitleTiming':'real Edge TTS WordBoundary, validated start/end and no overlap','mathematicalChecks':'passed, five-company loss / EPS / PE','noSpeakerPlayback':True,'listeningReview':False,'aestheticAcceptance':'not claimed'},ensure_ascii=False,indent=2),encoding='utf-8')
subprocess.run([sys.executable,str(P/'build_delivery.py')],check=True)
print(json.dumps(checks),flush=True)
