import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, F, prog, easeOut } from './theme';

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

export const Grain: React.FC<{opacity?: number}> = ({ opacity = 0.055 }) => (
  <AbsoluteFill
    style={{
      backgroundImage: NOISE,
      backgroundSize: '180px 180px',
      opacity,
      mixBlendMode: 'overlay',
      pointerEvents: 'none',
    }}
  />
);

export const Ground: React.FC<{warm?: number}> = ({ warm = 1 }) => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 70% at 18% -10%, rgba(201,162,39,${0.16 * warm}) 0%, rgba(201,162,39,0) 58%),
                     radial-gradient(90% 60% at 92% 108%, rgba(90,110,150,${0.1 * warm}) 0%, rgba(0,0,0,0) 60%)`,
      }}
    />
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 74%, rgba(0,0,0,0.55) 100%)',
      }}
    />
  </AbsoluteFill>
);

/** Small gold label with a rule that draws itself. */
export const Kicker: React.FC<{
  text: string;
  at: number;
  x?: number;
  y?: number;
  width?: number;
}> = ({ text, at, x = 96, y = 236, width = 240 }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 16);
  const r = prog(f, at + 6, 20);
  return (
    <div style={{ position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{ width: width * r, height: 1.5, background: C.gold, opacity: 0.85 }} />
      <div
        style={{
          fontFamily: F.sans,
          fontSize: 27,
          fontWeight: 500,
          letterSpacing: '0.34em',
          color: C.goldLight,
          opacity: p,
          transform: `translateY(${(1 - p) * 8}px)`,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Section title in serif, revealed line by line. */
export const Title: React.FC<{
  lines: string[];
  at: number;
  x?: number;
  y?: number;
  size?: number;
  gap?: number;
  color?: string;
  align?: 'left' | 'center';
  width?: number;
}> = ({ lines, at, x = 96, y = 320, size = 62, gap = 14, color = C.paper, align = 'left', width = 888 }) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        textAlign: align,
        fontFamily: F.serif,
        fontSize: size,
        lineHeight: 1.34,
        fontWeight: 600,
        color,
        letterSpacing: '0.02em',
      }}
    >
      {lines.map((line, i) => {
        const p = prog(f, at + i * 9, 18, easeOut);
        return (
          <div key={i} style={{ opacity: p, transform: `translateY(${(1 - p) * 18}px)`, marginTop: i ? gap : 0 }}>
            {line}
          </div>
        );
      })}
    </div>
  );
};

export const Hatch: React.FC<{w: number; h: number; color?: string; angle?: number}> = ({
  w,
  h,
  color = C.gold,
  angle = 45,
}) => (
  <div
    style={{
      position: 'absolute',
      width: w,
      height: h,
      backgroundImage: `repeating-linear-gradient(${angle}deg, ${color}44 0px, ${color}44 1.5px, transparent 1.5px, transparent 12px)`,
    }}
  />
);

export const Pill: React.FC<{children: React.ReactNode; at: number; color?: string}> = ({
  children,
  at,
  color = C.gold,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 14);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 18px',
        border: `1px solid ${color}66`,
        borderRadius: 999,
        fontFamily: F.sans,
        fontSize: 24,
        letterSpacing: '0.16em',
        color,
        opacity: p,
        transform: `translateY(${(1 - p) * 6}px)`,
        background: `${color}10`,
      }}
    >
      {children}
    </div>
  );
};

/** Bottom scrim so subtitles always read against the picture. */
export const SubtitleScrim: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 460,
      background: 'linear-gradient(180deg, rgba(3,4,6,0) 0%, rgba(3,4,6,0.55) 46%, rgba(3,4,6,0.86) 100%)',
    }}
  />
);
