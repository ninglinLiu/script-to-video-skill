// Reuses the proven local Remotion renderer; no audio is played or rendered here.
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill,openBrowser} from '@remotion/renderer';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const mode=process.argv[2]||'stills';
const tl=JSON.parse(readFileSync('src/timing.json','utf8'));
const browserExecutable=process.env.REMOTION_BROWSER;
if(browserExecutable && !existsSync(browserExecutable))throw new Error('Set REMOTION_BROWSER to Chrome Headless Shell.');
const serveUrl=await bundle({entryPoint:path.resolve('src/entry.tsx'),webpackOverride:c=>c});
const browser=await openBrowser('chrome',{browserExecutable,logLevel:'error'});
const composition=await selectComposition({serveUrl,id:['clean','segment'].includes(mode)?'clean':'chapter',puppeteerInstance:browser,timeoutInMilliseconds:120000});
const opts={serveUrl,composition,puppeteerInstance:browser,timeoutInMilliseconds:120000,logLevel:'error'};
mkdirSync('../qa/stills',{recursive:true});
mkdirSync('../out',{recursive:true});
try{
 if(mode==='stills'){
  const times=tl.chapters.flatMap(c=>[.2,.55,.87].map(p=>c.start+(c.end-c.start)*p));
  for(let i=0;i<times.length;i++){await renderStill({...opts,frame:Math.round(times[i]*30),output:`../qa/stills/${String(i).padStart(2,'0')}.jpg`,imageFormat:'jpeg',jpegQuality:94,scale:.5});console.log(`still ${i} ${times[i].toFixed(2)}`);}
  writeFileSync('../qa/still-times.json',JSON.stringify(times));
 }else{
  const start=Date.now();let last=-1;
  const from=Math.round((tl.chapters[1].start-5)*30);
  const segment=mode==='segment'?tl.chapters.find(c=>c.id===process.argv[3]):null;
  if(mode==='segment'&&!segment)throw new Error('Specify a chapter ID, e.g. node render.mjs segment recovery');
  const range=segment?[Math.round(segment.start*30),Math.round(segment.end*30)-1]:mode==='proof'?[from,from+389]:undefined;
  mkdirSync('../native/segments',{recursive:true});
  const output=segment?`../native/segments/${segment.id}.mp4`:mode==='rough'?'../qa/rough-v1.mp4':mode==='proof'?'../qa/proof-13s.mp4':mode==='clean'?'../native/clean-master.mp4':'../out/final-silent.mp4';
  await renderMedia({...opts,outputLocation:output,codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',crf:mode==='rough'?23:18,muted:true,concurrency:4,scale:['rough','proof'].includes(mode)?.5:1,frameRange:range,onProgress:({progress})=>{const n=Math.floor(progress*20);if(n!==last){console.log(`${mode}: ${n*5}%`);last=n;}}});
  writeFileSync(`../qa/render-${mode}.json`,JSON.stringify({mode,seconds:(Date.now()-start)/1000,composition,frameRange:range||[0,tl.frames-1],output},null,2));
 }
}finally{await browser.close({silent:true});}
