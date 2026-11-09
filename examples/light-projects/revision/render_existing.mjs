// Adapted from existing Poisson renderer; composition only changed. See sources.json.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn,spawnSync} from 'node:child_process';
const require=createRequire('<home>/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/puppeteer-core/package.json');
const puppeteer=require('puppeteer-core');
const root=path.dirname(fileURLToPath(import.meta.url));
const [mode='probe',arg,arg2]=process.argv.slice(2);
const W=1080,H=1920,FPS=30;
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--hide-scrollbars','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const errors=[];
async function page(){
 const p=await browser.newPage();await p.setViewport({width:W,height:H,deviceScaleFactor:1});
 p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(new URL('index.html', import.meta.url).href + (process.env.FILM_VARIANT ? '?variant='+process.env.FILM_VARIANT : ''),{waitUntil:'load',timeout:60000});
 await p.waitForFunction('window.ready === true',{timeout:60000,polling:100});return p;
}
async function frame(p,t){return Buffer.from(await p.evaluate(t=>{window.render(t);return document.getElementById('film').toDataURL('image/jpeg',.97).split(',')[1]},t),'base64')}
function run(cmd,args){return new Promise((resolve,reject)=>{const c=spawn(cmd,args,{stdio:['ignore','inherit','inherit']});c.on('error',reject);c.on('close',n=>n===0?resolve():reject(new Error(cmd+' exit '+n)))})}
async function encode(start,end,out,label,preparedPage=null){
 const p=preparedPage||await page();
 const proc=spawn('ffmpeg',['-v','warning','-y','-f','image2pipe','-c:v','mjpeg','-framerate','30','-i','-','-an','-c:v','libx264','-preset','medium','-b:v','9M','-minrate','9M','-maxrate','9M','-bufsize','18M','-x264-params','nal-hrd=cbr:filler=1','-threads','3','-pix_fmt','yuv420p','-r','30','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
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
  const p=await page();const times=(arg||'0.6,3.8,9,13.9,20,25,37,48.5,61,70,79,86.5').split(',').map(Number);
  for(const t of times){fs.writeFileSync(path.join(root,'qa','frame_'+t.toFixed(2)+'.jpg'),await frame(p,t))}
  fs.writeFileSync(path.join(root,'qa','probe-meta.json'),JSON.stringify({times,meta:await p.evaluate(()=>window.meta),errors},null,2));
  console.log('probes '+times.length);await p.close();
 }else if(mode==='clip'){
  const start=Number(arg),end=Number(arg2);await encode(Math.round(start*FPS),Math.round(end*FPS),process.env.FILM_OUTPUT || path.join(root,'qa','clip_'+start+'_'+end+'.mp4'),'clip');
 }else if(mode==='full'){
  const ranges=[[0,660],[660,1320],[1320,1986]];
  const needed=ranges.map(([a,b],i)=>{const out=path.join(root,'out','part_'+i+'.mp4');let valid=false;if(fs.existsSync(out)){try{const v=JSON.parse(spawnSync('ffprobe',['-v','error','-show_entries','stream=nb_frames,codec_type','-of','json',out],{encoding:'utf8'}).stdout);valid=v.streams.some(s=>s.codec_type==='video'&&Number(s.nb_frames)===b-a)}catch{}}if(valid){console.log('reuse part'+i);return null}return {a,b,i,out}}).filter(Boolean);
  for(const job of needed)job.p=await page();
  for (const {a,b,i,out,p} of needed) await encode(a,b,out,'part'+i,p);
  fs.writeFileSync(path.join(root,'out','concat.txt'),ranges.map((_,i)=>"file 'part_"+i+".mp4'").join('\n'));
  await run('ffmpeg',['-v','warning','-y','-f','concat','-safe','0','-i',path.join(root,'out','concat.txt'),'-i',path.join(root,'assets','mix.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','256k','-t','66.2','-movflags','+faststart',path.join(root,'out','revision_full.mp4')]);
  console.log('FULL EXPORT COMPLETE');
 }
 fs.writeFileSync(path.join(root,'qa','browser-errors.json'),JSON.stringify(errors,null,2));
 if(errors.length)throw new Error(errors.join('\n'));
}finally{let closed=false; await Promise.race([browser.close().then(()=>closed=true),new Promise(r=>setTimeout(r,5000))]);if(!closed)browser.process()?.kill();}
