"""Mux, silent comparison and media checks. Never invokes playback."""
from pathlib import Path
import subprocess,json,hashlib,cv2
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent
styles=['editorial','spatial','pixel']
reports=[]
def ff(args):subprocess.run(['ffmpeg','-v','error','-y',*map(str,args)],check=True)
def probe(file):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(file)],text=True))
for s in styles:
    silent=P/'out'/f'{s}-silent.mp4';audible=P/'out'/f'{s}.mp4'
    ff(['-i',silent,'-i',P/'assets'/f'mix-{s}.wav','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-t','8','-movflags','+faststart',audible])
    sm=probe(silent);am=probe(audible)
    assert len(sm['streams'])==1 and sm['streams'][0]['codec_type']=='video'
    v=sm['streams'][0];assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(1080,1920,'30/1',240)
    assert abs(float(sm['format']['duration'])-8)<.01
    assert sum(x['codec_type']=='audio' for x in am['streams'])==1
    ff(['-i',silent,'-f','null','-'])
    ff(['-i',audible,'-f','null','-'])
    cap=cv2.VideoCapture(str(silent));cap.set(cv2.CAP_PROP_POS_MSEC,6200);ok,bgr=cap.read();assert ok;cap.release()
    im=Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB));im.resize((540,960)).save(P/'qa'/f'{s}-poster.jpg',quality=92)
    # This checks clipping/loudness offline. It is not a listening approval.
    m=subprocess.run(['ffmpeg','-hide_banner','-i',str(audible),'-af','loudnorm=I=-16:TP=-1:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    import re
    loud=json.loads(re.findall(r'\{\s*"input_i".*?\}',m.stderr,re.S)[-1])
    assert float(loud['input_tp'])<-.4
    reports.append({'style':s,'duration':8,'frames':240,'size':[1080,1920],'fps':30,'silentPreviewHasAudio':False,'audioEditionHasAudio':True,'fullDecode':'pass','loudness':loud,'sha256':hashlib.sha256(silent.read_bytes()).hexdigest(),'userAcceptance':'pending','listening':'not performed; user requested no speaker playback'})
header=Image.new('RGB',(1620,96),'#10191c');d=ImageDraw.Draw(header);font=ImageFont.truetype(str(P/'assets/NotoSansSC-VF.ttf'),38)
for i,label in enumerate(['A · 图形排版','B · 空间几何','C · 像素工坊']):
    d.text((i*540+30,20),label,font=font,fill='#eed4a3')
header.save(P/'qa/compare-header.png')
args=[]
for s in styles:args+=['-i',P/'out'/f'{s}-silent.mp4']
args+=['-i',P/'qa/compare-header.png']
f='[0:v]scale=540:960[a];[1:v]scale=540:960[b];[2:v]scale=540:960:flags=neighbor[c];[a][b][c]hstack=inputs=3,pad=1620:1056:0:96:color=0x10191c[body];[body][3:v]overlay=0:0:format=auto[v]'
ff([*args,'-filter_complex',f,'-map','[v]','-an','-frames:v','240','-r','30','-c:v','libx264','-crf','18','-preset','medium','-threads','3','-pix_fmt','yuv420p','-movflags','+faststart',P/'out/compare-silent.mp4'])
cp=probe(P/'out/compare-silent.mp4');assert len(cp['streams'])==1
(P/'qa/final-checks.json').write_text(json.dumps({'samples':reports,'comparison':{'width':1620,'height':1056,'audioStreams':0},'previewAutoPlay':False},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(reports,ensure_ascii=False,indent=2))
