// Complete-episode renderer, adapted from chapter-01. Always silent while rendering.
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill,openBrowser} from '@remotion/renderer';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));process.chdir(here);
const mode=process.argv[2]||'stills',tl=JSON.parse(readFileSync('src/timing.json','utf8'));
const python=process.env.PYTHON||'python';
const digest=()=>{const r=spawnSync(python,['../tools/production.py','digest','--episode','..'],{encoding:'utf8'});if(r.status)throw Error(r.stderr);return r.stdout.trim();};
mkdirSync('.tmp',{recursive:true});process.env.TEMP=path.resolve('.tmp');process.env.TMP=process.env.TEMP;
for(const x of ['../qa/stills','../qa/caption-reference','../out'])mkdirSync(x,{recursive:true});
const hashBefore=digest(),serveUrl=await bundle({entryPoint:path.resolve('src/entry.tsx')});
const browser=await openBrowser('chrome',{browserExecutable:process.env.REMOTION_BROWSER,logLevel:'error'});
const traces=new Map();
const onBrowserLog=log=>{const i=log.text.indexOf('CAPTION:');if(i>=0){const r=JSON.parse(log.text.slice(i+8));traces.set(r.frame,r);}};
try{
 const composition=await selectComposition({serveUrl,id:'chapter',puppeteerInstance:browser});
 const opts={serveUrl,composition,puppeteerInstance:browser,timeoutInMilliseconds:120000,logLevel:'error',onBrowserLog};
 if(mode==='stills'){
  const times=tl.cues.map(c=>(c.start+c.end)/2);
  for(let i=0;i<times.length;i++)await renderStill({...opts,frame:Math.round(times[i]*tl.fps),output:`../qa/stills/${String(i).padStart(2,'0')}.jpg`,imageFormat:'jpeg',scale:.5});
  writeFileSync('../qa/still-times.json',JSON.stringify(times));
 }else if(['proof','full'].includes(mode)){
  const proof=mode==='proof',from=Number(process.argv[3]||0),to=Number(process.argv[4]||12);
  const range=proof?[Math.round(from*tl.fps),Math.round(to*tl.fps)-1]:undefined;
  await renderMedia({...opts,outputLocation:proof?'../qa/proof.mp4':'../out/final-silent.mp4',codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',videoBitrate:proof?undefined:'10M',crf:proof?20:undefined,muted:true,concurrency:Number(process.env.RENDER_CONCURRENCY||2),scale:proof?.5:1,frameRange:range});
  if(hashBefore!==digest())throw Error('Render inputs changed during rendering');
  if(!proof){
   writeFileSync('../qa/caption-trace.json',JSON.stringify([...traces.values()].sort((a,b)=>a.frame-b.frame)));
   const samples=[];
   for(let i=0;i<tl.subtitles.length;i++){
    const s=tl.subtitles[i];
    for(const [part,seconds] of [['start',s.start+.16],['end',s.end-.16]]){
     const frame=Math.round(seconds*tl.fps),stem=`${String(i).padStart(2,'0')}-${part}`;
     for(const enabled of [true,false])await renderStill({...opts,composition:{...composition,props:{...composition.props,captions:enabled}},frame,inputProps:{captions:enabled},output:`../qa/caption-reference/${stem}-${enabled?'with':'without'}.png`});
     samples.push({subtitle:i,frame,text:s.text,expected:`qa/caption-reference/${stem}-with.png`,without:`qa/caption-reference/${stem}-without.png`});
    }
   }
   if(hashBefore!==digest())throw Error('Render inputs changed while producing caption references');
   writeFileSync('../qa/caption-reference.json',JSON.stringify({sourceSha256:hashBefore,samples},null,2));
   writeFileSync('../qa/render-full.json',JSON.stringify({sourceSha256:hashBefore,frames:tl.frames,fps:tl.fps,width:composition.width,height:composition.height,captionMode:'visible-in-video'},null,2));
  }
 }else throw Error('Use stills, proof START END, or full');
}finally{await browser.close({silent:true});}
