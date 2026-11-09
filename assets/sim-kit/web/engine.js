// 代码模拟 · 暗金排版：画面原语。所有绘制只依赖时间 t，逐帧渲染可重复。
// 配色和版式量自老板喜欢的参考片《临界点：渗流理论》（竖屏 1080×1920），见 references/sim-typography.md。
export const W = 1080, H = 1920;
export const C = {
  bgTop: '#0a0d16', bgMid: '#070a11', bgBot: '#020306',
  text: '#dbd5cb', gray: '#84858c', dim: '#565b67', faint: '#262c38',
  gold: '#f9ba5b', goldHi: '#ffe0a8', goldLo: '#d8893a', label: '#9c7a4a',
  cell: '#353c4b', cellLo: '#1b2029', void: '#11151d', ash: '#171b23',
};
export const FONT = {serif: 'KSerif', mono: 'KMono'};
// 版式（像素）：标题两行、上方小标签、主画面区、下方读数。下方 1/5 留给平台界面。
export const Y = {label: 226, line1: 297, line2: 412, boxTop: 560, boxBottom: 1330, readout: 1420};

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ramp = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const outCubic = x => 1 - Math.pow(1 - clamp(x), 3);
export const inOut = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
// 在 a 处淡入、b 处淡出的包络
export const env = (t, a, b, fi = .35, fo = .45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b));
export const fmt = (x, d = 0) => x.toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});

// ---------- 舞台 ----------
export function stage(canvas) {
  const ctx = canvas.getContext('2d');
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c.getContext('2d'); };
  const S = {ctx, glow: mk(), layer: mk(), layerGlow: mk(), noise: makeNoise()};
  for (const c of [ctx, S.glow, S.layer, S.layerGlow]) c.textBaseline = 'middle';
  return S;
}

function makeNoise() {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), img = g.createImageData(W, H);
  let s = 7; const r = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() - .5) * 120; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  return c;
}

function background(ctx, noise) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, C.bgTop); g.addColorStop(.55, C.bgMid); g.addColorStop(1, C.bgBot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const r = ctx.createRadialGradient(W / 2, H * .4, 40, W / 2, H * .4, W * .95);
  r.addColorStop(0, 'rgba(46,58,86,.16)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = .035; ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(noise, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

// sections: [{t0, t1, fi, fo, draw(L)}]，L = {c 画面层, g 发光层, t 全局时间, lt 段内时间}
export function frame(S, t, sections) {
  const {ctx, glow, layer, layerGlow} = S;
  background(ctx, S.noise);
  glow.clearRect(0, 0, W, H);
  for (const s of sections) {
    const a = env(t, s.t0, s.t1, s.fi ?? .35, s.fo ?? .5);
    if (a <= 0) continue;
    layer.clearRect(0, 0, W, H); layerGlow.clearRect(0, 0, W, H);
    s.draw({c: layer, g: layerGlow, t, lt: t - s.t0});
    ctx.globalAlpha = a; ctx.drawImage(layer.canvas, 0, 0); ctx.globalAlpha = 1;
    glow.globalAlpha = a; glow.drawImage(layerGlow.canvas, 0, 0); glow.globalAlpha = 1;
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.filter = 'blur(26px)'; ctx.globalAlpha = .38; ctx.drawImage(glow.canvas, 0, 0);
  ctx.filter = 'blur(7px)'; ctx.globalAlpha = .32; ctx.drawImage(glow.canvas, 0, 0);
  ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H * .45, W * .45, W / 2, H * .45, H * .75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

// ---------- 文字 ----------
const widths = new Map();
function cw(c, ch) {
  const k = c.font + '|' + c.letterSpacing + '|' + ch;
  if (!widths.has(k)) widths.set(k, c.measureText(ch).width);
  return widths.get(k);
}
// {重点} 用强调色
export function chars(s) {
  const out = []; let acc = false;
  for (const ch of s) { if (ch === '{') { acc = true; continue; } if (ch === '}') { acc = false; continue; } out.push([ch, acc]); }
  return out;
}
export const typeEnd = (s, t0, cps = 20) => t0 + chars(s).length / cps;

// 逐字打出：每个字 fade 秒内淡入；out 时整行淡出。返回打完的时间。
export function type(L, s, o) {
  const {c, g, t} = L;
  const cps = o.cps ?? 20, t0 = o.t0, fade = o.fade ?? .14;
  const cs = chars(s);
  if (t < t0) return t0 + cs.length / cps;
  const font = `${o.weight ?? 700} ${o.size ?? 56}px ${o.font ?? FONT.serif}`;
  c.font = font; g.font = font; c.letterSpacing = g.letterSpacing = (o.ls ?? 0) + 'px';
  const total = cs.reduce((a, [ch]) => a + cw(c, ch), 0);
  const align = o.align ?? 'center';
  let x = align === 'center' ? (o.x ?? W / 2) - total / 2 : align === 'right' ? o.x - total : o.x;
  const outA = o.out != null ? 1 - ramp(t, o.out, o.out + (o.outDur ?? .35)) : 1;
  c.textAlign = g.textAlign = 'left';
  cs.forEach(([ch, acc], i) => {
    const a = smooth((t - (t0 + i / cps)) / fade) * outA * (o.alpha ?? 1);
    if (a > 0) {
      c.globalAlpha = a; c.fillStyle = acc ? (o.accent ?? C.gold) : (o.color ?? C.text); c.fillText(ch, x, o.y);
      if (acc || o.glow) { g.globalAlpha = a * (o.glowK ?? .85); g.fillStyle = acc ? (o.accent ?? C.gold) : (o.color ?? C.text); g.fillText(ch, x, o.y); }
    }
    x += cw(c, ch);
  });
  c.globalAlpha = g.globalAlpha = 1; c.letterSpacing = g.letterSpacing = '0px';
  return t0 + cs.length / cps;
}

// 标题两行：第二行在第一行打完 gap 秒后开始
export function head(L, a, b, o) {
  const e1 = type(L, a, {...o, y: o.y1 ?? Y.line1});
  if (b) type(L, b, {...o, t0: o.t1 ?? e1 + (o.gap ?? .35), y: o.y2 ?? Y.line2});
}

// 字母间距加大的小标签，如 KELLY CRITERION
export function label(L, s, o) {
  const a = (o.alpha ?? 1) * (o.t0 != null ? smooth(ramp(L.t, o.t0, o.t0 + .4)) : 1) * (o.out != null ? 1 - ramp(L.t, o.out, o.out + .35) : 1);
  if (a <= 0) return;
  const c = L.c;
  c.font = `${o.weight ?? 600} ${o.size ?? 19}px ${FONT.serif}`; c.letterSpacing = (o.ls ?? 7) + 'px';
  c.textAlign = o.align ?? 'center'; c.fillStyle = o.color ?? C.label; c.globalAlpha = a;
  c.fillText(s.toUpperCase(), o.x ?? W / 2, o.y);
  c.globalAlpha = 1; c.letterSpacing = '0px'; c.textAlign = 'left';
}

// 等宽数字读数
export function mono(L, s, o) {
  const a = (o.alpha ?? 1) * (o.t0 != null ? smooth(ramp(L.t, o.t0, o.t0 + .3)) : 1) * (o.out != null ? 1 - ramp(L.t, o.out, o.out + .35) : 1);
  if (a <= 0) return;
  for (const [c, k] of [[L.c, 1], [L.g, o.glow ?? 0]]) {
    if (!k) continue;
    c.font = `${o.weight ?? 700} ${o.size ?? 40}px ${FONT.mono}`; c.textAlign = o.align ?? 'left';
    c.fillStyle = o.color ?? C.gold; c.globalAlpha = a * k; c.fillText(s, o.x, o.y);
    c.globalAlpha = 1; c.textAlign = 'left';
  }
}

// 小标签 + 读数，参考片里 CELLS LIT / PERCOLATES 那种
export function readout(L, name, value, o) {
  label(L, name, {x: o.x, y: o.y, align: o.align ?? 'left', size: 20, ls: 5, color: '#6c707b', t0: o.t0, out: o.out});
  mono(L, value, {x: o.x, y: o.y + 44, align: o.align ?? 'left', size: o.size ?? 38, color: o.color ?? C.gold, glow: o.glow ?? .5, t0: o.t0, out: o.out});
}

// ---------- 大数字：光条从左扫到右，扫过的地方点亮 ----------
export function bigNumber(L, s, o) {
  const {c, g, t} = L, t0 = o.t0, dur = o.dur ?? 1.1, size = o.size ?? 250, y = o.y;
  if (t < t0 - .35) return;
  const font = `900 ${size}px ${FONT.serif}`;
  c.font = g.font = font; c.textAlign = g.textAlign = 'left';
  const w = c.measureText(s).width, x0 = (o.x ?? W / 2) - w / 2;
  const outA = o.out != null ? 1 - ramp(t, o.out, o.out + .45) : 1;
  c.globalAlpha = ramp(t, t0 - .35, t0 + .15) * .2 * outA; c.strokeStyle = C.goldLo; c.lineWidth = 2; c.strokeText(s, x0, y);
  const k = inOut(ramp(t, t0 + .2, t0 + .2 + dur)), bx = x0 - 24 + (w + 48) * k;
  if (k > 0) {
    for (const [ctx, a] of [[c, 1], [g, .8]]) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, bx, H); ctx.clip();
      const gr = ctx.createLinearGradient(0, y - size * .42, 0, y + size * .38);
      gr.addColorStop(0, C.goldHi); gr.addColorStop(.5, C.gold); gr.addColorStop(1, C.goldLo);
      ctx.globalAlpha = a * outA; ctx.fillStyle = gr; ctx.fillText(s, x0, y); ctx.restore();
    }
  }
  const ba = Math.min(ramp(t, t0 - .2, t0 + .15), 1 - ramp(t, t0 + .35 + dur, t0 + .9 + dur)) * outA;
  if (ba > 0) {
    const bh = size * 1.5;
    for (const [ctx, a] of [[c, 1], [g, 1]]) {
      const gr = ctx.createLinearGradient(0, y - bh / 2, 0, y + bh / 2);
      gr.addColorStop(0, 'rgba(255,220,160,0)'); gr.addColorStop(.5, 'rgba(255,240,215,1)'); gr.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.globalAlpha = ba * a; ctx.fillStyle = gr; ctx.fillRect(bx - 5, y - bh / 2, 10, bh);
    }
  }
  c.globalAlpha = g.globalAlpha = 1;
}

// ---------- 格子 ----------
// state(i) 返回 [颜色, 透明度, 发光强度, 缩放x, 缩放y] 或 null
export function cells(L, o) {
  const {c, g} = L, pitch = o.w / o.cols, s = pitch * (1 - (o.gap ?? .16));
  for (let i = 0; i < o.n; i++) {
    const st = o.state(i); if (!st) continue;
    const [col, a, gl, sx = 1, sy = 1] = st; if (a <= 0) continue;
    const cx = o.x + (i % o.cols) * pitch + pitch / 2, cy = o.y + Math.floor(i / o.cols) * pitch + pitch / 2;
    const w = s * sx, h = s * sy;
    c.globalAlpha = a; c.fillStyle = col; c.fillRect(cx - w / 2, cy - h / 2, w, h);
    if (gl > 0) { g.globalAlpha = gl; g.fillStyle = col; g.fillRect(cx - w / 2, cy - h / 2, w, h); }
  }
  c.globalAlpha = g.globalAlpha = 1;
}

// 主画面上方那条金色细线
export function rule(L, x, y, w, o = {}) {
  const a = o.alpha ?? 1, k = o.k ?? 1;
  L.c.globalAlpha = a; L.c.fillStyle = o.color ?? C.goldLo; L.c.fillRect(x, y, w * k, o.h ?? 2);
  L.g.globalAlpha = a * .6; L.g.fillStyle = o.color ?? C.goldLo; L.g.fillRect(x, y, w * k, o.h ?? 2);
  L.c.globalAlpha = L.g.globalAlpha = 1;
}

// ---------- 图表 ----------
export function axes(L, o) {
  const {c} = L, a = o.alpha ?? 1;
  c.globalAlpha = a; c.strokeStyle = C.faint; c.lineWidth = 1.5;
  for (const [v] of o.ys ?? []) { const y = o.ymap(v); c.beginPath(); c.moveTo(o.x, y); c.lineTo(o.x + o.w, y); c.stroke(); }
  c.strokeStyle = '#3a4150'; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x, o.y + o.h); c.lineTo(o.x + o.w, o.y + o.h); c.stroke();
  c.font = `500 23px ${FONT.mono}`; c.fillStyle = '#6c707b';
  c.textAlign = 'right'; for (const [v, s] of o.ys ?? []) c.fillText(s, o.x - 12, o.ymap(v));
  c.textAlign = 'center'; for (const [v, s] of o.xs ?? []) c.fillText(s, o.xmap(v), o.y + o.h + 30);
  c.font = `500 25px ${FONT.serif}`; c.fillStyle = C.gray;
  if (o.xLabel) c.fillText(o.xLabel, o.x + o.w / 2, o.y + o.h + 74);
  c.textAlign = 'left'; if (o.yLabel) c.fillText(o.yLabel, o.x + 6, o.y - 30);
  c.globalAlpha = 1;
}

// 折线按 prog 画出一部分；head 为 true 时在笔尖画亮点
export function line(L, pts, o = {}) {
  const prog = clamp(o.prog ?? 1), n = pts.length;
  if (n < 2 || prog <= 0) return null;
  const m = prog * (n - 1), k = Math.floor(m), f = m - k;
  const path = pts.slice(0, k + 1);
  if (k < n - 1) path.push([lerp(pts[k][0], pts[k + 1][0], f), lerp(pts[k][1], pts[k + 1][1], f)]);
  for (const [c, a] of [[L.c, 1], [L.g, o.glow ?? 0]]) {
    if (!a) continue;
    c.globalAlpha = (o.alpha ?? 1) * a; c.strokeStyle = o.color ?? C.gold; c.lineWidth = o.width ?? 3; c.lineJoin = 'round'; c.lineCap = 'round';
    c.setLineDash(o.dash ?? []); c.beginPath(); path.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.setLineDash([]);
  }
  const tip = path[path.length - 1];
  if (o.head) dot(L, tip[0], tip[1], {r: 7, alpha: o.alpha ?? 1});
  L.c.globalAlpha = L.g.globalAlpha = 1;
  return tip;
}

export function dot(L, x, y, o = {}) {
  for (const [c, a] of [[L.c, 1], [L.g, 1]]) {
    c.globalAlpha = (o.alpha ?? 1) * a; c.fillStyle = o.color ?? C.goldHi;
    c.beginPath(); c.arc(x, y, o.r ?? 6, 0, Math.PI * 2); c.fill();
  }
  L.c.globalAlpha = L.g.globalAlpha = 1;
}

// ---------- 清单 ----------
export function check(L, s, o) {
  const k = outCubic(ramp(L.t, o.t0, o.t0 + .35));
  if (k > 0) {
    const x = o.x, y = o.y, sz = 22;
    for (const [c, a] of [[L.c, 1], [L.g, .9]]) {
      c.globalAlpha = a * k; c.strokeStyle = C.gold; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(x - sz * .55, y); c.lineTo(x - sz * .1, y + sz * .45); c.lineTo(x + sz * .7, y - sz * .6); c.stroke();
    }
    L.c.globalAlpha = L.g.globalAlpha = 1;
  }
  type(L, s, {x: o.x + 56, y: o.y, align: 'left', size: o.size ?? 48, t0: o.t0 + .25, cps: o.cps ?? 18});
}
