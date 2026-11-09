import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import timing from './timing.json';
import content from './content.generated.json';
import './style.css';
import './vertical.css';

const P = '#F5EFDE', I = '#112B37', B = '#174ACC', R = '#EF643E', G = '#167D6A';
const W = 1080, H = 1920, M = 72;
const L = content.labels as Record<string, string>;

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => { v = clamp(v); return v * v * v * (v * (v * 6 - 15) + 10); };
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const ch = timing.chapters;
const q = (c: number, n: number) => timing.cues[ch[c].cueStart + n].start;
const enter = (t: number, s: number, d = 0.7) => ease((t - s) / d);
const num = (k: string) => L[k] ?? k;

function phase(t: number) { let i = 0; for (let k = 1; k < ch.length; k++) if (t >= ch[k].start) i = k; return i; }

const Key: React.FC<{ children: React.ReactNode; at: number; t: number }> = ({ children, at, t }) => (
  <div className="kicker" style={{ top: 128, left: M, color: '#6B7E80', opacity: enter(t, at, .5) }}>{children}</div>
);

const H1: React.FC<{ children: React.ReactNode; y: number; at: number; t: number; size?: number; color?: string }> = ({
  children, y, at, t, size = 62, color = I,
}) => (
  <div style={{
    position: 'absolute', left: M, top: y, width: W - M * 2, fontFamily: 'Serif', fontSize: size, lineHeight: 1.3,
    color, opacity: enter(t, at, .62), transform: `translateY(${mix(22, 0, enter(t, at, .62))}px)`,
  }}>{children}</div>
);

const Rule: React.FC<{ y: number; at: number; t: number; color?: string; w?: number }> = ({ y, at, t, color = I, w = W - M * 2 }) => (
  <div style={{ position: 'absolute', left: M, top: y, width: w * enter(t, at, .7), height: 2, background: color, opacity: .22 }} />
);

/** 01 — the liquidation slip, reusing the migrated receipt treatment. */
const Statement: React.FC<{ t: number }> = ({ t }) => {
  const p = enter(t, q(0, 0) - .2, .8), s = enter(t, q(0, 1), .8);
  const rows = [
    ['卖方', 'Situational Awareness'],
    ['团队', `${num('people')} 人 · 25 岁创始人`],
    ['公开持仓', `${num('book')} 亿美元`],
    ['用时', `${num('hours')}小时`],
    ['买方', 'Citadel'],
  ];
  return <>
    <Key t={t} at={q(0, 0) - .4}>01 / 一条成交记录</Key>
    <H1 t={t} at={q(0, 0) - .1} y={172} size={58}>八个人，卖掉了 {num('book')} 亿美元的仓位。</H1>
    <div style={{ position: 'absolute', left: M, top: 372, width: W - M * 2, height: 660, opacity: p }}>
      <div className="receipt" style={{ height: 640, padding: '38px 42px', borderTopWidth: 10 }}>
        <div className="receipt-top" style={{ fontSize: 24 }}>清仓成交单<span>2026 · 07 · 30</span></div>
        <div style={{ marginTop: 26, fontSize: 17, letterSpacing: 4, color: '#718080' }}>PUBLIC BOOK · SOLD IN 36 HOURS</div>
        <div style={{ fontFamily: 'Anton', fontSize: 150, lineHeight: 1.1, marginTop: 4 }}>
          36<span style={{ fontFamily: 'Sans', fontSize: 34, marginLeft: 12, letterSpacing: 2 }}>小时</span>
        </div>
        <div className="receipt-dash" />
        {rows.map(([k, v], i) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 25, marginTop: i ? 14 : 0, opacity: enter(t, q(0, 1) + i * .06, .5) }}>
            <span style={{ color: '#5d7276' }}>{k}</span><b style={{ fontWeight: 700 }}>{v.replace('{{book}}', num('book'))}</b>
          </div>
        ))}
        <div className="stamp" style={{ top: 520, left: 34, borderColor: R, color: R, opacity: s, transform: `rotate(-4deg) scale(${mix(1.3, 1, s)})` }}>折价成交</div>
        <div className="barcode">{Array.from({ length: 46 }, (_, i) => <i key={i} style={{ width: i % 3 === 0 ? 4 : 2, marginRight: i % 4 === 0 ? 4 : 2 }} />)}</div>
      </div>
    </div>
  </>;
};

/** 02 — three bound statistics, stacked as receipt rows. */
const Rise: React.FC<{ t: number }> = ({ t }) => {
  const items = [
    { k: '上半年净回报', v: num('ret'), at: q(1, 0) },
    { k: '规模', v: `${num('aumStart')} 亿 → ${num('aumPeak')} 亿`, at: q(1, 1), note: `${num('aumMultiple')}，八个月` },
    { k: '杠杆', v: num('lev'), at: q(1, 2), note: '总收益互换' },
  ];
  return <>
    <Key t={t} at={q(1, 0) - .4}>02 / 封神</Key>
    <H1 t={t} at={q(1, 0) - .1} y={172} size={58}>上半年，他站在最亮的地方。</H1>
    {items.map((it, i) => {
      const p = enter(t, it.at - .15, .6);
      return <div key={it.k} style={{
        position: 'absolute', left: M, top: 392 + i * 250, width: W - M * 2,
        borderTop: `2px solid ${I}30`, paddingTop: 22, opacity: p, transform: `translateX(${mix(40, 0, p)}px)`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 28, color: '#63777a', letterSpacing: 3 }}>{it.k}</span>
          <span style={{ fontFamily: 'Anton', fontSize: 78, color: i === 2 ? R : B, letterSpacing: 1 }}>{it.v}</span>
        </div>
        {it.note && <div style={{ textAlign: 'right', fontSize: 22, color: '#6b7e80', marginTop: 6 }}>{it.note}</div>}
      </div>;
    })}
    <div style={{ position: 'absolute', left: M, top: 1176, width: W - M * 2, fontFamily: 'Serif', fontSize: 34, opacity: enter(t, q(1, 2) + .5, .7) }}>
      4 倍杠杆，把 439% 变成了“必须一直对”。
    </div>
  </>;
};

/** 03 — two legs hit at once, with leverage in the middle. */
const Squeeze: React.FC<{ t: number }> = ({ t }) => {
  const a = enter(t, q(2, 0) - .1, .7), b = enter(t, q(2, 1), .6), c = enter(t, q(2, 2), .65);
  const Bar: React.FC<{ side: 'L' | 'R'; label: string; value: string; color: string; p: number; y: number }> = ({ side, label, value, color, p, y }) => (
    <div style={{ position: 'absolute', top: y, left: side === 'L' ? M : 556, width: 452, opacity: p,
      transform: `translateY(${mix(24, 0, p)}px)` }}>
      <div style={{ fontSize: 26, color, fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: 'Anton', fontSize: 86, color, lineHeight: 1.1, marginTop: 8 }}>{value}</div>
    </div>
  );
  return <>
    <Key t={t} at={q(2, 0) - .4}>03 / 两条腿同时挨打</Key>
    <H1 t={t} at={q(2, 0) - .1} y={172} size={56}>做多的一端在跌，做空的一端在涨。</H1>
    <Rule t={t} at={q(2, 0)} y={392} />
    <Bar side="L" label="做多 · AI 基建" value={`−${num('nebius')}`} color={R} p={a} y={432} />
    <Bar side="L" label="其中 SanDisk" value={`−${num('sandisk')}`} color={R} p={enter(t, q(2, 0) + .8, .6)} y={600} />
    <Bar side="R" label="做空 · 软件股" value="反弹" color={B} p={b} y={432} />
    <div style={{ position: 'absolute', left: M, top: 792, width: W - M * 2, borderTop: `2px solid ${I}30`, opacity: c }} />
    <div style={{ position: 'absolute', left: M, top: 820, opacity: c, transform: `translateY(${mix(20, 0, c)}px)` }}>
      <div style={{ fontSize: 26, color: '#63777a', letterSpacing: 3 }}>乘数</div>
      <div style={{ fontFamily: 'Anton', fontSize: 132, color: I, lineHeight: 1.05 }}>{num('lev')}</div>
      <div style={{ fontFamily: 'Serif', fontSize: 34, lineHeight: 1.5, marginTop: 10 }}>方向没错，两边一起亏，<br />杠杆把亏损放大。</div>
    </div>
  </>;
};

/** 04 — the 36-hour timeline, migrated from the numbered decision rows. */
const Timeline: React.FC<{ t: number }> = ({ t }) => {
  const rows = [
    { at: q(3, 0), when: '07 / 24', what: '致投资者信：最具吸引力的买入窗口之一', tone: B },
    { at: q(3, 1), when: '07 / 29', what: '三家主经纪商同时追加保证金', tone: R },
    { at: q(3, 2), when: '07 / 30', what: '全部公开持仓折价交给 Citadel', tone: I },
  ];
  return <>
    <Key t={t} at={q(3, 0) - .4}>04 / 三十六小时</Key>
    <H1 t={t} at={q(3, 0) - .1} y={172} size={56}>信还没等到钱，保证金先到了。</H1>
    <div style={{ position: 'absolute', left: M + 18, top: 420, width: 2, height: 620 * enter(t, q(3, 0), 1), background: `${I}30` }} />
    {rows.map((r, i) => {
      const p = enter(t, r.at - .2, .65);
      return <div key={r.when} style={{ position: 'absolute', left: M, top: 412 + i * 236, width: W - M * 2, opacity: p, transform: `translateX(${mix(34, 0, p)}px)` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 28 }}>
          <span style={{ fontFamily: 'Anton', fontSize: 46, color: r.tone, minWidth: 150 }}>{r.when}</span>
          <span style={{ fontFamily: 'Serif', fontSize: 36, lineHeight: 1.45 }}>{r.what}</span>
        </div>
      </div>;
    })}
    <div style={{ position: 'absolute', left: M, top: 1180, width: W - M * 2, fontSize: 24, color: '#6b7e80', opacity: enter(t, q(3, 2) + .4, .6) }}>
      前一天的追加资金邀请，没有等到 8 月 1 日。
    </div>
  </>;
};

/** 05 — the reversal right after the sale: two separate readings, not one shared axis. */
const Dawn: React.FC<{ t: number }> = ({ t }) => {
  const a = enter(t, q(4, 0) - .1, .7), b = enter(t, q(4, 0) + .8, .7), c = enter(t, q(4, 1) - .1, .7);
  const Row: React.FC<{ at: number; p: number; label: string; value: string; color: string; y: number; note: string }> = ({ p, label, value, color, y, note }) => (
    <div style={{ position: 'absolute', left: M, top: y, width: W - M * 2, opacity: p, transform: `translateY(${mix(26, 0, p)}px)` }}>
      <div style={{ borderTop: `2px solid ${I}30`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 30, color: '#63777a', letterSpacing: 2 }}>{label}</span>
        <span style={{ fontFamily: 'Anton', fontSize: 96, color, letterSpacing: 1 }}>{value}</span>
      </div>
      <div style={{ textAlign: 'right', fontSize: 22, color: '#6b7e80', marginTop: 6 }}>{note}</div>
    </div>
  );
  return <>
    <Key t={t} at={q(4, 0) - .4}>05 / 黎明前五分钟</Key>
    <H1 t={t} at={q(4, 0) - .1} y={172} size={56}>他卖完的当天，市场开始反攻。</H1>
    <Row p={a} at={q(4, 0)} label="卖出当天 · 纳斯达克 100" value={`+${num('nasdaq')}`} color={R} y={430} note="他清仓的同一个交易日" />
    <Row p={b} at={q(4, 0) + .9} label="AI 概念股 · 报复性反弹" value={`+${num('reboundLow')}–${num('reboundHigh')}`} color={B} y={700} note="来自文章的转述：15%–25%" />
    <div style={{ position: 'absolute', left: M, top: 1010, width: W - M * 2, fontFamily: 'Serif', fontSize: 38, lineHeight: 1.55, opacity: c }}>
      他看对了方向，<br />却死在黎明前五分钟。
    </div>
  </>;
};

/** 06 — the author's verdict, kept verbatim. */
const Verdict: React.FC<{ t: number }> = ({ t }) => {
  const a = enter(t, q(5, 0) - .1, .8), b = enter(t, q(5, 1) - .1, .8);
  return <>
    <Key t={t} at={q(5, 0) - .4}>06 / 结论</Key>
    <div style={{ position: 'absolute', left: M, top: 420, width: W - M * 2, fontFamily: 'Serif', fontSize: 66, lineHeight: 1.42, opacity: a, transform: `translateY(${mix(24, 0, a)}px)` }}>
      杠杆不改变方向，<br />只改变速度。
    </div>
    <div style={{ position: 'absolute', left: M, top: 800, width: W - M * 2, fontFamily: 'Serif', fontSize: 44, lineHeight: 1.6, color: R, opacity: b }}>
      方向再对，<br />也要活到兑现的那一天。
    </div>
    <div style={{ position: 'absolute', left: M, top: 1060, width: W - M * 2, fontSize: 24, color: '#6b7e80', lineHeight: 1.7, opacity: b }}>
      凯撒的复盘：市场不评判你想得多聪明，<br />只评判你能不能活下去。
    </div>
  </>;
};

const scenes = [Statement, Rise, Squeeze, Timeline, Dawn, Verdict];

export const Chapter: React.FC<{ captions?: boolean }> = ({ captions = true }) => {
  const t = useCurrentFrame() / 30, k = phase(t);
  const sub = timing.subtitles.find((s) => t >= s.start && t <= s.end + .08);
  return <AbsoluteFill style={{ width: W, height: H, background: P, color: I, fontFamily: 'Sans', overflow: 'hidden' }}>
    <div className="texture" />
    <div style={{ position: 'absolute', left: M, right: M, top: 52, display: 'flex', justifyContent: 'space-between', fontSize: 18, letterSpacing: 2, color: '#6b7e80' }}>
      <span>凯撒的复利实验室</span><span>LEOPOLD / A 60-SECOND CASE</span>
    </div>
    <Rule t={t} at={0} y={84} />
    {scenes.map((Scene, i) => {
      const incoming = enter(t, ch[i].start + (i === 0 ? 0 : .22), .35);
      const outgoing = i < 5 ? 1 - enter(t, ch[i + 1].start - .30, .30) : 1;
      const opacity = (i === 0 ? 1 : incoming) * outgoing;
      if (opacity < .001) return null;
      return <div key={i} style={{ position: 'absolute', inset: 0, opacity, transform: 'translateY(78px)' }}><Scene t={t} /></div>;
    })}
    {captions && sub && <div className="subtitle"><span>{sub.text}</span></div>}
    <div style={{ position: 'absolute', bottom: 46, left: M, right: M, height: 3, background: '#112B3718' }}>
      <div style={{ height: 3, width: `${(t / timing.seconds) * 100}%`, background: B }} />
    </div>
    <div style={{ position: 'absolute', bottom: 14, left: M, fontSize: 16, color: '#82908e' }}>
      凯撒文章改编 · 数字沿用原文口径 · 不构成投资建议
    </div>
    <div style={{ position: 'absolute', bottom: 14, right: M, fontSize: 17, fontFamily: 'Anton', color: '#82908e' }}>
      {String(k + 1).padStart(2, '0')} / 06
    </div>
  </AbsoluteFill>;
};
