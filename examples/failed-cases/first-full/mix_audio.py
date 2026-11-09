from pathlib import Path
import numpy as np, subprocess, wave, json, re
P=Path(__file__).resolve().parent
T=json.loads((P/'assets/timeline.json').read_text(encoding='utf-8'));C={c['id']:c for c in T['chapters']};Q={c['id']:c for c in T['cues']}
SR=48000;D=T['duration'];N=round(D*SR);rng=np.random.default_rng(20261018)
fx=np.zeros((N,2),dtype=np.float64);events=[]
def add(at,duration,kind,gain=.035,pan=0):
    tt=np.arange(round(duration*SR))/SR
    if kind=='contact':y=(np.sin(2*np.pi*148*tt)*np.exp(-tt*24)+.28*np.sin(2*np.pi*1150*tt)*np.exp(-tt*75)+rng.normal(size=len(tt))*.14*np.exp(-tt*110))*np.minimum(tt/.003,1)
    elif kind=='paper':y=np.convolve(rng.normal(size=len(tt)),np.ones(12)/12,mode='same')*np.sin(np.pi*tt/duration)**2
    else:y=(np.sin(2*np.pi*540*tt)+.18*np.sin(2*np.pi*1080*tt))*np.exp(-tt*12)*np.minimum(tt/.006,1)
    y=np.column_stack((y*np.sqrt((1-pan)/2),y*np.sqrt((1+pan)/2)))*gain
    i=round(at*SR);n=min(len(y),N-i);fx[i:i+n]+=y[:n];events.append({'time':at,'kind':kind})
k=C['intro']['end']/8
add(1.95*k,.42,'contact',.16,-.05);add(3.1*k,1.5*k,'paper',.032,-.3);add(4.85*k,.6,'tone',.017,.1)
add(C['history']['start']+.9,1.2,'paper',.025,.3)
add(C['framework']['start']+.7,.4,'tone',.015)
for i in range(3):add(Q[f'dimensions_{i}']['start']+.3,.3,'tone',.012,(i-1)*.25)
for i in range(2):add(C['sources']['start']+1.2+i*.65,.5,'paper',.047,(i-.5)*.6)
add(C['organize']['start']+1.5,.55,'paper',.055,-.2)
add(C['verify']['start']+.5,.7,'paper',.03,-.3)
add(C['return']['start']+2.3,.9,'paper',.024,.25)
def decode(path,extra=None,af=None):
    cmd=['ffmpeg','-v','error']+(extra or [])+['-i',str(path)]
    if af:cmd+=['-af',af]
    cmd+=['-ar',str(SR),'-ac','2','-f','f32le','-']
    return np.frombuffer(subprocess.check_output(cmd),dtype='<f4').reshape(-1,2).astype(np.float64)
def wav(path,y):
    with wave.open(str(path),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(y,-1,1)*32767).astype('<i2').tobytes())
v=decode(P/'assets/voice.wav',af='loudnorm=I=-18:TP=-3:LRA=7');voice=np.zeros_like(fx);offset=round(T['voiceDelay']*SR)
assert len(v)+offset<=N,'Voice outside picture';voice[offset:offset+len(v)]=v
music=decode(P/'assets/vastness.mp3',extra=['-ss','12','-t',str(D)])
if len(music)<N:raise RuntimeError('Existing music source too short; do not silently loop')
music=music[:N];music*=10**(-31/20)/(np.sqrt(np.mean(music**2))+1e-12)
tt=np.arange(N)/SR;env=np.minimum(tt/.22,1)*np.minimum(np.maximum(D-tt,0)/1.5,1)
music*=env[:,None]
premix=voice+music+fx;wav(P/'assets/premix.wav',premix)
r=subprocess.run(['ffmpeg','-hide_banner','-i',str(P/'assets/premix.wav'),'-af','loudnorm=I=-16:TP=-1:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
m=json.loads(re.findall(r'\{\s*"input_i".*?\}',r.stderr,re.S)[-1]);gain=min(10**((-16-float(m['input_i']))/20),10**(-1.1/20)/(np.max(np.abs(premix))+1e-12))
for name,y in [('voice-track',voice),('music-track',music),('sfx-track',fx),('mix',premix)]:wav(P/f'assets/{name}.wav',y*gain)
(P/'qa/audio-master.json').write_text(json.dumps({'premix_measurement':m,'master_gain':gain,'events':events,'duration':D,'music':{'title':'Vastness','artist':'Andrew Ev','source':'https://assets.mixkit.co/music/184/184.mp3','license':'https://mixkit.co/license/#musicFree','range':[12,12+D]},'stems':'Three aligned WAV stems sum to master, within 16-bit quantization tolerance'},indent=2),encoding='utf-8')
# Styled subtitles match the approved sample and remain independently editable.
head='[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 2\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Noto Sans SC,68,&H00DDEAF1,&H00DDEAF1,&H00101010,&H00000000,0,0,0,0,100,100,0,0,1,0.6,0,2,75,75,165,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n'
def stamp(t):
    n=round(t*100);return f'{n//360000:01}:{n//6000%60:02}:{n//100%60:02}.{n%100:02}'
ass=head+''.join(f"Dialogue: 0,{stamp(c['start'])},{stamp(c['end'])},Default,,0,0,0,,{c['text']}\n" for c in T['cues'])
(P/'out/subtitles.ass').write_text(ass,encoding='utf-8-sig')
print(json.dumps({'duration':D,'gain':gain,'events':len(events)}))
