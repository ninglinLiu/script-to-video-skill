import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill,openBrowser} from '@remotion/renderer';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const mode=process.argv[2]||'stills';
const browserExecutable=process.env.REMOTION_BROWSER||'<home>/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe';
if(!existsSync(browserExecutable))throw new Error('Set REMOTION_BROWSER to the absolute path of a Chrome Headless Shell executable.');
const serveUrl=await bundle({entryPoint:path.resolve('src/entry.tsx'),webpackOverride:c=>c});
const browser=await openBrowser('chrome',{browserExecutable,logLevel:'error'});
const composition=await selectComposition({serveUrl,id:'gold-transmission',puppeteerInstance:browser,timeoutInMilliseconds:120000});
const opts={serveUrl,composition,puppeteerInstance:browser,timeoutInMilliseconds:120000,logLevel:'error'};
try{
 if(mode==='stills'){
  mkdirSync('../qa/stills',{recursive:true});
  const times=[1.8,3.7,6.5,10.5,15.5,18,23.7,26.6,29.5,31.5,34.5,37.4,39.2,42.5,46.5,50.5,55,58.8,63.5,66.5,69.5,74.8,78.5,82.8];
  for(const t of times){await renderStill({...opts,frame:Math.round(t*30),output:`../qa/stills/${t.toFixed(1).replace('.','-')}.jpg`,imageFormat:'jpeg',jpegQuality:90,scale:.5});console.log(`still ${t}`);}
 }else{
  let last=-1;const start=Date.now();
  await renderMedia({...opts,outputLocation:mode==='proof'?'../qa/proof-numeric.mp4':'../qa/render-full-range.mp4',codec:'h264',crf:18,muted:true,concurrency:3,scale:mode==='proof'?.5:1,frameRange:mode==='proof'?[825,1289]:undefined,onProgress:({progress})=>{const n=Math.floor(progress*20);if(n!==last){console.log(`${mode}: ${n*5}%`);last=n;}}});
  writeFileSync(`../qa/render-${mode}.json`,JSON.stringify({mode,seconds:(Date.now()-start)/1000,composition,output:mode==='proof'?'qa/proof-numeric.mp4':'qa/render-full-range.mp4'},null,2));
 }
}finally{await browser.close({silent:true});}
