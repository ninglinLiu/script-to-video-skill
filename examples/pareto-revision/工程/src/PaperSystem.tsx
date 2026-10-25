// Adapted from examples/chapter-01/src/Chapter.tsx and its style.css:
// receipt silhouette/barcode/stamp, paper evidence treatment, blue/red semantics,
// quintic entry easing, persistent numeric badge, and measured-cue subtitle layer.
import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import './style.css';
export const P='#F5EFDE',I='#112B37',B='#174ACC',R='#EF643E',G='#167D6A';
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const ease=(v:number)=>{v=clamp(v);return v*v*v*(v*(v*6-15)+10)};
export const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
export const enter=(t:number,s:number,d=.65)=>ease((t-s)/d);
export const Text:React.FC<React.PropsWithChildren<{x:number;y:number;size?:number;color?:string;width?:number;style?:React.CSSProperties}>>=({children,x,y,size=44,color=I,width,style})=><div style={{position:'absolute',left:x,top:y,fontSize:size,color,width,lineHeight:1.3,...style}}>{children}</div>;
export const Paper:React.FC<React.PropsWithChildren<{x?:number;y?:number;w?:number;h?:number;angle?:number;style?:React.CSSProperties}>>=({children,x=76,y=410,w=928,h=1050,angle=0,style})=><div className="research-paper" style={{position:'absolute',left:x,top:y,width:w,height:h,padding:0,transform:`rotate(${angle}deg)`,...style}}>{children}</div>;
export const ReceiptCard:React.FC<{x:number;y:number;rotation:number;title:string;value:string;label:string;color:string;stamp:string;progress:number}>=({x,y,rotation,title,value,label,color,stamp,progress})=><div style={{position:'absolute',left:x,top:y,width:420,height:540,transform:`rotate(${rotation}deg) translateY(${mix(65,0,progress)}px)`,opacity:progress}}>
 <div className="receipt" style={{height:540,background:'#fffdf6',borderTopColor:color}}>
  <div className="receipt-top">{title}<span>MODEL / SHARE</span></div>
  <div style={{fontSize:24,marginTop:34,color:'#69797d'}}>{label}</div>
  <div style={{fontFamily:'Anton',fontSize:132,lineHeight:1.3,color,marginTop:22}}>{value}</div>
  <div className="receipt-dash"/><div style={{fontSize:24}}>比例需要明确观察对象</div>
  <div className="stamp" style={{top:390,left:36,borderColor:color,color,fontSize:28,transform:'rotate(-5deg)'}}>{stamp}</div>
  <div className="barcode">{Array.from({length:46},(_,i)=><i key={i} style={{width:i%3===0?4:2,marginRight:i%4===0?4:2}}/>)}</div>
 </div>
</div>;
export const CaptionLayer:React.FC<{subtitles:{text:string;start:number;end:number}[];enabled:boolean}>=({subtitles,enabled})=>{
 const frame=useCurrentFrame(),t=frame/useVideoConfig().fps,sub=subtitles.find(s=>t>=s.start&&t<s.end);
 if(!enabled||!sub)return null;
 return <div data-spoken-caption style={{position:'absolute',left:64,right:64,top:1660,height:154,display:'flex',alignItems:'center',justifyContent:'center',zIndex:99,textAlign:'center',fontSize:44,fontWeight:600,lineHeight:1.48}}><span style={{background:I,color:'#fff9e9',padding:'15px 25px',maxWidth:952,boxShadow:'0 8px 25px #112b3720',borderRadius:3}}>{sub.text}</span></div>;
};
export const Shell:React.FC<React.PropsWithChildren<{number:number;title:React.ReactNode;tag:string}>>=({children,number,title,tag})=><AbsoluteFill style={{background:P,color:I,fontFamily:'Sans',overflow:'hidden'}}>
 <div className="texture"/>
 <div style={{position:'absolute',left:72,right:72,top:63,display:'flex',justifyContent:'space-between',fontSize:21,letterSpacing:3,color:'#6b7e80'}}><span>比例 / 模型 / 边界</span><span>PARETO STUDY</span></div>
 <div style={{position:'absolute',top:108,left:72,right:72,height:2,background:'#112b3730'}}/>
 <Text x={72} y={144} size={24} color={B} style={{letterSpacing:3}}>{String(number).padStart(2,'0')} / {tag}</Text>
 <Text x={72} y={205} width={930} size={74} style={{fontWeight:850,letterSpacing:-2,lineHeight:1.22}}>{title}</Text>
 {children}
 <div style={{position:'absolute',bottom:42,left:72,right:72,fontSize:19,color:'#6b7e80'}}>原文改编 · 模型示意与自行推导 · 不是实测财富数据</div>
</AbsoluteFill>;
