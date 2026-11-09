import {AbsoluteFill,useCurrentFrame,staticFile} from 'remotion';
import timing from './timing.json';
import {C,E,mix,Chapter} from './design';
import {HookStation,SelectionStation,RiskStation,ChecklistStation,EndStation} from './Stations';
import {WeightStation,DriftStation} from './Weights';
import {BuybackStation,ValuationStation} from './Capital';
const components=[HookStation,SelectionStation,WeightStation,DriftStation,BuybackStation,ValuationStation,RiskStation,ChecklistStation,EndStation];
// Continuous world-camera pattern adapted from weilanx VoxShow World/camAt.
// Every station has a fixed world location. The lens travels between them.
export const Film=()=>{const t=useCurrentFrame()/30;const cs=timing.chapters as Chapter[];let idx=0;cs.forEach((ch,i)=>{if(t>=ch.start)idx=i});let camera=idx*2000;
 for(let i=1;i<cs.length;i++){const at=cs[i].start;if(t>=at-.48&&t<=at+.48)camera=mix((i-1)*2000,i*2000,E(t,at-.48,at+.48));}
 const subtitle=timing.subtitles.find(s=>t>=s.start&&t<s.end+.10);
 let rows:string[]=[];if(subtitle){const a=Array.from(subtitle.text); if(a.length>19){let split=Math.ceil(a.length/2);const punct=a.findIndex((v,i)=>i>=7&&i<=19&&'，；：。'.includes(v));if(punct>=0)split=punct+1;rows=[a.slice(0,split).join(''),a.slice(split).join('')]}else rows=[subtitle.text];}
 return <AbsoluteFill style={{background:C.paper,fontFamily:'Vox Heavy',overflow:'hidden'}}><style>{`@font-face{font-family:'Vox Heavy';src:url('${staticFile('fonts/vox/NotoSansSC-900.woff')}')}@font-face{font-family:'Vox Anton';src:url('${staticFile('fonts/vox/Anton-400.woff')}')}`}</style>
 <svg width="1080" height="1920" viewBox="0 0 1080 1920"><defs><pattern id="dot" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".6" fill={C.ink} opacity=".11"/></pattern></defs><rect width="1080" height="1920" fill={C.paper}/>
 <g transform={`translate(0 ${-camera})`}>{components.map((Component,i)=>Math.abs(i*2000-camera)<2100?<g key={i} transform={`translate(0 ${i*2000})`}><rect x="0" y="0" width="1080" height="2000" fill={C.paper}/><rect width="1080" height="1590" fill="url(#dot)"/><path d="M35 0v2000M1045 0v2000" stroke={C.line} strokeWidth="2"/>{[1880,1920,1960].map(y=><path key={y} d={`M525 ${y}l15 12l15 -12`} stroke={C.blue} strokeWidth="4" fill="none"/>)}<Component t={t} ch={cs[i]}/></g>:null)}</g>
 <rect x="0" y="1565" width="1080" height="355" fill={C.ink}/><rect x="0" y="1565" width={1080*t/timing.seconds} height="8" fill={C.lime}/><text x="80" y="1630" fill={C.line} fontSize="25" fontFamily="Vox Heavy">{String(idx+1).padStart(2,'0')} / {cs[idx].title}</text>
 {rows.map((r,i)=><text key={i} x="540" y={1715+i*72} textAnchor="middle" fill={C.white} fontSize="48" fontFamily="Vox Heavy">{r}</text>)}
 <text x="80" y="1870" fill={C.muted} fontSize="23" fontFamily="Vox Heavy">原创机制演示 · 非收益预测</text><text x="1000" y="1870" textAnchor="end" fill={C.line} fontSize="23" fontFamily="Vox Heavy">{Math.floor(t/60)}:{String(Math.floor(t%60)).padStart(2,'0')} / 3 MIN</text></svg></AbsoluteFill>;
};
