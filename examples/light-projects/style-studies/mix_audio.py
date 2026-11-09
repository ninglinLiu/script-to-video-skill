"""Offline audio construction only; never opens an audio device or media player."""
from pathlib import Path
import json, subprocess, wave
import numpy as np
P=Path(__file__).resolve().parent
SR=48000;N=SR*8
def decode(file,extra=(),af=None):
    args=['ffmpeg','-v','error',*extra,'-i',str(file)]
    if af:args+=['-af',af]
    args+=['-ar',str(SR),'-ac','2','-f','f32le','-']
    return np.frombuffer(subprocess.check_output(args),dtype='<f4').reshape(-1,2).astype(float)
def write(file,data):
    with wave.open(str(file),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
        w.writeframes((np.clip(data,-1,1)*32767).astype('<i2').tobytes())
voice=decode(P/'assets/voice.wav',af='loudnorm=I=-18:TP=-3:LRA=7')
music=decode(P/'assets/vastness.mp3',extra=['-ss','12','-t','8'])[:N]
music*=10**(-32/20)/max(1e-9,np.sqrt(np.mean(music**2)))
t=np.arange(N)/SR
music*=np.minimum(t/.15,1)[:,None]*np.minimum((8-t)/.5,1)[:,None]
common=np.zeros((N,2));off=round(.12*SR);common[off:off+len(voice)]+=voice;common[:len(music)]+=music
events={
 'editorial':[(.22,'tile'),(.59,'tile'),(.98,'tile'),(2.95,'turn'),(4.65,'tick'),(5.77,'open')],
 'spatial':[(.31,'tile'),(.67,'tile'),(2.80,'turn'),(4.4,'tick'),(5.64,'open')],
 'pixel':[(.80,'tile'),(1.68,'tile'),(3.32,'tick'),(3.65,'tick'),(4.0,'tick'),(4.35,'tick'),(5.71,'open'),(6.52,'chime')]}
report={'playback':'Never played through speakers; offline metrics only','styles':{}}
for style,ev in events.items():
    rng=np.random.default_rng(1020);fx=np.zeros((N,2))
    for time,kind in ev:
        dur={'tile':.22,'tick':.07,'turn':.55,'open':.7,'chime':.65}[kind]
        x=np.arange(round(dur*SR))/SR
        if kind=='turn':
            noise=rng.normal(size=len(x));y=np.convolve(noise,np.ones(30)/30,'same')*np.sin(np.pi*x/dur)**2*.05
        elif kind in ('open','chime'):
            freq=660 if style=='pixel' else 440
            y=(np.sin(2*np.pi*freq*x)+.34*np.sin(2*np.pi*freq*1.5*x))*np.exp(-x*8)*np.minimum(x/.01,1)*.024
        else:
            freq=(620 if style=='pixel' else 185) if kind=='tile' else 380
            y=(np.sin(2*np.pi*freq*x)+rng.normal(size=len(x))*.2)*np.exp(-x*(35 if kind=='tile' else 80))*np.minimum(x/.003,1)*(.05 if kind=='tile' else .02)
        at=round(time*SR);length=min(len(y),N-at)
        fx[at:at+length]+=np.column_stack((y[:length],y[:length]))
    mix=common+fx
    gain=min(1,.86/max(1e-9,np.max(np.abs(mix))))
    write(P/'assets'/f'mix-{style}.wav',mix*gain);write(P/'assets'/f'sfx-{style}.wav',fx*gain)
    report['styles'][style]={'events':ev,'samplePeakDBFS':float(20*np.log10(np.max(abs(mix*gain)))),'duration':8,'globalGain':gain}
(P/'qa/audio.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print('Three offline mixes ready. No playback performed.')
