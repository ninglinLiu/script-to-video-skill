from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import subprocess,json
P=Path(__file__).resolve().parent
D=P/'qa/proof-frames';D.mkdir(exist_ok=True)
subprocess.run(['ffmpeg','-v','error','-y','-ss','5.67','-i',str(P/'qa/proof-numeric.mp4'),'-frames:v','12',str(D/'%02d.jpg')],check=True)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17)
sheet=Image.new('RGB',(1080,3*510),'#192d2b');d=ImageDraw.Draw(sheet)
for i,f in enumerate(sorted(D.glob('*.jpg'))):
 im=Image.open(f);im.thumbnail((264,470));x=i%4*270+3;y=i//4*510+26;sheet.paste(im,(x,y));d.text((x,y-23),f'{33.17+i/30:.3f}s',font=font,fill='#ffe7b1')
sheet.save(P/'qa/proof-continuous-12.jpg',quality=92)
for t in [3.9,7.0,10.1,13.0]:subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(P/'qa/proof-numeric.mp4'),'-frames:v','1',str(P/f'qa/proof-{t}.jpg')],check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(P/'qa/proof-numeric.mp4')],text=True))
assert not any(s['codec_type']=='audio' for s in probe['streams'])
print(probe['format']['duration'])
