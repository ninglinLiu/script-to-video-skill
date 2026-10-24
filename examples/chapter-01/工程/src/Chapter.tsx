import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import timing from './timing.json';
import './style.css';

const P='#F5EFDE', I='#112B37', B='#174ACC', R='#EF643E', G='#167D6A';
export const facts={costA:100,costB:40,current:60,loss:(60-100)/100,recovery:(100-60)/60};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{v=clamp(v);return v*v*v*(v*(v*6-15)+10)};
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const ch=timing.chapters;
const q=(c:number,n:number)=>timing.cues[ch[c].cueStart+n].start;
const enter=(t:number,s:number,d=.7)=>ease((t-s)/d);
function phase(t:number){let i=0;for(let k=1;k<ch.length;k++)if(t>=ch[k].start)i=k;return i;}
function Key({children,top=112,left=120,color=I}:React.PropsWithChildren<{top?:number;left?:number;color?:string}>){return <div className="kicker" style={{top,left,color}}>{children}</div>}
function T({children,x,y,size=48,color=I,serif=false,style={}}:React.PropsWithChildren<{x:number;y:number;size?:number;color?:string;serif?:boolean;style?:React.CSSProperties}>){return <div style={{position:'absolute',left:x,top:y,fontSize:size,color,fontFamily:serif?'Serif':'Sans',...style}}>{children}</div>}
function Rule({x,y,w,color=I,opacity=.2}: {x:number;y:number;w:number;color?:string;opacity?:number}){return <div style={{position:'absolute',left:x,top:y,width:w,height:2,background:color,opacity}}/>}
function Receipt({kind,t,phaseIndex}:{kind:'A'|'B';t:number;phaseIndex:number}){
 const isA=kind==='A';
 const states=isA?[[560,530,-7,1,1],[350,410,-11,.54,.6],[255,420,-8,.43,.6],[320,590,-8,.52,0],[450,470,-3,1.08,1],[475,490,-3,.85,1],[380,430,-7,.68,1]]:[[1360,530,7,1,1],[1570,410,11,.54,.6],[1680,260,8,.38,0],[1680,260,8,.38,0],[1680,260,8,.38,0],[1445,490,4,.85,1],[1570,430,7,.68,.4]];
 const k=phaseIndex,pr=enter(t,ch[k].start,.95),a=states[Math.max(0,k-1)],b=states[k];
 const st=b.map((v,j)=>mix(a[j],v,k===0?1:pr));
 if(k===5)st[1]+=80*Math.sin(pr*Math.PI);
 const intro=enter(t,isA?q(0,2)-.35:q(0,3)-.3,.8);
 const flip=isA&&k===4?180*enter(t,ch[4].start,.95):isA&&k===5?180*(1-enter(t,ch[5].start,.95)):0;
 const back=flip>90;
 const stamp=enter(t,isA?q(0,4):q(0,6),.45);
 return <div style={{position:'absolute',left:st[0],top:st[1],opacity:st[4]*intro,transform:`translate(-50%,-50%) rotate(${st[2]}deg) scale(${st[3]})`,width:420,height:540,perspective:1400}}>
  <div className="receipt" style={{transform:`rotateY(${back?flip-180:flip}deg)`}}>
   <div className="receipt-top">{isA?'A / 甲的账单':'B / 乙的账单'}<span>01 SHARE</span></div>
   <div style={{marginTop:26,fontSize:20,letterSpacing:4,color:'#718080'}}>{back?'我的持有依据':'历史买入价 · 每股'}</div>
   {back?<div style={{fontSize:33,lineHeight:1.8,marginTop:22}}><span style={{color:B}}>原判断</span><br/><span style={{opacity:enter(t,q(4,2),.65)}}>新证据进入</span><br/><span style={{color:'#a3aaa8',position:'relative',display:'inline-block'}}>旧理由<i style={{position:'absolute',left:0,top:'52%',height:3,width:`${enter(t,q(4,4),.7)*100}%`,background:R}}/></span><br/><strong style={{opacity:enter(t,q(4,4),.7)}}>哪些需要更新？</strong></div>:<>
    <div style={{fontFamily:'Anton',fontSize:135,lineHeight:1.2,marginTop:10}}><span style={{fontSize:40,fontFamily:'Sans'}}>¥</span>{isA?facts.costA:facts.costB}</div>
    <div className="receipt-dash"/><div style={{fontSize:24,display:'flex',justifyContent:'space-between'}}><span>当前价格</span><b>¥60</b></div>
    <div style={{fontSize:24,display:'flex',justifyContent:'space-between',marginTop:15}}><span>账面变化</span><strong style={{color:isA?R:B}}>{isA?'−40 元':'+20 元'}</strong></div>
    <div className="stamp" style={{borderColor:isA?R:B,color:isA?R:B,opacity:stamp,transform:`rotate(${isA?-5:3}deg) scale(${mix(1.35,1,stamp)})`}}>{isA?'等回本再卖':'先落袋为安'}</div>
   </>}
   <div className="barcode">{Array.from({length:46},(_,i)=><i key={i} style={{width:i%3===0?4:2,marginRight:i%4===0?4:2}}/>)}</div>
  </div>
 </div>
}
function Price({t,k}:{t:number;k:number}){
 const states=[[960,500,1,1],[960,490,1,1],[550,680,.65,1],[530,680,.45,0],[960,800,.5,0],[960,760,.67,1],[960,560,1,1]];
 const p=enter(t,ch[k].start,.95),a=states[Math.max(0,k-1)],b=states[k],s=b.map((v,j)=>mix(a[j],v,k===0?1:p));
 return <div style={{position:'absolute',left:s[0],top:s[1],opacity:s[3]*enter(t,.1,.65),transform:`translate(-50%,-50%) scale(${s[2]})`,width:260,height:260,borderRadius:'50%',background:B,color:P,boxShadow:'0 26px 65px #122f5930',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}}><div style={{fontSize:19,letterSpacing:5}}>同一资产 · 现价</div><div style={{fontSize:130,lineHeight:1.15,fontFamily:'Anton'}}>60<span style={{fontSize:25,fontFamily:'Sans'}}>元</span></div></div>
}
function Accounts({t}:{t:number}){const late=enter(t,q(0,8),.65);return <>
 <Key>01 / 两张账单，一个价格</Key>
 <T x={120} y={166} size={70} serif>回本以后，什么会改变？</T>
 <T x={120} y={850} size={27} color="#637575">原创假设 · 同一股票 · 每股金额 · 暂不计税费</T>
 <div style={{position:'absolute',left:1300,top:845,width:440,height:62,background:R,color:P,display:'grid',placeItems:'center',fontSize:27,opacity:late,transform:`translateY(${mix(25,0,late)}px)`}}>变的是账单，还是资产？</div>
 </>}
function Future({t}:{t:number}){
 const p=enter(t,q(1,2),1.1),a=enter(t,q(1,5),.5);
 return <><Key>02 / 从今天出发</Key><T x={120} y={166} size={68} serif>把过去，往后推。</T>
 <svg width="1920" height="1080" style={{position:'absolute',left:0,top:0}}>
  <path d="M960 620 C960 700 690 685 600 770" fill="none" stroke={B} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1-p}/>
  <path d="M960 620 C960 700 1230 685 1320 770" fill="none" stroke={R} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1-p}/>
 </svg>
 <T x={430} y={765} size={42} color={B} style={{opacity:p}}>涨到 72 → 每股 +12</T>
 <T x={1100} y={765} size={42} color={R} style={{opacity:p}}>跌到 48 → 每股 −12</T>
 <T x={680} y={852} size={24} color="#61757b" style={{opacity:p}}>同一情景下，甲与乙从今天起的每股变化相同</T>
 <div style={{position:'absolute',left:1000,top:178,opacity:a,fontSize:23,color:'#677c80',lineHeight:1.7}}>情景演示，不代表预测<br/>股数及其他条件相同，仅买入价不同</div>
 </>}
function Recovery({t}:{t:number}){
 const down=enter(t,q(2,1),.85),up=enter(t,q(2,3),1.05),why=enter(t,q(2,7),.6);
 return <><Key>03 / 百分比的起点</Key><T x={120} y={166} size={68} serif>差的都是 40，基数变了。</T>
 <svg width="1920" height="1080" style={{position:'absolute'}}>
  {[320,680].map(y=><path key={y} d={`M430 ${y} H950`} stroke={I} strokeOpacity={.15} strokeWidth={2} strokeDasharray={y===320?'12 9':undefined}/>)}
  <path d="M550 337 V620" stroke={R} strokeWidth={13} pathLength={1} strokeDasharray={1} strokeDashoffset={1-down}/>
  <path d="M750 660 V340" stroke={B} strokeWidth={13} pathLength={1} strokeDasharray={1} strokeDashoffset={1-up}/>
  <path d="M530 603 L550 630 L570 603" stroke={R} strokeWidth={10} fill="none" opacity={down}/>
  <path d="M730 360 L750 333 L770 360" stroke={B} strokeWidth={10} fill="none" opacity={up}/>
 </svg>
 <T x={475} y={260} size={44}>100</T>
 <T x={785} y={640} size={44}>60</T>
 <div style={{position:'absolute',left:1080,top:320,opacity:down}}><span className="small-label">跌幅 · 起点 100</span><div className="formula" style={{color:R}}>40 ÷ <b>100</b> = 40%</div></div>
 <div style={{position:'absolute',left:1080,top:510,opacity:up}}><span className="small-label">回到原价 · 起点 60</span><div className="formula" style={{color:B}}>40 ÷ <b>60</b> ≈ 66.7%</div></div>
 <div style={{position:'absolute',left:1040,top:730,width:710,borderLeft:`6px solid ${R}`,paddingLeft:28,fontSize:33,opacity:why,lineHeight:1.6}}>100 元是一笔历史支出。<br/><strong>还缺一条通向未来的理由。</strong></div>
 </>}
function Evidence({t}:{t:number}){
 const sample=enter(t,q(3,2),.8),pattern=enter(t,q(3,3),.7),limit=enter(t,q(3,6),.65);
 return <><Key>04 / 从假设，到真实样本</Key>
 <div className="research-paper" style={{position:'absolute',left:170,top:220,width:780,height:575,transform:`rotate(${mix(-4,-1,enter(t,ch[3].start,1))}deg)`}}>
  <div style={{fontSize:18,letterSpacing:3,marginBottom:32}}>THE JOURNAL OF FINANCE · 1998</div>
  <Img src={staticFile('paper-title.png')} style={{width:680,mixBlendMode:'multiply'}}/>
  <Rule x={45} y={310} w={680}/>
  <div style={{marginTop:40,opacity:sample}}><span style={{fontFamily:'Anton',fontSize:112,color:B}}>10,000</span><span style={{fontSize:30,marginLeft:18}}>个账户</span></div>
  <div style={{fontSize:25,marginTop:9,opacity:sample}}>1987–1993 · 美国一家折扣券商</div>
 </div>
 <div style={{position:'absolute',left:1090,top:255,width:660,opacity:pattern}}><div style={{fontSize:58,fontFamily:'Serif'}}>更倾向于……</div><div style={{display:'flex',gap:24,marginTop:40}}><div className="tendency" style={{background:B,color:P}}>兑现盈利<span>获利仓位 → 卖出</span></div><div className="tendency" style={{background:'#e3d5bc'}}>保留亏损<span>亏损仓位 → 持有</span></div></div><div style={{fontSize:25,letterSpacing:2,marginTop:24}}>行为模式：处置效应</div></div>
 <div style={{position:'absolute',left:1090,top:620,width:650,opacity:limit}}><div style={{fontFamily:'Serif',fontSize:43,color:R}}>观察到行为 ≠ 找到唯一原因</div><div style={{fontSize:28,marginTop:25,lineHeight:1.6}}>锚定？反弹预期？其他机制？<br/>这项研究不能替每个人判定动机。</div></div>
 <T x={170} y={845} size={19} color="#637575">来源：Odean (1998), pp. 1775–1783。原论文题头节选；右侧为本片概括。</T>
 </>}
function Decision({t}:{t:number}){
 const rows=[{at:q(4,2),label:'证据',text:'哪条原判断，被新信息推翻？',no:'01'},{at:q(4,5),label:'约束',text:'用钱期限 · 集中程度 · 可承受损失',no:'02'},{at:q(4,9),label:'比较',text:'持有与替代选择，哪项更合条件？',no:'03'}];
 return <><Key>05 / 同一张账单，翻到背面</Key><T x={900} y={185} size={62} serif>重新写下，卖出的理由。</T>
 {rows.map((r,i)=>{let p=enter(t,r.at,.7);return <div key={r.no} style={{position:'absolute',left:900+mix(80,0,p),top:320+i*166,width:850,opacity:p,display:'flex',gap:34,borderTop:`2px solid ${I}35`,paddingTop:25}}><span style={{fontFamily:'Anton',fontSize:59,color:i===0?B:I,opacity:.55}}>{r.no}</span><div><div style={{fontSize:34,color:i===0?B:I,fontWeight:750}}>{r.label}</div><div style={{fontSize:29,marginTop:12}}>{r.text}</div></div></div>})}
 </>}
function Boundary({t}:{t:number}){let p=enter(t,q(5,1),.6),r=enter(t,q(5,3),.6);return <><Key>06 / 保留一个必要的反例</Key><T x={120} y={166} size={68} serif>成本，仍有它的位置。</T>
 <T x={290} y={732} size={32} color={B} style={{opacity:p}}>账目与税费：保留成本信息</T>
 <T x={1240} y={732} size={32} color={R} style={{opacity:r}}>期限与组合：可能不同</T>
 <svg width="1920" height="1080" style={{position:'absolute',opacity:r}}><path d="M670 640 C800 640 780 740 870 760 M1250 640 C1120 640 1140 740 1050 760" fill="none" stroke={I} strokeWidth={3} strokeDasharray="8 10"/></svg>
 <div style={{position:'absolute',left:770,top:340,width:380,textAlign:'center',opacity:r}}><div style={{fontSize:24,letterSpacing:4,color:'#687c7f'}}>条件不同</div><div style={{fontFamily:'Serif',fontSize:49,lineHeight:1.4,marginTop:24}}>合理的决定<br/>也可能不同</div></div>
 </>}
function Return({t}:{t:number}){const p=enter(t,q(6,2),.7),end=enter(t,q(6,4),.7);return <><Key>07 / 再问一次</Key><T x={120} y={166} size={65} serif>“回本就卖。”然后呢？</T>
 <div style={{position:'absolute',left:620,top:290,width:680,textAlign:'center',fontSize:38,lineHeight:1.5,opacity:p}}>到了那个价格，<br/><strong style={{color:B}}>哪条关于未来的判断会改变？</strong></div>
 <div style={{position:'absolute',left:750,top:740,width:420,padding:'12px 20px',border:`2px solid ${R}`,color:R,fontSize:28,textAlign:'center',opacity:1-end*.4}}>账单备注：历史买入 100 元</div>
 <div style={{position:'absolute',right:120,top:820,fontSize:21,color:'#6a7d80',opacity:end}}>凯撒文章改编 / 原创假设与独立核查</div>
 </>}
const scenes=[Accounts,Future,Recovery,Evidence,Decision,Boundary,Return];
export const Chapter:React.FC<{captions?:boolean}>=({captions=true})=>{
 const t=useCurrentFrame()/30,k=phase(t);let sub=timing.subtitles.find(s=>t>=s.start&&t<=s.end+.08);
 return <AbsoluteFill style={{background:P,color:I,fontFamily:'Sans',overflow:'hidden'}}>
  <div className="texture"/>
  <div style={{position:'absolute',left:120,right:120,top:62,display:'flex',justifyContent:'space-between',fontSize:19,letterSpacing:3,color:'#6b7e80'}}><span>凯撒的复利实验室 · 行为与决策</span><span>回本以后 / A CHAPTER STUDY</span></div>
  <Rule x={120} y={99} w={1680}/>
  {scenes.map((Scene,i)=>{const incoming=enter(t,ch[i].start+(i===5?.55:.22),.35),outgoing=i<6?1-enter(t,ch[i+1].start-.30,.30):1;const opacity=(i===0?1:incoming)*outgoing;if(opacity<.001)return null;return <div key={i} style={{position:'absolute',inset:0,opacity}}><Scene t={t}/></div>})}
  <Receipt kind="A" t={t} phaseIndex={k}/><Receipt kind="B" t={t} phaseIndex={k}/><Price t={t} k={k}/>
  {captions&&sub&&<div className="subtitle"><span>{sub.text}</span></div>}
  <div style={{position:'absolute',bottom:29,left:120,right:120,height:2,background:'#112B3718'}}><div style={{height:2,width:`${t/timing.seconds*100}%`,background:B}}/></div>
  <div style={{position:'absolute',bottom:42,left:120,fontSize:15,color:'#82908e'}}>原创假设仅供机制说明 · 不构成具体买卖建议</div>
  <div style={{position:'absolute',bottom:42,right:120,fontSize:18,fontFamily:'Anton',color:'#82908e'}}>{String(k+1).padStart(2,'0')} / 07</div>
 </AbsoluteFill>
};
