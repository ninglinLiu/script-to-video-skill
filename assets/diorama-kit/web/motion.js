// 动效原语：所有动画只依赖时间 t（秒），可逐帧确定性渲染。
// 原则：不同对象用不同曲线和时长；起止错峰；重要落位用 spring/back 带过冲；镜头走连续样条，不在关键帧停住。

export const clamp01 = x => Math.max(0, Math.min(1, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const win = (t, a, b) => clamp01((t - a) / (b - a));

export const ease = {
  linear: x => x,
  inCubic: x => x * x * x,
  outCubic: x => 1 - Math.pow(1 - x, 3),
  inOutCubic: x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outQuart: x => 1 - Math.pow(1 - x, 4),
  outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  inBack: (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x,
};

// 欠阻尼弹簧阶跃响应：t 秒后 0→1，带自然过冲与回弹。freq 越高越利落，damp 越小弹得越多。
export function spring(t, freq = 2.0, damp = 0.42) {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freq;
  if (damp >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * t) * (Math.cos(wd * t) + (damp / Math.sqrt(1 - damp * damp)) * Math.sin(wd * t));
}

// 错峰：第 i 个对象（共 n 个）的启动时间。
export const stagger = (i, n, start, spread) => start + (n <= 1 ? 0 : spread * i / (n - 1));

// 抛物线跳跃：p∈[0,1] 时的高度。
export const arc = (p, h) => 4 * h * p * (1 - p);

// 跳跃的挤压拉伸：返回 [sx, sy]（sz 同 sx）。phase: 'pre'(蓄力) / 'air' / 'land'(落地)。
export function squash(kind, p, amt = 0.22) {
  if (kind === 'pre') { const k = Math.sin(Math.PI * p) * amt; return [1 + k * .6, 1 - k]; }
  if (kind === 'air') { const k = Math.sin(Math.PI * p) * amt * .8; return [1 - k * .4, 1 + k]; }
  if (kind === 'land') { const k = Math.exp(-5 * p) * Math.cos(9 * p) * amt; return [1 + k * .6, 1 - k]; }
  return [1, 1];
}

// 非均匀时间的 Catmull-Rom（三次 Hermite）轨道：经过关键点时保持速度连续，镜头不会在每个关键帧停顿。
// keys: [{t, v:[...]}]，可在同一位置放两个相近关键帧制造“停留”。
export function track(keys) {
  const n = keys.length;
  const tan = keys.map((k, i) => {
    const a = keys[Math.max(0, i - 1)], b = keys[Math.min(n - 1, i + 1)];
    const dt = b.t - a.t || 1;
    return k.v.map((_, j) => (i === 0 || i === n - 1) ? 0 : (b.v[j] - a.v[j]) / dt);
  });
  return t => {
    if (t <= keys[0].t) return keys[0].v.slice();
    if (t >= keys[n - 1].t) return keys[n - 1].v.slice();
    let i = 0; while (keys[i + 1].t < t) i++;
    const a = keys[i], b = keys[i + 1], h = b.t - a.t, s = (t - a.t) / h;
    const s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    return a.v.map((_, j) => h00 * a.v[j] + h10 * h * tan[i][j] + h01 * b.v[j] + h11 * h * tan[i + 1][j]);
  };
}

// 计数器：在 [a,b] 内用 outExpo 从 v0 滚到 v1（数字先快后慢，落定可读）。
export const count = (t, a, b, v0, v1, f = ease.outExpo) => lerp(v0, v1, f(win(t, a, b)));

// 可复现随机。
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s += 0x6D2B79F5; let r = Math.imul(s ^ (s >>> 15), 1 | s); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}
