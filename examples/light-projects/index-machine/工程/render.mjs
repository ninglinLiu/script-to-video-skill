import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill,openBrowser} from '@remotion/renderer';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const mode=process.argv[2]||'stills';
const tl=JSON.parse(readFileSync('src/timing.json','utf8'));
const browserExecutable=process.env.REMOTION_BROWSER||'<home>/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe';
if(!existsSync(browserExecutable))throw new Error('Set REMOTION_BROWSER to a Chrome Headless Shell executable.');
const serveUrl=await bundle({entryPoint:path.resolve('src/entry.tsx'),webpackOverride:c=>c});
const browser=await openBrowser('chrome',{browserExecutable,logLevel:'error'});
const composition=await selectComposition({serveUrl,id:'index-machine',puppeteerInstance:browser,timeoutInMilliseconds:120000});
const opts={serveUrl,composition,puppeteerInstance:browser,timeoutInMilliseconds:120000,logLevel:'error'};
try{
 if(mode==='stills'){
  mkdirSync('../qa/stills',{recursive:true});
  const times=tl.chapters.flatMap(ch=>[.18,.55,.82].map(p=>ch.start+(ch.end-ch.start)*p));
  for(let i=0;i<times.length;i++){const t=times[i];await renderStill({...opts,frame:Math.round(t*30),output:`../qa/stills/${String(i).padStart(2,'0')}.jpg`,imageFormat:'jpeg',jpegQuality:95,scale:.5});console.log(`still ${i} ${t.toFixed(2)}`);}
  writeFileSync('../qa/still-times.json',JSON.stringify(times));
 }else if(mode==='valuation'){
  const ch=tl.chapters.find(c=>c.id==='valuation');const from=Math.floor((ch.start-.6)*30),to=Math.ceil((ch.end+.6)*30);
  await renderMedia({...opts,outputLocation:'../qa/valuation-repair.mp4',codec:'h264',crf:18,muted:true,concurrency:4,scale:1,frameRange:[from,to]});
  writeFileSync('../qa/valuation-repair.json',JSON.stringify({from,to,frames:to-from+1}));
  console.log(`valuation repair ${from}..${to}`);
 }else{
  let last=-1;const start=Date.now();const ch=tl.chapters.find(c=>c.id==='weight');
  const from=Math.round((ch.start+(ch.end-ch.start)*.32)*30);const to=Math.min(Math.round(ch.end*30)-1,from+389);
  await renderMedia({...opts,outputLocation:mode==='proof'?'../qa/proof-weight.mp4':'../qa/render-full-range.mp4',codec:'h264',crf:18,muted:true,concurrency:4,scale:mode==='proof'?.5:1,frameRange:mode==='proof'?[from,to]:undefined,onProgress:({progress})=>{const n=Math.floor(progress*20);if(n!==last){console.log(`${mode}: ${n*5}%`);last=n;}}});
  writeFileSync(`../qa/render-${mode}.json`,JSON.stringify({mode,seconds:(Date.now()-start)/1000,composition,range:mode==='proof'?[from,to]:[0,tl.frames-1]},null,2));
 }
}finally{await browser.close({silent:true});}
