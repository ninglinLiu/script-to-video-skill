from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import subprocess,json,hashlib,math,sys
P=Path(__file__).resolve().parent
tl=json.loads((P/'assets/timeline.json').read_text(encoding='utf-8'))
def run(cmd):return subprocess.run(cmd,check=True,capture_output=True,text=True,encoding='utf-8',errors='replace')
def probe(p,count=True):return json.loads(run(['ffprobe','-v','error']+(['-count_frames'] if count else [])+['-show_streams','-show_format','-of','json',str(p)]).stdout)
raw=P/'qa/render-full-range.mp4';r=probe(raw,False);v=next(s for s in r['streams'] if s['codec_type']=='video')
vf='scale=in_range=pc:out_range=tv' if v.get('color_range')=='pc' else 'format=yuv420p'
if '--refresh-only' not in sys.argv:
 print('Mastering silent MP4',flush=True)
 run(['ffmpeg','-v','error','-y','-i',str(raw),'-an','-vf',vf,'-c:v','libx264','-preset','medium','-b:v','8500k','-minrate','8500k','-maxrate','8500k','-bufsize','17000k','-x264-params','nal-hrd=cbr:filler=1','-pix_fmt','yuv420p','-color_range','tv','-movflags','+faststart',str(P/'out/final-silent.mp4')])
run(['ffmpeg','-v','error','-y','-i',str(P/'out/final-silent.mp4'),'-i',str(P/'assets/mix.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-af','apad','-c:a','aac','-b:a','192k','-t',str(tl['seconds']),'-movflags','+faststart',str(P/'out/final-with-audio.mp4')])
checks=[]
for name,ac in [('final-silent.mp4',0),('final-with-audio.mp4',1)]:
 f=P/'out'/name;r=probe(f);v=next(s for s in r['streams'] if s['codec_type']=='video');aud=[s for s in r['streams'] if s['codec_type']=='audio']
 assert (v['width'],v['height'],v['r_frame_rate'],v['pix_fmt'])==(1080,1920,'30/1','yuv420p')
 assert int(v['nb_read_frames'])==tl['frames'] and len(aud)==ac
 assert int(v.get('bit_rate',0))>=8000000
 assert abs(float(v['duration'])-tl['seconds'])<.04
 run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'])
 checks.append(dict(file=name,seconds=float(v['duration']),width=1080,height=1920,fps=30,frames=int(v['nb_read_frames']),audioStreams=ac,pixelFormat=v['pix_fmt'],decode='pass',bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
subs=tl['subtitles'];assert all(0<=s['start']<s['end']<=tl['seconds'] for s in subs)
assert all(a['end']<=b['start'] for a,b in zip(subs,subs[1:]))
assert all(any(abs(s['start']-c['start'])<1e-7 for c in tl['cues']) and any(abs(s['end']-c['end'])<1e-7 for c in tl['cues']) for s in subs)
prices=[100,102,101,104,103,106,104,108]
assert sum(b<a for a,b in zip(prices,prices[1:]))==3
assert math.isclose(prices[-1]/prices[0]-1,.08)
assert round(104/106*100-100,2)==-1.89
assert round(10000*.998**20,2)==9607.51
assert all(math.isclose(10000*.998**n+(10000-10000*.998**n),10000) for n in range(21))
times=json.loads((P/'qa/still-times.json').read_text());D=P/'qa/final-frames';D.mkdir(exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20)
for i,t in enumerate(times):run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(P/'out/final-silent.mp4'),'-frames:v','1','-vf','scale=540:960','-q:v','2',str(D/f'{i:02}.jpg')])
for pg in range(math.ceil(len(times)/9)):
 sheet=Image.new('RGB',(1080,2040),'#112b37');d=ImageDraw.Draw(sheet)
 for j,i in enumerate(range(pg*9,min(len(times),(pg+1)*9))):
  im=Image.open(D/f'{i:02}.jpg').resize((360,640));x=j%3*360;y=j//3*680+30;sheet.paste(im,(x,y));d.text((x+8,y-27),f'{times[i]:.2f}s',font=font,fill='#ddea6b')
 sheet.save(P/f'qa/final-contact-{pg+1}.jpg',quality=93)
Image.open(D/'02.jpg').save(P/'qa/poster.jpg',quality=95)
def cue(id,i):return tl['cues'][next(c for c in tl['chapters'] if c['id']==id)['cueStart']+i]['start']
for name,at in [('result-handoff',cue('path',12)+.10),('cost-debit',cue('cost',5)+1.2),('world-transition',tl['chapters'][2]['start']-.2),('evidence-gate',cue('end',4)+.25)]:
 folder=P/'qa'/name;folder.mkdir(exist_ok=True)
 run(['ffmpeg','-v','error','-y','-ss',str(at),'-i',str(P/'out/final-silent.mp4'),'-frames:v','12','-vf','scale=270:480','-q:v','2',str(folder/'%02d.jpg')])
 sheet=Image.new('RGB',(1080,1530),'#112b37');d=ImageDraw.Draw(sheet)
 for j,f in enumerate(sorted(folder.glob('*.jpg'))):
  x=j%4*270;y=j//4*510+28;sheet.paste(Image.open(f),(x,y));d.text((x+4,y-24),f'{at+j/30:.3f}s',font=font,fill='#ddea6b')
 sheet.save(P/f'qa/{name}-12.jpg',quality=93)
(P/'qa/technical-checks.json').write_text(json.dumps({'outputs':checks,'subtitles':len(subs),'subtitleTiming':'real Edge TTS WordBoundary; starts/ends and no overlap validated','mathematicalChecks':['path 7 intervals / 3 down / +8%','104 vs 106 = -1.89%','20 fee debits = 9607.51, balance+fees conserved'],'noSpeakerPlayback':True,'listeningReview':False,'aestheticAcceptance':'not claimed'},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(checks),flush=True)

