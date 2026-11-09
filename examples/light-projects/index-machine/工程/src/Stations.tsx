import {C,Props,E,mix,T,Num,Label,Header,Machine,Company,Track,Arrow,Note,k,Rule} from './design';
const Gear=({x,y,r,t,fill=C.ink}:any)=><g transform={`translate(${x} ${y}) rotate(${t*22})`}>{Array.from({length:12},(_,i)=><rect key={i} x={-r*.18} y={-r} width={r*.36} height={r*.4} fill={fill} transform={`rotate(${i*30})`}/>)}<circle r={r*.79} fill={fill}/><circle r={r*.36} fill={C.paper}/></g>;
export const HookStation=({t,ch}:Props)=>{
 const u=(t-ch.start)/(ch.end-ch.start),drop=1,swap=E(u,.34,.49),question=E(u,.52,.64);
 return <g><T x={80} y={139} size={24} fill={C.muted}>凯撒的复利实验室 / 机制研究 02</T><Rule y={180}/>
 <T x={76} y={315} size={105}>会换人。</T><T x={76} y={441} size={105} fill={C.blue}>就不会亏？</T>
 <g transform={`translate(0 ${-question*28})`}><Machine x={95} y={550} w={890} h={460}><T x={145} y={617} size={28} fill={C.paper}>PRICE INDEX / 假设示例</T><Num x={540} y={883} size={278} anchor="middle" fill={C.lime}>{Math.round(100-20*drop)}</Num><T x={540} y={957} size={31} anchor="middle" fill={C.paper}>{swap>.8?'名单已更换 · 读数仍然是 80':'更换前，已从 100 跌至 80'}</T></Machine>
 <g transform={`translate(${mix(0,1020,swap)} 0)`}><Company x={99} y={1100} id={4} w={120} h={130}/></g><g transform={`translate(${mix(-1040,0,swap)} 0)`}><Company x={99} y={1100} id={5} w={120} h={130}/></g>{[0,1,2,3].map((id,i)=><Company key={id} id={id} x={275+i*178} y={1100} w={120} h={130}/>)}<Track y={1240}/><Gear x={170} y={1346} r={45} t={t}/><Gear x={900} y={1346} r={45} t={-t}/></g>
 <g opacity={question}><Label x={288} y={1410} w={504} fill={C.coral}>换掉名字，不会重写你的亏损</Label></g></g>;
};
export const SelectionStation=({t,ch}:Props)=>{
 const u=(t-ch.start)/(ch.end-ch.start),qual=E(u,.08,.22),choose=E(u,.25,.4),math=E(u,.67,.78);
 return <g><Header n="01" title="更新名单，不是重写历史" sub="SELECTION ≠ RETURN"/>
 <g opacity={1-math}><T x={80} y={430} size={32}>先过资格门，再由委员会选择</T><path d="M140 800V510H940V800" fill="none" stroke={C.blue} strokeWidth={30}/><Label x={185} y={540} w={710} fill={C.blue}>规模 / 流动性 / 流通量 / 财务等资格</Label>{[0,1,2,3,4].map((id,i)=><Company key={id} x={100+i*178} y={mix(840,650,qual)} id={id} scale={.83}/>)}<Track y={1000}/><g opacity={choose}><path d="M535 600V1050" stroke={C.coral} strokeWidth={7} strokeDasharray="11 10"/><Label x={352} y={1110} w={376} fill={C.coral}>委员会选择 ≠ 自动入选</Label></g></g>
 <g transform={`translate(0 ${mix(280,0,math)})`} opacity={math}>
 <Machine x={100} y={455} w={880} h={590} fill={C.paper}><T x={150} y={522} size={30}>成分更替瞬间 · 假设价格不动</T><Num x={278} y={716} size={145} anchor="middle">80</Num><Num x={798} y={716} size={145} anchor="middle">80</Num><Arrow x={440} y={664} w={200} color={C.blue}/><T x={280} y={780} size={31} anchor="middle">更替前</T><T x={800} y={780} size={31} anchor="middle">更替后</T><path d="M150 842h780" stroke={C.line} strokeWidth={3}/><T x={540} y={916} size={40} anchor="middle">除数调整，维持指数连续</T><T x={540} y={978} size={29} anchor="middle" fill={C.muted}>不是把新名单拿去改写旧收益</T></Machine>
 <rect x={190} y={1140} width={700} height={150} fill={C.ink} transform="rotate(-3 540 1215)"/><T x={540} y={1230} size={58} fill={C.lime} anchor="middle">旧亏损，仍在账上。</T></g>
 <Note>加入条件不等于持续留存条件；移出指数也不等于退市。</Note></g>;
};
export const RiskStation=({t,ch}:Props)=>{
 const u=(t-ch.start)/(ch.end-ch.start),spread=E(u,.04,.2),wave=E(u,.26,.5),lines=E(u,.58,.74);const pts=[[245,810],[725,810],[485,1030],[245,1260],[725,1260]];
 return <g><Header n="06" title="名字分散，风险可能同源" sub="DIVERSIFICATION / COMMON EXPOSURE"/>
 <Machine x={150} y={410} w={780} h={210}><T x={540} y={480} size={31} anchor="middle" fill={C.paper}>共同冲击 · 机制示意</T><T x={540} y={563} size={50} anchor="middle" fill={C.lime}>{lines>.5?'公司数量 ≠ 风险来源数量':'利率 / 需求 / 估值'}</T></Machine>
 {pts.map(([x,y],i)=><g key={i}><path d={`M540 625C540 705 ${x+55} 680 ${x+55} ${y-40}`} fill="none" stroke={C.line} strokeWidth={12}/><path d={`M540 625C540 705 ${x+55} 680 ${x+55} ${y-40}`} fill="none" stroke={C.coral} strokeWidth={5} strokeDasharray={`${Math.max(0,wave)*900} 1200`} /><g transform={`translate(${mix(485,x,spread)} ${y}) rotate(${Math.sin(t*3+i)*wave*2} 55 75)`}><Company x={0} y={0} id={i} w={110} h={130}/>{wave>0&&<path d="M24 165h67m-19 -13l19 13l-19 13" stroke={C.coral} strokeWidth={6} opacity={wave}/>}</g></g>)}
 <Note>分散可降低特定公司风险，但不能保证躲过全市场下跌。</Note></g>;
};
export const ChecklistStation=({t,ch}:Props)=>{
 const row=[k(t,ch,2,.6),k(t,ch,3,.6),k(t,ch,4,.6),k(t,ch,6,.6)];
 return <g><Header n="07" title="别只问：它会不会涨" sub="FOUR QUESTIONS BEFORE THE PRICE"/>
 {[{n:'01',key:'权重',txt:'风险集中在哪里？',small:'名字多，不代表分量相等',color:C.lime},{n:'02',key:'盈利',txt:'增长从哪里来？',small:'经营改善，还是股数变化？',color:C.blue},{n:'03',key:'价格',txt:'好消息付了几倍？',small:'盈利预期 × 市场愿付倍数',color:C.coral},{n:'04',key:'期限',txt:'下跌时有时间等吗？',small:'期限、现金需要与可承受亏损',color:C.cyan}].map((r,i)=><g key={i} transform={`translate(${mix(100,0,row[i])} 0)`} opacity={row[i]}><Machine x={80} y={420+i*246} w={920} h={221}><rect x={104} y={444+i*246} width={175} height={173} rx={9} fill={r.color}/><Num x={190} y={510+i*246} size={52} anchor="middle" fill={i===1?C.paper:C.ink}>{r.n}</Num><T x={190} y={582+i*246} size={40} anchor="middle" fill={i===1?C.paper:C.ink}>{r.key}</T><T x={320} y={508+i*246} size={48} fill={C.paper}>{r.txt}</T><T x={320} y={581+i*246} size={29} fill={C.line}>{r.small}</T></Machine></g>)}
 <Note>指数是持仓规则；基金的费用与跟踪误差还会影响实际回报。</Note></g>;
};
export const EndStation=({t,ch}:Props)=>{const u=(t-ch.start)/(ch.end-ch.start),p=E(u,.02,.25);return <g><T x={80} y={140} size={25} fill={C.muted}>CAESAR LAB / END OF THE ASSEMBLY LINE</T><Rule y={180}/><g transform={`translate(0 ${mix(85,0,p)})`} opacity={p}><g stroke={C.blue} strokeWidth={33}><path d="M95 510h245M95 590h245M279 452L161 655"/></g><T x={92} y={397} size={87}>企业的进化</T><T x={92} y={803} size={87}>收益的保证</T><T x={88} y={998} size={47}>你买下的不只是企业，</T><T x={88} y={1071} size={47}>还有它的价格。</T><path d="M90 1130h900" stroke={C.coral} strokeWidth={18}/><Company x={395} y={1230} id={0} w={170} h={160}/><Track y={1410}/></g></g>};
