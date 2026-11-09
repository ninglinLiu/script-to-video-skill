import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {clamp01,easeInOut,easeOut,keyframes} from './library/anim';
import {project,rotate,V3} from './library/redshift/theme';
import {Dial,Ledger} from './Mechanism';
import timing from './timing.json';

const C={paper:'#eee9da',ink:'#123c3b',mint:'#c3dfc9',orange:'#e8683d',gold:'#d5aa58',muted:'#537570',dark:'#092c2d'};
const CN='Vox Heavy',NUM='Vox Anton';
const p=(t:number,a:number,b:number)=>easeInOut(clamp01((t-a)/(b-a)));
const out=(t:number,a:number,d=.55)=>easeOut(clamp01((t-a)/d));
const q=(i:number)=>timing.cues[i].start;
const K=(t:number,ks:[number,number][])=>keyframes(t,ks);
type TxtProps={x?:number;y:number;size?:number;fill?:string;anchor?:'start'|'middle'|'end';face?:string;opacity?:number;children:React.ReactNode};
const T:React.FC<TxtProps>=({x=80,y,size=50,fill=C.ink,anchor='start',face=CN,opacity=1,children})=><text x={x} y={y} fontFamily={face} fontSize={size} fill={fill} textAnchor={anchor} opacity={opacity}>{children}</text>;
const Rule=({y=150}:{y?:number})=><path d={`M80 ${y}H1000`} stroke="currentColor" opacity=".3" strokeWidth="2"/>;
const Tag=({x=80,y,w=260,text,fill=C.ink,color=C.paper}:{x?:number;y:number;w?:number;text:string;fill?:string;color?:string})=><g><rect x={x} y={y} width={w} height="54" rx="3" fill={fill}/><T x={x+w/2} y={y+37} size={27} anchor="middle" fill={color}>{text}</T></g>;
const Arrow=({x,y,down=true,color=C.orange,scale=1}:{x:number;y:number;down?:boolean;color?:string;scale?:number})=><g transform={`translate(${x} ${y}) scale(${scale} ${down?scale:-scale})`}><path d="M0 -40V40M-19 20L0 40L19 20" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></g>;

const Defs=()=> <defs>
 <linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#eff2d9"/><stop offset=".3" stopColor="#bdd8c4"/><stop offset=".76" stopColor="#79a78f"/><stop offset="1" stopColor="#507f6c"/></linearGradient>
 <linearGradient id="rim" x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#f8edb9"/><stop offset=".25" stopColor="#8a9f7d"/><stop offset=".5" stopColor="#f7f0ca"/><stop offset=".7" stopColor="#7d9b78"/><stop offset="1" stopColor="#254f45"/></linearGradient>
 <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0b9"/><stop offset=".36" stopColor="#d1a567"/><stop offset=".60" stopColor="#fff4c7"/><stop offset="1" stopColor="#a06e37"/></linearGradient>
 <linearGradient id="goldFace" x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#ffedac"/><stop offset=".32" stopColor="#d4a34b"/><stop offset=".55" stopColor="#f7d582"/><stop offset="1" stopColor="#a97828"/></linearGradient>
 <linearGradient id="goldSide" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#6d491d"/><stop offset=".5" stopColor="#b58534"/><stop offset="1" stopColor="#ebbe67"/></linearGradient>
 <linearGradient id="tealBar" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#193f3b"/><stop offset=".55" stopColor="#4d8772"/><stop offset="1" stopColor="#234f47"/></linearGradient>
 <radialGradient id="ceramic" cx=".35" cy=".25"><stop stopColor="#fbfae7"/><stop offset=".75" stopColor="#d4e2c8"/><stop offset="1" stopColor="#afc7b1"/></radialGradient>
 <radialGradient id="paper"><stop stopColor="#faf6e9"/><stop offset="1" stopColor="#e1dfcc"/></radialGradient>
 <radialGradient id="night" cx=".65" cy=".42"><stop stopColor="#245852"/><stop offset="1" stopColor="#072527"/></radialGradient>
 <filter id="shadow" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="15"/></filter>
 <pattern id="grain" width="17" height="19" patternUnits="userSpaceOnUse"><circle cx="3" cy="6" r=".65" fill="#153c37" opacity=".11"/><circle cx="12" cy="14" r=".45" fill="#fff" opacity=".3"/></pattern>
 <pattern id="hatch" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M-4 4L4 -4M0 16L16 0M12 20L20 12" stroke="#ffe1af" strokeWidth="2" opacity=".4"/></pattern>
 <clipPath id="stage"><rect y="370" width="1080" height="1220"/></clipPath>
 </defs>;

// A single projected gold ingot survives all chapter changes. It is not a price chart.
const Gold=({t,x,y,s,rz=0}:{t:number;x:number;y:number;s:number;rz?:number})=>{
 const ay=-.24+.035*Math.sin(t*.7),ax=-.60+.025*Math.cos(t*.5),az=rz;
 const verts:V3[]=[[-215,-125,-48],[215,-125,-48],[215,125,-48],[-215,125,-48],[-246,-150,48],[246,-150,48],[246,150,48],[-246,150,48]];
 const ps=verts.map(v=>project(rotate(v,ay,ax,az),2000));
 const faces=[{v:[4,5,1,0],fill:'url(#goldSide)'},{v:[5,6,2,1],fill:'url(#goldSide)'},{v:[6,7,3,2],fill:'url(#goldSide)'},{v:[7,4,0,3],fill:'url(#goldSide)'},{v:[0,1,2,3],fill:'url(#goldFace)'}].sort((a,b)=>b.v.reduce((n,i)=>n+ps[i].z,0)-a.v.reduce((n,i)=>n+ps[i].z,0));
 const a=ps[0],b=ps[1],d=ps[3];
 return <g transform={`translate(${x} ${y}) scale(${s})`}>
  <ellipse cy="165" rx="255" ry="58" fill="#000" opacity=".19" filter="url(#shadow)"/>
  {faces.map((f,i)=><polygon key={i} points={f.v.map(j=>`${ps[j].x},${ps[j].y}`).join(' ')} fill={f.fill} stroke="#ffe6a6" strokeOpacity=".4" strokeWidth="2"/>)}
  <g transform={`matrix(${(b.x-a.x)/430} ${(b.y-a.y)/430} ${(d.x-a.x)/250} ${(d.y-a.y)/250} ${a.x} ${a.y})`}>
   <rect x="17" y="15" width="396" height="220" rx="16" fill="none" stroke="#704d1e" strokeOpacity=".35" strokeWidth="2"/>
   <T x={215} y={110} size={83} face={NUM} anchor="middle" fill="#77501d">Au</T>
   <T x={215} y={159} size={25} face={NUM} anchor="middle" fill="#79551f">FINE GOLD</T>
   <T x={215} y={205} size={29} face={NUM} anchor="middle" fill="#79551f">999.9</T>
  </g>
 </g>;
};

const Hook=({t}:{t:number})=>{
 const smash=out(t,q(2),.3);
 return <>
  <T y={307} size={117}>降息了。</T><T y={448} size={108}>黄金就该涨？</T>
  <g opacity={1-smash} transform={`translate(${-smash*160} ${smash*90}) rotate(${-smash*18} 540 680)`}><path d="M215 730H865M790 655L865 730L790 805" stroke={C.orange} strokeWidth="25" fill="none"/><Tag x={320} y={610} w={440} text="一条直线，就够了吗？"/></g>
  <g opacity={smash}><T y={690} x={540} size={187} face={NUM} anchor="middle" fill={C.orange}>3</T><T x={540} y={758} size={44} anchor="middle">道传导，藏在中间。</T></g>
  <ellipse cx="540" cy="1128" rx="375" ry="100" fill="none" stroke={C.gold} strokeWidth="2"/>
  {['实际利率','美元','预期差'].map((s,i)=><g key={s} opacity={out(t,2.8+i*.14,.4)} transform={`translate(${210+i*330} ${1350+40*(1-out(t,2.8+i*.14,.4))})`}><circle r="24" cy="-72" fill={C.orange}/><T x={0} y={0} size={42} anchor="middle">{s}</T></g>)}
 </>;
};

const Tools=({t}:{t:number})=>{
 const a=q(5),b=q(6),c=q(9);
 const zoom=K(t,[[4.439,1.02],[5.8,.87],[a-.28,.87],[a+.35,1.29],[b-.18,1.29],[b+.42,1.25],[c-.25,1.25],[c+.45,.87],[19.83,.87]]);
 const cx=K(t,[[4.439,540],[a-.28,540],[a+.35,404],[b-.18,404],[b+.42,610],[c-.25,610],[c+.45,540]]);
 const cy=K(t,[[4.439,963],[a-.28,963],[a+.35,750],[b-.18,750],[b+.42,1260],[c-.25,1260],[c+.45,963]]);
 const dialT=3.2375+3.7*p(t,a,a+.85),ledgerT=5.70+1.5*p(t,q(7),q(8)+.75);
 return <>
 <T y={270} size={89}>降息 <tspan fill={C.orange}>×</tspan> 缩表</T>
 <T y={337} size={34}>{t<a?'原文中的政策设想 · 2026 年 1 月':t<b?'调低短期政策利率':t<c?'到期本金，部分不再投资':'资金价格 ≠ 央行账本规模'}</T>
 <g clipPath="url(#stage)"><g transform={`translate(540 985) scale(${zoom}) translate(${-cx} ${-cy})`}>
 <rect x="85" y="405" width="910" height="1160" rx="68" fill="#284e41" opacity=".24" filter="url(#shadow)"/>
 <rect x="70" y="378" width="910" height="1160" rx="68" fill="url(#body)" stroke="#618c71" strokeWidth="3"/>
 <rect x="87" y="395" width="876" height="1126" rx="57" fill="none" stroke="#eff3d8" strokeWidth="2"/>
 <path d="M101 970H949" stroke="#5a876d" strokeWidth="3"/><path d="M102 974H948" stroke="#e6efd2" strokeWidth="2"/>
 <T x={770} y={533} size={87} face={NUM}>01</T><T x={775} y={588} size={28}>价格</T><Dial t={dialT}/>
 <T x={144} y={1090} size={87} face={NUM}>02</T><T x={149} y={1145} size={28}>规模</T><Ledger t={ledgerT}/>
 {[110,940].map(x=>[420,1490].map(y=><g key={`${x}-${y}`}><circle cx={x} cy={y} r="12" fill="url(#metal)"/><path d={`M${x-5} ${y+5}l10 -10`} stroke={C.ink} strokeWidth="2"/></g>))}
 </g></g>
 {t>=c&&<g opacity={out(t,c,.45)}><Tag y={1485} x={214} w={652} text="可以同时调整，但不是同一个旋钮" fill={C.orange}/></g>}
 </>;
};

const Coupon=({x,y,a=1}:{x:number;y:number;a?:number})=><g opacity={a} transform={`translate(${x} ${y}) rotate(-7)`}><rect width="210" height="107" rx="7" fill="url(#metal)" stroke="#f7dda0" strokeWidth="3"/><T x={105} y={67} size={35} anchor="middle">利息</T><path d="M25 15V92M185 15V92" stroke="#94703b" strokeDasharray="5 5"/></g>;
const Opportunity=({t}:{t:number})=><>
 <T y={276} size={97} fill={C.paper}>持有黄金，</T><T y={392} size={97} fill={C.paper}>你放弃了什么？</T>
 <Tag y={462} w={306} text="01 / 实际利率" fill={C.gold} color={C.ink}/>
 <path d="M540 690V1360" stroke={C.mint} opacity=".25" strokeDasharray="6 12"/>
 <T x={293} y={1210} size={51} fill={C.paper} anchor="middle">不付利息</T><T x={293} y={1264} size={28} fill={C.mint} anchor="middle">但金价会波动</T>
 <g transform={`translate(650 ${780+20*(1-out(t,q(13)))})`}><rect width="250" height="350" rx="7" fill={C.paper}/><rect x="18" y="18" width="214" height="66" fill={C.ink}/><T x={125} y={62} size={31} fill={C.paper} anchor="middle">付息资产</T><path d="M25 124H225M25 150H225M25 176H175" stroke={C.muted} strokeWidth="4"/><T x={125} y={285} size={92} face={NUM} anchor="middle">%</T></g>
 {[0,1,2].map(i=>{const u=out(t,q(13)+i*.32,.6);return <Coupon key={i} x={650+60*u} y={990-210*u+i*107} a={u}/>;})}
 <T x={790} y={1264} size={34} fill={C.mint} anchor="middle">可能获得利息</T>
 <g opacity={out(t,q(14),.4)}><path d="M280 1390H800" stroke={C.gold} strokeWidth="3"/><T x={540} y={1478} size={65} anchor="middle" fill={C.gold}>这就是机会成本</T></g>
 </>;

const Stack=({x,n,inf,real,showReal,label}:{x:number;n:number;inf:number;real:number;showReal:number;label:string})=>{
 const w=190,h=110,base=1280,top=base-n*h,split=base-inf*h;
 return <g>
  <ellipse cx={x+109} cy={base+31} rx="132" ry="29" fill={C.ink} opacity=".15" filter="url(#shadow)"/>
  <path d={`M${x+w} ${top}l25 -20V${base-20}l-25 20Z`} fill="#4a6150"/>
  <path d={`M${x} ${top}l25 -20h${w}l-25 20Z`} fill="#e7d49c"/>
  <rect x={x} y={top} width={w} height={n*h} fill="url(#tealBar)" stroke="#385f4d" strokeWidth="2"/>
  <rect x={x} y={top} width={w} height={Math.max(0,(n-inf)*h)} fill="url(#goldFace)" opacity={showReal}/>
  <rect x={x} y={split} width={w} height={inf*h} fill={C.orange}/><rect x={x} y={split} width={w} height={inf*h} fill="url(#hatch)"/>
  <path d={`M${x} ${split}h${w}`} stroke={C.paper} strokeWidth="3"/>
  <T x={x+w/2} y={top-42} size={78} anchor="middle" face={NUM}>{n.toFixed(0)}%</T>
  <T x={x+w/2} y={split+inf*h/2+16} size={inf<1.3?37:44} anchor="middle" fill="#fff4d9">{inf.toFixed(0)}%</T>
  <g opacity={showReal}><T x={x+w/2} y={(top+split)/2+23} size={64} anchor="middle" face={NUM}>{real.toFixed(0)}%</T></g>
  <T x={x+w/2} y={1354} size={34} anchor="middle">{label}</T>
 </g>;
};
const Example=({t}:{t:number})=>{
 const nom=5-p(t,q(17),q(17)+.95),inf=3-2*p(t,q(19),q(19)+.95),show=out(t,q(20),.65),read=out(t,q(21),.7);
 return <>
 <T y={268} size={77}>名义降了。</T><T y={366} size={77}>实际利率却可能升。</T>
 <Tag y={425} w={478} text="原创假设 · 均为一年期"/>
 <g transform="translate(80 555)"><rect width="20" height="20" fill={C.orange}/><T x={34} y={22} size={28}>预期通胀</T><rect x="240" width="20" height="20" fill={C.gold}/><T x={274} y={22} size={28}>实际利率（近似）</T></g>
 {[0,1,2,3,4,5].map(v=><g key={v} opacity=".24"><path d={`M120 ${1280-v*110}H960`} stroke={C.ink} strokeWidth="1" strokeDasharray="3 9"/><T x={105} y={1288-v*110} size={22} face={NUM} anchor="end">{v}</T></g>)}
 <Stack x={225} n={5} inf={3} real={2} showReal={show} label="原先"/>
 <Stack x={677} n={nom} inf={inf} real={nom-inf} showReal={show} label="变化后"/>
 <g opacity={out(t,q(17),.3)}><Arrow x={937} y={810} down/><T x={940} y={885} size={25} anchor="middle">名义</T></g>
 <g opacity={out(t,q(19),.3)}><Arrow x={937} y={1130} down/><T x={940} y={1206} size={25} anchor="middle">通胀</T></g>
 <g opacity={read}><path d="M420 995H640" stroke={C.orange} strokeDasharray="8 7" strokeWidth="3"/><Arrow x={550} y={965} down={false}/><T x={540} y={1110} size={33} anchor="middle" fill={C.orange}>实际 ↑</T></g>
 <g opacity={show}><T x={320} y={1460} size={58} face={NUM} anchor="middle">5% − 3% ≈ 2%</T><T x={770} y={1460} size={58} face={NUM} anchor="middle">4% − 1% ≈ 3%</T></g>
 <g opacity={out(t,q(22),.4)}><T x={540} y={1550} size={40} anchor="middle">名义收益率 − 预期通胀 ≈ 实际利率</T></g>
 </>;
};

const Curve=({t}:{t:number})=>{
 const move=p(t,q(25),q(25)+1.1),fan=out(t,q(26),.8),f=out(t,q(27),.5);
 const y=870+move*220;
 return <>
 <T y={272} size={86}>一个短端，</T><T y={382} size={86}>不是整条曲线。</T>
 <Tag y={448} w={377} text="期限传导 · 概念示意"/>
 <path d="M150 1220H960M150 1220V650" stroke={C.ink} strokeWidth="3"/>
 <T x={132} y={628} size={27}>收益率</T><T x={960} y={1280} size={30} anchor="end">期限 →</T>
 <path d="M190 870C410 850 630 770 920 750" fill="none" stroke={C.muted} strokeWidth="5" strokeDasharray="12 13" opacity=".5"/>
 <path d={`M190 ${y}C400 ${y-5} 570 770 920 750`} fill="none" stroke={C.orange} strokeWidth="10" strokeLinecap="round"/>
 <circle cx="190" cy={y} r="21" fill={C.orange} stroke={C.paper} strokeWidth="5"/>
 <g opacity={fan}><path d={`M500 905Q730 720 920 640M500 905Q710 890 920 915`} fill="none" stroke={C.muted} strokeWidth="3" strokeDasharray="9 10"/><path d="M500 905Q730 720 920 640L920 915Q710 890 500 905Z" fill={C.mint} opacity=".4"/><circle cx="920" cy="750" r="18" fill={C.ink}/><T x={920} y={590} size={35} anchor="end">长端方向并不确定</T></g>
 <T x={180} y={1327} size={38}>短期政策利率</T>
 <g opacity={f}>{['未来利率','通胀预期','期限风险'].map((s,i)=><g key={s} transform={`translate(${80+i*315} ${1420+35*(1-out(t,q(27)+i*.25,.5))})`}><rect width="290" height="85" fill={i===1?C.orange:C.ink} rx="4"/><T x={145} y={56} size={37} anchor="middle" fill={C.paper}>{s}</T></g>)}</g>
 </>;
};

const Dollar=({t}:{t:number})=>{
 const up=p(t,q(32),q(32)+.8),more=out(t,q(33),.7);
 return <>
 <T y={270} size={95} fill={C.paper}>美元变贵，</T><T y={385} size={95} fill={C.paper}>谁付得更多？</T>
 <Tag y={448} w={280} text="02 / 美元" fill={C.gold} color={C.ink}/>
 <ellipse cx="540" cy="1035" rx="365" ry="242" fill="none" stroke={C.gold} opacity=".4" strokeWidth="2"/>
 <Tag x={350} y={642} w={380} text="同样一盎司 · 1 oz" fill={C.paper} color={C.ink}/>
 <g opacity={out(t,q(31),.4)}><path d="M540 1110V1210" stroke={C.gold} strokeWidth="3"/><T x={540} y={1265} size={46} anchor="middle" fill={C.paper}>美元报价不变</T></g>
 <g transform={`translate(190 ${1040-150*up})`}><circle r="80" fill="url(#goldFace)" stroke={C.gold} strokeWidth="5"/><T x={0} y={36} size={98} anchor="middle" face={NUM}>$</T></g>
 <g opacity={up}><Arrow x={190} y={695} down={false} color={C.gold}/><T x={190} y={1170} size={35} anchor="middle" fill={C.gold}>美元升值</T></g>
 {[0,1,2,3,4].map(i=>{const a=i<2?1:more;return <g key={i} opacity={a} transform={`translate(${835+(i%2)*18} ${1090-i*45-50*more})`}><ellipse rx="78" ry="26" fill="#5e9483"/><path d="M-78 0V14A78 26 0 0 0 78 14V0" fill="#416c60"/><ellipse rx="78" ry="26" fill={C.mint} stroke="#e5edcd" strokeWidth="2"/></g>;})}
 <g opacity={more}><T x={850} y={1170} size={35} anchor="middle" fill={C.mint}>本币支出 ↑</T><path d="M190 1370H890" stroke={C.gold} strokeWidth="3"/><T x={540} y={1460} size={51} anchor="middle" fill={C.paper}>汇率，改变买入的门槛。</T></g>
 </>;
};

const Expectation=({t}:{t:number})=>{
 const expected=out(t,q(35),1),actual=out(t,q(36),.65),gap=out(t,q(38),.5);
 return <>
 <T y={270} size={89}>都叫降息。</T><T y={380} size={89}>差别在预期。</T><Tag y={446} w={418} text="03 / 预期差 · 原创假设"/>
 <T x={320} y={650} size={43} anchor="middle">原本押注</T><T x={763} y={650} size={43} anchor="middle">实际落地</T>
 <path d="M155 742H925" stroke={C.ink} strokeWidth="3"/>
 <T x={100} y={755} size={31} face={NUM}>0</T>
 {[25,50].map(v=><g key={v}><path d={`M155 ${742+v*8.5}H925`} stroke={C.ink} opacity=".2" strokeDasharray="5 9"/><T x={100} y={755+v*8.5} size={28} face={NUM}>−{v}</T></g>)}
 <path d={`M320 742V${742+425*expected}`} stroke={C.ink} strokeWidth="150"/>
 <path d={`M763 742V${742+212.5*actual}`} stroke={C.orange} strokeWidth="150"/>
 <g opacity={expected}><T x={320} y={1263} size={103} face={NUM} anchor="middle">−50<tspan fontSize="40">bp</tspan></T></g>
 <g opacity={actual}><T x={763} y={1050} size={103} face={NUM} anchor="middle" fill={C.orange}>−25<tspan fontSize="40">bp</tspan></T></g>
 <g opacity={gap}><path d="M580 955H610M600 955V1167M580 1167H610" fill="none" stroke={C.orange} strokeWidth="4"/><T x={535} y={1075} size={49} face={NUM} anchor="middle" fill={C.orange}>25</T><T x={535} y={1118} size={25} anchor="middle" fill={C.orange}>bp 落差</T><Tag x={180} y={1390} w={720} text="降息已经发生，宽松仍可能少于预期" fill={C.orange}/></g>
 <T y={1520} size={28} fill={C.muted}>1 个基点 = 0.01 个百分点；此处不对应实际会议。</T>
 </>;
};

const End=({t}:{t:number})=>{
 const all=out(t,q(45),.7),resolve=out(t,q(46),.6);
 const factors=[{s:'实际利率',x:250,y:660,c:42},{s:'美元',x:830,y:740,c:43},{s:'预期差',x:470,y:1250,c:44}];
 return <>
 <T y={275} size={88} fill={C.paper}>别只盯降息。</T><T y={380} size={88} fill={C.paper}>看它怎样传导。</T>
 <g transform={`rotate(${(t-71.13)*.7} 540 940)`}><ellipse cx="540" cy="940" rx="370" ry="320" fill="none" stroke={C.gold} strokeWidth="2" opacity=".35"/><ellipse cx="540" cy="940" rx="410" ry="190" fill="none" stroke={C.mint} strokeWidth="2" opacity=".25"/></g>
 {factors.map(({s,x,y,c},i)=>{const a=out(t,q(c)-.15,.5);return <g key={s} opacity={a} transform={`translate(${x} ${y+30*(1-a)})`}><path d={`M0 0L${540-x} ${940-y}`} stroke={C.gold} strokeWidth="2" strokeDasharray="5 8" opacity=".8"/><circle r="105" fill={i===1?C.orange:C.mint}/><T x={0} y={15} size={39} anchor="middle">{s}</T></g>;})}
 <g opacity={all}><Tag x={80} y={1360} w={337} text="央行购金" fill={C.gold}/><Tag x={663} y={1360} w={337} text="避险需求" fill={C.gold}/><path d="M248 1360L405 1110M832 1360L690 1110" stroke={C.gold} strokeWidth="3"/></g>
 <g opacity={resolve}><rect x="80" y="1470" width="920" height="91" fill={C.paper}/><T x={540} y={1532} size={50} anchor="middle">影响方向 <tspan fill={C.orange}>≠</tspan> 保证涨跌</T></g>
 </>;
};

function hero(t:number){
 const states:[number,number,number,number,number][]=[
 [0,540,1060,1.28,-.25],[2.65,540,1060,1.17,-.14],[4.10,540,1060,1.17,-.14],[4.84,907,272,.17,.12],
 [19.35,907,272,.17,.12],[20.35,285,1000,.79,-.24],[27.15,285,1000,.79,-.24],[28.0,920,293,.18,-.1],
 [43.05,920,293,.18,-.1],[44.0,895,275,.18,.1],[51.95,895,275,.18,.1],[53.0,540,960,1.0,-.15],
 [59.66,540,960,1.0,-.15],[60.7,908,285,.18,.1],[70.7,908,285,.18,.1],[71.9,540,940,.78,-.17],[84.633,540,940,.84,-.1]];
 return {x:K(t,states.map(s=>[s[0],s[1]])),y:K(t,states.map(s=>[s[0],s[2]])),s:K(t,states.map(s=>[s[0],s[3]])),rz:K(t,states.map(s=>[s[0],s[4]]))};
}
function lines(text:string){
 if(text.length<=18)return [text];
 const choices=[...text].map((c,i)=>'，；：、'.includes(c)?i+1:-1).filter(i=>i>=7&&i<=18&&text.length-i<=18);
 const split=choices.length?choices.reduce((a,b)=>Math.abs(a-text.length/2)<Math.abs(b-text.length/2)?a:b):Math.ceil(text.length/2);
 return [text.slice(0,split),text.slice(split)];
}

export const FullFilm:React.FC=()=>{
 const t=useCurrentFrame()/30,idx=Math.max(0,timing.chapters.findIndex(ch=>t>=ch.start&&t<ch.end)),id=timing.chapters[idx].id;
 const dark=['opportunity','dollar','end'].includes(id),fg=dark?C.paper:C.ink;
 const sub=timing.subtitles.find(c=>t>=c.start&&t<c.end+.07);
 const source=id==='tools'?'原文政策设想 / 2026.01 · 联储操作机制':id==='example'?'原创假设 · 同期限 · 实际利率为近似计算':id==='expectation'?'原创假设 · 并非实际会议或交易建议':id==='curve'?'概念示意 · 不表示实际收益率曲线':id==='dollar'?'换算示意 · 假设美元报价不变':'机制解释 · 影响因素不构成确定的价格预测';
 return <AbsoluteFill style={{background:dark?C.dark:C.paper,fontFamily:CN}}><svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{color:fg}}>
 <Defs/><rect width="1080" height="1920" fill={dark?'url(#night)':'url(#paper)'}/>
 <T y={120} size={27} fill={fg}>凯撒的复利实验室</T><T x={1000} y={120} size={27} face={NUM} anchor="end" fill={fg}>GOLD / TRANSMISSION</T><Rule/>
 {id==='hook'?<Hook t={t}/>:id==='tools'?<Tools t={t}/>:id==='opportunity'?<Opportunity t={t}/>:id==='example'?<Example t={t}/>:id==='curve'?<Curve t={t}/>:id==='dollar'?<Dollar t={t}/>:id==='expectation'?<Expectation t={t}/>:<End t={t}/>}
 <Gold t={t} {...hero(t)}/>
 <Rule y={1633}/>
 {sub&&lines(sub.text).map((s,i,a)=><T key={i} x={540} y={a.length===1?1732:1694+i*64} size={47} anchor="middle" fill={fg}>{s}</T>)}
 <T y={1827} size={26} fill={dark?C.mint:C.muted}>{source}</T>
 <T y={1875} size={24} fill={dark?C.mint:C.muted}>改编自《黄金暴跌复盘》 · 机制篇</T><T x={1000} y={1875} size={26} face={NUM} anchor="end" fill={fg}>{String(idx+1).padStart(2,'0')} / 08</T>
 <rect x="80" y="1900" width="920" height="3" fill={fg} opacity=".15"/><rect x="80" y="1900" width={920*t/timing.seconds} height="3" fill={C.orange}/>
 <rect width="1080" height="1920" fill="url(#grain)" pointerEvents="none"/>
 </svg></AbsoluteFill>;
};
