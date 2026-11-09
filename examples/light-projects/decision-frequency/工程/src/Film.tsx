import {AbsoluteFill,useCurrentFrame,staticFile} from 'remotion';
import timing from './timing.json';
import {C,E,mix,Chapter} from './design';
import {HookStation,PathStation,ReferenceStation,SignalStation,ProtocolStation,EndStation} from './Observations';
import {ModelStation,ResearchStation,CostStation} from './Mechanisms';
import {CaptionLayer} from './Captions';
const stations=[HookStation,PathStation,ReferenceStation,ModelStation,ResearchStation,CostStation,SignalStation,ProtocolStation,EndStation];
export const Film=()=>{const t=useCurrentFrame()/30,cs=timing.chapters as Chapter[];let idx=0;cs.forEach((ch,i)=>{if(t>=ch.start)idx=i});let camera=idx*2000;
 for(let i=1;i<cs.length;i++){const at=cs[i].start;if(t>=at-.45&&t<=at+.45)camera=mix((i-1)*2000,i*2000,E(t,at-.45,at+.45));}
 return <AbsoluteFill style={{background:C.paper,fontFamily:'Vox Heavy',overflow:'hidden'}}><style>{`@font-face{font-family:'Vox Heavy';src:url('${staticFile('fonts/vox/NotoSansSC-900.woff')}')}@font-face{font-family:'Vox Anton';src:url('${staticFile('fonts/vox/Anton-400.woff')}')}`}</style><svg width="1080" height="1920" viewBox="0 0 1080 1920"><defs><pattern id="grain" width="13" height="13" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill={C.ink} opacity=".10"/></pattern></defs><rect width="1080" height="1920" fill={C.paper}/>
 <g transform={`translate(0 ${-camera})`}>{stations.map((Station,i)=>Math.abs(i*2000-camera)<2100?<g key={i} transform={`translate(0 ${i*2000})`}><rect width="1080" height="2000" fill={C.paper}/><rect width="1080" height="1565" fill="url(#grain)"/><path d="M35 0v2000M1045 0v2000" stroke={C.line} strokeWidth="2"/>{[1800,1850,1900,1950].map(y=><g key={y}><rect x="32" y={y} width="6" height="24" fill={C.blue}/><rect x="1042" y={y} width="6" height="24" fill={C.blue}/><path d={`M520 ${y}l20 14 20 -14`} stroke={C.blue} strokeWidth="4" fill="none"/></g>)}<Station t={t} ch={cs[i]}/></g>:null)}</g>
 <g transform="translate(0 1564)"><CaptionLayer t={t}/></g></svg></AbsoluteFill>;
};
