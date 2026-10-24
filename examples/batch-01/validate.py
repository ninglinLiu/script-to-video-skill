from pathlib import Path
import hashlib,json,subprocess
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent
ids=['tree-business','tree-learning','matrix-price','matrix-sharing','orbit-signal','orbit-value']
results=[]
for file in list((P/'out').glob('*.mp4')):
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(file)],text=True,encoding='utf-8'))
    vids=[s for s in probe['streams'] if s['codec_type']=='video']; aud=[s for s in probe['streams'] if s['codec_type']=='audio']
    assert len(vids)==1 and not aud,file
    v=vids[0]
    decode=subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],capture_output=True)
    assert decode.returncode==0 and not decode.stderr,(file,decode.stderr)
    if file.parent.name=='out':assert v['width']==1080 and v['height']==1920 and v['r_frame_rate']=='30/1' and int(v['nb_frames'])==300
    results.append({'file':str(file.relative_to(P)),'duration':float(probe['format']['duration']),'dimensions':[v['width'],v['height']],'frames':v.get('nb_frames'),'audio_streams':len(aud),'full_decode':'passed','sha256':hashlib.sha256(file.read_bytes()).hexdigest()})

# Actual encoded-frame contact sheet, not concept imagery.
grid=Image.new('RGB',(6*270,540),'#101b22'); draw=ImageDraw.Draw(grid)
for i,id in enumerate(ids):
    out=P/'qa'/f'{id}-encoded.jpg'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','5.0' if id.startswith('orbit') else '8.67','-i',str(P/'out'/f'{id}.mp4'),'-frames:v','1','-vf','scale=270:480',str(out)],check=True)
    with Image.open(out) as im:grid.paste(im,(i*270,32))
    draw.text((i*270+8,9),id,fill='#f0eee4')
grid.save(P/'qa/encoded-contact.jpg',quality=94)

for id in ['tree-business','matrix-price','orbit-signal']:
    # Transition evidence centered on branch tracing, comparison arrows, and the orbit landing.
    start={'tree-business':4.7,'matrix-price':4.0,'orbit-signal':6.3}[id]
    files=[]
    for n in range(9):
        t=start+n*.1;dest=P/'qa'/f'{id}-strip-{n}.jpg'
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(t),'-i',str(P/'out'/f'{id}.mp4'),'-frames:v','1','-vf','scale=216:384',str(dest)],check=True)
        files.append(dest)
    sheet=Image.new('RGB',(9*216,410),'#101b22'); d=ImageDraw.Draw(sheet)
    for n,file in enumerate(files):
        with Image.open(file) as im:sheet.paste(im,(n*216,26))
        d.text((n*216+8,7),f'{start+n*.1:.2f}s',fill='white')
    sheet.save(P/'qa'/f'{id}-continuous.jpg',quality=94)

record={'status':'technical_checks_passed','scope':'3 prototype components with 2 content configurations each; 4 external reference links','renders':results,'font_load':'local bundled fonts','source_provenance':'provenance.json','user_direction_acceptance':'accepted by user on 2026-10-24; not a blanket final-film acceptance','native_editor_import':'not_yet_performed','not_claimed':['full automatic article adaptation','reference-quality equivalence','a completed large component library','native animation internals in Jianying']}
(P/'qa/validation.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
print('All 6 MP4s fully decoded; six 300-frame prototypes and zero audio streams verified.')
