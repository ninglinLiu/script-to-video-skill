"""Offline audio, mute previews, full-decode validation and visual contact sheets."""
from pathlib import Path
import subprocess,json,hashlib,wave,re
import numpy as np
import cv2
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent
SR=48000;D=10.5;N=round(SR*D)
styles=['editorial','spatial','pixel']
def ff(args):subprocess.run(['ffmpeg','-v','error','-y',*map(str,args)],check=True)
def probe(p):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(p)],text=True))
def decode(p,extra=(),af=None):
    a=['ffmpeg','-v','error',*extra,'-i',str(p)]
    if af:a+=['-af',af]
    a+=['-ar',str(SR),'-ac','2','-f','f32le','-']
    return np.frombuffer(subprocess.check_output(a),dtype='<f4').reshape(-1,2).astype(float)
def write(p,data):
    with wave.open(str(p),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(data,-1,1)*32767).astype('<i2').tobytes())
def getframe(cap,t,width=360):
    cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,bgr=cap.read();assert ok
    return Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB)).resize((width,round(width*16/9)))
font=ImageFont.truetype(str(P/'assets/NotoSansSC-VF.ttf'),26)
music=decode(P/'assets/vastness.mp3',extra=['-ss','12','-t',str(D)])[:N]
music*=10**(-32/20)/max(1e-9,np.sqrt(np.mean(music**2)))
times=np.arange(N)/SR
music*=np.minimum(times/.2,1)[:,None]*np.minimum((D-times)/.65,1)[:,None]
events={
 'editorial':[(.30,'tap'),(1.35,'stamp'),(3.3,'turn'),(4.50,'tap'),(5.55,'tap'),(6.45,'tap'),(7.85,'chime')],
 'spatial':[(.3,'tap'),(1.4,'stamp'),(3.3,'chain'),(5.6,'turn'),(6.65,'chime')],
 'pixel':[(t,'step') for t in np.arange(.3,5.05,.34)]+[(6.2,'turn'),(7.1,'chime')]+[(t,'step') for t in np.arange(7.6,9.3,.25)]
}
report=[]
for s in styles:
    v=decode(P/'assets'/f'voice-{s}.wav',af='loudnorm=I=-18:TP=-3:LRA=7')
    data=np.zeros((N,2));data[:len(music)]+=music
    at=round(.12*SR);assert at+len(v)<=N;data[at:at+len(v)]+=v
    rng=np.random.default_rng(1020);fx=np.zeros_like(data)
    for when,kind in events[s]:
        dur=.45 if kind in ['turn','chime'] else .16
        t=np.arange(round(dur*SR))/SR
        if kind=='turn':
            y=np.convolve(rng.normal(size=len(t)),np.ones(40)/40,'same')*np.sin(np.pi*t/dur)**2*.05
        elif kind=='chime':
            f=660 if s=='pixel' else 440
            y=(np.sin(2*np.pi*f*t)+.3*np.sin(2*np.pi*f*1.5*t))*np.exp(-t*9)*np.minimum(t/.01,1)*.02
        else:
            f={'tap':190,'stamp':100,'chain':1100,'step':230}[kind]
            y=(np.sin(2*np.pi*f*t)+rng.normal(size=len(t))*.3)*np.exp(-t*45)*np.minimum(t/.003,1)*(.045 if kind=='stamp' else .022)
        k=round(when*SR);fx[k:k+len(y)]+=y[:,None]
    data+=fx;gain=min(1,.84/max(1e-9,np.max(np.abs(data))))
    mix=P/'assets'/f'mix-{s}.wav';write(mix,data*gain);write(P/'assets'/f'sfx-{s}.wav',fx*gain)
    silent=P/'out'/f'{s}-silent.mp4';audio=P/'out'/f'{s}.mp4'
    ff(['-i',silent,'-i',mix,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',D,'-movflags','+faststart',audio])
    m=probe(silent);am=probe(audio)
    assert len(m['streams'])==1 and m['streams'][0]['codec_type']=='video'
    vs=m['streams'][0];assert (vs['width'],vs['height'],vs['r_frame_rate'],int(vs['nb_frames']))==(1080,1920,'30/1',315)
    assert abs(float(m['format']['duration'])-D)<.01
    assert sum(x['codec_type']=='audio' for x in am['streams'])==1
    for file in [silent,audio]:ff(['-i',file,'-f','null','-'])
    log=subprocess.run(['ffmpeg','-hide_banner','-i',str(audio),'-af','loudnorm=I=-16:TP=-1:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    loud=json.loads(re.findall(r'\{\s*"input_i".*?\}',log.stderr,re.S)[-1]);assert float(loud['input_tp'])<-.5
    cap=cv2.VideoCapture(str(silent))
    sheet=Image.new('RGB',(1800,685),'#e6e0d1');draw=ImageDraw.Draw(sheet)
    for i,t in enumerate([.8,2.3,4.6,6.6,9.4]):
        sheet.paste(getframe(cap,t),(360*i,45));draw.text((360*i+15,5),f'{t:.1f}s',font=font,fill='#1d302e')
    sheet.save(P/'qa'/f'{s}-final-sheet.jpg',quality=94)
    getframe(cap,8.6,width=540).save(P/'qa'/f'{s}-poster.jpg',quality=94)
    for t in {'editorial':[3.3,4.2,6.25],'spatial':[3.1,5.8,6.7],'pixel':[5.05,6.18,7.28]}[s]:
        strip=Image.new('RGB',(1440,880),'#e6e0d1');draw=ImageDraw.Draw(strip)
        for i in range(12):
            time=t+i/30;x=i%6*240;y=i//6*440
            strip.paste(getframe(cap,time,240),(x,y+12));draw.text((x+5,y),f'{time:.2f}',fill='#243833')
        strip.save(P/'qa'/f'{s}-continuous-{t:.2f}.jpg',quality=92)
    cap.release()
    report.append({'style':s,'duration':D,'frames':315,'size':[1080,1920],'fps':30,'silentPreviewAudioStreams':0,'normalVersionAudioStreams':1,'fullDecode':'pass','loudness':loud,'events':events[s],'sha256':hashlib.sha256(silent.read_bytes()).hexdigest(),'listening':'not performed; user requested no speaker playback','userAcceptance':'pending'})
header=Image.new('RGB',(1620,96),'#101d21');draw=ImageDraw.Draw(header);font=ImageFont.truetype(str(P/'assets/NotoSansSC-VF.ttf'),36)
for i,s in enumerate(['认知复杂度 · 纸感','锚定效应 · 立体','勤奋之外 · 像素']):draw.text((i*540+25,21),s,font=font,fill='#e8d7b5')
header.save(P/'qa/compare-header.png')
args=[]
for s in styles:args+=['-i',P/'out'/f'{s}-silent.mp4']
args+=['-i',P/'qa/compare-header.png']
filters='[0:v]scale=540:960[a];[1:v]scale=540:960[b];[2:v]scale=540:960:flags=neighbor[c];[a][b][c]hstack=inputs=3,pad=1620:1056:0:96:color=0x101d21[body];[body][3:v]overlay=0:0:format=auto[v]'
ff([*args,'-filter_complex',filters,'-map','[v]','-an','-frames:v','315','-r','30','-c:v','libx264','-crf','18','-preset','medium','-threads','3','-pix_fmt','yuv420p','-movflags','+faststart',P/'out/compare-silent.mp4'])
assert len(probe(P/'out/compare-silent.mp4')['streams'])==1
(P/'qa/final-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{k:v for k,v in x.items() if k in ['style','duration','frames','loudness','silentPreviewAudioStreams']} for x in report],ensure_ascii=False,indent=2))
