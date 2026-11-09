import React,{useEffect,useState} from 'react';
import {AbsoluteFill,continueRender,delayRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {GlowPawnG,SpotlightG} from './vendor/src/library/blackgold/props';
import {B,glowText} from './vendor/src/library/blackgold/theme';
import profile from './profile.json';
import content from './content.generated.json';
import plan from '../../plans/edit-plan.json';
import {PersistentObject,EvidenceCut,MotionProbe,blend,ease} from './motion';

export const Claim:React.FC<{id:keyof typeof content.labels}>=({id})=><span data-claim-key={id}>{content.labels[id]}</span>;

const Fonts=()=>{
  const [handle]=useState(()=>delayRender('production-fonts'));
  useEffect(()=>{const face=new FontFace('ProductionSans',`url(${staticFile('fonts/NotoSansSC-VF.ttf')})`,{weight:'100 900'});face.load().then(x=>{document.fonts.add(x);continueRender(handle);}).catch(e=>{throw e;});},[handle]);
  return null;
};

const Actor:React.FC<{tone:'lit'|'dim'|'cyan';size:number}>=({tone,size})=>(
  <svg width={size*1.3} height={size*1.45} viewBox={`${-size*0.65} ${-size*1.3} ${size*1.3} ${size*1.45}`} style={{overflow:'visible'}}>
    <GlowPawnG tone={tone} size={size}/>
  </svg>
);

const QUINTS:Array<keyof typeof content.labels>=['q1','q2','q3','q4','q5'];

/** 二八法则：五组人口（各 20%）的份额 -> 站上柱形 -> 换成三个指数做对照。 */
export const Film=()=>{
  const f=useCurrentFrame(),{width,height,fps}=useVideoConfig(),t=f/fps;
  const T1=plan.transitions[0].at,T2=plan.transitions[1].at;
  const move=ease((t-(T1-.7))/1.8);
  const grow=ease((t-(T1-.2))/1.6);
  const spot=ease((t-(T1+.5))/1.2);
  const cards=ease((t-(T2+.45))/.7);
  const rowBack=ease((t-(T2+.05))/.8);
  const close=ease((t-(plan.duration-6.9))/1.2);
  const tail=ease((t-(T2+19.2))/1.6);   // 64/4 那一刻：尾巴再集中一次
  const hardCut=plan.transitions[1].kind==='evidence-cut';

  const baseY=.66*height,barMax=.34*height;
  const share=[content.values.q1,content.values.q2,content.values.q3,content.values.q4,content.values.q5];
  const maxShare=content.values.q5;

  const actors=<>{QUINTS.map((q,i)=>{
    const rowX=.14+i*.18,rowY=.42;
    const barX=.16+i*.17,barY=(baseY-(share[i]/maxShare)*barMax)/height;
    const backX=.14+i*.18,backY=.875;
    return <PersistentObject key={q} id={`quintile-${i}`} asset={profile.kit} keys={[
      {frame:0,x:rowX,y:rowY,scale:1},
      {frame:Math.round((T1-.7)*fps),x:rowX,y:rowY,scale:1},
      {frame:Math.round((T1+1.1)*fps),x:barX,y:barY,scale:i===4?1.06:.94},
      {frame:Math.round((T2-.1)*fps),x:barX,y:barY,scale:i===4?1.06:.94},
      {frame:Math.round((T2+1.3)*fps),x:blend(barX,backX,rowBack),y:blend(barY,backY,rowBack),scale:.56},
      {frame:Math.round((T2+19.2)*fps),x:backX,y:backY,scale:.56},
      {frame:Math.round((T2+20.8)*fps),x:backX,y:backY,scale:i===4?.86:.42},
      {frame:Math.round(plan.duration*fps),x:backX,y:backY,scale:i===4?.86:.42},
    ]}>
      <div style={{textAlign:'center',marginBottom:2,fontWeight:900,fontSize:i===4?54:36,color:i===4?profile.accent:B.ink,...(i===4?glowText(profile.accent,14,.8):{})}}><Claim id={q}/></div>
      <div style={{display:'flex',justifyContent:'center'}}><Actor tone={i===4?'lit':i===0?'dim':'lit'} size={i===4?116:84}/></div>
    </PersistentObject>;
  })}</>;

  const bars=<svg width={width} height={height} style={{position:'absolute',inset:0}}>
    {share.map((v,i)=>{
      const h=(v/maxShare)*barMax*grow,x=.16*width+i*.17*width;
      return <rect key={i} x={x-46} y={baseY-h} width={92} height={h} rx={10} fill={i===4?profile.accent:B.gold} opacity={i===4?.85:.3}/>;
    })}
    <line x1={.08*width} x2={.92*width} y1={baseY} y2={baseY} stroke={B.goldLine} strokeWidth={2} opacity={grow}/>
  </svg>;

  const spotlight=spot>.01?<svg width={width} height={height} style={{position:'absolute',inset:0,pointerEvents:'none'}}>
    <SpotlightG x={.16*width+3*.17*width} y={.28*height} w={270} h={.32*height} on={spot} id="top"/>
  </svg>:null;

  const rows=[
    {a:'alpha161' as const,top:'top80' as const,note:'帕累托观察到的那种尾巴'},
    {a:'alpha15' as const,top:'top15' as const,note:'尾巴更厚：20% 占到近六成'},
    {a:'alpha20' as const,top:'top20' as const,note:'尾巴更薄：20% 只占四成多'},
  ];
  const alphaCards=<div style={{position:'absolute',left:'9%',top:'27%',width:'82%',display:'flex',flexDirection:'column',gap:18,opacity:cards,transform:`translateY(${(1-cards)*24}px)`}}>
    {rows.map((row,i)=><div key={row.a} style={{border:`1.5px solid ${i===0?profile.accent:B.goldLine}`,borderRadius:10,background:'rgba(8,18,24,0.72)',padding:'18px 26px',boxShadow:i===0?`0 0 22px ${profile.accent}44`:'none'}}>
      <div style={{fontSize:24,color:B.inkDim,letterSpacing:'0.06em'}}>指数 α = <Claim id={row.a}/></div>
      <div style={{marginTop:2,fontWeight:900,fontSize:56,color:i===0?profile.accent:B.ink}}>20% 占 <Claim id={row.top}/></div>
      <div style={{fontSize:21,color:B.inkFaint,marginTop:2}}>{row.note}</div>
    </div>)}
  </div>;

  return <AbsoluteFill data-film-root style={{background:profile.background,color:profile.ink,fontFamily:'ProductionSans',overflow:'hidden'}}>
    <Fonts/>
    <AbsoluteFill style={{background:`radial-gradient(ellipse at 50% 34%,${profile.accent}16,transparent 62%)`}}/>
    <div style={{position:'absolute',left:'8%',top:'7%',fontSize:25,letterSpacing:'0.34em',color:B.goldWarm,opacity:.8}}>PARETO · 1896</div>
    <div style={{position:'absolute',left:'8%',top:'10.5%',width:'84%',fontSize:54,fontWeight:900,lineHeight:1.32}}>{content.text.title}</div>
    <div style={{position:'absolute',left:'8%',top:'19.4%',width:'84%',fontSize:29,color:B.inkDim,lineHeight:1.5}}>
      {t>=T2+.9?content.text.swap:t>=T1-.4?content.text.change:content.text.group}
    </div>
    {hardCut?<EvidenceCut at={Math.round(T2*fps)} anchor={actors} before={<>{bars}{spotlight}</>} after={alphaCards}/>:<>{bars}{actors}{spotlight}</>}
    <div style={{position:'absolute',left:'8%',width:'84%',top:'58.5%',opacity:close,transform:`translateY(${(1-close)*20}px)`}}>
      <div style={{fontWeight:900,fontSize:62,lineHeight:1.34,color:B.ink}}>先量尾巴有多厚</div>
      <div style={{fontWeight:900,fontSize:62,lineHeight:1.34,color:B.gold}}>再谈 80 / 20</div>
    </div>
    <div style={{position:'absolute',bottom:'5%',left:'8%',width:'84%',fontSize:22,color:B.inkFaint,lineHeight:1.5}}>{content.text.scope}</div>
    <MotionProbe/>
  </AbsoluteFill>;
};
