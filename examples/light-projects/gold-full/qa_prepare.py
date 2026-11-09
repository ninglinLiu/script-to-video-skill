from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent
files=sorted((P/'qa/stills').glob('*.jpg'),key=lambda p:float(p.stem.replace('-','.')))
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20)
for page in range((len(files)+7)//8):
    selected=files[page*8:(page+1)*8]
    sheet=Image.new('RGB',(4*288,2*542),'#192d2b');d=ImageDraw.Draw(sheet)
    for j,f in enumerate(selected):
        im=Image.open(f);im.thumbnail((276,491));x=(j%4)*288+6;y=(j//4)*542+30
        sheet.paste(im,(x,y));d.text((x,y-25),f.stem.replace('-','.')+'s',font=font,fill='#fff1ce')
    sheet.save(P/f'qa/contact-{page+1}.jpg',quality=92)
print(len(files))
