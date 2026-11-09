from pathlib import Path
import cv2,json,subprocess,sys
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent
video=Path(sys.argv[1]);tag=sys.argv[2] if len(sys.argv)>2 else 'draft';offset=float(sys.argv[3]) if len(sys.argv)>3 else 0
cap=cv2.VideoCapture(str(video));duration=cap.get(cv2.CAP_PROP_FRAME_COUNT)/cap.get(cv2.CAP_PROP_FPS)
def frame(t,w=270):
 cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,bgr=cap.read()
 if not ok:raise RuntimeError(f'failed {t}')
 im=Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB));return im.resize((w,round(im.height*w/im.width)))
def sheet(times,name,w=270,cols=4):
 h=round(w*16/9);out=Image.new('RGB',(w*cols,(h+30)*((len(times)+cols-1)//cols)),'#111b28');d=ImageDraw.Draw(out)
 for i,t in enumerate(times):
  x=i%cols*w;y=i//cols*(h+30);out.paste(frame(t,w),(x,y));d.text((x+8,y+h+7),f'{t+offset:.3f}s',fill='white')
 out.save(P/'qa'/name,quality=94)
times=[.2+(duration-.5)*i/11 for i in range(12)]
sheet(times,tag+'-contact.jpg')
if duration<15:
 for at in [1.2,7,9]:sheet([at+i/30 for i in range(12)],tag+f'-strip-{at}.jpg',180,6)
else:
 for at in [8.9,16.3,21.4,30.5,32.3,37.6,45.9,52.6]:sheet([at+i/30 for i in range(12)],tag+f'-strip-{at}.jpg',180,6)
for i,t in enumerate(times):frame(t,540).save(P/'qa'/f'{tag}-{i:02}.jpg',quality=95)
cap.release();print(json.dumps({'duration':duration,'sheet':tag+'-contact.jpg'}))
