import React,{useLayoutEffect} from 'react';
import {useCurrentFrame} from 'remotion';

// Observes the actual rendered subtitle node, not the SRT or planned string.
// Pixel verification of the encoded MP4 is still required independently.
export const CaptionProbe:React.FC=()=>{
 const frame=useCurrentFrame();
 useLayoutEffect(()=>{
  const e=document.querySelector('[data-spoken-caption],.subtitle');
  const r=e?.getBoundingClientRect();const css=e?getComputedStyle(e):null;
  console.log('CAPTION:'+JSON.stringify({frame,text:e?.textContent||'',
   visible:!!r&&r.width>0&&r.height>0&&css?.visibility!=='hidden'&&css?.display!=='none'&&css?.opacity!=='0'}));
 },[frame]);
 return null;
};
