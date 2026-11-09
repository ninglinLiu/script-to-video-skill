"""File-only export and checks. Does not play audio or launch a media player."""
from pathlib import Path
import json,subprocess,re,hashlib,xml.etree.ElementTree as ET
import cv2
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent
def ff(args):subprocess.run(['ffmpeg','-v','error','-y',*map(str,args)],check=True)
def probe(f):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(f)],text=True))
silent=P/'out/anchor-silent.mp4'; normal=P/'out/anchor.mp4'
ff(['-i',silent,'-i',P/'out/mix.wav','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','60','-movflags','+faststart',normal])
sp=probe(silent);ap=probe(normal);vs=sp['streams'][0]
assert len(sp['streams'])==1 and vs['codec_type']=='video'
assert (vs['width'],vs['height'],vs['r_frame_rate'],int(vs['nb_frames']))==(1080,1920,'30/1',1800)
assert abs(float(sp['format']['duration'])-60)<.001
assert sum(s['codec_type']=='audio' for s in ap['streams'])==1
for f in [silent,normal]:ff(['-i',f,'-f','null','-'])
log=subprocess.run(['ffmpeg','-hide_banner','-i',str(normal),'-af','loudnorm=I=-16:TP=-1:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
loud=json.loads(re.findall(r'\{\s*"input_i".*?\}',log.stderr,re.S)[-1]);assert float(loud['input_tp'])<-.4
tl=json.loads((P/'assets/timeline-anchor.json').read_text(encoding='utf-8'))
assert all(0<=c['start']<c['end']<=60 for c in tl['cues'])
assert all(tl['cues'][i]['end']<=tl['cues'][i+1]['start'] for i in range(len(tl['cues'])-1))
srt=(P/'out/anchor.srt').read_text(encoding='utf-8-sig')
assert all(c['text'] in srt for c in tl['cues'])
cap=cv2.VideoCapture(str(silent));font=ImageFont.truetype(str(P/'assets/NotoSansSC-VF.ttf'),18)
def frame(t,w=270):
 cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,bgr=cap.read();assert ok
 return Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB)).resize((w,round(w*16/9)))
times=[.6,4.8,10,13.2,17.4,24.8,33.6,37.7,40.5,43.4,47,56]
sheet=Image.new('RGB',(1620,1032),'#142a24');draw=ImageDraw.Draw(sheet)
for i,t in enumerate(times):
 x=i%6*270;y=i//6*516;sheet.paste(frame(t),(x,y+36));draw.text((x+12,y+6),f'{t:.2f}s',font=font,fill='#efdfbb')
sheet.save(P/'qa/final-contact-sheet.jpg',quality=95)
frame(4.8,810).save(P/'qa/poster.jpg',quality=95)
frame(56,540).save(P/'qa/ending.jpg',quality=95)
for start in [15.8,28.1,36.9,42.8,44.3]:
 strip=Image.new('RGB',(1440,916),'#142a24');d=ImageDraw.Draw(strip)
 for i in range(12):
  t=start+i/30;x=i%6*240;y=i//6*458;strip.paste(frame(t,240),(x,y+31));d.text((x+8,y+6),f'{t:.3f}',font=font,fill='#efdfbb')
 strip.save(P/'qa'/f'continuous-{start:.1f}.jpg',quality=94)
cap.release()
# FCP7 XML: nine cut points on the rendered picture; separate narration, score and effects.
def add(parent,tag,text=None,**attrs):
 e=ET.SubElement(parent,tag,attrs)
 if text is not None:e.text=str(text)
 return e
def rate(parent):r=add(parent,'rate');add(r,'timebase',30);add(r,'ntsc','FALSE')
root=ET.Element('xmeml',version='5');seq=add(root,'sequence',id='sequence-anchor');add(seq,'name','价签之外 60秒');add(seq,'duration',1800);rate(seq)
media=add(seq,'media');video=add(media,'video');fmt=add(add(video,'format'),'samplecharacteristics');rate(fmt)
for k,v in [('width',1080),('height',1920),('anamorphic','FALSE'),('pixelaspectratio','square'),('fielddominance','none')]:add(fmt,k,v)
track=add(video,'track');bounds=[0,333,477,838,1107,1286,1335,1386,1633,1800]
for i,(a,b) in enumerate(zip(bounds,bounds[1:])):
 c=add(track,'clipitem',id=f'picture-{i}');add(c,'name',f'价签之外 {i+1:02}');add(c,'duration',1800);rate(c)
 for k,v in [('start',a),('end',b),('in',a),('out',b)]:add(c,k,v)
 f=add(c,'file',id='file-picture')
 if i==0:
  add(f,'name',silent.name);add(f,'pathurl',silent.as_uri());rate(f);add(f,'duration',1800)
  fm=add(add(f,'media'),'video');fc=add(fm,'samplecharacteristics');rate(fc)
  for k,v in [('width',1080),('height',1920),('pixelaspectratio','square')]:add(fc,k,v)
 st=add(c,'sourcetrack');add(st,'mediatype','video');add(st,'trackindex',1)
audio=add(media,'audio');add(audio,'numOutputChannels',2)
for i,(name,file) in enumerate([('旁白','voice-mix.wav'),('原创配乐','music-original.wav'),('动作音效','sound-design.wav')]):
 c=add(add(audio,'track'),'clipitem',id=f'audio-{i}');add(c,'name',name);add(c,'duration',1800);rate(c)
 for k,v in [('start',0),('end',1800),('in',0),('out',1800)]:add(c,k,v)
 f=add(c,'file',id=f'file-audio-{i}');add(f,'name',file);add(f,'pathurl',(P/'assets'/file).as_uri());rate(f);add(f,'duration',1800)
 fa=add(add(f,'media'),'audio');add(fa,'channelcount',1);sc=add(fa,'samplecharacteristics');add(sc,'depth',16);add(sc,'samplerate',44100)
 st=add(c,'sourcetrack');add(st,'mediatype','audio');add(st,'trackindex',1)
ET.indent(root);ET.ElementTree(root).write(P/'out/premiere.xml',encoding='utf-8',xml_declaration=True)
report={'title':'价签之外','duration':60,'frames':1800,'size':[1080,1920],'fps':30,'silentAudioStreams':0,'normalAudioStreams':1,'fullDecode':'pass','cues':len(tl['cues']),'cueOrdering':'pass','subtitleTexts':'pass','audioLoudness':loud,'pictureSha256':hashlib.sha256(silent.read_bytes()).hexdigest(),'audioListening':'not performed: user prohibits speaker playback','editorImport':'not tested; XML structure parsed','userAcceptance':'pending'}
(P/'qa/final-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
