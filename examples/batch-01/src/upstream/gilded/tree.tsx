import React from 'react';
import {clamp01} from '../anim';
import {G, GF} from './theme';

/**
 * 暗金文献风的金线图表：全部是细金线 + 发光端点，逐步「画出来」。
 * 每个组件给出 SVG 局部坐标（左上为 0,0），用 Soft 或 div 定位到画面里。
 */

const glowLine = (c: string, px = 4) => ({filter: `drop-shadow(0 0 ${px}px ${c})`});

/**
 * 二叉树：从左往右分 depth 层，p 为生长进度（0–1，一层一层长出来）。
 * highlight 是从根到叶的路径（每层 0=上 1=下），会被描成发光的朱红；leafLabel 给每片叶子标字。
 */
export const GoldTree: React.FC<{w: number; h: number; depth: number; p: number; highlight?: number[]; hp?: number; leafLabel?: (i: number) => string; leafColor?: (i: number) => string}> = ({w, h, depth, p, highlight, hp = 0, leafLabel, leafColor}) => {
  const lw = w / (depth + 0.4);
  const nodes: React.ReactNode[] = [];
  const lines: React.ReactNode[] = [];
  const hiNodes = new Set<string>();
  if (highlight) {
    let idx = 0;
    hiNodes.add('0-0');
    highlight.forEach((b, d) => {
      idx = idx * 2 + b;
      hiNodes.add(`${d + 1}-${idx}`);
    });
  }
  const pos = (d: number, i: number) => {
    const n = Math.pow(2, d);
    return [d * lw, ((i + 0.5) / n) * h] as const;
  };
  for (let d = 0; d < depth; d++) {
    const grow = clamp01(p * depth - d);
    if (grow <= 0) continue;
    for (let i = 0; i < Math.pow(2, d); i++) {
      const [x0, y0] = pos(d, i);
      for (const b of [0, 1]) {
        const [x1, y1] = pos(d + 1, i * 2 + b);
        const hi = hiNodes.has(`${d}-${i}`) && hiNodes.has(`${d + 1}-${i * 2 + b}`);
        const draw = hi ? clamp01(hp * depth - d) : 0;
        const path = `M${x0} ${y0} C${x0 + lw * 0.5} ${y0}, ${x1 - lw * 0.5} ${y1}, ${x1} ${y1}`;
        lines.push(<path key={`l${d}-${i}-${b}`} d={path} fill="none" stroke={G.goldLine} strokeWidth={1.2} pathLength={1} strokeDasharray={`${grow} 1`} />);
        if (draw > 0) lines.push(<path key={`h${d}-${i}-${b}`} d={path} fill="none" stroke={G.red} strokeWidth={3} pathLength={1} strokeDasharray={`${draw} 1`} style={glowLine(G.red, 6)} />);
      }
    }
  }
  for (let d = 0; d <= depth; d++) {
    const show = clamp01(p * depth - d + 1);
    if (show <= 0) continue;
    for (let i = 0; i < Math.pow(2, d); i++) {
      const [x, y] = pos(d, i);
      if (d === depth) {
        const lab = leafLabel?.(i);
        const col = leafColor?.(i) ?? G.gold;
        nodes.push(
          <g key={`n${d}-${i}`} opacity={show}>
            <circle cx={x} cy={y} r={Math.min(10, h / Math.pow(2, depth) / 2.4)} fill="rgba(0,0,0,0.6)" stroke={col} strokeWidth={1.2} />
            {lab ? (
              <text x={x} y={y + 4} textAnchor="middle" fontFamily={GF.cn} fontSize={Math.min(12, h / Math.pow(2, depth) / 2.2)} fill={col}>
                {lab}
              </text>
            ) : null}
          </g>,
        );
      } else nodes.push(<circle key={`n${d}-${i}`} cx={x} cy={y} r={3.5} fill={G.goldBright} opacity={show} style={glowLine(G.gold, 3)} />);
    }
  }
  return (
    <svg width={w + 20} height={h} style={{overflow: 'visible'}}>
      {lines}
      {nodes}
    </svg>
  );
};
