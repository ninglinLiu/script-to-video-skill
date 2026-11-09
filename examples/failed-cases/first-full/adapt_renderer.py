from pathlib import Path
P=Path(__file__).resolve().parent
f=P/'render.mjs';s=f.read_text(encoding='utf-8')
s=s.replace("import fs from 'node:fs';", "import fs from 'node:fs';\nimport crypto from 'node:crypto';")
s=s.replace('const W=1080,H=1920,FPS=30;', "const W=1080,H=1920,FPS=30;\nconst timeline=JSON.parse(fs.readFileSync(path.join(root,'assets/timeline.json'),'utf8'));\nconst OW=Number(process.env.OUT_WIDTH||1080),SAMPLES=Number(process.env.SUBFRAMES||3);\nconst clean=mode==='full'||process.env.CLEAN==='1';")
s=s.replace("(process.env.FILM_VARIANT ? '?variant='+process.env.FILM_VARIANT : '')", "(clean?'?clean=1':'')")
s=s.replace("p.evaluate(t=>{const c=document.getElementById('film');", "p.evaluate(({t,width,samples})=>{const c=document.getElementById('film');")
s=s.replace("const n=Number(new URLSearchParams(location.search).get('samples')||3);", "const n=samples;")
s=s.replace('window.captureCanvas.width=c.width;window.captureCanvas.height=c.height;', 'window.captureCanvas.width=width;window.captureCanvas.height=Math.round(width*16/9);')
s=s.replace('acc.drawImage(c,0,0);', 'acc.drawImage(c,0,0,window.captureCanvas.width,window.captureCanvas.height);')
s=s.replace(".split(',')[1]},t),'base64')", ".split(',')[1]},{t,width:OW,samples:SAMPLES}),'base64')")
s=s.replace("const times=(arg||'0,0.6,1.95,2.5,3.4,4.85,6.5,7.8').split(',').map(Number);", "const times=arg?arg.split(',').map(Number):timeline.chapters.flatMap(c=>[c.start+.8,(c.start+c.end)/2,c.end-.25]);")
start=s.index("  const ranges=[[0,240]];")
end=s.index("  console.log('FULL EXPORT COMPLETE');",start)+len("  console.log('FULL EXPORT COMPLETE');")
s=s[:start]+'''  const ranges=timeline.chapters.map(c=>[Math.round(c.start*FPS),Math.round(c.end*FPS)]);
  const hash=crypto.createHash('sha256');
  for(const n of ['film.js','timeline.js','index.html','render.mjs',...fs.readdirSync(path.join(root,'assets')).filter(n=>/\\.(png|ttf)$/.test(n)).map(n=>'assets/'+n)])hash.update(fs.readFileSync(path.join(root,n)));
  hash.update(String(OW)+':'+SAMPLES);const signature=hash.digest('hex');
  const jobs=ranges.map(([a,b],i)=>({a,b,i,out:path.join(root,'out','scene_'+String(i+1).padStart(2,'0')+'.mp4')}));
  for(const j of jobs){
    const meta=j.out+'.json';let valid=false;
    if(fs.existsSync(j.out)&&fs.existsSync(meta)){const m=JSON.parse(fs.readFileSync(meta));valid=m.signature===signature&&m.start===j.a&&m.end===j.b}
    if(valid){console.log('reuse scene '+(j.i+1));continue}
    await encode(j.a,j.b,j.out,'scene '+(j.i+1));
    fs.writeFileSync(meta,JSON.stringify({signature,start:j.a,end:j.b}));
  }
  fs.writeFileSync(path.join(root,'out','concat.txt'),jobs.map(j=>"file '"+path.basename(j.out)+"'").join('\\n'));
  await run('ffmpeg',['-v','warning','-y','-f','concat','-safe','0','-i',path.join(root,'out','concat.txt'),'-c','copy','-movflags','+faststart',path.join(root,'out','picture-clean.mp4')]);
  console.log('FULL PICTURE EXPORT COMPLETE');'''+s[end:]
f.write_text(s,encoding='utf-8')
f=P/'index.html';s=f.read_text(encoding='utf-8');s=s.replace('8秒节奏调整版','完整竖屏短片');f.write_text(s,encoding='utf-8')
print('Existing renderer adapted: duration, chapter cuts, exact source signatures, clean picture and draft sizing.')
