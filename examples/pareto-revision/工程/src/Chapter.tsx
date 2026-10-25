import React from 'react';
import {useCurrentFrame,interpolateColors} from 'remotion';
import timing from './timing.json';
import data from './content.generated.json';
import {Shell,Paper,ReceiptCard,CaptionLayer,Text,P,I,B,R,G,enter,mix,clamp,ease} from './PaperSystem';

const q=(i:number)=>timing.cues[i].start;
const cuts=()=>[0,q(1)-.15,q(2)-.15,q(3)-.15,q(4)-.15,q(6)-.15,q(9)-.15,q(11)-.15,q(13)-.15,q(14)-.15];
const pct=(v:number)=>`${Math.round(v*100)}%`;
const lines=[['二八法则，','真是一条定律吗？'],['土地的例子：','少数，拿走多数。'],['换成豌豆，','还是分布不均。'],['相似的比例，','不等于普遍规律。'],['先选模型，','再谈二八。'],['同样的20%，','答案可以变。'],['比例是结果，','不能反过来当原因。'],['再分一次，','需要再加一个条件。'],['比例相同，','内部也可能不同。'],['下次看到二八，','先问两个问题。']];
const tags=['先提出问题','原文举例 · 非新核验史料','原文举例 · 数量关系示意','从观察进入模型','帕累托 I 型 · α > 1','只改变一个参数','推导方向','同一比例继续成立时','原创离散示意','回到观察对象'];

function Opening({t}:{t:number}){return <>
 <ReceiptCard x={83} y={510} rotation={-5} title="观察对象" value="20%" label="一部分人" color={B} stamp="人群占比" progress={enter(t,.25,.65)}/>
 <ReceiptCard x={574} y={510} rotation={5} title="他们得到的份额" value="80%" label="大部分财富" color={R} stamp="结果占比" progress={enter(t,.85,.65)}/>
 <svg width="1080" height="1920" style={{position:'absolute'}}><path d="M490 790 Q540 720 590 790" fill="none" stroke={I} strokeWidth="5" pathLength="1" strokeDasharray="1" strokeDashoffset={1-enter(t,1.4,.7)}/></svg>
 <Text x={104} y={1230} size={59} style={{fontWeight:700,opacity:enter(t,2.7,.6)}}>观察到一次，</Text><Text x={104} y={1320} size={59} color={R} style={{fontWeight:800,opacity:enter(t,3.5,.65)}}>就能套用到所有地方？</Text>
 </>}

function CaseGrid({t,stage}:{t:number;stage:number}){
 const local=t-cuts()[stage],pea=stage===2;
 const p=pea?1:enter(local,.15,1.1),colored=Math.floor(80*p),morph=pea?enter(local,0,.7):0;
 return <Paper h={1110}>
 <Text x={44} y={40} size={25} color="#708083">{pea?'文章中的植株与产量':'文章中的人口与土地'} · 比例示意</Text>
 <div style={{position:'absolute',left:44,top:120,width:835,height:520,display:'grid',gridTemplateColumns:'repeat(10,1fr)',gap:10}}>
 {Array.from({length:100},(_,i)=><div key={i} style={{background:i<colored?interpolateColors(morph,[0,1],[R,G]):'#d9ded6',borderRadius:`${mix(5,50,morph)}%`,transform:`scale(${i<colored&&!pea?mix(.6,1,enter(local,.1+(i%10)*.035,.4)):1})`,boxShadow:i<colored?'inset 0 -3px 0 #00000010':'none'}}/>)}</div>
 <Text x={44} y={700} size={110} color={pea?G:R} style={{fontFamily:'Anton'}}>80%</Text>
 <Text x={335} y={740} size={39}>{pea?'产量':'土地'}</Text>
 <div style={{position:'absolute',left:50,top:873,width:800,height:3,background:'#112b3725'}}/>
 <Text x={44} y={925} size={37}>对应的{pea?'植株':'人口'}：</Text><Text x={600} y={892} size={100} color={B} style={{fontFamily:'Anton'}}>20%</Text>
 </Paper>;
}

function Observation({t}:{t:number}){const local=t-cuts()[3];return <>
 <ReceiptCard x={125} y={480} rotation={-7} title="土地" value="80/20" label="原文列举" color={R} stamp="观察" progress={1}/>
 <ReceiptCard x={550} y={590} rotation={6} title="豌豆" value="80/20" label="原文列举" color={G} stamp="观察" progress={enter(local,.1,.55)}/>
 <div style={{position:'absolute',left:90,top:1250,background:B,color:P,padding:'25px 40px',fontSize:51,fontWeight:750,transform:`rotate(${mix(-4,0,enter(local,.7,.6))}deg)`,opacity:enter(local,.7,.6)}}>两个例子 ≠ 普遍定律</div>
 </>}

function Distribution({t,stage}:{t:number;stage:number}){
 let a=data.values.alpha161;
 if(stage===5){a=mix(data.values.alpha161,1.5,enter(t,q(6)+.1,1.25));a=mix(a,2,enter(t,q(7)+.1,1.25));a=mix(a,data.values.alpha161,enter(t,q(8)+.5,2));}
 const share=Math.pow(.2,1-1/a),curve=Array.from({length:101},(_,i)=>{const u=i/100;return `${82+u*758},${700-(1-Math.pow(1-u,1-1/a))*390}`}).join(' ');
 const mark=1-share,d=enter(t,cuts()[4]+.25,1.0),readPoint=enter(t,q(5)+.4,1),complement=enter(t,q(5)+2.5,.8);
 return <Paper h={1120}>
 <Text x={45} y={37} size={26} color="#6b7e80">模型假设：帕累托 I 型分布</Text>
 <Text x={45} y={100} size={45}>尾指数 α</Text><Text x={500} y={72} size={100} color={B} style={{fontFamily:'Anton'}}>{a.toFixed(2)}</Text>
 <svg width="928" height="800" style={{position:'absolute',top:0,left:0}}>
 <path d="M82 280 V700 H860" stroke={I} strokeWidth="3" fill="none"/>
 <path d="M82 700 L840 310" stroke="#c9d1cd" strokeWidth="2" strokeDasharray="7 9"/>
 <polyline points={curve} fill="none" stroke={B} strokeWidth="8" pathLength="1" strokeDasharray="1" strokeDashoffset={1-d}/>
 <path d={`M688.4 700 V${700-mark*390} H82`} fill="none" stroke={B} strokeWidth="4" pathLength="1" strokeDasharray="1" strokeDashoffset={1-readPoint}/>
 <path d={`M688 ${700-mark*390} H840 V310`} fill="none" stroke={R} strokeWidth="4" strokeDasharray="8 7" opacity={complement}/>
 <circle cx={688.4} cy={700-mark*390} r="10" fill={R} opacity={readPoint}/>
 <text x="82" y="220" fontSize="32" fill={B} opacity={readPoint}>底部80%人口 → {pct(mark)}份额</text>
 <text x="82" y="760" fontSize="25" fill={I}>0</text><text x="610" y="760" fontSize="25" fill={R}>80% 的人口</text><text x="82" y="265" fontSize="25" fill={I}>累计份额</text>
 </svg>
 <div style={{position:'absolute',left:45,top:835,width:838,height:35,background:'#e4ddd0',borderRadius:30,overflow:'hidden'}}><div style={{width:`${share*100*complement}%`,height:'100%',background:R}}/></div>
 <Text x={45} y={920} size={34}>顶部 20% 的份额</Text><Text x={550} y={892} size={104} color={R} style={{fontFamily:'Anton',opacity:complement}}>{pct(share)}</Text>
 {stage===4&&<Text x={45} y={1060} size={23} color="#718080">这里的二八比例，是模型与参数共同给出的。</Text>}
 </Paper>;
}

function Direction({t}:{t:number}){const local=t-cuts()[6];return <Paper h={1100}>
 {['选定分布模型','代入参数 α','得到份额比例'].map((s,i)=>{const p=enter(local,.1+i*.75,.5);return <div key={s} style={{position:'absolute',left:65,top:80+i*246,width:795,height:160,background:i===2?B:'#f0ebdf',color:i===2?P:I,padding:'38px 35px',fontSize:49,fontWeight:750,opacity:p,transform:`translateX(${mix(55,0,p)}px)`}}><span style={{fontFamily:'Anton',color:i===2?'#a5b9ff':R,marginRight:32}}>{i+1}</span>{s}{i<2&&<div style={{position:'absolute',top:165,left:370,fontSize:55,color:B}}>↓</div>}</div>})}
 <Text x={65} y={900} size={42} color={R} style={{opacity:enter(t,q(10),.6),fontWeight:800}}>不能把结果，当作万能原因。</Text>
 </Paper>}

function Nested({t}:{t:number}){const local=t-cuts()[7],stage2=enter(t,q(12)+.7,1),p=enter(local,.6,1),q80=enter(local,3.2,1.2);
 return <Paper h={1150}>
 <Text x={45} y={40} size={28} color={R}>条件：同一比例继续成立</Text>
 <Text x={45} y={110} size={43}>份额：80% × 80%</Text>
 <div style={{position:'absolute',left:45,top:215,width:830,height:245,background:'#e4ddd0'}}>
  <div style={{width:`${80*p}%`,height:'100%',background:'#abc0f0'}}/>
  <div style={{position:'absolute',left:0,top:0,width:`${64*q80}%`,height:'100%',background:B,display:'grid',placeItems:'center',fontFamily:'Anton',fontSize:100,color:P}}><span style={{opacity:enter(local,4.4,.3)}}>64%</span></div>
 </div>
 <Text x={45} y={555} size={43}>人群：20% × 20%</Text>
 <Text x={45} y={475} size={29} color={B} style={{opacity:enter(local,1.6,.4)}}>先保留80%，再在这一段里选80%。</Text>
 <div style={{position:'absolute',left:45,top:665,width:830,height:260,display:'grid',gridTemplateColumns:'repeat(10,1fr)',gap:8}}>{Array.from({length:100},(_,i)=><div key={i} style={{background:i<4&&stage2>.02?R:i<20?'#bbc7df':'#e9e4d9',transform:`scale(${i<4?mix(1,1.16,stage2):1})`,borderRadius:3,opacity:i<4?1:mix(1,.7,stage2)}}/>)}</div>
 <Text x={45} y={1000} size={27}>100 格中选 20 格，再从中选 4 格。</Text><Text x={685} y={960} size={100} color={R} style={{fontFamily:'Anton',opacity:stage2}}>4%</Text>
 </Paper>}

function Counterexample({t}:{t:number}){const local=t-cuts()[8];return <Paper h={1100}>
 <Text x={45} y={45} size={29} color="#687c7f">原创示意 · 五组各占 20% 人口</Text>
 {[{label:'组合 A',v:[3,4,5,8,80],color:B},{label:'组合 B',v:[5,5,5,5,80],color:R}].map((r,j)=><div key={r.label} style={{position:'absolute',left:50,top:125+j*385,width:810,height:335,opacity:enter(local,j*.4,.5)}}>
 <div style={{fontSize:32,color:r.color}}>{r.label}</div><svg width="810" height="300" style={{position:'absolute',top:45}}>{r.v.map((v,i)=><g key={i}><rect x={i*160+20} y={260-v*2.7} width="105" height={v*2.7} rx="6" fill={r.color} opacity={i===4?1:.45}/><text x={i*160+73} y={250-v*2.7} textAnchor="middle" fontSize="28" fill={I}>{v}%</text></g>)}</svg></div>)}
 <Text x={45} y={970} size={41} style={{fontWeight:750}}>顶部都是 80%，内部并不相同。</Text>
 </Paper>}

function Closing({t}:{t:number}){const local=t-cuts()[9];return <>
 <ReceiptCard x={80} y={490} rotation={-5} title="先问对象" value="WHO?" label="分母究竟是谁" color={B} stamp="口径明确" progress={enter(local,0,.6)}/>
 <ReceiptCard x={575} y={540} rotation={5} title="再问分布" value="HOW?" label="差距怎样产生" color={R} stamp="模型有边界" progress={enter(local,.6,.6)}/>
 <Text x={105} y={1280} size={60} style={{fontWeight:800,opacity:enter(local,1.5,.8)}}>先看分布，</Text><Text x={105} y={1370} size={60} color={B} style={{fontWeight:800,opacity:enter(local,2.1,.7)}}>再谈二八。</Text>
 </>}

export const Chapter:React.FC<{captions?:boolean}>=({captions=true})=>{
 const t=useCurrentFrame()/timing.fps,starts=cuts();let k=0;for(let i=1;i<starts.length;i++)if(t>=starts[i])k=i;
 const scene=k===0?<Opening t={t}/>:k===1||k===2?<CaseGrid t={t} stage={k}/>:k===3?<Observation t={t}/>:k===4||k===5?<Distribution t={t} stage={k}/>:k===6?<Direction t={t}/>:k===7?<Nested t={t}/>:k===8?<Counterexample t={t}/>:<Closing t={t}/>;
 const incoming=k===0||k===2||k===5?1:enter(t,starts[k],.36);
 return <Shell number={k+1} tag={tags[k]} title={<>{lines[k][0]}<br/>{lines[k][1]}</>}>
 <div style={{position:'absolute',inset:0,opacity:incoming,transform:`translateY(${mix(24,0,incoming)}px)`}}>{scene}</div>
 <CaptionLayer subtitles={timing.subtitles} enabled={captions}/>
 </Shell>;
};
