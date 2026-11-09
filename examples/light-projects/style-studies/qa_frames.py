from pathlib import Path
import cv2, json, subprocess, hashlib
import numpy as np
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent
styles=['editorial','spatial','pixel']
def contact(images,names,target,cols=4,w=270,h=480):
    sheet=Image.new('RGB',(cols*w,((len(images)+cols-1)//cols)*(h+30)),'#151a1b');d=ImageDraw.Draw(sheet)
    for i,(im,name) in enumerate(zip(images,names)):
        im=im.copy();im.thumbnail((w,h));x=(i%cols)*w;y=(i//cols)*(h+30)
        sheet.paste(im,(x,y+30));d.text((x+8,y+8),name,fill='#eeeecc')
    sheet.save(target)
for style in styles:
    frames=sorted((P/'qa').glob(style+'_frame_*.jpg'))
    if frames:contact([Image.open(f) for f in frames],[f.stem for f in frames],P/'qa'/f'{style}-probes.jpg')
    file=P/'out'/f'{style}.mp4'
    if not file.exists():continue
    meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(file)],text=True))
    cap=cv2.VideoCapture(str(file));fps=cap.get(5);count=cap.get(7);ims=[];names=[]
    times=[.25,1.25,2.25,2.9,3.5,4.7,5.7,7.2]
    for t in times:
        cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);ret,bgr=cap.read()
        if not ret:raise RuntimeError('Missing frame '+str(t))
        ims.append(Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB)));names.append(f'{style} {t:.2f}s')
    contact(ims,names,P/'qa'/f'{style}-final.jpg')
    for n,start in enumerate([2.6,4.9,5.7]):
        cap.set(cv2.CAP_PROP_POS_FRAMES,round(start*fps));seq=[]
        for i in range(12):
            ret,bgr=cap.read()
            if not ret:raise RuntimeError('Missing continuity frame')
            seq.append(Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB)))
        contact(seq,[f'{start+i/fps:.3f}' for i in range(12)],P/'qa'/f'{style}-continuous-{n}.jpg',cols=6,w=180,h=320)
    cap.release()
    subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True)
    meta.update({'frames':count,'fps':fps,'fullDecode':'pass','sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'userAcceptance':'pending'})
    (P/'qa'/f'{style}-technical.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf8')
print('Contact sheets and available final-file checks complete.')
