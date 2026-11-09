from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import subprocess
P=Path(__file__).resolve().parent
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20)
for name,at in [('hook-handoff',4.10),('camera-return',16.27),('expectation-gap',66.42)]:
 seq=P/'qa'/name;seq.mkdir(exist_ok=True)
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(at),'-i',str(P/'out/final-silent.mp4'),'-frames:v','12','-vf','scale=270:480','-q:v','2',str(seq/'%02d.jpg')],check=True)
 sheet=Image.new('RGB',(1080,1530),'#192d2b');d=ImageDraw.Draw(sheet)
 for j,f in enumerate(sorted(seq.glob('*.jpg'))):
  x=j%4*270;y=j//4*510+28;sheet.paste(Image.open(f),(x,y));d.text((x+4,y-24),f'{at+j/30:.3f}s',font=font,fill='#fff1ce')
 sheet.save(P/f'qa/{name}-12.jpg',quality=93)
print('Continuous strips refreshed at constant JPEG quality; MP4 unchanged')
