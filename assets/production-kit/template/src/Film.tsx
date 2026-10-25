import React,{useEffect,useState} from 'react';
import {AbsoluteFill,continueRender,delayRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {Asset} from './Asset';
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

/** Working transfer example. Replace content and meaningful poses, keep the reusable actors. */
export const Film=()=>{
  const f=useCurrentFrame(),{width,height,fps}=useVideoConfig(),t=f/fps;
  const tall=height>width,base=tall?1:0.9;
  const first=plan.transitions[0].at,second=plan.transitions[1].at;
  const a=ease((t-(first-.8))/1.6),b=ease((t-(second-.8))/1.6);
  const amounts=content.values.accounts;
  const mean=Number(content.values.mean),median=Number(content.values.median);
  const current=amounts.map(v=>blend(median,v,(t-(first-.8))/2.4));
  const running=current.reduce((x,y)=>x+y,0)/current.length;
  const max=Math.max(...amounts);
  const hardCut=plan.transitions[1].kind==='evidence-cut';
  const chart=<svg width={width} height={height} style={{position:'absolute',inset:0}}>
      {amounts.map((v,i)=>{const x=(hardCut?.18+i*.16:blend(.18+i*.16,.15+i*.175,(t-(second-.8))/1.6))*width;const y=height*(tall?.64:.70);const h=(current[i]/max)*height*.22*a;return <rect key={i} x={x-38} y={y-h} width={76} height={h} rx={10} fill={i===amounts.length-1?profile.accent:profile.ink} opacity={i===amounts.length-1?.85:.3}/>;})}
      <line x1={width*.09} x2={width*.92} y1={height*(tall?.64:.70)-running/max*height*.22} y2={height*(tall?.64:.70)-running/max*height*.22} stroke={profile.accent} strokeWidth={3} strokeDasharray="12 12" opacity={a}/>
    </svg>;
  const actors=<>{amounts.map((v,i)=>{
      const rowY=tall?.58:.64;
      const firstX=.18+i*.16,firstY=tall?.42:.49;
      const focusY=rowY-(v/max)*.22-.10;
      return <PersistentObject key={`account-${i}`} id={`account-${i}`} asset={profile.kit} keys={[
        {frame:0,x:firstX,y:firstY,scale:base},{frame:(first-.8)*fps,x:firstX,y:firstY,scale:base},
        {frame:(first+.8)*fps,x:firstX,y:focusY,scale:i===4?base*1.12:base*.85},
        {frame:(second-.8)*fps,x:firstX,y:focusY,scale:i===4?base*1.12:base*.85},
        {frame:(second+.8)*fps,x:hardCut?firstX:.15+i*.175,y:focusY,scale:hardCut?(i===4?base*1.12:base*.85):base*.88}
      ]}><div style={{display:'flex',justifyContent:'center',height:120}}><Asset/></div>
        <div style={{textAlign:'center',fontSize:40,fontWeight:800,color:i===4?profile.accent:profile.ink}}>{Math.round(current[i])}</div>
      </PersistentObject>;
    })}</>;
  const comparison=<div style={{position:'absolute',left:'9%',top:tall?'68%':'76%',display:'flex',gap:tall?70:140,alignItems:'baseline',opacity:hardCut?1:b}}>
      <div><div style={{fontSize:26,opacity:.7}}>平均数</div><div style={{fontSize:84,fontWeight:800,color:profile.accent}}><Claim id="mean"/></div></div>
      <div><div style={{fontSize:26,opacity:.7}}>中位数</div><div style={{fontSize:84,fontWeight:800}}><Claim id="median"/></div></div>
    </div>;
  return <AbsoluteFill data-film-root style={{background:profile.background,color:profile.ink,fontFamily:'ProductionSans',overflow:'hidden'}}>
    <Fonts/>
    <AbsoluteFill style={{background:`radial-gradient(ellipse at 75% 45%,${profile.accent}20,transparent 65%)`}}/>
    <div style={{position:'absolute',left:'8%',top:'9%',fontSize:tall?60:68,fontWeight:800,lineHeight:1.3}}>{content.text.title}</div>
    <div style={{position:'absolute',left:'8%',top:tall?'17%':'23%',fontSize:tall?30:34,opacity:.75}}>{(hardCut?t>=second:b>.5)?content.text.result:a>.3?content.text.change:content.text.group}</div>
    {hardCut?<EvidenceCut at={Math.round(second*fps)} anchor={actors} before={chart} after={comparison}/>:<>{chart}{actors}{comparison}</>}
    <div style={{position:'absolute',bottom:'7%',left:'8%',width:'84%',fontSize:24,opacity:.55}}>{content.text.scope}</div>
    <MotionProbe/>
  </AbsoluteFill>;
};
