// Reuse the established Remotion bundle -> Headless Shell -> FFmpeg renderer.
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill,openBrowser} from '@remotion/renderer';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const ids=['tree-business','tree-learning','matrix-price','matrix-sharing','orbit-signal','orbit-value'];
const wanted=process.argv.slice(3);const mode=process.argv[2]||'stills';
const exe=process.env.REMOTION_BROWSER || undefined;
const serveUrl=await bundle({entryPoint:path.resolve('src/entry.tsx'),webpackOverride:c=>c});
const browser=await openBrowser('chrome',{browserExecutable:exe,logLevel:'error'});
mkdirSync('qa/stills',{recursive:true});mkdirSync('out',{recursive:true});
const reports=[];
try{
 for(const id of ids.filter(i=>!wanted.length||wanted.includes(i))){
  const composition=await selectComposition({serveUrl,id,puppeteerInstance:browser,timeoutInMilliseconds:120000});
  const opts={serveUrl,composition,puppeteerInstance:browser,timeoutInMilliseconds:120000,logLevel:'error'};
  if(mode==='stills'){
   for(const frame of [40,150,260]){await renderStill({...opts,frame,output:`qa/stills/${id}-${frame}.jpg`,imageFormat:'jpeg',scale:.5});}
   console.log(`${id}: 3 stills`);
  }else{
   const start=Date.now();let last=-1;
   await renderMedia({...opts,outputLocation:`out/${id}.mp4`,codec:'h264',crf:17,muted:true,concurrency:4,onProgress:({progress})=>{const n=Math.floor(progress*4);if(n!==last){console.log(`${id} ${n*25}%`);last=n;}}});
   reports.push({id,frames:300,fps:30,width:1080,height:1920,seconds:(Date.now()-start)/1000,muted:true});
  }
 }
}finally{await browser.close({silent:true});}
if(mode!=='stills')writeFileSync(`qa/render-${wanted.join('-')||'all'}.json`,JSON.stringify(reports,null,2));
