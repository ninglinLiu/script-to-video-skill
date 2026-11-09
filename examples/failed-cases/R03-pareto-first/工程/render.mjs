// Uses the pinned chapter-01 renderer. Silent by construction; no automatic player.
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderMedia,renderStill} from '@remotion/renderer';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));process.chdir(here);
const root=path.resolve('..'),mode=process.argv[2]||'proof';
if(!['proof','final','stills'].includes(mode))throw new Error('Use proof, final, or stills');
const python=process.env.PYTHON||'python';
const run=(...args)=>{const r=spawnSync(python,['../tools/production.py',...args,'--episode',root],{encoding:'utf8'});if(r.status!==0)throw new Error((r.stdout||'')+(r.stderr||''));return r.stdout;};
console.log(run('check','--stage',mode==='final'?'render':'prepare'));
// Scoped to this process and its renderer children; fixes the observed Windows TEMP failure.
mkdirSync('.tmp',{recursive:true});process.env.TEMP=path.resolve('.tmp');process.env.TMP=process.env.TEMP;
mkdirSync('../qa',{recursive:true});mkdirSync('../out',{recursive:true});
const plan=JSON.parse(readFileSync('../plans/edit-plan.json','utf8'));
const sourceDigest=run('digest').trim();
const serveUrl=await bundle({entryPoint:path.resolve('src/entry.tsx')});
const browser=await openBrowser('chrome',{browserExecutable:process.env.REMOTION_BROWSER,logLevel:'error'});
const traces=new Map();
const onBrowserLog=log=>{const s=log.text;const i=s.indexOf('VTRACE:');if(i>=0){const r=JSON.parse(s.slice(i+7));traces.set(r.frame,r);}};
try{
  const composition=await selectComposition({serveUrl,id:'film',puppeteerInstance:browser});
  const onLog=({previewString})=>{if(!previewString.includes('VTRACE:'))console.error(previewString);};
  const common={serveUrl,composition,puppeteerInstance:browser,timeoutInMilliseconds:120000,onBrowserLog,onLog,logLevel:'error'};
  if(mode==='stills'){
    for(const t of [1,4,6,8,10])await renderStill({...common,frame:Math.round(t*plan.fps),output:`../qa/frame-${t}.png`,scale:.5});
    console.log('Stills saved; these do not satisfy the motion gate.');
  }else{
    const proof=mode==='proof';
    const range=proof?[Math.round(plan.proof.start*plan.fps),Math.round(plan.proof.end*plan.fps)-1]:undefined;
    await renderMedia({...common,outputLocation:proof?'../qa/motion-proof.mp4':'../out/final-silent.mp4',codec:'h264',pixelFormat:'yuv420p',muted:true,crf:19,scale:proof?.5:1,concurrency:Number(process.env.RENDER_CONCURRENCY||3),frameRange:range});
    if(sourceDigest!==run('digest').trim())throw new Error('Render inputs changed during rendering; output cannot be certified');
    if(proof){writeFileSync('../qa/motion-trace.json',JSON.stringify([...traces.values()].sort((a,b)=>a.frame-b.frame)));console.log(run('capture'));}
    else writeFileSync('../qa/render-full.json',JSON.stringify({sourceSha256:sourceDigest,mode,frames:composition.durationInFrames,fps:composition.fps},null,2));
  }
}finally{await browser.close({silent:true});}
