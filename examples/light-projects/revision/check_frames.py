"""Review composition using the author's browser launcher; not a render engine."""
import sys,json,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'vendor/xilo-opus-video/skills/xilo-opus-video/scripts'))
from render import launch,page_url,GPU_ARGS
GPU_ARGS[:]=['--disable-gpu','--disable-background-timer-throttling','--disable-renderer-backgrounding']
from playwright.sync_api import sync_playwright
times=[1.5,3.5,6,7.7,8.2,10,14.5,18.5,22,26,28.5,32,35.5,37.8,40.5,44.5,49,53.5,58,61.5,65]
with sync_playwright() as p:
    b=launch(p);pg=b.new_page(viewport={'width':1080,'height':1920});errors=[]
    pg.on('pageerror',lambda e:errors.append(str(e)))
    pg.goto(page_url(str(HERE/'index.html')));pg.wait_for_function('window.ready === true')
    frames=[]
    for t in times:
        pg.evaluate('t=>window.render(t)',t);out=HERE/f'qa/frame_{t:g}.png';pg.screenshot(path=str(out));frames.append(out)
    pg.evaluate('window.render(7.7)');a=hashlib.sha256(pg.screenshot()).hexdigest()
    pg.evaluate('window.render(49)');pg.evaluate('window.render(7.7)');c=hashlib.sha256(pg.screenshot()).hexdigest()
    b.close()
cols=5;cw=216;ch=420;out=Image.new('RGB',(cols*cw,((len(frames)+cols-1)//cols)*ch),'#ddd5c4');d=ImageDraw.Draw(out)
for i,(f,t) in enumerate(zip(frames,times)):
    im=Image.open(f);im.thumbnail((cw,384));x=i%cols*cw;y=i//cols*ch;out.paste(im,(x,y));d.text((x+8,y+389),f'{t:.2f}s',fill='black')
out.save(HERE/'qa/frames-sheet.jpg')
(HERE/'qa/composition.json').write_text(json.dumps({'times':times,'browser_errors':errors,'deterministic_out_of_order_frame':a==c},indent=2),encoding='utf-8')
print({'frames':len(frames),'browser_errors':errors,'deterministic':a==c})
if errors or a!=c:raise SystemExit(1)
