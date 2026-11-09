from pathlib import Path
from PIL import Image,ImageDraw
import cv2,json,sys
P=Path(__file__).resolve().parent
T=json.loads((P/'assets/timeline.json').read_text(encoding='utf-8'))
draft=len(sys.argv)>1 and sys.argv[1]=='draft'
path=P/('qa/draft.mp4' if draft else 'out/video.mp4');prefix='draft' if draft else 'final'
times=[x for c in T['chapters'] for x in (c['start']+.6,(c['start']+c['end'])/2,c['end']-.3)]
C={c['id']:c for c in T['chapters']}
strips={'roof':1.95*C['intro']['end']/8-.16,'research-boundary':C['boundary']['start']-.15,'book-entry':C['sources']['start']+.7,'paper-transfer':C['organize']['start']+.7,'verify-lens':C['verify']['start']+1.3,'model-return':C['return']['start']+2.3}
indices={round(t*30) for t in times}
for t in strips.values():indices.update(round(t*30)+i for i in range(12))
mobile=[C['dimensions']['start']+1,C['organize']['start']+4,C['verify']['start']+3,C['limits']['start']+4]
indices.update(round(t*30) for t in mobile)
cap=cv2.VideoCapture(str(path));frames={};i=0
while True:
    ok,bgr=cap.read()
    if not ok:break
    if i in indices:frames[i]=Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB))
    i+=1
cap.release()
assert len(frames)==len(indices),(len(frames),len(indices))
sheet=Image.new('RGB',(1080,((len(times)+4)//5)*410),'#151515');d=ImageDraw.Draw(sheet)
for i,t in enumerate(times):
    x=i%5*216;y=i//5*410;sheet.paste(frames[round(t*30)].resize((216,384)),(x,y));d.text((x+8,y+390),f'{t:.2f}s',fill='white')
sheet.save(P/f'qa/{prefix}-sheet.jpg',quality=94)
for name,t in strips.items():
    im=Image.new('RGB',(1920,1180),'#151515');d=ImageDraw.Draw(im)
    for i in range(12):
        x=i%6*320;y=i//6*590;im.paste(frames[round(t*30)+i].resize((320,569)),(x,y));d.text((x+7,y+572),f'{(round(t*30)+i)/30:.3f}s',fill='white')
    im.save(P/f'qa/{prefix}-{name}.jpg',quality=92)
for i,t in enumerate(mobile):frames[round(t*30)].resize((360,640)).save(P/f'qa/{prefix}-mobile-{i}.jpg',quality=96)
print(f'{prefix}: sequentially decoded video and saved 30 sample frames, six 12-frame strips, four phone-size views')
