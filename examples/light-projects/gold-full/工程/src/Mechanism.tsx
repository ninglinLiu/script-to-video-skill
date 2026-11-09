import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {clamp01,easeInOut,keyframes,lerp} from './library/anim';
import {project,rotate,V3} from './library/redshift/theme';
import timing from './proof-timing.json';

const C={paper:'#ede9dc',ink:'#143b3c',mint:'#c6e3d8',orange:'#ed6a3b',gold:'#ce9b51',dark:'#214e4c',muted:'#507371'};
const CN='Vox Heavy', NUM='Vox Anton', SERIF='Vox Garamond';
const p=(t:number,a:number,b:number)=>easeInOut(clamp01((t-a)/(b-a)));
const k=(t:number,arr:[number,number][])=>keyframes(t,arr);
const cue=timing.cues;
const RATE=cue[2].start-.2, BOND=cue[3].start-.2, RETURN=cue[4].start-.15;
const Text:React.FC<{x?:number;y:number;size?:number;fill?:string;anchor?:'start'|'middle'|'end';face?:string;opacity?:number;children:React.ReactNode}>=({x=80,y,size=50,fill=C.ink,anchor='start',face=CN,opacity=1,children})=><text x={x} y={y} fontFamily={face} fontSize={size} fill={fill} textAnchor={anchor} opacity={opacity}>{children}</text>;

const Screw:React.FC<{x:number;y:number}>=({x,y})=><g transform={`translate(${x} ${y})`}><circle r="13" fill="url(#metal)" stroke="#386561" strokeWidth="2"/><path d="M-5 5L5 -5" stroke="#466d65" strokeWidth="2"/></g>;
export const Dial:React.FC<{t:number}>=({t})=>{
 const turn=p(t,RATE,BOND+1.5),angle=lerp(55,-108,turn);
 return <g transform="translate(395 722)">
  <ellipse cx="24" cy="46" rx="265" ry="248" fill="#123630" opacity=".18" filter="url(#shadow)"/>
  <circle cy="20" r="265" fill="#275951"/><circle r="265" fill="url(#rim)" stroke="#4a7366" strokeWidth="3"/>
  {Array.from({length:96},(_,i)=><path key={i} d="M0 -248V-262" stroke={i%2?'#7a987b':'#eef3cc'} strokeWidth="3" transform={`rotate(${i*3.75})`}/>)}
  <circle r="234" fill="url(#ceramic)" stroke="#f3f7de" strokeWidth="4"/>
  <circle r="207" fill="none" stroke="#94b2a5" strokeWidth="2"/>
  {Array.from({length:37},(_,i)=><path key={i} d={`M0 -190V${i%3===0?-171:-182}`} stroke={C.ink} strokeOpacity={i%3===0?.75:.3} strokeWidth={i%3===0?3:2} transform={`rotate(${-125+i*5})`}/>)}
  <path d="M-171 120A210 210 0 0 1 171 -120" fill="none" stroke={C.orange} strokeWidth="9" strokeLinecap="round" opacity=".22"/>
  <Text x={0} y={-74} size={28} anchor="middle" face={NUM}>POLICY RATE</Text>
  <Text x={0} y={74} size={77} anchor="middle">利率</Text>
  <Text x={-163} y={95} size={28} anchor="middle">低</Text><Text x={148} y={-120} size={28} anchor="middle">高</Text>
  <g transform={`rotate(${angle})`}>
   <path d="M-16 49L-9 -156Q0 -192 9 -156L16 49Z" fill="#814323" transform="translate(4 6)" opacity=".28"/>
   <path d="M-13 49L-7 -158Q0 -184 7 -158L13 49Z" fill={C.orange}/>
   <path d="M-3 -155L-4 32" stroke="#ffbd88" strokeWidth="3"/>
  </g>
  <circle r="35" fill="url(#metal)" stroke="#c1a368" strokeWidth="4"/><circle r="10" fill={C.ink}/>
  <path d="M-135 141Q0 202 135 141" fill="none" stroke="#fffef0" strokeWidth="9" opacity=".6"/>
 </g>;
};

const pt=(v:V3,cx:number,cy:number)=>{const q=project(rotate(v,.10,-.62,-.12),1800);return [q.x+cx,q.y+cy] as [number,number];};
const poly=(vs:V3[],cx:number,cy:number)=>vs.map(v=>pt(v,cx,cy).join(',')).join(' ');
const Sheet:React.FC<{i:number;t:number}>=({i,t})=>{
 const u=i===4?p(t,BOND+.35,BOND+1.85):0;
 const cx=588+i*9+u*224,cy=1298-i*24+u*160;
 const z=-i*4-Math.sin(u*Math.PI)*100;
 const vs:V3[]=[[-207,-146,z],[207,-146,z],[207,146,z],[-207,146,z]];
 const line=(a:V3,b:V3)=>poly([a,b],cx,cy);
 return <g opacity={1}>
  <polygon points={poly(vs.map(([x,y,z])=>[x+5,y+12,z]),cx,cy)} fill="#345e54" opacity=".22"/>
  <polygon points={poly(vs,cx,cy)} fill={i===4?'#f5da91':'#f3f2dc'} stroke={i===4?'#af8548':'#a5b7a1'} strokeWidth="3"/>
  <polygon points={poly([[-190,-130,z],[190,-130,z],[190,-88,z],[-190,-88,z]],cx,cy)} fill={C.ink}/>
  <polyline points={line([-173,-53,z],[170,-53,z])} fill="none" stroke="#688b7a" strokeWidth="4"/>
  {[-22,9,40,71].map((y,j)=><polyline key={y} points={line([-173,y,z],[j===3?55:170,y,z])} fill="none" stroke="#a7bca5" strokeWidth="4"/>)}
  {Array.from({length:26},(_,j)=><polyline key={j} points={line([-170+j*4,96,z],[-170+j*4,121,z])} fill="none" stroke={C.ink} strokeWidth={j%3===0?3:1}/>)}
  <circle cx={pt([140,102,z],cx,cy)[0]} cy={pt([140,102,z],cx,cy)[1]} r="19" fill="none" stroke={C.orange} strokeWidth="3"/>
 </g>;
};
export const Ledger:React.FC<{t:number}>=({t})=>{
 const moved=p(t,BOND+.35,BOND+1.85);
 return <>
  <ellipse cx="650" cy="1320" rx="276" ry="65" fill="#173e36" opacity=".15" filter="url(#shadow)"/>
  <path d="M315 1232L770 1180L865 1322L406 1379Z" fill="#608f7a"/><path d="M406 1379V1397L865 1340V1322" fill="#315e50"/>
  {[0,1,2,3,4].map(i=><Sheet key={i} i={i} t={t}/>)}
  <g opacity={moved}><path d="M697 1438H1008V1496H697Z" fill={C.ink}/><Text x={852} y={1478} size={30} anchor="middle" fill="#fff6d1">到期 · 不再投资</Text></g>
  <Text x={347} y={1047} size={38}>证券持有</Text>
  <path d="M349 1068H810" stroke={C.ink} opacity=".35" strokeWidth="2"/>
 </>;
};

export const TwoControls:React.FC=()=>{
 const t=useCurrentFrame()/30;
 const zoom=k(t,[[0,1.15],[1.0,.91],[RATE-.45,.91],[RATE+.05,1.34],[BOND-.02,1.34],[BOND+.55,1.34],[RETURN-.20,1.34],[RETURN+.65,.91],[timing.seconds,.93]]);
 const cx=k(t,[[0,435],[1.0,540],[RATE-.45,540],[RATE+.05,398],[BOND-.02,398],[BOND+.55,623],[RETURN-.20,623],[RETURN+.65,540],[timing.seconds,540]]);
 const cy=k(t,[[0,830],[1.0,965],[RATE-.45,965],[RATE+.05,742],[BOND-.02,742],[BOND+.55,1280],[RETURN-.20,1280],[RETURN+.65,965],[timing.seconds,965]]);
 const az=k(t,[[0,-10],[1,0],[RATE-.45,0],[RATE+.05,-3],[BOND-.02,-3],[BOND+.55,3],[RETURN-.2,3],[RETURN+.65,0]]);
 const current=cue.find(c=>t>=c.start&&t<c.end+.14);
 const ending=p(t,RETURN+.55,RETURN+1.05);
 const detailRate=t>RATE&&t<BOND+.2, detailBond=t>=BOND+.2&&t<RETURN+.1;
 return <AbsoluteFill style={{background:C.paper,fontFamily:CN}}>
  <svg width="1080" height="1920" viewBox="0 0 1080 1920">
   <defs>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#eff2d9"/><stop offset=".3" stopColor="#bdd8c4"/><stop offset=".76" stopColor="#79a78f"/><stop offset="1" stopColor="#507f6c"/></linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#f8edb9"/><stop offset=".25" stopColor="#8a9f7d"/><stop offset=".5" stopColor="#f7f0ca"/><stop offset=".7" stopColor="#7d9b78"/><stop offset="1" stopColor="#254f45"/></linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0b9"/><stop offset=".36" stopColor="#d1a567"/><stop offset=".60" stopColor="#fff4c7"/><stop offset="1" stopColor="#a06e37"/></linearGradient>
    <radialGradient id="ceramic" cx=".35" cy=".25"><stop stopColor="#fbfae7"/><stop offset=".75" stopColor="#d4e2c8"/><stop offset="1" stopColor="#afc7b1"/></radialGradient>
    <radialGradient id="paper"><stop stopColor="#faf6e9"/><stop offset="1" stopColor="#e4e1d1"/></radialGradient>
    <filter id="shadow" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="15"/></filter>
    <pattern id="grain" width="17" height="19" patternUnits="userSpaceOnUse"><circle cx="3" cy="6" r=".65" fill="#153c37" opacity=".1"/><circle cx="12" cy="14" r=".45" fill="#fff" opacity=".4"/></pattern>
    <clipPath id="stage"><rect y="388" width="1080" height="1210"/></clipPath>
   </defs>
   <rect width="1080" height="1920" fill="url(#paper)"/>
   <path d="M79 92H1000M79 160H1000" stroke={C.ink} strokeWidth="2"/>
   <Text y={135} size={27}>凯撒的复利实验室</Text><Text x={1000} y={135} anchor="end" size={26} face={NUM}>MONETARY STUDIES / 01</Text>
   <Text y={279} size={102}>降息 <tspan fill={C.orange}>×</tspan> 缩表</Text>
   <Text y={346} size={35} opacity={1-ending}>两种工具，可以同时调整。</Text>
   <g opacity={ending}><rect x="78" y="304" width="685" height="61" fill={C.orange}/><Text x={102} y={348} size={35} fill="#fff7dd">分开看，才看得清。</Text></g>
   <g clipPath="url(#stage)">
    <g transform={`translate(540 980) scale(${zoom}) rotate(${az}) translate(${-cx} ${-cy})`}>
     <rect x="108" y="416" width="910" height="1175" rx="76" fill="#456d58" opacity=".17" filter="url(#shadow)"/>
     <rect x="82" y="398" width="910" height="1160" rx="68" fill="#426f5b"/>
     <rect x="70" y="378" width="910" height="1160" rx="68" fill="url(#body)" stroke="#618c71" strokeWidth="2"/>
     <rect x="87" y="395" width="876" height="1126" rx="57" fill="none" stroke="#eff3d8" strokeWidth="2" opacity=".8"/>
     <path d="M101 970H949" stroke="#5a876d" strokeWidth="3"/><path d="M102 974H948" stroke="#e6efd2" strokeWidth="2"/>
     <Screw x={115} y={423}/><Screw x={935} y={423}/><Screw x={115} y={1490}/><Screw x={935} y={1490}/>
     <Text x={779} y={528} size={91} face={SERIF}>01</Text><Text x={786} y={582} size={27}>价格工具</Text>
     <path d="M799 636v145m0 0l-19 -25m19 25l19 -25" fill="none" stroke={C.orange} strokeWidth="6" opacity={.4+.6*p(t,RATE,RATE+.4)}/>
     <Dial t={t}/>
     <Text x={144} y={1090} size={91} face={SERIF}>02</Text><Text x={149} y={1137} size={27}>规模工具</Text>
     <Ledger t={t}/>
     <path d="M151 1353h55m-55 16h55m-55 16h55m-55 16h55m-55 16h55" stroke="#4d7b65" strokeWidth="4"/>
    </g>
   </g>
   {detailRate&&<g><rect x="80" y="1468" width="920" height="107" rx="6" fill={C.ink}/><Text x={540} y={1538} size={48} fill={C.paper} anchor="middle">调低短期资金的价格</Text></g>}
   {detailBond&&<g><rect x="80" y="1468" width="920" height="107" rx="6" fill={C.ink}/><Text x={540} y={1538} size={48} fill={C.paper} anchor="middle">减少央行持有的证券</Text></g>}
   <path d="M80 1642H1000" stroke={C.ink} opacity=".3"/>
   {current&&<Text x={540} y={1720} size={50} anchor="middle">{current.text}</Text>}
   <Text y={1820} size={28} fill={C.muted}>机制示意 · 不代表某次会议的操作或实际数量</Text>
   <Text y={1870} size={25} fill={C.muted}>从《黄金暴跌复盘》中提炼 / 原创控制台模型</Text>
   <Text x={1000} y={1870} size={25} face={NUM} anchor="end" fill={C.muted}>01—02</Text>
   <rect width="1080" height="1920" fill="url(#grain)" pointerEvents="none"/>
  </svg>
 </AbsoluteFill>;
};
