from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import subprocess,json,hashlib,re,os,zipfile,sys
P=Path(__file__).resolve().parent
tl=json.loads((P/'assets/timeline.json').read_text(encoding='utf-8'))
def run(cmd):return subprocess.run(cmd,check=True,capture_output=True,text=True,encoding='utf-8',errors='replace')
def probe(path):return json.loads(run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(path)]).stdout)
raw=P/'qa/render-full-range.mp4'
assert raw.exists(),'Render the full video first'
before=probe(raw);v=next(s for s in before['streams'] if s['codec_type']=='video')
vf='scale=in_range=pc:out_range=tv' if v.get('color_range')=='pc' else 'format=yuv420p'
print('Mastering portable silent MP4',flush=True)
run(['ffmpeg','-v','error','-y','-i',str(raw),'-an','-vf',vf,'-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-color_range','tv','-movflags','+faststart',str(P/'out/final-silent.mp4')])
print('Muxing audio edition',flush=True)
run(['ffmpeg','-v','error','-y','-i',str(P/'out/final-silent.mp4'),'-i',str(P/'assets/mix.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-af','apad','-c:a','aac','-b:a','192k','-t',str(tl['seconds']),'-movflags','+faststart',str(P/'out/final-with-audio.mp4')])
checks=[]
for name,audio in [('final-silent.mp4',0),('final-with-audio.mp4',1)]:
 f=P/'out'/name;r=probe(f);vs=[s for s in r['streams'] if s['codec_type']=='video'];aa=[s for s in r['streams'] if s['codec_type']=='audio'];s=vs[0]
 assert len(vs)==1 and len(aa)==audio,(name,'stream count')
 assert (s['width'],s['height'])==(1080,1920)
 assert s['r_frame_rate']=='30/1' and s['pix_fmt']=='yuv420p'
 assert int(s['nb_read_frames'])==tl['frames']
 assert abs(float(s['duration'])-tl['seconds'])<.04
 run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'])
 checks.append({'file':name,'duration':float(s['duration']),'width':1080,'height':1920,'fps':30,'frames':int(s['nb_read_frames']),'pixelFormat':s['pix_fmt'],'audioStreams':len(aa),'videoCodec':s['codec_name'],'audioCodec':aa[0]['codec_name'] if aa else None,'decode':'pass','bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
subs=tl['subtitles'];assert len(subs)==32
assert all(0<=s['start']<s['end']<=tl['seconds'] for s in subs)
assert all(a['end']<=b['start'] for a,b in zip(subs,subs[1:]))
for s in subs:
 assert any(abs(s['start']-c['start'])<1e-7 for c in tl['cues'])
 assert any(abs(s['end']-c['end'])<1e-7 for c in tl['cues'])
assert (5-3,4-1)==(2,3)
assert 50-25==25
print('Extracting actual final frames',flush=True)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20)
times=[1.8,3.7,6.5,10.5,15.5,18,23.7,26.6,29.5,31.5,34.5,37.4,39.2,42.5,46.5,50.5,55,58.8,63.5,66.5,69.5,74.8,78.5,82.8]
D=P/'qa/final-frames';D.mkdir(exist_ok=True)
for t in times:run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(P/'out/final-silent.mp4'),'-frames:v','1','-vf','scale=540:960',str(D/f'{t:04.1f}.jpg')])
for page in range(3):
 sheet=Image.new('RGB',(1152,1084),'#192d2b');d=ImageDraw.Draw(sheet)
 for j,t in enumerate(times[page*8:(page+1)*8]):
  im=Image.open(D/f'{t:04.1f}.jpg');im.thumbnail((276,491));x=j%4*288+6;y=j//4*542+30;sheet.paste(im,(x,y));d.text((x,y-25),f'{t:.1f}s',font=font,fill='#fff1ce')
 sheet.save(P/f'qa/final-contact-{page+1}.jpg',quality=92)
Image.open(D/'03.7.jpg').save(P/'qa/poster.jpg',quality=95)
for name,at in [('hook-handoff',4.10),('camera-return',16.27),('expectation-gap',66.42)]:
 seq=P/'qa'/name;seq.mkdir(exist_ok=True)
 run(['ffmpeg','-v','error','-y','-ss',str(at),'-i',str(P/'out/final-silent.mp4'),'-frames:v','12','-vf','scale=270:480','-q:v','2',str(seq/'%02d.jpg')])
 sheet=Image.new('RGB',(1080,3*510),'#192d2b');d=ImageDraw.Draw(sheet)
 for j,f in enumerate(sorted(seq.glob('*.jpg'))):
  x=j%4*270;y=j//4*510+28;sheet.paste(Image.open(f),(x,y));d.text((x+4,y-24),f'{at+j/30:.3f}s',font=font,fill='#fff1ce')
 sheet.save(P/f'qa/{name}-12.jpg',quality=91)
qa={'passed':True,'outputs':checks,'subtitles':{'count':len(subs),'timingSource':'real Edge TTS WordBoundary','startsAndEndsMatchBoundaries':True,'withinDuration':True,'semanticGrouping':'manual grouping; no cross-chapter joining'},'hypotheticalMath':{'sameHorizon':'one year','before':'5% - 3% ≈ 2%','after':'4% - 1% ≈ 3%','expectationGap':'50bp - 25bp = 25bp'},'listeningReview':False,'defaultPreviewAudioStreams':0}
(P/'qa/technical-checks.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2),encoding='utf-8')
subprocess.run([sys.executable,str(P/'build_delivery.py')],check=True)
print(json.dumps(checks,ensure_ascii=True),flush=True)
