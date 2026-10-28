// Silent Canvas production renderer. Runs from a copied episode, without repository paths.
import puppeteer from 'puppeteer-core';
import {readFileSync,writeFileSync,mkdirSync,existsSync,createReadStream} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));process.chdir(here);
const mode=process.argv[2]||'probe',python=process.env.PYTHON||'python';
if(!['baseline','probe','proof','full'].includes(mode))throw Error('Use baseline, probe, proof START END, or full');
const call=command=>{const r=spawnSync(python,['-X','utf8','../tools/cinema.py',command,'--episode','..'],{encoding:'utf8'});if(r.status)throw Error(r.stderr);return JSON.parse(r.stdout);};
const baseline=mode==='baseline',film=baseline?null:JSON.parse(readFileSync('film.compiled.json','utf8')),hash=baseline?null:call('digest').sha256;
if(!baseline&&film.sourceSha256!==hash)throw Error('Compiled film is stale; run cinema.py compile');
if(mode==='full')call('check'); // Synthetic test timelines can never be delivered as real films.
const sha=b=>createHash('sha256').update(b).digest('hex');
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2));
for(const p of ['.tmp','../qa/cinema-probes','../qa/caption-reference','../out'])mkdirSync(p,{recursive:true});
process.env.TEMP=path.resolve('.tmp');process.env.TMP=process.env.TEMP;
const chrome=process.env.CHROME_PATH||process.env.REMOTION_BROWSER||[
 'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
 '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'
].find(existsSync);
if(!chrome)throw Error('Set CHROME_PATH to an installed Chrome/Chromium executable');
const server=createServer((req,res)=>{
 try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/,''),file=path.resolve(here,rel||'index.html');
 if(!file.startsWith(here+path.sep)&&file!==path.join(here,'index.html')){res.writeHead(403);return res.end();}
 if(!existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.html':'text/html','.png':'image/png','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream');createReadStream(file).pipe(res);
 }catch{res.writeHead(400);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--mute-audio','--hide-scrollbars'],userDataDir:path.resolve('.tmp/browser')});
 const page=await browser.newPage();await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});
 await page.goto(`http://127.0.0.1:${server.address().port}/${baseline?'original-silent.html':''}`);await page.waitForFunction('window.ready || window.bootError',{timeout:90000});
 const error=await page.evaluate(()=>window.bootError);if(error)throw Error(error);
 const frame=async(t,opts={})=>page.evaluate(({t,opts})=>{const trace=window.renderFrame(t,opts);return {trace,png:document.querySelector('canvas').toDataURL('image/png').split(',')[1]};},{t,opts});
 if(baseline){
  const rows=[];
  for(const t of [4,12,24,35,48,60,69,78,86]){
   const r=await page.evaluate(t=>{window.renderFrame(t);return {png:document.querySelector('canvas').toDataURL('image/png').split(',')[1],info:window.currentFrameInfo};},t);
   const output=`../qa/cinema-probes/original-${t}.png`;writeFileSync(output,Buffer.from(r.png,'base64'));rows.push({time:t,...r.info,file:output.replace('../','')});
  }
  save('../qa/original-baseline.json',{frames:rows,scope:'Original nine-scene visual baseline; no soundtrack and no new-film approval'});
  console.log(JSON.stringify({mode,frames:rows.length,silent:true}));
 }else if(mode==='probe'){
  const shots=[];
  for(const s of film.shots){
   const samples=[];
   for(let j=0;j<5;j++){
    const t=s.actionStart+(s.actionEnd-s.actionStart)*j/4;
    const only=await frame(t,{subjectOnly:true}),normal=await frame(t);
    const name=`../qa/cinema-probes/${s.id}-${j}.png`;writeFileSync(name,Buffer.from(normal.png,'base64'));
    samples.push({time:t,subjectSha256:sha(Buffer.from(only.png,'base64')),objects:normal.trace.objects,frame:name.replace('../','')});
   }
   const actualMotion=new Set(samples.map(x=>JSON.stringify(x.objects))).size>1;
   const visibleMotion=new Set(samples.map(x=>x.subjectSha256)).size>1;
   shots.push({id:s.id,recipe:s.recipe,passed:actualMotion&&visibleMotion,samples});
  }
  const seams=[];
  for(let i=1;i<film.shots.length;i++){
   const s=film.shots[i],frames=[];
   for(const delta of [-1/30,0,1/30,.2,.5]){
    const t=s.start+delta,r=await frame(t),name=`../qa/cinema-probes/seam-${i}-${frames.length}.png`;
    writeFileSync(name,Buffer.from(r.png,'base64'));frames.push({time:t,objects:r.trace.objects,frame:name.replace('../','')});
   }
   let passed=true;
   if(s.transition.mode==='carry'){
    const old=frames[0].objects.filter(x=>x.kind==='point'),now=new Map(frames[1].objects.filter(x=>x.kind==='point').map(x=>[x.id,x]));
    passed=old.length>0&&old.every(x=>now.has(x.id)&&Math.hypot(x.x-now.get(x.id).x,x.y-now.get(x.id).y)<1);
   }
   seams.push({shot:s.id,mode:s.transition.mode,passed,frames});
  }
  if(hash!==call('digest').sha256)throw Error('Source changed during probe');
  const result={sourceSha256:hash,passed:shots.every(x=>x.passed)&&seams.every(x=>x.passed),shots,seams,scope:'Actual drawn semantic states and background-free pixels; not an aesthetic verdict'};
  save('../qa/cinema-motion.json',result);if(!result.passed)throw Error('One or more shots is static or has broken carried object positions');
  console.log(JSON.stringify({mode,shots:shots.length,seams:seams.length,passed:result.passed}));
 }else{
  const full=mode==='full',from=full?0:Math.round(Number(process.argv[3])*30),to=full?film.frames:Math.round(Number(process.argv[4])*30);
  if(!Number.isFinite(from)||!Number.isFinite(to)||from<0||to>film.frames||from>=to)throw Error('Invalid frame range');
  const output=full?'../out/final-silent.mp4':'../qa/proof.mp4',tmp=path.resolve('.tmp/rendering.mp4');
  const ff=spawn(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-threads','4','-b:v','10M','-pix_fmt','yuv420p','-movflags','+faststart',tmp],{stdio:['pipe','ignore','pipe']});
  let err='';ff.stderr.on('data',b=>err+=b.toString());
  const done=new Promise((resolve,reject)=>{ff.on('error',reject);ff.on('close',code=>code===0?resolve():reject(Error(err)));});
  // Attach a handler while rendering so early process failures cannot become unhandled.
  done.catch(()=>{});ff.stdin.on('error',()=>{});
  const trace=[];
  try{
   for(let f=from;f<to;f++){
    const r=await page.evaluate(t=>{const trace=window.renderFrame(t);return {trace,jpg:document.querySelector('canvas').toDataURL('image/jpeg',.96).split(',')[1]};},f/30);
    trace.push(r.trace);if(!ff.stdin.write(Buffer.from(r.jpg,'base64')))await Promise.race([once(ff.stdin,'drain'),done.then(()=>{throw Error('Encoder exited before end of frames');})]);
   }
   ff.stdin.end();await done;
  }catch(e){ff.kill();throw e;}
  if(hash!==call('digest').sha256)throw Error('Source changed during render; output not certified');
  const {copyFileSync}=await import('node:fs');copyFileSync(tmp,output);
  if(full){
   save('../qa/caption-trace.json',trace.map(x=>({frame:x.frame,text:x.text,visible:x.visible})));
   const samples=[];
   for(let i=0;i<film.subtitles.length;i++){
    const s=film.subtitles[i],lo=Math.ceil(s.start*30),hi=Math.ceil(s.end*30)-1;
    for(const [part,f] of [['start',Math.min(lo+4,hi)],['end',Math.max(lo,hi-4)]]){
     const stem=`qa/caption-reference/${i}-${part}`;
     for(const captions of [true,false]){const r=await frame(f/30,{captions});writeFileSync(`../${stem}-${captions?'with':'without'}.png`,Buffer.from(r.png,'base64'));}
     samples.push({subtitle:i,frame:f,text:s.text,expected:stem+'-with.png',without:stem+'-without.png'});
    }
   }
   if(hash!==call('digest').sha256)throw Error('Source changed while rendering caption references');
   save('../qa/caption-reference.json',{sourceSha256:hash,samples});
   save('../qa/render-full.json',{sourceSha256:hash,frames:film.frames,fps:30,width:1920,height:1080,captionMode:'visible-in-video',mediaSha256:sha(readFileSync(output))});
  }
  console.log(JSON.stringify({mode,frames:to-from,output,silent:true}));
 }
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
