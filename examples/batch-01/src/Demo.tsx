import React from 'react';
import {AbsoluteFill,staticFile,useCurrentFrame} from 'remotion';
import {GoldTree} from './upstream/gilded/tree';
import {PayoffMatrix,Cell} from './upstream/blackgold/charts';
import {Core,OrbitLines,TypeOrbit} from './local/redshift/props';
import {clamp01,easeInOut,easeOut,lerp} from './upstream/anim';
import {DemoId,variants} from './catalog';

const ramp=(f:number,a:number,b:number)=>clamp01((f-a)/(b-a));
const cn='Vox Heavy';
const gold='#ebd5a3',paper='#f6f2e9',red='#ff7568';
const T=({x,y,children,size=42,fill=paper,...props}:any)=><text x={x} y={y} fontFamily={cn} fontSize={size} fill={fill} {...props}>{children}</text>;
const Shell:React.FC<{id:DemoId;f:number;children:React.ReactNode}>=({id,f,children})=>{
 const d=variants[id],isOrbit=d.kind==='orbit';
 return <AbsoluteFill style={{background:'#070a0d',color:paper,fontFamily:cn,overflow:'hidden'}}>
  <style>{`@font-face{font-family:'Noto Serif SC';src:url('${staticFile('fonts/ep52/NotoSerifSC-VF.ttf')}')} .tree path {stroke-width:3.2px;} .tree circle {stroke-width:2px;}`}</style>
  <AbsoluteFill style={{background:isOrbit?'radial-gradient(ellipse at 45% 47%,#381020 0%,#0b0a10 58%,#070a0d 100%)':'radial-gradient(ellipse at 48% 51%,#2b2219 0%,#111310 42%,#070a0d 78%)'}}/>
  <svg width="1080" height="1920" style={{position:'absolute'}}><path d="M72 180H1008M72 1770H1008" stroke="#68726e" strokeWidth="1" opacity=".65"/><T x={72} y={112} size={24} fill={gold}>MOTION STUDIES / {d.code}</T><T x={1008} y={112} size={24} textAnchor="end" fill="#b6c0b8">同组件 · 双内容</T></svg>
  <div style={{position:'absolute',left:72,right:72,top:225,transform:`translateY(${16*(1-easeOut(ramp(f,0,15)))}px)`,opacity:.5+.5*ramp(f,0,12)}}>
   <div style={{fontSize:29,letterSpacing:2,color:gold,marginBottom:28}}>{d.tag}</div>
   <div style={{fontSize:d.title.length>10?71:80,lineHeight:1.25,letterSpacing:-2,maxWidth:950}}>{d.title}</div>
  </div>
  {children}
  <div style={{position:'absolute',left:72,right:72,bottom:190,fontSize:28,lineHeight:1.6,color:'#b9b8b0'}}>{d.detail}</div>
  <div style={{position:'absolute',left:72,bottom:94,fontSize:23,color:'#a3aaa3'}}>组件候选 / 方向评审　·　真实渲染　·　无音轨</div>
 </AbsoluteFill>
};

const TreeDemo:React.FC<{id:DemoId;f:number}>=({id,f})=>{
 const d=variants[id]; if(d.kind!=='tree')return null;
 const grow=easeOut(ramp(f,18,118)),hp=easeInOut(ramp(f,146,220));
 const x=126,y=665,w=720,h=640,lw=w/2.4;
 const leafIndex=d.highlight[0]*2+d.highlight[1];
 return <>
  <div className="tree" style={{position:'absolute',left:x,top:y}}><GoldTree w={w} h={h} depth={2} p={grow} highlight={[...d.highlight]} hp={hp} leafColor={(i)=>i===leafIndex&&hp>.95?red:gold}/></div>
  <svg width="1080" height="1920" style={{position:'absolute'}}>
   <circle cx={x} cy={y+h/2} r="15" fill={gold}/><T x={75} y={y+h/2-58} size={34} fill={gold}>{d.root}</T>
   {d.branches.map((b,i)=><g key={b} opacity={ramp(f,30,62)}><T x={x+lw} y={y+h*(i+.5)/2-42} size={34} textAnchor="middle" fill={gold}>{b}</T></g>)}
   {d.leaves.map((l,i)=><g key={l} opacity={ramp(f,66,112)}><T x={x+lw*2+42} y={y+h*(i+.5)/4+14} size={41} fill={hp>.95&&i===leafIndex?red:paper}>{l}</T></g>)}
   <path d="M72 1420H1008" stroke={gold} opacity=".25"/>
   <T x={72} y={1515} size={46} fill={f<145?gold:red}>{f<145?'先展开可能，再追踪线索。':d.takeaway}</T>
  </svg>
 </>;
};

const MatrixDemo:React.FC<{id:DemoId;f:number}>=({id,f})=>{
 const d=variants[id]; if(d.kind!=='matrix')return null;
 const matrix=[d.cells[0].map(x=>({...x})),d.cells[1].map(x=>({...x}))] as [[Cell,Cell],[Cell,Cell]];
 return <>
  <div style={{position:'absolute',top:480,left:72,fontSize:28,color:gold}}>格内分数：你 / 对方　·　分数越高越好</div>
  <PayoffMatrix f={f} at={12} x={270} y={650} cw={355} ch={255} rows={[...d.rows]} cols={[...d.cols]} cells={matrix}
   arrows={[{from:[0,0],to:[1,0],at:60},{from:[0,1],to:[1,1],at:92},{from:[0,0],to:[0,1],at:124},{from:[1,0],to:[1,1],at:156}]}
   hi={[{cell:[1,1],color:'red',at:190},{cell:[0,0],color:'cyan',at:230}]}/>
  <div style={{position:'absolute',left:72,right:72,top:1265,display:'flex',gap:20,alignItems:'center'}}><div style={{width:7,height:82,background:f<190?gold:red}}/><div style={{fontSize:37,lineHeight:1.5}}>{f<60?'先看收益表：每格有两个人的分数。':f<92?'比较左列：对方这样选，你选什么？':f<124?'比较右列：对方换选择，你选什么？':f<190?'再换到对方的视角，比较他的分数。':f<230?'箭头汇到右下角：各自不想先改。':'左上角对双方更好，却难以停在那里。'}</div></div>
  <svg width="1080" height="1920" style={{position:'absolute'}}><T x={72} y={1515} size={46} fill={gold}>{d.takeaway}</T></svg>
 </>;
};

const OrbitDemo:React.FC<{id:DemoId;f:number}>=({id,f})=>{
 const d=variants[id];if(d.kind!=='orbit')return null;
 const travel=easeInOut(ramp(f,145,205)),fade=1-easeOut(ramp(f,170,225));
 const clock=f<145?f*1.7:246.5+52*easeOut(ramp(f,145,220));
 return <>
  <svg width="1080" height="1920" style={{position:'absolute'}}>
   <defs><clipPath id="field"><rect x="0" y="490" width="1080" height="945"/></clipPath></defs>
   <g clipPath="url(#field)">
    <g transform={`translate(540 950) scale(${lerp(.9,2.4,travel)})`} opacity={fade}>
      <TypeOrbit f={clock} radius={330} tilt={.55+travel*.4} roll={-.14+travel*.7} density={24} words={[...d.words]} spread={travel*.65}/>
      <OrbitLines f={clock} radius={295}/>
      <Core f={clock} r={136} wire={ramp(f,82,136)}/>
    </g>
   </g>
   <g opacity={easeOut(ramp(f,193,228))} transform={`translate(540 ${970+55*(1-easeOut(ramp(f,193,228)))})`}>
    <T x={0} y={-18} size={190} textAnchor="middle" fontFamily="Vox Anton">{d.anchor}</T>
    <path d="M-355 45H355" stroke={red} strokeWidth="6"/>
    <T x={0} y={124} size={43} textAnchor="middle" fill={gold}>{d.cn}</T>
   </g>
   <T x={72} y={1515} size={43} fill={gold}>{f<145?'关键词进入空间，形成前后遮挡。':f<225?'镜头穿出字带，保留主词。':'收住镜头，留出可读的落点。'}</T>
  </svg>
 </>;
};

export const Demo:React.FC<{id:DemoId}>=({id})=>{const f=useCurrentFrame(),kind=variants[id].kind;return <Shell id={id} f={f}>{kind==='tree'?<TreeDemo id={id} f={f}/>:kind==='matrix'?<MatrixDemo id={id} f={f}/>:<OrbitDemo id={id} f={f}/>}</Shell>};
