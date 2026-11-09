import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp01, easeInOut, easeOut, keyframes, lerp} from './library/anim';
import {rotate, project, V3} from './library/redshift/theme';
import {makeCues} from './library/cues';
import timing from './timing.json';

const C={paper:'#f4f0e5', ink:'#102347', blue:'#234fe9', sky:'#8faaff', orange:'#f36b42', light:'#ffe0bb', muted:'#66718a'};
const CN='Vox Heavy', NUM='Vox Anton';
const p=(t:number,a:number,b:number)=>easeInOut(clamp01((t-a)/(b-a)));
const out=(t:number,a:number,b:number)=>easeOut(clamp01((t-a)/(b-a)));
const k=(t:number,arr:[number,number][])=>keyframes(t,arr);
const {cueAt}=makeCues(timing.cues,60);
type Tile={id:number;x:number;y:number;z:number;opacity?:number;orange?:boolean;scale?:number};
type Pose={cx:number;cy:number;zoom:number;ax:number;ay:number;az:number};
const base=(i:number):V3=>[(i%10-4.5)*58,(Math.floor(i/10)-4.5)*58,0];
const array=(n:number)=>Array.from({length:n},(_,i)=>{const [x,y,z]=base(i);return {id:i,x,y,z} as Tile;});
const point=(v:V3,pose:Pose)=>{const r=rotate(v,pose.ay,pose.ax,pose.az); const q=project(r,1850);return {x:pose.cx+q.x*pose.zoom,y:pose.cy+q.y*pose.zoom,z:r[2]};};
const points=(vs:V3[],pose:Pose)=>vs.map(v=>point(v,pose)).map(v=>`${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ');
const Txt:React.FC<{x?:number;y:number;size?:number;fill?:string;anchor?:'start'|'middle'|'end';num?:boolean;opacity?:number;children:React.ReactNode}>=({x=80,y,size=64,fill=C.ink,anchor='start',num=false,opacity=1,children})=><text x={x} y={y} fill={fill} fontSize={size} fontFamily={num?NUM:CN} textAnchor={anchor} opacity={opacity}>{children}</text>;

/** Each tile is one equal-value unit. Geometry and painter order reuse redshift transforms. */
const Blocks:React.FC<{tiles:Tile[];pose:Pose;slots?:number;slotAlpha?:number}>=({tiles,pose,slots=100,slotAlpha=.25})=>{
  const faces:{key:string;ps:V3[];z:number;fill:string;opacity:number}[]=[];
  for(const tile of tiles){
    const a=tile.opacity??1;if(a<.005)continue;
    const s=tile.scale??1,h=24*s,d=17*s;
    const v:V3[]=[[-h,-h,-d],[h,-h,-d],[h,h,-d],[-h,h,-d],[-h,-h,d],[h,-h,d],[h,h,d],[-h,h,d]].map(([x,y,z])=>[x+tile.x,y+tile.y,z+tile.z] as V3);
    const color=tile.orange?['url(#orange)',' #fdb88e','#ba3d27','#dc4d2c','#ffc89f','#c84c32']:['url(#blue)','#8da9ff','#1833a5','#163ac3','#a5b8ff','#2c47bd'];
    [[0,1,2,3],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0],[5,4,7,6]].forEach((ids,j)=>{
      const ps=ids.map(i=>v[i]);faces.push({key:`${tile.id}-${j}`,ps,z:ps.reduce((s,v)=>s+rotate(v,pose.ay,pose.ax,pose.az)[2],0)/4,fill:color[j].trim(),opacity:a});
    });
  }
  faces.sort((a,b)=>b.z-a.z);
  return <>
    <ellipse cx={pose.cx+20} cy={pose.cy+240*pose.zoom} rx={330*pose.zoom} ry={80*pose.zoom} fill="#193459" opacity=".12" filter="url(#shadow)"/>
    <g opacity={slotAlpha}>{Array.from({length:slots},(_,i)=>{const [x,y]=base(i);return <polygon key={i} points={points([[x-25,y-25,22],[x+25,y-25,22],[x+25,y+25,22],[x-25,y+25,22]],pose)} fill="none" stroke={C.ink} strokeWidth="1.8"/>;})}</g>
    {faces.map(face=><polygon key={face.key} points={points(face.ps,pose)} fill={face.fill} fillOpacity={face.opacity} stroke="#f8faff" strokeOpacity={face.opacity*.25} strokeWidth=".75" strokeLinejoin="round"/>)}
  </>;
};

const Pill:React.FC<{x:number;y:number;label:string;orange?:boolean;w?:number}>=({x,y,label,orange=false,w=270})=><g transform={`translate(${x} ${y})`}><rect width={w} height="72" rx="36" fill={orange?C.orange:C.ink}/><Txt x={w/2} y={49} size={34} anchor="middle" fill={C.paper}>{label}</Txt></g>;
const Formula:React.FC<{y?:number;children:React.ReactNode;opacity?:number}>=({y=1510,children,opacity=1})=><g opacity={opacity}><path d={`M82 ${y-75}H998`} stroke={C.ink} opacity=".18"/><Txt x={540} y={y} size={68} anchor="middle" num>{children}</Txt></g>;

const Gate:React.FC<{s:number;at:number;label:string;color:string;right?:boolean}>=({s,at,label,color,right})=>{
 const enter=out(s,at,at+.45),leave=p(s,4.9,5.6),x=right?760:290;
 return <g transform={`translate(${x+(1-enter)*(right?1000:-1000)-leave*1600} ${880+leave*160}) rotate(${right?14:-14}) scale(${1+leave*1.5})`} opacity={1-leave}>
   <path d="M-130 -260H130V260H-130Z" fill="none" stroke={color} strokeWidth="32"/>
   <path d="M-130 -260l40 -38h260v520l-40 38M130 -260l40 -38" fill="none" stroke={color} strokeWidth="9" opacity=".4"/>
   <rect x="-154" y="-112" width="308" height="190" fill={C.paper}/><Txt x={0} y={35} size={116} num anchor="middle" fill={color}>{label}</Txt>
 </g>;
};

function forward(s:number):Tile[]{
 return array(100).map(tile=>{
  const i=tile.id,c=i%10,r=Math.floor(i/10),right=c>=5;
  const e=out(s,.03+(r+c)*.014,.68+(r+c)*.014);
  tile.x+=Math.cos(i*2.3)*(1-e)*550;tile.y+=(1-e)*1000;tile.z-=(1-e)*300;
  tile.opacity=e;
  if(right){
    const loss=p(s,7.75+r*.025,9.05+r*.025);
    tile.orange=s>7.4&&s<9.5;
    tile.x+=loss*880;tile.y-=loss*180;tile.z-=Math.sin(loss*Math.PI)*250;
    tile.opacity*=1-p(loss,.7,1);
    if(r<5&&s>=13.9){
      const copy=p(s,14.05+r*.045,15.5+r*.045);
      const [x,y]=base(i);tile.x=x-290*(1-copy);tile.y=y-30*Math.sin(copy*Math.PI);tile.z=-180*Math.sin(copy*Math.PI);tile.opacity=out(copy,0,.15);tile.orange=true;
    }
  }else if(s>=11.0&&s<14.2){
    tile.orange=r<5&&s>=12.15;
    tile.z-=r<5?Math.sin(p(s,12.15,13.9)*Math.PI)*85:0;
  }
  return tile;
 });
}

const Forward:React.FC<{s:number}>=({s})=>{
 const question=s>=5.1&&s<7.6, lost=s>=9.4&&s<13.9, added=s>=15.7;
 const pose:Pose={cx:k(s,[[0,540],[5,540],[7.5,540],[12,540],[17,510]]),cy:k(s,[[0,1020],[1.5,1010],[6,990],[10,995],[13,1000],[18,1020]]),zoom:k(s,[[0,.85],[1.5,1.22],[6,1.18],[10,1.15],[13,1.23],[17,1.12]]),ax:k(s,[[0,-.65],[6,-.48],[10,-.2],[13,0],[17,-.17]]),ay:k(s,[[0,.20],[6,.15],[12,0],[17,.12]]),az:k(s,[[0,-.22],[6,-.10],[12,0],[17,-.08]])};
 let title=s<1.8?'给你100元':s<5.1?'涨跌各一半':question?'能回本吗？':s<11?'拿走一半':s<14.8?'现在的一半':s<17?'补回去':'少了25元';
 let digit=s<7.6?'100':s<9.4?'−50%':lost?'50':s<15.7?'+25':'75';
 return <>
   <Txt y={290} size={80}>{title}</Txt>
   <g transform={`translate(80 335)`}><text y="255" fontFamily={NUM} fontSize="300" fill={added?C.orange:C.blue}>{question?'?':digit}</text><text x={question?170:digit.length*145} y="250" fill={C.ink} fontSize="36" fontFamily={CN}>{question?'你的直觉怎么说':digit.includes('%')?'':'元'}</text></g>
   <Blocks tiles={forward(s)} pose={pose}/>
   <Gate s={s} at={1.85} label="−50%" color={C.blue}/><Gate s={s} at={3.45} label="+50%" color={C.orange} right/>
   {s>=9.5&&s<11&&<Pill x={392} y={1320} label="原来的 1/2"/>}
   {s>=11&&s<14.8&&<Formula>50 × 50% = <tspan fill={C.orange}>25</tspan></Formula>}
   {s>=14.8&&<Formula>100 − 50 + 25 = <tspan fill={C.orange}>75</tspan></Formula>}
   {s>=17.1&&<g opacity={out(s,17.1,17.5)}><path d="M755 1140Q920 1160 900 1300" fill="none" stroke={C.orange} strokeWidth="5"/><Txt x={880} y={1330} size={34} fill={C.orange} anchor="end">缺了整整 1/4</Txt></g>}
   {question&&<Formula y={1440}><tspan fill={C.blue}>−50%</tspan> → <tspan fill={C.orange}>+50%</tspan></Formula>}
 </>;
};

function reverse(s:number):Tile[]{
 return array(150).map(tile=>{
  const i=tile.id,r=Math.floor(i/10),c=i%10;
  if(r>=10){const e=p(s,21.05+(r-10)*.07,22.55+(r-10)*.07);tile.opacity=e;tile.y-=(1-e)*290;tile.z-=170*Math.sin(e*Math.PI);tile.orange=true;}
  if(c>=5){const loss=p(s,23.55+r*.025,25+r*.025);tile.x+=loss*800;tile.y+=loss*170;tile.z-=Math.sin(loss*Math.PI)*240;tile.opacity=(tile.opacity??1)*(1-p(loss,.7,1));}
  else {const m=p(s,26.25,27.15),j=r*5+c,di=j<50?Math.floor(j/5)*10+j%5:(Math.floor((j-50)/5)*10+5+j%5),[x,y]=base(di);tile.x=lerp(tile.x,x,m);tile.y=lerp(tile.y,y,m);}
  return tile;
 });
}
const settled75=()=>array(100).filter(a=>a.id%10<5||a.id<50).map(a=>({...a,orange:a.id%10>=5}));
const Reverse:React.FC<{s:number}>=({s})=>{
 const compare=p(s,26.4,27.6),pose:Pose={cx:540,cy:lerp(k(s,[[19.4,1010],[21,840],[23,840],[26,840]]),1350,compare),zoom:lerp(k(s,[[19.4,1.12],[21,.85],[23,.85],[26,.85]]),.72,compare),ax:lerp(-.35,0,compare),ay:lerp(-.15,0,compare),az:lerp(.08,0,compare)};
 return <>
  <Txt y={290} size={80}>{s<26.4?'反过来，会怎样？':'顺序换了'}</Txt>
  {s<26.4?<><Txt y={550} size={250} num fill={C.blue}>{s<21?'100':s<22.9?'+50%':s<23.55?'150':s<25.5?'−50%':'75'}</Txt><Pill x={740} y={510} label={s<23.55?'新增50':'减去75'} w={240} orange={s<23.55}/></>:<Txt y={425} size={86} fill={C.orange}>终点没变。</Txt>}
  <g opacity={compare}><Blocks tiles={settled75()} pose={{cx:540,cy:800,zoom:.72,ax:0,ay:0,az:0}}/><Txt y={545} size={42}>先跌后涨</Txt><Txt x={1000} y={545} anchor="end" size={56} num>100 → 50 → <tspan fill={C.orange}>75</tspan></Txt><Txt y={1105} size={42}>先涨后跌</Txt><Txt x={1000} y={1105} anchor="end" size={56} num>100 → 150 → <tspan fill={C.orange}>75</tspan></Txt></g>
  <Blocks tiles={reverse(s)} pose={pose} slots={s<21?100:s<26.4?150:100}/>
  {s<26.4&&<Formula>{s<23.6?'100 × 1.5 = 150':'150 × 0.5 = 75'}</Formula>}
 </>;
};

const Principle:React.FC<{s:number}>=({s})=>{
 const q=p(s,29.2,30.0),slide=p(s,31.2,32.2);
 return <>
  <Txt y={290} size={76}>百分比，站在哪里？</Txt>
  <g transform={`translate(540 805) rotate(${-7+slide*7}) scale(${.7+q*.3})`}>
   <rect x="-490" y="-330" width="980" height="570" rx="12" fill={C.blue}/>
   <text x="0" y="100" fontFamily={NUM} fontSize="420" textAnchor="middle" fill={C.paper}>50%</text>
   <path d="M-450 285H450M-450 270v30M450 270v30" stroke={C.ink} strokeWidth="4"/>
  </g>
  <Txt x={540} y={1260} anchor="middle" size={88}>谁的 50%？</Txt>
  <g opacity={slide}><Txt x={540} y={1420} anchor="middle" size={56} fill={C.blue}>每次，从当时的本金开始算</Txt></g>
 </>;
};

const Recovery:React.FC<{s:number}>=({s})=>{
 const tiles=array(100).map(tile=>{const c=tile.id%10,r=Math.floor(tile.id/10);if(c>=5){const e=p(s,36.35+r*.03,37.75+r*.03);tile.x-=290*(1-e);tile.z-=170*Math.sin(Math.PI*e);tile.opacity=e;tile.orange=true;}return tile;});
 const finish=p(s,38.0,39.0);
 return <>
  <Txt y={290} size={80}>亏一半，怎么回来？</Txt>
  <Txt y={580} num size={250} fill={C.blue}>{s<37.7?'50 → 100':'+100%'}</Txt>
  <Blocks tiles={tiles} pose={{cx:540,cy:1020,zoom:1.12,ax:lerp(-.3,0,finish),ay:0,az:lerp(-.08,0,finish)}}/>
  <Pill x={215} y={1360} label="现有 50" w={270}/><Pill x={595} y={1360} label="新增 50" w={270} orange/>
  <Formula y={1540}>50 ÷ 50 = <tspan fill={C.orange}>100%</tspan></Formula>
 </>;
};

const Conclusion:React.FC<{s:number}>=({s})=>{
 const first=array(100).map(a=>({...a,orange:a.id%10<5}));
 const second=array(100).filter(a=>a.id%10<5).map(a=>({...a,x:a.x+145,orange:a.id<50}));
 return <>
  <Txt y={290} size={76}>相同的百分比</Txt><Txt y={405} size={76} fill={C.blue}>不同的本金</Txt>
  <Blocks tiles={first} pose={{cx:415,cy:805,zoom:.85,ax:0,ay:0,az:0}}/>
  <Txt x={770} y={690} size={47} num>100 × 50%</Txt><Txt x={770} y={915} size={200} num fill={C.orange}>50</Txt>
  <path d="M80 1110H1000" stroke={C.ink} opacity=".2"/>
  <Blocks tiles={second} pose={{cx:415,cy:1360,zoom:.78,ax:0,ay:0,az:0}} slots={0}/>
  <Txt x={770} y={1230} size={47} num>50 × 50%</Txt><Txt x={770} y={1455} size={200} num fill={C.orange}>25</Txt>
  <g opacity={out(s,43.7,44.0)}><path d="M150 600H420M150 600v-20M420 600v-20" stroke={C.orange} strokeWidth="5"/></g>
 </>;
};

const Ending:React.FC<{s:number}>=({s})=>{
 const u=out(s,47.2,48.1),turn=p(s,49,51.5),tiles=array(25).map((a,i)=>({id:i,x:(i%5-2)*68,y:(Math.floor(i/5)-2)*68,z:0,orange:i>=15}));
 return <>
  <g transform={`translate(${(1-u)*-1100} 0)`}><Txt y={330} size={94}>看懂涨跌</Txt><Txt y={535} size={170} fill={C.blue}>先看本金。</Txt></g>
  <Blocks tiles={tiles} pose={{cx:540,cy:1000,zoom:1.6,ax:-.45,ay:-.15+turn*.3,az:-.20+turn*.1}} slots={0}/>
  <Txt x={540} y={1480} size={58} anchor="middle">消失的25元</Txt><Txt x={540} y={1550} size={32} anchor="middle" fill={C.muted}>一个关于复利的数字实验</Txt>
 </>;
};

export const Missing25:React.FC=()=>{
 const f=useCurrentFrame(),t=f/30,s=t<.6?t:(t-.6)/timing.scale+.6,cue=cueAt(f);
 const phase=s<19.45?0:s<29.15?1:s<33.8?2:s<41.2?3:s<47.15?4:5;
 const thresholds=[19.45,29.15,33.8,41.2,47.15];
 return <AbsoluteFill style={{background:C.paper,color:C.ink,fontFamily:CN}}>
  <svg width="1080" height="1920" viewBox="0 0 1080 1920">
   <defs><linearGradient id="blue" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#92acff"/><stop offset=".28" stopColor="#3d6cff"/><stop offset="1" stopColor="#173ec4"/></linearGradient><linearGradient id="orange" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffd4a7"/><stop offset=".36" stopColor="#ff9860"/><stop offset="1" stopColor="#de4f32"/></linearGradient><radialGradient id="paper"><stop stopColor="#fffcf2"/><stop offset="1" stopColor="#ebe6da"/></radialGradient><filter id="shadow" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="22"/></filter><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".65" fill="#143760" opacity=".07"/></pattern></defs>
   <rect width="1080" height="1920" fill="url(#paper)"/><rect width="1080" height="1920" fill="url(#dots)"/>
   <Txt y={110} size={27}>凯撒的复利实验室</Txt><Txt x={1000} y={110} anchor="end" size={27} num>COMPOUND / 001</Txt><path d="M80 150H1000" stroke={C.ink} strokeWidth="2" opacity=".25"/>
   <Txt y={208} size={22} fill={C.muted}>{['01 / 猜一猜','02 / 交换顺序','03 / 找到基数','04 / 回本的数学','05 / 放在一起看','06 / 消失的25元'][phase]}</Txt>
   {phase===0?<Forward s={s}/>:phase===1?<Reverse s={s}/>:phase===2?<Principle s={s}/>:phase===3?<Recovery s={s}/>:phase===4?<Conclusion s={s}/>:<Ending s={s}/>}
   {thresholds.map((at,i)=>{const u=clamp01((s-at+.20)/.40);if(u<=0||u>=1)return null;return <g key={at} transform={`translate(${-1800+u*4680} 960) rotate(-16)`}><rect x="-750" y="-1400" width="1500" height="2800" fill={i%2?C.blue:C.orange}/><text x="0" y="190" fontFamily={NUM} textAnchor="middle" fontSize="570" fill={C.paper}>{['50%','?','100%','50%','25'][i]}</text></g>;})}
   <path d="M80 1800H1000" stroke={C.ink} opacity=".15"/><path d={`M80 1800H${80+920*t/60}`} stroke={C.blue} strokeWidth="4"/>
   <Txt y={1850} size={23} fill={C.muted}>假设示例 · 无出入金 · 不计费用与税</Txt>
  </svg>
  {cue&&<div style={{position:'absolute',left:65,right:65,bottom:185,textAlign:'center',fontSize:cue.text.length>15?49:54,lineHeight:1.45,color:C.ink,textShadow:'0 1px 0 #fff'}}>{cue.text}</div>}
 </AbsoluteFill>;
};
