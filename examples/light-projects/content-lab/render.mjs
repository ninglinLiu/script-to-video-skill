// Adapted from revision/render_existing.mjs, itself from Poisson render.mjs. Parameter edits and temporal sampling only.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn,spawnSync} from 'node:child_process';
const require=createRequire('<home>/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/puppeteer-core/package.json');
const puppeteer=require('puppeteer-core');
const root=path.dirname(fileURLToPath(import.meta.url));
const [mode='probe',arg,arg2]=process.argv.slice(2);
const STYLE=process.env.STYLE||'editorial';
const W=1080,H=1920,FPS=30;
const timeline=JSON.parse(fs.readFileSync(path.join(root,'assets/timeline-'+STYLE+'.json'),'utf8'));
const OW=Number(process.env.OUT_WIDTH||1080),SAMPLES=Number(process.env.SUBFRAMES||3);
const clean=mode==='full'||process.env.CLEAN==='1';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio','--hide-scrollbars','--allow-file-access-from-files','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const errors=[];
async function page(){
 const p=await browser.newPage();await p.setViewport({width:W,height:H,deviceScaleFactor:1});
 p.on('pageerror',e=>{errors.push(String(e));console.error('PAGE:',String(e))});
 p.on('requestfailed',r=>console.error('RESOURCE:',r.url(),r.failure()?.errorText));
 await p.goto(new URL('index.html', import.meta.url).href + '?style='+STYLE+(clean?'&clean=1':''),{waitUntil:'load',timeout:60000});
 await p.waitForFunction('window.ready === true',{timeout:60000,polling:100});return p;
}
async function frame(p,t){return Buffer.from(await p.evaluate(({t,width,samples})=>{const c=document.getElementById('film');
 const n=samples;
 if(!window.captureCanvas){window.captureCanvas=document.createElement('canvas');window.captureCanvas.width=width;window.captureCanvas.height=Math.round(width*16/9);}
 const acc=window.captureCanvas.getContext('2d',{alpha:false});
 for(let k=0;k<n;k++){window.render(t+((k+.5)/n-.5)/60);acc.globalAlpha=1/(k+1);acc.drawImage(c,0,0,window.captureCanvas.width,window.captureCanvas.height);}
 acc.globalAlpha=1;
 return window.captureCanvas.toDataURL('image/jpeg',.97).split(',')[1]},{t,width:OW,samples:SAMPLES}),'base64')}
function run(cmd,args){return new Promise((resolve,reject)=>{const c=spawn(cmd,args,{stdio:['ignore','inherit','inherit']});c.on('error',reject);c.on('close',n=>n===0?resolve():reject(new Error(cmd+' exit '+n)))})}
async function encode(start,end,out,label,preparedPage=null){
 const p=preparedPage||await page();
 const proc=spawn('ffmpeg',['-v','warning','-y','-f','image2pipe','-c:v','mjpeg','-framerate','30','-i','-','-an','-c:v','libx264','-preset','medium','-b:v','12M','-minrate','12M','-maxrate','12M','-bufsize','24M','-x264-params','nal-hrd=cbr:filler=1','-threads','3','-pix_fmt','yuv420p','-r','30','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
 const done=new Promise((resolve,reject)=>{proc.on('error',reject);proc.on('close',n=>n===0?resolve():reject(new Error('ffmpeg '+n)))});
 const startTime=Date.now();
 for(let i=start;i<end;i++){
  const buf=await frame(p,i/FPS);
  if(!proc.stdin.write(buf))await new Promise((resolve,reject)=>{const ok=()=>{proc.stdin.off('error',bad);resolve()};const bad=e=>{proc.stdin.off('drain',ok);reject(e)};proc.stdin.once('drain',ok);proc.stdin.once('error',bad)});
  if((i-start)%150===0)console.log(label+' '+(i-start)+'/'+(end-start)+' '+((Date.now()-startTime)/1000).toFixed(1)+'s');
 }
 proc.stdin.end();await done;await p.close();console.log(label+' complete '+((Date.now()-startTime)/1000).toFixed(1)+'s');
}
try{
 if(mode==='probe'){
  const p=await page();const times=arg?arg.split(',').map(Number):timeline.chapters.flatMap(c=>[c.start+.8,(c.start+c.end)/2,c.end-.25]);
  const repeat=[];
  for(const t of [1.234,3.147,6.237]){
   const a=crypto.createHash('sha256').update(await frame(p,t)).digest('hex');
   await frame(p,7.3);
   const b=crypto.createHash('sha256').update(await frame(p,t)).digest('hex');
   repeat.push({t,sha256:a,identical:a===b});
   if(a!==b)throw new Error('Non-deterministic frame '+t);
  }
  fs.writeFileSync(path.join(root,'qa',STYLE+'-determinism.json'),JSON.stringify(repeat,null,2));
  for(const t of times){fs.writeFileSync(path.join(root,'qa',STYLE+'_frame_'+t.toFixed(2)+'.jpg'),await frame(p,t))}
  fs.writeFileSync(path.join(root,'qa',STYLE+'-probe-meta.json'),JSON.stringify({times,meta:await p.evaluate(()=>window.meta),errors},null,2));
  console.log('probes '+times.length);await p.close();
 }else if(mode==='clip'){
  const start=Number(arg),end=Number(arg2);await encode(Math.round(start*FPS),Math.round(end*FPS),process.env.FILM_OUTPUT || path.join(root,'qa','clip_'+start+'_'+end+'.mp4'),'clip');
 }else if(mode==='full'){
  const ranges=timeline.chapters.map(c=>[Math.round(c.start*FPS),Math.round(c.end*FPS)]);
  const hash=crypto.createHash('sha256');
  for(const n of ['film.js','timeline.js','index.html','render.mjs',...fs.readdirSync(path.join(root,'assets')).filter(n=>/\.(png|ttf)$/.test(n)).map(n=>'assets/'+n)])hash.update(fs.readFileSync(path.join(root,n)));
  hash.update(String(OW)+':'+SAMPLES);const signature=hash.digest('hex');
  const jobs=ranges.map(([a,b],i)=>({a,b,i,out:path.join(root,'out','scene_'+String(i+1).padStart(2,'0')+'.mp4')}));
  for(const j of jobs){
    const meta=j.out+'.json';let valid=false;
    if(fs.existsSync(j.out)&&fs.existsSync(meta)){const m=JSON.parse(fs.readFileSync(meta));valid=m.signature===signature&&m.start===j.a&&m.end===j.b}
    if(valid){console.log('reuse scene '+(j.i+1));continue}
    await encode(j.a,j.b,j.out,'scene '+(j.i+1));
    fs.writeFileSync(meta,JSON.stringify({signature,start:j.a,end:j.b}));
  }
  fs.writeFileSync(path.join(root,'out','concat.txt'),jobs.map(j=>"file '"+path.basename(j.out)+"'").join('\n'));
  await run('ffmpeg',['-v','warning','-y','-f','concat','-safe','0','-i',path.join(root,'out','concat.txt'),'-c','copy','-movflags','+faststart',path.join(root,'out','picture-clean.mp4')]);
  console.log('FULL PICTURE EXPORT COMPLETE');
 }
 fs.writeFileSync(path.join(root,'qa',STYLE+'-browser-errors.json'),JSON.stringify(errors,null,2));
 if(errors.length)throw new Error(errors.join('\n'));
}finally{let closed=false; await Promise.race([browser.close().then(()=>closed=true),new Promise(r=>setTimeout(r,5000))]);if(!closed)browser.process()?.kill();}
