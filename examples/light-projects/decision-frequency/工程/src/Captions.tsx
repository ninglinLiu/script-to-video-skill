import {AbsoluteFill,useCurrentFrame,staticFile} from 'remotion';
import timing from './timing.json';
import {C} from './design';
import {wrap} from './caption-layout';
export const fontCSS=()=>`@font-face{font-family:'Vox Heavy';src:url('${staticFile('fonts/vox/NotoSansSC-900.woff')}')}@font-face{font-family:'Vox Anton';src:url('${staticFile('fonts/vox/Anton-400.woff')}')}`;
export const CaptionLayer=({t}:{t:number})=>{let idx=0;timing.chapters.forEach((ch,i)=>{if(t>=ch.start)idx=i});const sub=timing.subtitles.find(s=>t>=s.start&&t<s.end+.10),rows=sub?wrap(sub.text):[];
 return <g><rect width="1080" height="356" fill={C.ink}/><rect width={1080*t/timing.seconds} height="8" fill={C.coral}/><text x="80" y="66" fill={C.sky} fontSize="25" fontFamily="Vox Heavy">{String(idx+1).padStart(2,'0')} / {timing.chapters[idx].title}</text>{rows.map((r,i)=><text key={i} x="540" y={(rows.length>2?131:151)+i*(rows.length>2?60:72)} textAnchor="middle" fill={C.white} fontSize="46" fontFamily="Vox Heavy">{r}</text>)}<text x="80" y="306" fill={C.muted} fontSize="24" fontFamily="Vox Heavy">行为金融 · 原创机制演示</text><text x="1000" y="306" fill={C.sky} textAnchor="end" fontSize="23" fontFamily="Vox Heavy">{Math.floor(t/60)}:{String(Math.floor(t%60)).padStart(2,'0')} / 3 MIN</text></g>;
};
export const SubtitleBand=()=>{const t=useCurrentFrame()/30;return <AbsoluteFill style={{background:C.ink}}><style>{fontCSS()}</style><svg width="1080" height="356" viewBox="0 0 1080 356"><CaptionLayer t={t}/></svg></AbsoluteFill>};
