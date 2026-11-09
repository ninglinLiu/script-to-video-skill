import React, {useLayoutEffect} from 'react';
import {useCurrentFrame, useVideoConfig,delayRender,continueRender,cancelRender} from 'remotion';

export type Pose = {frame: number; x: number; y: number; scale: number};
export const ease = (p: number) => {const t=Math.max(0,Math.min(1,p)); return t*t*(3-2*t);};
export const blend = (a: number,b: number,p: number) => a+(b-a)*ease(p);
export function poseAt(frame: number, keys: Pose[]): Pose {
  if(frame<=keys[0].frame)return keys[0];
  for(let i=1;i<keys.length;i++)if(frame<=keys[i].frame){
    const a=keys[i-1],b=keys[i],p=(frame-a.frame)/(b.frame-a.frame);
    return {frame,x:blend(a.x,b.x,p),y:blend(a.y,b.y,p),scale:blend(a.scale,b.scale,p)};
  }
  return keys[keys.length-1];
}

/** Same keyed object across shots. Coordinates are normalized, not a scaled 16:9 page. */
export const PersistentObject: React.FC<{id:string;asset:string;keys:Pose[];children:React.ReactNode}>=({id,asset,keys,children})=>{
  const frame=useCurrentFrame(), {width,height}=useVideoConfig(),p=poseAt(frame,keys);
  return <div data-object-id={id} data-visual-asset={asset} style={{position:'absolute',left:p.x*width,top:p.y*height,width:180,height:180,transform:`translate(-50%,-50%) scale(${p.scale})`,transformOrigin:'center'}}>{children}</div>;
};

/** Evidence hard-cut: keep the anchor outside the replaced content, with stable identity. */
export const EvidenceCut: React.FC<{at:number;anchor:React.ReactNode;before:React.ReactNode;after:React.ReactNode}>=({at,anchor,before,after})=>{
  const f=useCurrentFrame();return <>{anchor}{f<at?before:after}</>;
};

/** Browser DOM telemetry of rendered objects. It is NOT an aesthetic reviewer. */
export const MotionProbe: React.FC=()=>{
  const frame=useCurrentFrame();
  useLayoutEffect(()=>{
    const handle=delayRender('motion DOM '+frame);let cancelled=false,tries=0;
    const measure=()=>{
    if(cancelled)return;
    const root=document.querySelector('[data-film-root]')!.getBoundingClientRect();
    if(!root.width||!root.height){if(++tries>200){cancelRender(new Error('No laid out film root'));return;}setTimeout(measure,10);return;}
    const visible=(e:Element)=>{let o=1;let n:Element|null=e;while(n){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden')return false;o*=Number(s.opacity);n=n.parentElement;}return o>0.05;};
    const objects=Array.from(document.querySelectorAll('[data-object-id]')).map(e=>{const r=e.getBoundingClientRect();return {id:e.getAttribute('data-object-id'),asset:e.getAttribute('data-visual-asset'),shapes:e.querySelectorAll('svg path,svg rect,svg circle,svg polygon,svg ellipse').length,x:(r.x+r.width/2-root.x)/root.width,y:(r.y+r.height/2-root.y)/root.height,visible:visible(e)&&r.width>0&&r.height>0&&r.right>root.left&&r.left<root.right&&r.bottom>root.top&&r.top<root.bottom};});
    const claims=Array.from(document.querySelectorAll('[data-claim-key]')).filter(visible).map(e=>({key:e.getAttribute('data-claim-key'),text:e.textContent}));
    console.log('VTRACE:'+JSON.stringify({frame,objects,claims}));
    continueRender(handle);
    };
    measure();
    return ()=>{cancelled=true;continueRender(handle);};
  },[frame]);
  return null;
};
