import {C,T,Num,Header,Panel,Note,Label,Dial,Eye,E,k,q,mix,clamp,Props} from './design';

const Lock=({x,y,open=0,s=1,color=C.ink}:any)=><g transform={`translate(${x} ${y}) scale(${s})`}><path d={`M-24 -5v-23a24 24 0 0 1 48 0v${mix(23,3,open)}`} transform={`translate(${open*14} ${-open*12}) rotate(${open*25} -24 -28)`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"/><rect x="-38" y="-9" width="76" height="60" rx="9" fill={color}/><circle cy="13" r="7" fill={C.paper}/><path d="M0 17v15" stroke={C.paper} strokeWidth="7"/></g>;
const Pulse=({t,x,y,w=200,color=C.blue,offset=0}:any)=>{const p=((t+offset)%1.1+1.1)%1.1/1.1;return <g><path d={`M${x} ${y}h${w}`} stroke={color} opacity=".25" strokeWidth="5"/><circle cx={x+w*p} cy={y} r="8" fill={color}/></g>};

/** A physical separation between the quote-feed controller and decision permission. */
export const ModelStation=({t,ch}:Props)=>{
 const split=k(t,ch,2,1.05),feed=k(t,ch,3),permission=k(t,ch,5,.9);
 const left=mix(370,306,split),right=mix(710,774,split);
 const needle=feed?(.45+.3*Math.sin((t-q(ch,3))*4.8)):.25;
 const packet=clamp((t-q(ch,5)-.4)/1.1),quote=[104,103,105,104,106,105][Math.max(0,Math.floor((t-q(ch,3))*2.2))%6];
 return <g><Header n="04" title="拆开两个旋钮" sub="报价频率 × 决策频率"/>
 <g opacity={1-split*.58}><Label x={175} y={440} w={305} fill={C.coral}>损失厌恶</Label><T x={540} y={440} anchor="middle" size={48}>+</T><Label x={600} y={440} w={305} fill={C.sky}>短期评价</Label></g>
 <Panel x={95} y={510} w={890} h={733} fill={C.white}>
  <path d={`M540 ${mix(1220,540,split)}V1220`} stroke={C.line} strokeWidth="3" strokeDasharray="10 10"/>
  <Dial x={left} y={727} r={132} value={needle} color={C.blue} label="收到报价" sub="信息什么时候来"/>
  <Dial x={right} y={727} r={132} value={mix(.18,.78,permission)} color={C.coral} label="重新决定" sub="什么时候能改变选择"/>
  <path d={`M${left} 985v15h-58v16M${right} 985v31`} stroke={C.ink} strokeWidth="7" fill="none"/>
  <g transform={`translate(${left-146} 1016)`}><rect width="292" height="152" rx="12" fill={C.blue}/><Num x={146} y={108} size={76} fill={C.white} anchor="middle">{feed?quote:104}.00</Num><T x={146} y={31} anchor="middle" size={19} fill={C.sky}>QUOTE FEED</T></g>
  <g transform={`translate(${right} 1092)`}><rect x="-146" y="-76" width="292" height="152" rx="12" fill={C.paper} stroke={C.ink} strokeWidth="3"/>
   <rect x={mix(-122,-142,permission)} y="-60" width={mix(122,40,permission)} height="120" fill={C.line}/><rect x={mix(0,102,permission)} y="-60" width={mix(122,40,permission)} height="120" fill={C.line}/>
   <Lock x={0} y={-10} open={permission} s={.78} color={permission>.8?C.teal:C.ink}/>
  </g>
 </Panel>
 {feed>.2&&<Pulse t={t-q(ch,3)} x={155} y={1288} w={300} color={C.blue}/>}
 <g opacity={permission}><path d="M625 1288h300" stroke={C.coral} strokeOpacity=".3" strokeWidth="5"/><rect x={625+packet*270} y="1275" width="26" height="26" rx="5" fill={C.coral}/></g>
 <T x={306} y={1355} anchor="middle" size={32} fill={C.blue}>看见一个变化</T><T x={774} y={1355} anchor="middle" size={32} fill={C.coral}>获得一次决策机会</T>
 <Note y={1450}>两个独立控制器 · 机制示意，非实验参数</Note>
 </g>;
};

const Student=({x,y,color=C.blue,s=1}:any)=><g transform={`translate(${x} ${y}) scale(${s})`}><circle cy="-10" r="11" fill={color}/><path d="M-17 22v-9a17 17 0 0 1 34 0v9Z" fill={color}/></g>;
/** Factorial design, without fabricated effect sizes or proportional outcome graphics. */
export const ResearchStation=({t,ch}:Props)=>{
 const appear=k(t,ch,1,1.1),n=k(t,ch,2,.8),first=k(t,ch,3),second=k(t,ch,4),scope=k(t,ch,10);
 return <g><Header n="05" title="结论也要拆开" sub="反馈 × 决策：分开操纵，才知道谁在起作用"/>
 <g transform={`translate(0 ${24*(1-n)})`} opacity={n}><Num x={80} y={465} size={104} fill={C.blue}>1810</Num><T x={348} y={424} size={31}>名学生被招募</T><T x={348} y={467} size={26} fill={C.muted}>两项在线实验 · 不等于实盘回测</T><Student x={893} y={420} color={C.blue} s={1.6}/><Student x={948} y={433} color={C.coral} s={1.4}/></g>
 <g opacity={appear} transform={`translate(0 ${30*(1-appear)})`}>
 <T x={575} y={547} anchor="middle" size={29} fill={C.blue}>反馈频率</T><T x={425} y={592} anchor="middle" size={28}>低</T><T x={765} y={592} anchor="middle" size={28}>高</T>
 <T x={87} y={798} size={26}>决策</T><T x={87} y={836} size={26}>频率</T>
 {[0,1].map(row=><g key={row}><T x={192} y={722+row*205} anchor="middle" size={30}>{row?'高':'低'}</T>{[0,1].map(col=>{const x=268+col*340,y=620+row*205,vis=E(t,q(ch,1)+row*.2+col*.13,q(ch,1)+.65+row*.2+col*.13);return <g key={col} opacity={vis} transform={`translate(${x} ${y})`}>
 <rect x="8" y="10" width="312" height="182" rx="16" fill={C.ink} opacity=".1"/><rect width="312" height="182" rx="16" fill={col?C.sky:C.white} stroke={C.ink} strokeWidth="3"/>
 <Eye x={58} y={54} s={.4}/>{Array.from({length:col?3:1},(_,i)=><rect key={i} x={104+i*52} y="37" width="36" height="34" rx="5" fill={C.blue}/>)}
 <path d="M30 92h252" stroke={C.line} strokeWidth="2"/>
 <Lock x={58} y={131} s={.42} open={row?1:0} color={C.coral}/>{Array.from({length:row?3:1},(_,i)=><circle key={i} cx={122+i*52} cy="140" r="17" fill={C.coral}/>)}
 </g>;})}</g>)}
 </g>
 <g opacity={first} transform={`translate(${(1-first)*-28} 0)`}><rect x="88" y="1068" width="900" height="98" rx="13" fill={C.white} stroke={C.line} strokeWidth="2"/><Label x={109} y={1128} fill={C.ink} w={170}>实验一</Label><T x={314} y={1132} size={34}>未发现显著差异</T><path d="M920 1118h34" stroke={C.muted} strokeWidth="6"/></g>
 <g opacity={second} transform={`translate(${(1-second)*28} 0)`}><rect x="88" y="1182" width="900" height="121" rx="13" fill={C.blue}/><T x={112} y={1230} size={29} fill={C.sky}>实验二及合并分析</T><T x={112} y={1278} size={37} fill={C.white}>更支持决策频率的作用</T><path d="M905 1228l16 16l35-39" stroke={C.lime} strokeWidth="7" strokeLinecap="round" fill="none"/></g>
 <g opacity={scope}><path d="M90 1353h900" stroke={C.coral} strokeWidth="3"/><T x={90} y={1408} size={34} fill={C.coral}>测量风险投入，不能替你预测收益</T></g>
 <Note y={1470} size={24}>Schwaiger 等 · 工作论文，仍在审稿 · 设计示意</Note>
 </g>;
};

const Gear=({x,y,r=46,angle=0,color=C.ink}:any)=><g transform={`translate(${x} ${y}) rotate(${angle})`}>{Array.from({length:12},(_,i)=><rect key={i} x={-7} y={-r-8} width="14" height="19" rx="3" fill={color} transform={`rotate(${i*30})`}/>)}<circle r={r} fill={color}/><circle r={r*.61} fill={C.paper}/><circle r={r*.19} fill={color}/></g>;
/** Funds and fee bucket are updated on the same discrete debit event. */
export const CostStation=({t,ch}:Props)=>{
 const debitStart=q(ch,5),debitEnd=q(ch,8),progress=clamp((t-debitStart)/Math.max(.4,debitEnd-debitStart));
 const step=Math.min(20,Math.floor(progress*20+1e-7));
 const amount=10000*Math.pow(.998,step),fee=10000-amount,ratio=amount/10000,feeRatio=fee/(10000-10000*Math.pow(.998,20));
 const result=k(t,ch,9),qualifier=k(t,ch,14);
 const angle=step*24+clamp((progress*20)%1)*18;
 return <g><Header n="06" title="行动开始收费" sub="纯算术假设：市场收益为零 · 每笔全仓"/>
 <Panel x={92} y={385} w={896} h={292} fill={C.blue}>
  <T x={132} y={448} size={29} fill={C.sky}>资金余额 / 元</T><Num x={540} y={593} anchor="middle" size={137} fill={C.white}>{amount.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</Num>
  <T x={940} y={448} size={27} anchor="end" fill={C.sky}>{step} / 20 笔</T>
 </Panel>
 <g><T x={80} y={739} size={29} fill={C.muted}>每笔扣当时金额的 0.2%</T><T x={992} y={739} size={29} anchor="end" fill={C.coral}>十轮买卖 = 二十笔</T></g>
 <g transform="translate(98 792)"><rect width="884" height="108" rx="8" fill={C.line}/><rect width={884*ratio} height="108" rx="8" fill={C.teal}/><rect x={884*ratio} width={884*(1-ratio)} height="108" fill={C.coral}/><T x={24} y={67} size={34} fill={C.white}>本金条：同一比例</T><path d={`M${884*ratio} -10v128`} stroke={C.ink} strokeWidth="4"/>
 </g>
 <path d="M963 910v42H807v51" stroke={C.coral} strokeWidth="6" fill="none"/>
 <Gear x={145} y={1000} angle={angle} color={C.ink}/><Gear x={231} y={1000} angle={-angle+15} color={C.ink}/>
 <g transform="translate(312 961)"><T x={0} y={10} size={27} fill={C.muted}>按当时余额扣费</T><Num x={0} y={66} size={43}>10,000 × 0.998<tspan dx={2} dy={-24} fontSize={25}>{step}</tspan></Num></g>
 <g transform="translate(672 1008)"><path d="M0 0v205h290V0" fill={C.white} stroke={C.ink} strokeWidth="4"/><rect x="8" y={205-160*feeRatio} width="274" height={160*feeRatio} fill={C.coral} opacity=".88"/>{Array.from({length:6},(_,i)=><path key={i} d={`M0 ${29+i*29}h18`} stroke={C.ink} strokeWidth="2"/>)}<Num x={145} y={138} anchor="middle" size={56} fill={feeRatio>.57?C.white:C.ink}>{fee.toFixed(2)}</Num><T x={145} y={178} anchor="middle" size={25} fill={feeRatio>.79?C.white:C.ink}>累计费用 / 元</T></g>
 <T x={818} y={1258} anchor="middle" size={25} fill={C.muted}>费用槽放大显示</T>
 <g transform="translate(98 1080)">{Array.from({length:20},(_,i)=>{const done=i<step;return <g key={i}><rect x={(i%10)*49} y={Math.floor(i/10)*63} width="39" height="46" rx="7" fill={done?C.coral:C.paper} stroke={done?C.coral:C.line} strokeWidth="2"/><Num x={(i%10)*49+19.5} y={Math.floor(i/10)*63+32} anchor="middle" size={22} fill={done?C.white:C.muted}>{i+1}</Num></g>})}<T x={0} y={160} size={25} fill={C.muted}>每个格子对应一笔真实扣费</T></g>
 <g opacity={result}><path d="M80 1322h920" stroke={C.ink} strokeWidth="2"/><Num x={80} y={1413} size={83} fill={C.coral}>-3.9%</Num><T x={390} y={1371} size={29}>20 笔后约 9,608 元</T><T x={390} y={1418} size={32} fill={C.ink}>{qualifier>.5?'有价值的信息，也可能值得交易':'这是成本，不是情绪'}</T></g>
 <Note y={1480} size={25}>假设费率，非真实报价 · 无市场涨跌与其他成本</Note>
 </g>;
};
