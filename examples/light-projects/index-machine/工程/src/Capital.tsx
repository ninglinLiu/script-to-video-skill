import React from 'react';
import {C, Props, E, mix, clamp, T, Num, Label, Header, Machine, Arrow, Note, q, k} from './design';

// Both stations live in the common workshop coordinate system. No independent
// camera or subtitle layer: the parent composition carries us between stations.
const cashColor = '#7BC8B7';
const span = (t:number,ch:Props['ch'],a:number,b:number) => E(t,q(ch,a),Math.max(q(ch,a)+.25,q(ch,b)));
const Slot = ({x,y,w=38,h=28,fill=C.lime,opacity=1}:any) => <g opacity={opacity}>
  <path d={`M${x+4} ${y+4}h${w}v${h}h-${w}Z`} fill={C.ink} opacity=".2"/>
  <rect x={x} y={y} width={w} height={h} rx="3" fill={fill} stroke={C.ink} strokeWidth="2"/>
  <path d={`M${x+8} ${y+8}v${h-16}m8 0V${y+8}`} stroke={C.ink} strokeWidth="2" opacity=".45"/>
</g>;
const Banknote = ({x,y,rotate=0,opacity=1}:any) => <g transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={opacity}>
  <rect x="-39" y="-20" width="78" height="40" rx="3" fill={cashColor} stroke={C.ink} strokeWidth="2.5"/>
  <rect x="-31" y="-13" width="62" height="26" rx="2" fill="none" stroke={C.ink} strokeWidth="1.5"/>
  <circle r="10" fill={C.paper} stroke={C.ink} strokeWidth="1.5"/>
  <path d="M-24 0h7M17 0h7" stroke={C.ink} strokeWidth="2"/>
</g>;
const Cog = ({x,y,r=54,angle=0,color=C.ink}:any) => <g transform={`translate(${x} ${y}) rotate(${angle})`}>
  {Array.from({length:12},(_,i)=><rect key={i} x="-8" y={-r-9} width="16" height="24" rx="2" fill={color} transform={`rotate(${i*30})`}/>)}
  <circle r={r} fill={color}/><circle r={r*.47} fill={C.paper}/><circle r="9" fill={color}/>
</g>;

export const BuybackStation: React.FC<Props> = ({t,ch}) => {
  const intro = E(t,ch.start,ch.start+1.1);
  const shrink = span(t,ch,4,5);
  const avgFocus = span(t,ch,8,9);
  const cashFocus = span(t,ch,12,13);
  const cost = span(t,ch,14,15);
  const expensive = k(t,ch,17,.6);
  const issue = k(t,ch,18,1.1);
  const shares = 100 - Math.round(20*shrink);
  const eps = 100/shares;
  const shownEPS = shrink === 0 ? '1.00' : eps.toFixed(2);
  const revealEPS = k(t,ch,5,.45);
  const transitionY = mix(34,0,intro);
  return <g transform={`translate(0 ${transitionY})`} opacity={intro}>
    <Header n="04" title="每股变多 ≠ 利润变多" sub="第三本账 / 每股价值与价格"/>
    <Label x={80} y={396} w={470} fill={C.lime}>假设示例 · 期初完成回购</Label>
    <T x={1000} y={399} size={23} anchor="end" fill={C.muted}>PROFIT / SHARES / CASH</T>

    {/* One company enclosure; profit, shares and cash are separate accounts. */}
    <Machine x={80} y={442} w={920} h={965} fill={C.white}>
      <path d="M104 720H974M104 1197H974" stroke={C.ink} strokeWidth="3"/>
      <path d="M583 463V692" stroke={C.line} strokeWidth="2"/>
      <T x={118} y={488} size={22} fill={C.muted}>同一公司 · 各期内股数保持不变</T>
      <T x={122} y={542} size={30}>归属普通股利润</T>
      <Num x={120} y={671} size={142}>100</Num>
      <g transform="translate(375 573)">
        <path d="M0 20h128v71H0Z" fill={C.lime} stroke={C.ink} strokeWidth="3"/>
        <path d="M0 20l18-17h128l-18 17M128 20l18-17v71l-18 17" fill={C.paper} stroke={C.ink} strokeWidth="3"/>
        <T x={64} y={67} size={27} anchor="middle">保持不变</T>
      </g>
      <T x={634} y={511} size={27}>现金储备</T>
      <rect x={633} y={533} width={297} height={113} rx="8" fill={C.paper} stroke={C.ink} strokeWidth="3"/>
      <path d="M650 621h264" stroke={C.ink} strokeWidth="5"/>
      {[0,1,2,3,4,5].map((i)=><Banknote key={i} x={682+i*36} y={600-i%2*7} rotate={-4+i%3*4} opacity={i<3?1:1-shrink*.8}/>)}
      <T x={634} y={685} size={24} fill={cost>.3?C.coral:C.muted}>{cost>.3?'放弃其他资金用途':'回购支付 · 同步流出'}</T>
      <path d="M930 582h39v83" fill="none" stroke={cashFocus>.1?C.coral:C.ink} strokeWidth={cashFocus>.1?7:4}/>
      <path d="M955 649l14 17 14-17" fill="none" stroke={cashFocus>.1?C.coral:C.ink} strokeWidth="4"/>
      {/* Cash leaves while the retired shares leave circulation. */}
      {Array.from({length:5},(_,i)=>{
        const u=clamp((shrink-i*.115)/.42);
        const replay=clamp((cashFocus-i*.10)/.48);
        const v=cashFocus>0?replay:u;
        const visible=v>0&&v<1;
        return <Banknote key={i} x={mix(862,1055,v)} y={mix(577,667,v)} rotate={mix(0,12,v)} opacity={visible?Math.sin(Math.PI*v):0}/>;
      })}
      <g opacity={cashFocus}>
        <rect x={624} y={523} width={315} height={132} rx="14" fill="none" stroke={C.coral} strokeWidth="4"/>
        <T x={979} y={702} anchor="end" size={24} fill={C.coral}>付给卖方</T>
      </g>

      <T x={124} y={770} size={25} fill={C.muted}>{shrink===0?'第1期：固定100股 / 每格1股':shrink===1?'第2期：固定80股 / 每格1股':'两期间：回购并注销20股'}</T>
      <path d="M126 811h585v348H126Z" fill={C.paper} stroke={C.ink} strokeWidth="3"/>
      {/* 10 x 10 physical shares. Last two columns retire into the lower tray. */}
      {Array.from({length:100},(_,i)=>{
        const col=i%10,row=Math.floor(i/10);
        const gone=col>=8;
        const exit=gone?clamp((shrink-(row*.016+(col-8)*.06))/.72):0;
        const baseX=147+col*55,baseY=829+row*31;
        const targetX=790+(col-8)*48,targetY=1067+row*5;
        const x=gone?mix(baseX,targetX,exit):baseX;
        const y=gone?mix(baseY,targetY,exit)-Math.sin(exit*Math.PI)*80:baseY;
        return <Slot key={i} x={x} y={y} w={43} h={23} fill={gone?C.coral:C.lime} opacity={gone?1-E(exit,.70,1):1}/>;
      })}
      <path d="M753 1013v127h178v-127M753 1013h178" fill={C.ink} stroke={C.ink} strokeWidth="4"/>
      <path d="M770 1004l-15 9h176l15-9Z" fill={C.muted}/>
      <T x={842} y={1051} size={25} fill={C.paper} anchor="middle">退出流通</T>
      <Num x={841} y={1122} size={65} fill={C.coral} anchor="middle">{Math.round(20*shrink)}</Num>
      <T x={842} y={1181} size={24} anchor="middle" fill={C.coral} opacity={expensive}>回购价格也重要</T>
      <g opacity={shrink}>
        <Arrow x={730} y={905} w={140}/>
        <T x={800} y={948} size={22} anchor="middle" fill={C.muted}>回购股份</T>
      </g>
      <path d="M147 1173h413" stroke={C.ink} strokeWidth="4"/>
      {Array.from({length:9},(_,i)=><circle key={i} cx={158+i*47} cy={1173} r="7" fill={C.ink}/>)}

      <g>
        <T x={121} y={1251} size={29}>加权平均股数</T>
        <Num x={120} y={1360} size={116}>{shares}</Num>
        <T x={328} y={1356} size={36} fill={C.muted}>股</T>
        <path d="M375 1266h114m-22-18 22 18-22 18" stroke={C.ink} strokeWidth="5" fill="none"/>
        <T x={426} y={1324} size={22} anchor="middle" fill={C.muted}>100 ÷ {shares}</T>
        <rect x={538} y={1222} width={410} height={150} rx="12" fill={C.blue}/>
        <T x={564} y={1260} size={24} fill={C.paper}>每股收益 EPS</T>
        <Num x={565} y={1350} size={99} fill={C.white}>{shownEPS}</Num>
        <g transform={`translate(852 1304) scale(${mix(.7,1,revealEPS)})`} opacity={revealEPS}>
          <circle r="56" fill={C.lime}/><Num x={0} y={17} size={47} anchor="middle">+25%</Num>
        </g>
      </g>
      <rect x={105} y={1208} width={412} height={177} rx="14" fill="none" stroke={C.coral} strokeWidth="4" opacity={avgFocus*(1-.65*cashFocus)}/>
    </Machine>

    {/* Later caveats form an external side branch; the base example stays fixed. */}
    <g opacity={Math.max(avgFocus,issue)}>
      <T x={88} y={1460} size={29} fill={C.ink}>{issue>.2?'新增股份会抵消回购，需看净股数':'两期平均股数 ≠ 年底瞬间买回数量'}</T>
      <g opacity={issue} transform={`translate(${mix(990,866,issue)} 1500)`}>
        {[0,1,2].map(i=><Slot key={i} x={i*12} y={-i*7} w={37} h={25} fill={C.coral}/>)}
        <path d="M-23-1h-55m14-12-14 12 14 12" fill="none" stroke={C.coral} strokeWidth="4"/>
      </g>
      <T x={88} y={1504} size={24} fill={C.muted}>{issue>.2?'期权 / 股权激励 → 新增股份':'假设第二期开始前回购；忽略税费与融资变化'}</T>
    </g>
    <g opacity={1-avgFocus}>
      <Note y={1475}>利润没增加；分母减少，每股结果上升。</Note>
      <T x={80} y={1519} size={23} fill={C.muted}>假设第二期开始前回购20股；各期股数均保持不变。</T>
    </g>
  </g>;
};

export const ValuationStation: React.FC<Props> = ({t,ch}) => {
  const intro=E(t,ch.start,ch.start+1.05);
  const profit=span(t,ch,6,7);
  const multiple=span(t,ch,8,9);
  const verdict=k(t,ch,10,.6);
  const eps=Number((10+2*profit).toFixed(1));
  const pe=Number((30-10*multiple).toFixed(1));
  const price=Number((eps*pe).toFixed(1));
  const priceText=Number.isInteger(price)?String(price):price.toFixed(1);
  const epsText=profit===0?'10':profit===1?'12':eps.toFixed(1);
  const peText=multiple===0?'30':multiple===1?'20':pe.toFixed(1);
  const machinePulse=Math.sin(clamp((t-q(ch,9))/.7)*Math.PI)*7;
  return <g opacity={intro} transform={`translate(0 ${mix(34,0,intro)})`}>
    <Header n="05" title="盈利上升，价格仍能下跌" sub="同一盈利口径 / 股价 = EPS × PE"/>
    <Label x={80} y={396} w={344} fill={C.lime}>另一个假设 · 不含分红</Label>
    <T x={1000} y={397} size={23} anchor="end" fill={C.muted}>PRICE IS A MULTIPLICATION</T>

    {/* The two factors remain visible during every calculation. */}
    <Machine x={84} y={453} w={385} h={370} fill={C.blue}>
      <T x={118} y={512} size={31} fill={C.white}>每股收益</T>
      <T x={429} y={510} size={24} anchor="end" fill={C.paper}>EPS</T>
      <Num x={124} y={667} size={epsText.length>2?134:157} fill={C.white}>{epsText}</Num>
      <T x={438} y={660} size={21} anchor="end" fill={C.paper}>元 / 股</T>
      <path d="M121 692h302" stroke={C.paper} strokeWidth="2" strokeOpacity=".5"/>
      <T x={122} y={741} size={28} fill={C.paper}>期初 10</T>
      <T x={422} y={741} size={28} fill={C.lime} anchor="end" opacity={profit}>本期 12</T>
      <T x={122} y={788} size={25} fill={C.paper}>盈利增长</T>
      <Num x={422} y={793} size={43} fill={C.lime} anchor="end">{profit===0?'0%':'+'+Math.round((eps/10-1)*100)+'%'}</Num>
    </Machine>
    <Machine x={611} y={453} w={385} h={370} fill={C.lime}>
      <T x={648} y={512} size={31}>愿意支付的倍数</T>
      <Num x={650} y={667} size={peText.length>2?134:157}>{peText}</Num>
      <T x={953} y={660} size={25} anchor="end">倍</T>
      <path d="M649 692h304" stroke={C.ink} strokeWidth="2" strokeOpacity=".4"/>
      <T x={649} y={741} size={28}>期初 30</T>
      <T x={953} y={741} size={28} anchor="end" fill={C.coral} opacity={multiple}>本期 20</T>
      <T x={649} y={788} size={25}>市盈率 PE</T>
      <Num x={953} y={793} size={43} fill={C.coral} anchor="end">{multiple===0?'0%':'−'+((1-pe/30)*100).toFixed(1)+'%'}</Num>
    </Machine>
    <g transform={`translate(540 638) rotate(${profit*15-multiple*15})`}>
      <path d="M-25-25l50 50m0-50-50 50" stroke={C.ink} strokeWidth="12" strokeLinecap="square"/>
    </g>

    {/* Physical inputs: earnings piston and a thirty-notch valuation wheel. */}
    <path d="M276 824v91h263M803 824v91H540v75" stroke={C.ink} strokeWidth="14" strokeLinejoin="round" fill="none"/>
    <path d="M276 824v91h263" stroke={C.blue} strokeWidth="6" fill="none"/>
    <path d="M803 824v91H540v75" stroke={C.lime} strokeWidth="6" fill="none"/>
    <g transform={`translate(276 ${mix(866,850,profit)})`}>
      <rect x="-54" y="-13" width="108" height="33" rx="5" fill={C.blue} stroke={C.ink} strokeWidth="3"/>
      <path d="M-41-6H41M-41 2H41M-41 10H41" stroke={C.paper} strokeWidth="2" opacity=".6"/>
    </g>
    <g transform="translate(804 901)">
      <Cog x={0} y={0} r={45} angle={-multiple*120} color={C.ink}/>
      <circle r="20" fill={C.coral}/>
      <path d="M0-12V8l8-4" stroke={C.white} strokeWidth="3" fill="none"/>
    </g>
    <circle cx={540} cy={915} r="34" fill={C.ink}/>
    <path d="M526 901l28 28m0-28-28 28" stroke={C.paper} strokeWidth="6"/>
    <T x={122} y={951} size={23} fill={C.muted}>{profit>0&&multiple===0?'先保持 30 倍：12 × 30 = 360':'两个因子，必须一起计算'}</T>

    <g transform={`translate(0 ${-machinePulse})`}>
      <Machine x={84} y={995} w={912} h={333} fill={C.ink}>
        <T x={125} y={1052} size={28} fill={C.paper}>按当前参数计算的股价</T>
        <T x={948} y={1050} size={23} fill={C.muted} anchor="end">EPS × PE</T>
        <rect x={121} y={1080} width={536} height={204} rx="9" fill={C.paper}/>
        <Num x={153} y={1241} size={priceText.length>3?146:174} fill={multiple>.4?C.coral:C.ink}>{priceText}</Num>
        <T x={618} y={1241} anchor="end" size={32}>元</T>
        <T x={704} y={1125} size={25} fill={C.paper}>期初价格</T>
        <Num x={704} y={1200} size={75} fill={C.paper}>300</Num>
        <T x={704} y={1260} size={24} fill={C.muted}>10 × 30</T>
      </Machine>
    </g>
    {/* One continuous price slider makes the multiplication's outcome physical. */}
    <g transform="translate(121 1358)">
      <path d="M0 0h838" stroke={C.ink} strokeWidth="8"/>
      {[200,240,300,360,400].map((v)=><g key={v} transform={`translate(${(v-200)/200*838} 0)`}>
        <path d="M0-10V11" stroke={C.ink} strokeWidth="3"/>
        <Num x={0} y={43} size={25} anchor="middle" fill={C.muted}>{v}</Num>
      </g>)}
      <g transform={`translate(${clamp((price-200)/200)*838} 0)`}>
        <path d="M-16-23h32v37l-16 15-16-15Z" fill={multiple>.4?C.coral:C.blue} stroke={C.ink} strokeWidth="3"/>
      </g>
    </g>
    <g opacity={verdict} transform={`translate(808 1483) rotate(-5) scale(${mix(.75,1,verdict)})`}>
      <path d="M-168-52h336v100h-336Z" fill={C.coral} stroke={C.ink} strokeWidth="4"/>
      <Num x={0} y={28} size={77} fill={C.ink} anchor="middle">−20%</Num>
    </g>
    <g opacity={verdict>0?0:1}>
      <T x={83} y={1482} size={34} fill={multiple>0?C.coral:C.blue}>计算中：{epsText} × {peText} = {priceText}</T>
    </g>
    <g opacity={verdict}>
      <T x={83} y={1471} size={34}>12 × 20 = 240</T>
      <T x={83} y={1515} size={26} fill={C.muted}>盈利 +20%，股价仍然 −20%。</T>
    </g>
    <T x={83} y={1548} size={22} fill={C.muted}>原创假设；同口径正 EPS；不含分红、费用与税。</T>
  </g>;
};
