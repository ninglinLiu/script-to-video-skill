import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, F, clamp, easeOut, hold, prog, sup } from './theme';
import { Hatch, Kicker } from './ui';
import stats from './stats.json';

type SceneProps = { cues: number[]; duration: number; end: number };

const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>{children}</AbsoluteFill>
);

const Num: React.FC<{ v: string; size?: number; color?: string; weight?: number }> = ({
  v,
  size = 64,
  color = C.paper,
  weight = 600,
}) => (
  <span
    style={{
      fontFamily: F.sans,
      fontSize: size,
      fontWeight: weight,
      color,
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '-0.01em',
    }}
  >
    {v}
  </span>
);

const Glow: React.FC<{ x: number; y: number; r: number; strength?: number }> = ({
  x,
  y,
  r,
  strength = 0.12,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: '50%',
      background: `radial-gradient(circle, rgba(201,162,39,${strength}) 0%, rgba(201,162,39,0) 62%)`,
      filter: 'blur(6px)',
    }}
  />
);

/* ------------------------------------------------------------------ 01 coin */

const COIN = { x: 310, w: 460, top: 470, mid: 700, h: 230 };

const HalfCoin: React.FC<{
  side: 'up' | 'down';
  value: string;
  label: string;
  at: number;
  shift: number;
  dim: number;
}> = ({ side, value, label, at, shift, dim }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 18);
  return (
    <div
      style={{
        position: 'absolute',
        left: COIN.x,
        top: side === 'up' ? COIN.top : COIN.mid,
        width: COIN.w,
        height: COIN.h,
        border: `1.5px solid ${C.gold}`,
        borderBottom: side === 'up' ? 'none' : undefined,
        borderTop: side === 'down' ? 'none' : undefined,
        borderRadius: side === 'up' ? `${COIN.h}px ${COIN.h}px 0 0` : `0 0 ${COIN.h}px ${COIN.h}px`,
        background: side === 'up' ? 'rgba(201,162,39,0.075)' : 'rgba(201,162,39,0.02)',
        transform: `translateY(${(side === 'up' ? -1 : 1) * shift}px)`,
        opacity: p * (1 - dim * 0.4),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <Num v={value} size={100} color={C.goldLight} />
      <div style={{ fontFamily: F.sans, fontSize: 24, letterSpacing: '0.26em', color: C.dim }}>{label}</div>
    </div>
  );
};

export const SceneCoin: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const ask = cues[3];
  const dim = prog(f, ask, 24);
  const shift = 26 * dim;
  const q = prog(f, ask + 2, 20);
  const push = 1 + 0.03 * clamp(f / 200);
  return (
    <Stage>
      <Glow x={540} y={700} r={600} strength={0.13} />
      <Kicker text="硬币实验 · 一轮" at={cues[0] - 4} />
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-70 * dim}px) scale(${push - 0.1 * dim})`, transformOrigin: '540px 700px' }}>
        <div style={{ position: 'absolute', left: COIN.x, top: COIN.top, width: COIN.w, height: COIN.w }}>
          <svg width={COIN.w} height={COIN.w}>
            <circle
              cx={COIN.w / 2}
              cy={COIN.w / 2}
              r={COIN.w / 2 - 1}
              fill="none"
              stroke={C.gold}
              strokeWidth="1.5"
              strokeDasharray="1450"
              strokeDashoffset={1450 * (1 - prog(f, cues[0] - 2, 22))}
              opacity="0.5"
            />
          </svg>
        </div>
        <HalfCoin side="up" value="×1.5" label="正面 · 50%" at={cues[1] - 2} shift={shift} dim={dim} />
        <HalfCoin side="down" value="×0.5" label="反面 · 50%" at={cues[2] - 2} shift={shift} dim={dim} />
        <div
          style={{
            position: 'absolute',
            left: COIN.x,
            top: COIN.mid,
            width: COIN.w,
            height: 1,
            background: C.gold,
            opacity: 0.45 * (1 - dim),
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 1010,
          width: 888,
          opacity: q,
          transform: `translateY(${(1 - q) * 26}px)`,
        }}
      >
        <div style={{ width: 120 * q, height: 1.5, background: C.gold, marginBottom: 30 }} />
        <div style={{ fontFamily: F.serif, fontSize: 88, fontWeight: 700, color: C.paper, lineHeight: 1.22 }}>
          期望 <span style={{ color: C.goldLight }}>1.00</span>
        </div>
        <div style={{ fontFamily: F.serif, fontSize: 68, fontWeight: 600, color: C.paper, lineHeight: 1.36, marginTop: 8 }}>
          为什么大多数人还是亏？
        </div>
      </div>
    </Stage>
  );
};

/* -------------------------------------------------------------- 02 expected */

const FaceRow: React.FC<{
  at: number;
  y: number;
  label: string;
  value: string;
  hot: boolean;
}> = ({ at, y, label, value, hot }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 20);
  return (
    <div
      style={{
        position: 'absolute',
        left: 130,
        top: y,
        width: 820,
        height: 132,
        borderRadius: 18,
        border: `1px solid ${hot ? C.gold + 'AA' : C.gold + '3D'}`,
        background: hot ? 'rgba(201,162,39,0.07)' : 'rgba(255,255,255,0.012)',
        transform: `translateX(${(1 - p) * -36}px)`,
        opacity: p,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 999,
            border: `1.5px solid ${hot ? C.gold : C.faint}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: F.sans,
            fontSize: 22,
            color: hot ? C.goldLight : C.dim,
          }}
        >
          {label.slice(0, 1)}
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 30, color: C.paperDim, letterSpacing: '0.06em' }}>{label}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 26 }}>
        <Num v={value} size={64} color={hot ? C.goldLight : C.paper} />
        <div style={{ fontFamily: F.sans, fontSize: 26, color: C.dim, letterSpacing: '0.1em' }}>50%</div>
      </div>
    </div>
  );
};

export const SceneExpected: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const eq = prog(f, cues[1], 22, easeOut);
  const eq2 = prog(f, cues[2], 16);
  const badge = prog(f, cues[2] + 8, 20);
  const bar = prog(f, cues[0] + 4, 22);
  return (
    <Stage>
      <Kicker text="把两个结果平均" at={cues[0] - 4} />
      <FaceRow at={cues[0]} y={412} label="正面" value="×1.5" hot />
      <FaceRow at={cues[0] + 6} y={562} label="反面" value="×0.5" hot={false} />

      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 792,
          width: 888,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 20,
          opacity: eq,
          transform: `translateY(${(1 - eq) * 16}px)`,
        }}
      >
        <Num v="1.5" size={82} />
        <span style={{ fontFamily: F.sans, fontSize: 50, color: C.dim }}>+</span>
        <Num v="0.5" size={82} />
        <span style={{ fontFamily: F.sans, fontSize: 50, color: C.dim }}>÷</span>
        <Num v="2" size={82} />
        <span style={{ fontFamily: F.sans, fontSize: 50, color: C.gold }}>=</span>
        <span style={{ opacity: eq2, display: 'inline-block', transform: `scale(${0.86 + 0.14 * eq2})` }}>
          <Num v="1.00" size={124} color={C.goldLight} weight={700} />
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 984,
          left: 96,
          width: 888,
          display: 'flex',
          justifyContent: 'center',
          opacity: badge,
        }}
      >
        <div
          style={{
            padding: '14px 32px',
            border: `1px solid ${C.gold}55`,
            borderRadius: 4,
            fontFamily: F.sans,
            fontSize: 27,
            letterSpacing: '0.18em',
            color: C.goldLight,
            background: 'rgba(201,162,39,0.05)',
          }}
        >
          期望乘数 1.00
        </div>
      </div>

      <div style={{ position: 'absolute', top: 1128, left: 96, width: 888, opacity: bar }}>
        <div style={{ display: 'flex', height: 76, border: `1px solid ${C.gold}44` }}>
          <div
            style={{
              width: '50%',
              background: 'rgba(201,162,39,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: F.sans,
              fontSize: 26,
              letterSpacing: '0.2em',
              color: C.goldLight,
              borderRight: `1px solid ${C.gold}55`,
            }}
          >
            正面 50%
          </div>
          <div
            style={{
              width: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: F.sans,
              fontSize: 26,
              letterSpacing: '0.2em',
              color: C.dim,
            }}
          >
            反面 50%
          </div>
        </div>
        <div style={{ marginTop: 14, textAlign: 'center', fontFamily: F.sans, fontSize: 23, color: C.faint, letterSpacing: '0.1em' }}>
          两种结果，各占一半
        </div>
      </div>
    </Stage>
  );
};

/* ------------------------------------------------------------ 03 multiply */

const MX = (r: number) => 150 + r * 390; // rounds -> 150..930
const MY = (v: number) => 600 - ((v - 0.5) / 1.1) * 540; // 0.5..1.6

export const SceneMultiply: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const draw1 = prog(f, cues[1] - 8, 26, easeOut);
  const draw2 = prog(f, cues[2] - 8, 26, easeOut);
  const shade = prog(f, cues[2] - 2, 26);
  const result = prog(f, cues[2] + 2, 18);
  const tokens = [
    { t: '1.00', at: cues[0] - 4 },
    { t: '×', at: cues[1] - 6 },
    { t: '1.5', at: cues[1] - 2 },
    { t: '×', at: cues[2] - 6 },
    { t: '0.5', at: cues[2] - 2 },
    { t: '=', at: cues[2] + 6 },
    { t: '0.75', at: cues[2] + 10 },
  ];
  return (
    <Stage>
      <Kicker text="乘法，不是加法" at={cues[0] - 4} />
      <div
        style={{
          position: 'absolute',
          top: 392,
          left: 96,
          width: 888,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        {tokens.map((tk, i) => {
          const p = prog(f, tk.at, 16);
          const op = tk.t === '×' || tk.t === '=';
          return (
            <span
              key={i}
              style={{
                opacity: p,
                transform: `translateY(${(1 - p) * 14}px)`,
                fontFamily: F.sans,
                fontSize: op ? 46 : 72,
                fontWeight: op ? 400 : 600,
                color: op ? C.dim : i === tokens.length - 1 ? C.goldLight : C.paper,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {tk.t}
            </span>
          );
        })}
      </div>

      <svg width="1080" height="680" style={{ position: 'absolute', top: 520, left: 0 }}>
        <defs>
          <pattern id="lossHatch" width="12" height="12" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="12" stroke={C.gold} strokeWidth="1.4" opacity="0.34" />
          </pattern>
        </defs>
        {[0.5, 0.75, 1.0, 1.25, 1.5].map((v) => (
          <g key={v}>
            <line
              x1={150}
              x2={930}
              y1={MY(v)}
              y2={MY(v)}
              stroke={C.paper}
              strokeWidth="0.8"
              opacity={v === 1 ? 0.16 : 0.08}
            />
            <text
              x={132}
              y={MY(v) + 9}
              textAnchor="end"
              fill={v === 1 ? C.paperDim : C.faint}
              fontSize="28"
              fontFamily={F.sans}
            >
              {v.toFixed(2)}
            </text>
          </g>
        ))}
        <line x1={150} x2={930} y1={MY(1)} y2={MY(1)} stroke={C.goldLight} strokeWidth="1.2" strokeDasharray="7 9" opacity="0.3" />
        <g opacity={shade}>
          <rect
            x={MX(1.62)}
            y={MY(1)}
            width={MX(2) - MX(1.62)}
            height={MY(0.75) - MY(1)}
            fill="rgba(201,162,39,0.05)"
            stroke={C.gold}
            strokeOpacity="0.28"
            strokeDasharray="5 6"
          />
          <rect x={MX(1.62)} y={MY(1)} width={MX(2) - MX(1.62)} height={MY(0.75) - MY(1)} fill="url(#lossHatch)" opacity="0.55" />
        </g>
        <text
          x={330}
          y={MY(1.36)}
          textAnchor="middle"
          fill={C.paperDim}
          fontSize="26"
          fontFamily={F.sans}
          opacity={draw1 * 0.9}
        >
          ×1.5
        </text>
        <text
          x={766}
          y={300}
          textAnchor="middle"
          fill={C.paperDim}
          fontSize="26"
          fontFamily={F.sans}
          opacity={draw2 * 0.9}
        >
          ×0.5
        </text>
        <polyline
          points={`${MX(0)},${MY(1)} ${MX(1)},${MY(1)} ${MX(1)},${MY(1.5)}`}
          fill="none"
          stroke={C.paper}
          strokeWidth="2.6"
          opacity={0.92}
          strokeDasharray={560}
          strokeDashoffset={560 * (1 - draw1)}
        />
        <polyline
          points={`${MX(1)},${MY(1.5)} ${MX(2)},${MY(1.5)} ${MX(2)},${MY(0.75)}`}
          fill="none"
          stroke={C.paper}
          strokeWidth="2.6"
          opacity={0.92}
          strokeDasharray={640}
          strokeDashoffset={640 * (1 - draw2)}
        />
        <circle cx={MX(1)} cy={MY(1.5)} r={draw1 > 0.95 ? 7 : 0} fill={C.paper} />
        <circle cx={MX(2)} cy={MY(0.75)} r={draw2 > 0.95 ? 7 : 0} fill={C.goldLight} />
        <text x={MX(1)} y={MY(1.5) - 26} textAnchor="middle" fill={C.paperDim} fontSize="30" fontFamily={F.sans} opacity={draw1}>
          1.50
        </text>
        <text x={MX(2) + 18} y={MY(0.75) + 11} fill={C.paperDim} fontSize="30" fontFamily={F.sans} opacity={draw2}>
          0.75
        </text>
      </svg>

      <div
        style={{
          position: 'absolute',
          top: 1170,
          left: 96,
          width: 888,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 30,
          opacity: result,
        }}
      >
        <div style={{ fontFamily: F.sans, fontSize: 130, fontWeight: 700, color: C.goldLight, lineHeight: 1 }}>0.75</div>
        <div
          style={{
            marginBottom: 26,
            padding: '10px 22px',
            border: `1px solid ${C.gold}55`,
            borderRadius: 999,
            fontFamily: F.sans,
            fontSize: 30,
            color: C.goldLight,
          }}
        >
          −25%
        </div>
        <div style={{ paddingBottom: 12 }}>
          <div style={{ fontFamily: F.sans, fontSize: 29, color: C.paperDim, letterSpacing: '0.08em' }}>一次上涨 + 一次下跌</div>
          <div style={{ fontFamily: F.serif, fontSize: 40, color: C.paper, marginTop: 8 }}>本金少了四分之一</div>
        </div>
      </div>
    </Stage>
  );
};

/* -------------------------------------------------------------- 04 hundred */

const PX = (r: number) => 96 + (r / 100) * 872;
const PY = (logv: number) => 1104 - ((logv + 7) / 7.25) * 580;

const poly = (pts: number[][]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

export const SceneHundred: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const draw = prog(f, cues[0] + 4, 66, easeOut);
  const num = prog(f, cues[2] - 4, 22);
  const share = prog(f, cues[3] + 2, 24);
  const curve = stats.curve;
  const median = curve.medianTheory.map((v, i) => [PX(i), PY(v)]);
  const samples = curve.samples.map((path) => path.map((v, i) => [PX(i * curve.sampleStep), PY(v)]));
  return (
    <Stage>
      <Kicker text="一百轮之后" at={cues[0] - 4} />

      <svg width="1080" height="1200" style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <clipPath id="grow">
            <rect x="0" y="512" width={872 * draw + 96} height="596" />
          </clipPath>
          <linearGradient id="fadeGold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={C.gold} stopOpacity="0.55" />
            <stop offset="1" stopColor={C.goldLight} stopOpacity="1" />
          </linearGradient>
        </defs>
        {[0, -2, -4, -6].map((v) => (
          <g key={v}>
            <line x1={96} x2={968} y1={PY(v)} y2={PY(v)} stroke={C.paper} strokeWidth="0.8" opacity="0.09" />
            <text x={80} y={PY(v) + 9} textAnchor="end" fill={C.faint} fontSize="27" fontFamily={F.sans}>
              {v === 0 ? '1' : `10${sup(String(v))}`}
            </text>
          </g>
        ))}
        <g clipPath="url(#grow)">
          {samples.map((s, i) => (
            <polyline key={i} points={poly(s)} fill="none" stroke={C.paper} strokeWidth="1" opacity="0.1" />
          ))}
          <polyline points={poly(median)} fill="none" stroke="url(#fadeGold)" strokeWidth="3.2" strokeLinejoin="round" />
          <circle cx={PX(100)} cy={PY(curve.medianTheory[100])} r="6" fill={C.goldLight} />
        </g>
        <line x1={96} x2={968} y1={PY(0)} y2={PY(0)} stroke={C.paper} strokeWidth="1.2" strokeDasharray="7 9" opacity="0.36" />
        <text x={104} y={PY(0) - 16} fill={C.paperDim} fontSize="26" fontFamily={F.sans}>
          起点 1.00
        </text>
        <text x={PX(100)} y={PY(curve.medianTheory[100]) + 44} textAnchor="end" fill={C.goldLight} fontSize="26" fontFamily={F.sans}>
          中位数
        </text>
      </svg>

      <div
        style={{
          position: 'absolute',
          top: 1116,
          left: 96,
          opacity: num,
          transform: `translateY(${(1 - num) * 18}px)`,
        }}
      >
        <div style={{ fontFamily: F.sans, fontSize: 25, letterSpacing: '0.28em', color: C.dim, marginBottom: 8 }}>
          一百轮后的中位数
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontFamily: F.sans, fontSize: 100, fontWeight: 700, color: C.goldLight, fontVariantNumeric: 'tabular-nums' }}>
            5.66
          </span>
          <span style={{ fontFamily: F.sans, fontSize: 52, color: C.paperDim }}>× 10⁻⁷</span>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 1332, left: 96, width: 872, opacity: share }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: F.sans,
            fontSize: 23,
            color: C.dim,
            marginBottom: 12,
          }}
        >
          <span>100 个人 / 100 轮后仍在起点之上</span>
          <span style={{ color: C.goldLight }}>0.33%</span>
        </div>
        <div style={{ position: 'relative', width: 872, height: 10, background: 'rgba(255,255,255,0.07)' }}>
          <div style={{ position: 'absolute', right: 0, top: 0, width: 3, height: 10, background: C.goldLight }} />
          <div style={{ position: 'absolute', right: -5, top: -26, width: 1, height: 22, background: C.goldLight, opacity: 0.45 }} />
        </div>
      </div>
    </Stage>
  );
};

/* --------------------------------------------------------------- 05 average */

const SX = (logv: number) => 96 + ((logv + 7) / 8) * 872;

export const SceneAverage: React.FC<SceneProps> = ({ cues }) => {
  const f = useCurrentFrame();
  const meanP = prog(f, cues[0] - 2, 20);
  const medP = prog(f, cues[2] - 2, 22);
  const bridgeP = prog(f, cues[2] - 2, 24);
  const closeP = prog(f, cues[3] - 2, 20);
  const medLog = Math.log10(stats.sim.finalMedian);
  return (
    <Stage>
      <Kicker text="平均值 ≠ 你的账户" at={cues[0] - 4} />

      <div
        style={{
          position: 'absolute',
          top: 398,
          left: 96,
          width: 888,
          opacity: meanP,
          transform: `translateY(${(1 - meanP) * 16}px)`,
        }}
      >
        <div style={{ fontFamily: F.sans, fontSize: 25, letterSpacing: '0.28em', color: C.dim }}>平均值</div>
        <div style={{ marginTop: 4 }}>
          <span style={{ fontFamily: F.sans, fontSize: 132, fontWeight: 700, color: C.paper, fontVariantNumeric: 'tabular-nums' }}>
            1.00
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 662,
          left: 96,
          width: 888,
          opacity: medP,
          transform: `translateY(${(1 - medP) * 16}px)`,
        }}
      >
        <div style={{ fontFamily: F.sans, fontSize: 25, letterSpacing: '0.28em', color: C.dim }}>中位数 · 一万次模拟</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
          <span style={{ fontFamily: F.sans, fontSize: 88, fontWeight: 700, color: C.goldLight, fontVariantNumeric: 'tabular-nums' }}>
            5.66
          </span>
          <span style={{ fontFamily: F.sans, fontSize: 44, color: C.paperDim }}>× 10⁻⁷</span>
        </div>
      </div>

      <svg width="1080" height="260" style={{ position: 'absolute', top: 884, left: 0, opacity: bridgeP }}>
        {[SX(-7), SX(-6), SX(-5), SX(-4), SX(-3), SX(-2), SX(-1), SX(0)].map((x, i) => (
          <line key={i} x1={x} x2={x} y1={60} y2={68} stroke={C.faint} strokeWidth="1" opacity="0.5" />
        ))}
        <line x1={SX(-7)} x2={SX(0)} y1={60} y2={60} stroke={C.paper} strokeWidth="1" opacity="0.16" />
        <line
          x1={SX(medLog)}
          x2={SX(0)}
          y1={60}
          y2={60}
          stroke={C.goldLight}
          strokeWidth="1.4"
          strokeDasharray="4 8"
          opacity={0.6}
        />
        <circle cx={SX(medLog)} cy={60} r="8" fill={C.goldLight} />
        <circle cx={SX(0)} cy={60} r="8" fill={C.paper} />
        <text x={SX(medLog)} y={34} textAnchor="middle" fill={C.goldLight} fontSize="24" fontFamily={F.sans}>
          大多数人
        </text>
        <text x={SX(0) - 4} y={34} textAnchor="end" fill={C.paperDim} fontSize="24" fontFamily={F.sans}>
          平均值
        </text>
        <text x={(SX(medLog) + SX(0)) / 2} y={120} textAnchor="middle" fill={C.dim} fontSize="27" fontFamily={F.sans}>
          ≈ 6 个数量级
        </text>
      </svg>

      <div
        style={{
          position: 'absolute',
          top: 1100,
          left: 96,
          width: 888,
          opacity: closeP,
          transform: `translateY(${(1 - closeP) * 18}px)`,
        }}
      >
        <div style={{ width: 120 * closeP, height: 1.5, background: C.gold, marginBottom: 28 }} />
        <div style={{ fontFamily: F.serif, fontSize: 74, fontWeight: 600, color: C.paper, lineHeight: 1.36 }}>
          平均值算的是所有人
        </div>
        <div style={{ fontFamily: F.serif, fontSize: 74, fontWeight: 600, color: C.goldLight, lineHeight: 1.36 }}>
          你只走其中一条路
        </div>
      </div>
    </Stage>
  );
};

/* -------------------------------------------------------------- 06 geometric */

export const SceneGeometric: React.FC<SceneProps> = ({ cues, duration }) => {
  const f = useCurrentFrame();
  const rad = prog(f, cues[0] + 10, 24);
  const res = prog(f, cues[1] - 2, 20);
  const bar = prog(f, cues[2] - 4, 24);
  const chain = prog(f, cues[2] + 12, 22);
  const close = prog(f, cues[3] - 2, 22);
  const fade = hold(f, duration, 16);
  return (
    <Stage>
      <div style={{ opacity: fade }}>
        <Glow x={540} y={560} r={520} strength={0.07} />
        <Kicker text="几何平均" at={cues[0] - 4} />

        <div style={{ position: 'absolute', top: 392, left: 96, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span
            style={{
              fontFamily: F.sans,
              fontSize: 92,
              color: C.gold,
              opacity: rad,
              transform: `scaleY(${0.55 + 0.45 * rad})`,
            }}
          >
            √
          </span>
          <div style={{ position: 'relative', padding: '0 10px' }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: -12,
                width: `${100 * rad}%`,
                height: 2,
                background: C.gold,
                opacity: 0.85,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, paddingTop: 10, opacity: rad }}>
              <Num v="1.5" size={70} />
              <span style={{ fontFamily: F.sans, fontSize: 42, color: C.dim }}>×</span>
              <Num v="0.5" size={70} />
            </div>
          </div>
          <span style={{ fontFamily: F.sans, fontSize: 54, color: C.gold, opacity: res, marginLeft: 8 }}>=</span>
          <span
            style={{
              opacity: res,
              transform: `translateY(${(1 - res) * 14}px)`,
              fontFamily: F.sans,
              fontSize: 104,
              fontWeight: 700,
              color: C.goldLight,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            0.866
          </span>
        </div>

        <div style={{ position: 'absolute', top: 586, left: 96, width: 888, opacity: bar }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: F.sans,
              fontSize: 24,
              color: C.dim,
              marginBottom: 12,
            }}
          >
            <span>每一轮的几何收益</span>
            <span style={{ color: C.goldLight }}>−13.4%</span>
          </div>
          <div style={{ position: 'relative', width: 888, height: 50, border: `1px solid ${C.gold}33` }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.03)' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, width: 119, height: 50, background: 'rgba(181,84,60,0.14)' }}>
              <Hatch w={119} h={50} color={C.ember} />
            </div>
            <div style={{ position: 'absolute', left: 769, top: -1, width: 1.5, height: 52, background: C.goldLight }} />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: F.sans,
              fontSize: 21,
              color: C.faint,
              marginTop: 8,
            }}
          >
            <span>1.000</span>
            <span>0.866</span>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 760,
            left: 96,
            width: 888,
            opacity: chain,
            fontFamily: F.sans,
            fontSize: 29,
            color: C.paperDim,
          }}
        >
          连续一百轮：<span style={{ color: C.goldLight }}>0.866¹⁰⁰ ≈ 5.66 × 10⁻⁷</span>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 900,
            left: 96,
            width: 888,
            opacity: close,
            transform: `translateY(${(1 - close) * 20}px)`,
          }}
        >
          <div style={{ width: 120 * close, height: 1.5, background: C.gold, marginBottom: 32 }} />
          <div style={{ fontFamily: F.serif, fontSize: 90, fontWeight: 700, color: C.paper, lineHeight: 1.26 }}>期望决定要不要玩</div>
          <div style={{ fontFamily: F.serif, fontSize: 90, fontWeight: 700, color: C.goldLight, lineHeight: 1.26 }}>
            几何决定押多少
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 1340,
            left: 96,
            width: 888,
            opacity: close * 0.7,
            fontFamily: F.sans,
            fontSize: 22,
            color: C.faint,
            letterSpacing: '0.06em',
          }}
        >
          推导与模拟：本地脚本 · 10,000 条路径 × 100 轮 · Kelly 1956
        </div>
      </div>
    </Stage>
  );
};
