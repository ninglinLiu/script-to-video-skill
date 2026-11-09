import React from 'react';
import {C, colors, Props, E, mix, T, Num, Header, Machine, Company, Track, q} from './design';

// Both stations are fixed in the shared world. Only objects inside the machinery
// move; root Film owns the continuous camera between stations.
const Lock = ({x, y, lit = 0}: {x: number; y: number; lit?: number}) => <g transform={`translate(${x} ${y})`}>
  <path d="M9 20V10a13 13 0 0 1 26 0v10" fill="none" stroke={lit > .1 ? C.lime : C.paper} strokeWidth="6"/>
  <rect x="1" y="20" width="42" height="35" rx="5" fill={lit > .1 ? C.lime : C.paper}/>
  <circle cx="22" cy="34" r="4" fill={C.ink}/><path d="M22 34v10" stroke={C.ink} strokeWidth="4"/>
</g>;

const weights = [50, 20, 15, 10, 5];

export const WeightStation = ({t, ch}: Props) => {
  // A single roster unfolds into a scale. Numeric amounts are front-on.
  const unfold = E(t, q(ch, 2) - .12, q(ch, 2) + 1.08);
  const hypothetical = E(t, q(ch, 5) - .12, q(ch, 5) + .42);
  const cut = E(t, q(ch, 10) + .1, q(ch, 11) + .12);
  const transfer = E(t, q(ch, 11) + .12, q(ch, 12) + .48);
  const impact = E(t, q(ch, 12) + .1, q(ch, 12) + .65);
  const held = E(t, q(ch, 13), q(ch, 13) + .45);
  const finalUnits = cut > .001;
  const unit = 11.2, barX = 252, rowY = 634, rowGap = 110, rowH = 70;
  const chunkStartX = barX + (50 - 5 * cut) * unit;
  // Route the loss through the outside conduit, away from every data label.
  const chunkX = mix(mix(chunkStartX, 970, E(transfer,.18,.4)),870,E(transfer,.87,1));
  const chunkY = mix(mix(rowY,550,E(transfer,0,.18)),1242,E(transfer,.4,.87));
  const chunkOpacity = cut * (1 - E(transfer, .88, 1));
  const readout = 100 - 5 * cut;

  return <g>
    <Header n="02" title="公司多，分量不相等" sub="自由流通市值 → 权重 → 指数贡献"/>
    <Machine x={75} y={415} w={930} h={970}>
      <path d="M108 566h864M108 1175h864" stroke={C.muted} strokeWidth="2"/>
      <T x={116} y={478} size={29} fill={C.line}>WEIGHT / CONTRIBUTION</T>
      <T x={116} y={531} size={34} fill={C.paper}>
        {finalUnits ? '期末资产 · 以期初 100 为基准' : hypothetical > .5 ? '五家公司 · 期初权重' : '同一份名单，不同的分量'}
      </T>
      <g opacity={1 - unfold}>
        <path d="M145 803h784" stroke={C.line} strokeWidth="14"/>
        <path d="M534 805l-47 80h94Z" fill={C.coral}/>
        <path d="M371 895h328" stroke={C.paper} strokeWidth="10"/>
        <Track x={115} y={761} w={835}/>
        <T x={540} y={1050} size={43} fill={C.paper} anchor="middle">名字可以等大</T>
        <T x={540} y={1120} size={43} fill={C.lime} anchor="middle">影响，不能等分。</T>
      </g>

      {weights.map((amount, i) => {
        const y = rowY + i * rowGap;
        const stagger = [6, 7, 8, 9, 9][i];
        const reveal = E(t, q(ch, stagger) + (i === 4 ? .23 : 0), q(ch, stagger) + .5 + (i === 4 ? .23 : 0));
        const measured = E(t, q(ch, 2) + .35 + i * .12, q(ch, 2) + 1.7 + i * .12);
        const v = amount - (i === 0 ? 5 * cut : 0);
        const w = v * unit;
        const currentX = mix(125 + i * 169, 117, unfold);
        const currentY = mix(614, y + 4, unfold);
        return <React.Fragment key={i}>
          <g opacity={unfold}>
            <path d={`M${barX} ${y + rowH + 9}h${50 * unit}`} stroke={C.muted} strokeWidth="2"/>
            {[0, 1, 2, 3, 4, 5].map(j => <path key={j} d={`M${barX + j * unit * 10} ${y + rowH + 5}v8`} stroke={C.muted} strokeWidth="2"/>)}
            <rect x={barX} y={y} width={50 * unit} height={rowH} rx="2" fill={C.paper} opacity=".075"/>
            <rect x={barX} y={y} width={w * measured} height={rowH} rx="2" fill={colors[i]}/>
            <path d={`M${barX} ${y + rowH}h${w * measured}`} stroke="#000" strokeOpacity=".3" strokeWidth="8"/>
            <g opacity={hypothetical}>
              <Num x={945} y={y + 53} size={58} fill={C.paper} anchor="end" opacity={reveal}>
                {i === 0 && finalUnits ? v.toFixed(cut < 1 ? 1 : 0) : amount}{finalUnits ? '' : '%'}
              </Num>
              <T x={945} y={y + 82} size={20} fill={C.line} anchor="end" opacity={reveal}>
                {finalUnits ? '资产单位' : '期初权重'}
              </T>
            </g>
          </g>
          <Company x={currentX} y={currentY} id={i} w={106} h={130} scale={mix(1, .58, unfold)}/>
        </React.Fragment>;
      })}

      <g opacity={E(t, q(ch, 10), q(ch, 10) + .3)}>
        <rect x="724" y="479" width="226" height="58" rx="3" fill={C.coral}/>
        <T x={748} y={520} size={31}>A</T><Num x={923} y={523} anchor="end" size={40}>−10%</Num>
      </g>
      <g opacity={cut}>
        <path d="M785 586h212v656h-95" fill="none" stroke={C.coral} strokeOpacity=".35" strokeWidth="4" strokeDasharray="8 9"/>
        <path d="M914 1230l-18 12 18 12" fill="none" stroke={C.coral} strokeWidth="4"/>
      </g>
      <g transform={`translate(${chunkX} ${chunkY})`} opacity={chunkOpacity}>
        <rect x="0" y="0" width={5 * cut * unit} height={rowH} fill={C.coral} stroke={C.white} strokeWidth="2"/>
        <Num x={28 * cut} y="51" size="40" anchor="middle" opacity={E(cut,.9,1)}>5</Num>
      </g>

      <g opacity={unfold}>
        <rect x="111" y="1211" width="857" height="139" rx="10" fill={C.paper}/>
        <T x={139} y={1249} size={23} fill={C.muted}>组合读数</T>
        <Num x={135} y={1333} size={88}>{readout.toFixed(cut > 0 && cut < 1 ? 1 : 0)}</Num>
        <T x={391} y={1251} size={25}>期初总额</T>
        <Num x={392} y={1321} size={58}>100</Num>
        <path d="M552 1241v82" stroke={C.line} strokeWidth="2"/>
        <T x={590} y={1251} size={24}>{impact > .5 ? 'A 贡献的组合变动' : '只有 A 的资产变少'}</T>
        <Num x={592} y={1325} size={70} fill={C.coral} opacity={impact}>−5%</Num>
        <T x={819} y={1322} size={26} fill={C.blue} opacity={held}>A 仍在名单</T>
      </g>
    </Machine>
    <T x={80} y={1432} size={24} fill={C.muted}>原创假设：期初权重 50 / 20 / 15 / 10 / 5%；仅 A 跌 10%。</T>
    <T x={80} y={1468} size={24} fill={C.muted}>其余价格不变，无换股、分红等调整；期末显示资产单位，非新权重。</T>
  </g>;
};

export const DriftStation = ({t, ch}: Props) => {
  const enter = E(t, q(ch, 2) - .22, q(ch, 3) + .15);
  const grow = E(t, q(ch, 4) + .05, q(ch, 5) + .35);
  const explainRatio = E(t, q(ch, 6) - .1, q(ch, 6) + .55);
  const locked = E(t, q(ch, 7) - .1, q(ch, 7) + .45);
  const caveat = E(t, q(ch, 9), q(ch, 9) + .45);
  const a = 100 + 100 * grow;
  const ratio = a / (a + 100);
  const stripX = 131, stripW = 816, stripY = 1332;
  // 200 units occupy 430 px. Keep both bars on the same scale and leave
  // a full text line between the machine heading and the tallest number.
  const base = 1096, unit = 2.15;

  return <g>
    <Header n="03" title="权重变大，不等于追涨" sub="市值变化 → 权重漂移；股数可以锁定不动"/>
    <Machine x={80} y={415} w={920} h={880}>
      <T x={122} y={480} size={29} fill={C.line}>MARKET VALUE / FIXED HOLDINGS</T>
      <T x={122} y={536} size={caveat > .5 ? 30 : 35} fill={caveat > .5 ? C.lime : C.paper}>
        {caveat > .5 ? '成分调整与申赎，仍可能带来交易' : '两家公司 · 同一计量尺度'}
      </T>
      <g opacity={enter}>
        {[100, 200].map(v => <g key={v}>
          <path d={`M176 ${base - v * unit}h725`} stroke={C.muted} strokeWidth="2" strokeDasharray="4 10"/>
          <Num x={151} y={base - v * unit + 11} size={28} fill={C.line} anchor="end">{v}</Num>
        </g>)}
      </g>
      {[a, 100].map((v, i) => {
        const x = 213 + i * 423;
        const h = v * unit * enter;
        const top = base - h;
        return <g key={i}>
          <g opacity={enter}>
            <path d={`M${x + 220} ${top}l17 -13v${h}l-17 13Z`} fill={colors[i]} opacity=".45"/>
            <path d={`M${x} ${top}l17 -13h220l-17 13Z`} fill={C.paper}/>
            <rect x={x} y={top} width="220" height={Math.max(.1, h)} fill={colors[i]}/>
            <Num x={x + 110} y={top - 28} size={91} fill={C.paper} anchor="middle">{Math.round(v)}</Num>
            <T x={x + 110} y={top + 54} size={25} anchor="middle" fill={i === 1 ? C.white : C.ink}>
              {i === 0 && grow > .01 ? '市值上涨' : '市值'}
            </T>
          </g>
          <Company id={i} x={x + 35} y={962} w={142} h={130}/>
          <path d={`M${x - 15} 1110h270`} stroke={C.paper} strokeWidth="7"/>
          <g transform={`translate(${x - 33} 1155)`}>
            <rect width="284" height="94" rx="8" fill={C.paper} fillOpacity={mix(.07, .16, locked)} stroke={locked > .1 ? C.lime : C.muted} strokeWidth={mix(1, 3, locked)}/>
            <Lock x={17} y={24} lit={locked}/>
            <T x={78} y={40} size={24} fill={C.paper}>持有股数</T>
            <T x={78} y={75} size={30} fill={locked > .1 ? C.lime : C.paper}>保持不变</T>
          </g>
        </g>;
      })}
    </Machine>

    <g opacity={enter}>
      <rect x={stripX} y={stripY} width={stripW} height="76" fill={C.ink}/>
      <rect x={stripX + 4} y={stripY + 4} width={stripW * ratio - 4} height="68" fill={C.lime}/>
      <rect x={stripX + stripW * ratio + 3} y={stripY + 4} width={stripW * (1 - ratio) - 7} height="68" fill={C.blue}/>
      <T x={stripX + 24} y={stripY + 48} size={32}>A</T>
      <Num x={stripX + stripW * ratio - 22} y={stripY + 55} size={46} anchor="end">
        {grow < .001 ? '1/2' : grow > .999 ? '2/3' : `${(ratio * 100).toFixed(1)}%`}
      </Num>
      <T x={stripX + stripW * ratio + 24} y={stripY + 48} size={32} fill={C.white}>B</T>
      <Num x={stripX + stripW - 23} y={stripY + 55} size={46} anchor="end" fill={C.white}>
        {grow < .001 ? '1/2' : grow > .999 ? '1/3' : `${((1 - ratio) * 100).toFixed(1)}%`}
      </Num>
      <path d={`M${stripX + stripW * ratio} ${stripY - 15}v106`} stroke={C.ink} strokeWidth="5"/>
      <g opacity={explainRatio}>
        <circle cx={stripX + stripW * ratio} cy={stripY - 17} r="8" fill={C.coral}/>
        <path d={`M${stripX + stripW * ratio} ${stripY - 17}v-23h70`} stroke={C.coral} strokeWidth="3" fill="none"/>
      </g>
    </g>
    <T x={80} y={1446} size={23} fill={C.muted}>原创假设：市值 100/100 → 200/100；股本、流通比例及持有股数不变。</T>
    <T x={80} y={1479} size={23} fill={C.muted}>本例无主动交易。价格上涨本身，就能改变市值占比。</T>
  </g>;
};
