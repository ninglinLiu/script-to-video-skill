from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess,sys
P=Path(__file__).resolve().parent
mode=sys.argv[1] if len(sys.argv)>1 else 'draft'
src=P/f'out/{mode}-silent.mp4'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',22)
def frame(t,dst,w=360):
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(src),'-frames:v','1','-vf',f'scale={w}:-1',str(dst)],check=True)
times=[.3,1.7,3.9,5.25,6.1,7.3,8.65,10.5]
images=[]
for i,t in enumerate(times):
    f=P/f'qa/{mode}-{i:02}.jpg';frame(t,f)
    im=Image.open(f).convert('RGB');panel=Image.new('RGB',(360,676),'#143b3b');panel.paste(im,(0,36));ImageDraw.Draw(panel).text((12,6),f'{t:05.2f}s',font=font,fill='#f6e9ce');images.append(panel)
contact=Image.new('RGB',(1440,1352),'#143b3b')
for i,im in enumerate(images):contact.paste(im,((i%4)*360,(i//4)*676))
contact.save(P/f'qa/{mode}-contact.jpg',quality=92)
for name,start in [('camera',5.35 if mode=='final' else 5.02),('landing',6.8)]:
    strip=Image.new('RGB',(1440,912),'#143b3b')
    for i in range(12):
        t=start+i/30;f=P/f'qa/{mode}-{name}-{i:02}.jpg';frame(t,f,240);im=Image.open(f)
        strip.paste(im,((i%6)*240,30+(i//6)*456));ImageDraw.Draw(strip).text(((i%6)*240+10,(i//6)*456+3),f'{t:.3f}s',font=font,fill='#f6e9ce')
    strip.save(P/f'qa/{mode}-{name}-strip.jpg',quality=90)
if mode=='final':
    contact.save(P/'qa/contact-sheet.jpg',quality=92)
    frame(1.7,P/'qa/poster.jpg',1080)
print(f'{mode} frames and continuous strips saved')
