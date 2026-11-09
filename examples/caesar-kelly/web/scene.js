// 《凯利公式》：同一枚 60% 的硬币，押多少决定结局。所有数字来自 data.json（data/build_data.py 生成）。
import {W, C, Y, FONT, clamp, lerp, ramp, smooth, outCubic, fmt, type, head, label, mono, readout, bigNumber, cells, rule, axes, line, dot, check} from './engine.js';

export function build(D) {
  const seq = [...D.sequence].map(ch => ch === 'H');
  const secs = [];
  const add = (t0, t1, draw, fi, fo) => secs.push({t0, t1, draw, fi, fo});
  const lg = v => Math.log10(Math.max(v, 1e-9));
  const pct = (v, d = 0) => (v * 100).toFixed(d) + '%';
  const st = D.stats, fin = D.finals60_40;
  const pathAt = (arr, prog) => { const m = prog * (arr.length - 1), k = Math.floor(m); return k >= arr.length - 1 ? arr[arr.length - 1] : lerp(arr[k], arr[k + 1], m - k); };
  const flipCell = (i, t, t0, step, a = 1) => {
    const k = ramp(t, t0 + i * step, t0 + i * step + .22);
    if (k <= 0) return [C.cellLo, a, 0];
    const s = lerp(1.3, 1, outCubic(k));
    return [seq[i] ? C.gold : C.cell, a, seq[i] ? .28 * a : 0, s, s];
  };

  // ① 钩子：同样 60 胜 40 负，押 20% 和押 50%
  add(0, 8, L => {
    const {t} = L, step = .026, prog = ramp(t, 1.0, 1.0 + 100 * step);
    label(L, 'Kelly Criterion', {y: Y.label, t0: .1});
    head(L, '同一枚硬币，一样赢 {60} 次。', '一个翻 {7.5} 倍，一个剩 {3%}。', {t0: .4, t1: 4.2, out: 7.3});
    for (const [f, x] of [[.2, 120], [.5, 580]]) {
      const gw = 380;
      type(L, `押 {${f * 100}%}`, {x: x + gw / 2, y: 530, size: 36, t0: .8, cps: 24});
      rule(L, x, 562, gw, {alpha: ramp(t, .7, 1.1)});
      cells(L, {x, y: 572, w: gw, cols: 10, n: 100, state: i => flipCell(i, t, 1.0, step, ramp(t, .6, 1.0))});
      const arr = D.steps[f.toFixed(1)], top = 1010, h = 190, ym = v => top + (1.15 - clamp(lg(v), -1.8, 1.15)) / 2.95 * h;
      const pts = arr.map((v, i) => [x + i / 100 * gw, ym(v)]);
      L.c.globalAlpha = ramp(t, .9, 1.2) * .8; L.c.fillStyle = C.faint; L.c.fillRect(x, ym(1), gw, 1.5); L.c.globalAlpha = 1;
      line(L, pts, {prog, color: f === .2 ? C.gold : C.text, width: 2.5, glow: f === .2 ? .8 : .3, head: prog < 1});
      const v = pathAt(arr, prog);
      readout(L, 'Balance', '×' + v.toFixed(2), {x, y: 1250, t0: 1.0, color: v >= 1 ? C.gold : C.gray, glow: v >= 1 ? .5 : 0});
    }
  });

  // ② 揭晓那个数
  add(8, 16, L => {
    type(L, '差别只在一个数：', {y: 600, size: 40, weight: 500, color: C.gray, t0: 8.2, cps: 16});
    bigNumber(L, (D.threshold * 100).toFixed(1) + '%', {y: 880, size: 250, t0: 9.0, dur: 1.15});
    label(L, 'Bet Fraction', {y: 1070, t0: 10.4});
    type(L, '每次押注，占本金的比例', {y: 1125, size: 34, weight: 500, color: C.gray, t0: 10.7, cps: 20});
    type(L, '越过它，{60%} 的赢面也会输光。', {y: 1300, size: 48, t0: 12.2});
  });

  // ③ 规则：硬币、偏向、连押 100 次
  add(16, 28, L => {
    const {t} = L;
    head(L, '想象一枚硬币：', '正面赢，反面输，都按押注算。', {t0: 16.2, out: 19.9});
    const rowA = 1 - ramp(t, 19.9, 20.3);
    if (rowA > 0) {
      cells(L, {x: 120, y: 700, w: 840, cols: 10, n: 10, gap: .2, state: i => {
        const k = ramp(t, 17.6 + i * .27, 17.9 + i * .27);
        if (k <= 0) return [C.cellLo, rowA * ramp(t, 16.6, 17.0), 0];
        const up = k > .5;
        return [up ? (seq[i] ? C.gold : C.cell) : C.cellLo, rowA, up && seq[i] ? .55 * rowA : 0, Math.max(.04, Math.abs(Math.cos(k * Math.PI))), 1];
      }});
      const m = seq.slice(0, 10).filter((_, i) => t >= 17.75 + i * .27).length, hs = seq.slice(0, m).filter(Boolean).length;
      readout(L, 'Heads', `${hs} / ${m}`, {x: 120, y: 860, t0: 17.5, out: 19.9});
    }
    head(L, '它偏向你：', '正面的概率是 {60%}。', {t0: 20.3, out: 23.6});
    const gA = ramp(t, 20.3, 20.7);
    rule(L, 270, 590, 540, {alpha: gA});
    cells(L, {x: 270, y: 600, w: 540, cols: 10, n: 100, state: i => flipCell(i, t, 20.8, .022, gA)});
    const m = Math.min(100, Math.max(0, Math.floor((t - 20.8) / .022) + 1)), hs = seq.slice(0, m).filter(Boolean).length;
    readout(L, 'Heads', `${hs} / ${m}`, {x: 270, y: 1185, t0: 20.6});
    head(L, '每次押本金的一部分，', '连押 {100} 次。', {t0: 24.0, out: 27.4});
  });

  // ④ 一档一档试：10% → 50%
  const CH = {x: 170, y: 600, w: 790, h: 680};
  const fy = lv => CH.y + (1.3 - clamp(lv, -2.3, 1.3)) / 3.6 * CH.h, fx = i => CH.x + i / 100 * CH.w;
  const yTicks = [[1, '10×'], [0, '1×'], [-1, '0.1×'], [-2, '0.01×']];
  const steps = [
    [.1, '翻到 {4.5} 倍。'], [.2, '翻到 {7.5} 倍。'], [.3, '{4.4} 倍：押多了，反而少。'],
    [.4, '{0.78} 倍：亏了。'], [.5, `一度 {${Math.round(Math.max(...D.steps['0.5']))}} 倍，最后剩 {${pct(fin['0.5'])}}。`],
  ];
  const stepPts = steps.map(([f]) => D.steps[f.toFixed(1)].map((v, i) => [fx(i), fy(lg(v))]));
  const tagY = (() => { const ys = stepPts.map(p => p[100][1]), idx = ys.map((_, i) => i).sort((a, b) => ys[a] - ys[b]), out = [...ys];
    for (let j = 1; j < idx.length; j++) out[idx[j]] = Math.max(out[idx[j]], out[idx[j - 1]] + 26); return out; })();
  add(28, 49, L => {
    const {t} = L;
    axes(L, {...CH, ys: yTicks, ymap: fy, xs: [[0, '0'], [50, '50'], [100, '100']], xmap: fx, xLabel: '第几次', yLabel: '本金变成几倍', alpha: ramp(t, 28.1, 28.5)});
    L.c.globalAlpha = ramp(t, 28.1, 28.5) * .9; L.c.fillStyle = '#4a5162'; L.c.fillRect(CH.x, fy(0), CH.w, 2); L.c.globalAlpha = 1;
    steps.forEach(([f, result], k) => {
      const T = 28.4 + 4 * k, last = k === steps.length - 1;
      if (t < T) return;
      const cur = t < T + 4 || last, prog = ramp(t, T + .5, T + 2.4);
      if (cur) {
        head(L, `押 {${f * 100}%}：`, result, {t0: T, t1: T + 2.5, out: last ? 48.3 : T + 3.75});
        line(L, stepPts[k], {prog, width: 3.5, glow: .9, head: prog < 1});
        const v = pathAt(D.steps[f.toFixed(1)], prog);
        readout(L, 'Bet', `${f * 100}%`, {x: CH.x, y: Y.readout, t0: T + .2, out: last ? 48.3 : T + 3.75});
        readout(L, 'Balance', '×' + v.toFixed(2), {x: CH.x + CH.w, align: 'right', y: Y.readout, t0: T + .2, out: last ? 48.3 : T + 3.75, color: v >= 1 ? C.gold : C.gray, glow: v >= 1 ? .5 : 0});
      }
      if (!cur || prog >= 1) {
        const a = cur ? 1 : .55;
        if (!cur) line(L, stepPts[k], {color: C.dim, width: 2, alpha: a});
        const [ex, ey] = stepPts[k][100];
        mono(L, `${f * 100}%`, {x: ex + 12, y: tagY[k], size: 21, color: cur ? C.gold : C.dim, t0: cur ? T + 2.4 : null});
      }
    });
  });

  // ⑤ 一座山：山顶 20%，过了 38.9% 沉到水下
  const HX = f => CH.x + f / .6 * CH.w, HY = lv => CH.y + (1.3 - clamp(lv, -4, 1.3)) / 5.3 * CH.h;
  const hillPts = D.hill.map(([f, v]) => [HX(f), HY(lg(v))]);
  add(49, 58, L => {
    const {t} = L, a = ramp(t, 49.1, 49.5);
    axes(L, {...CH, ys: [[1, '10×'], [0, '1×'], [-1, '0.1×'], [-2, '0.01×'], [-3, '0.001×']], ymap: HY,
      xs: [0, .1, .2, .3, .4, .5, .6].map(f => [f, f * 100 + '%']), xmap: HX, xLabel: '每次押注占本金的比例', yLabel: '100 次后，本金变成几倍', alpha: a});
    const w = ramp(t, 53.7, 54.4);
    if (w > 0) { L.c.globalAlpha = w * .55; L.c.fillStyle = '#1a2130'; L.c.fillRect(CH.x + 1, HY(0), CH.w, CH.y + CH.h - HY(0)); L.c.globalAlpha = 1; }
    L.c.globalAlpha = a * .9; L.c.fillStyle = '#4a5162'; L.c.fillRect(CH.x, HY(0), CH.w, 2); L.c.globalAlpha = 1;
    line(L, hillPts, {prog: ramp(t, 49.6, 51.6), width: 3.5, glow: .9, head: t < 51.6});
    [.1, .2, .3, .4, .5].forEach((f, i) => { const k = ramp(t, 51.0 + i * .15, 51.25 + i * .15); if (k > 0) dot(L, HX(f), HY(lg(fin[f.toFixed(1)])), {r: 7 * k, color: C.gold, alpha: .9}); });
    head(L, '把押注比例，从 {0} 调到 {60%}：', '得到一座山。', {t0: 49.2, out: 52.3});
    const pk = ramp(t, 52.6, 53.0);
    if (pk > 0) {
      L.c.globalAlpha = pk * .7; L.c.strokeStyle = C.goldLo; L.c.setLineDash([6, 8]); L.c.lineWidth = 1.5;
      L.c.beginPath(); L.c.moveTo(HX(.2), HY(lg(fin['0.2']))); L.c.lineTo(HX(.2), CH.y + CH.h); L.c.stroke(); L.c.setLineDash([]); L.c.globalAlpha = 1;
      dot(L, HX(.2), HY(lg(fin['0.2'])), {r: 10, alpha: pk});
      mono(L, `20% · ×${fin['0.2'].toFixed(2)}`, {x: HX(.2), y: HY(lg(fin['0.2'])) - 44, align: 'center', size: 26, glow: .5, t0: 52.7});
    }
    if (t > 53.6) {
      dot(L, HX(D.threshold), HY(0), {r: 10, alpha: ramp(t, 53.6, 54.0)});
      mono(L, `${(D.threshold * 100).toFixed(1)}% · ×1`, {x: HX(D.threshold) - 16, y: HY(0) + 40, align: 'right', size: 26, glow: .5, t0: 53.7});
    }
    head(L, '山顶在 {20%}。', `过了 {${(D.threshold * 100).toFixed(1)}%}，就沉到水下。`, {t0: 52.6, out: 57.4});
  });

  // ⑥ 一万遍：同一批运气，押 20% 和押 50%
  const rank = new Int32Array(D.runs); D.order.forEach((p, j) => { rank[p] = j; });
  const cum = arr => { const pr = [0], lo = [0]; D.order.forEach(p => { pr.push(pr[pr.length - 1] + (arr[p] > 0)); lo.push(lo[lo.length - 1] + (arr[p] < -2)); }); return {pr, lo}; };
  const cum20 = cum(D.runs20), cum50 = cum(D.runs50);
  const R0 = 60.0, RD = 3.6;
  add(58, 74, L => {
    const {t} = L, shown = Math.min(D.runs, Math.max(0, Math.floor(ramp(t, R0, R0 + RD) * D.runs)));
    const focus = ramp(t, 70.0, 70.8);
    head(L, '这只是一种运气。', '把同样的游戏，重来 {一万} 遍。', {t0: 58.2, out: 63.9});
    head(L, `押 20%：{${pct(st['0.2'].profit)}} 的人赚钱。`, `押 50%：{${pct(st['0.5'].under1pct)}} 的人，剩不到 1%。`, {t0: 64.2, out: 67.9});
    head(L, `按期望值，押 50% 翻 {${fmt(st['0.5'].expected)}} 倍。`, '撑起它的，是{极少数人}。', {t0: 68.2, t1: 70.0, out: 73.4});
    [[.2, 120, D.runs20, cum20], [.5, 560, D.runs50, cum50]].forEach(([f, x, arr, cu]) => {
      const gw = 400, gy = 640;
      type(L, `押 {${f * 100}%}`, {x: x + gw / 2, y: 598, size: 34, t0: 58.6, cps: 24});
      rule(L, x, 628, gw, {alpha: ramp(t, 58.6, 59.0)});
      const base = ramp(t, 58.6, 59.2);
      cells(L, {x, y: gy, w: gw, cols: 100, n: D.runs, gap: .14, state: i => {
        if (t < R0 + rank[i] / D.runs * RD) return [C.cellLo, base * .8, 0];
        const v = arr[i];
        if (v > 0) {
          const big = f === .5 && v > 1;
          const a = lerp(.5, 1, clamp(v / 1.5)) * (big ? 1 : 1 - focus * .7);
          return [C.gold, a, (big ? .3 + .7 * focus : .25 * clamp(v / 2) * (1 - focus))];
        }
        return v > -2 ? [C.cell, .9 * (1 - focus * .6), 0] : ['#06080c', 1, 0];
      }});
      readout(L, 'Profit', pct(shown ? cu.pr[shown] / shown : 0, 1), {x, y: 1080, t0: R0, size: 34});
      readout(L, 'Left < 1%', pct(shown ? cu.lo[shown] / shown : 0, 1), {x: x + 220, y: 1080, t0: R0, size: 34, color: C.gray, glow: 0});
    });
    readout(L, 'Runs', fmt(shown), {x: W / 2, align: 'center', y: 1230, t0: R0 - .2, size: 34, color: C.text, glow: 0});
  });

  // ⑦ 真人实验：61 人，28% 输光
  const E = D.experiment, bustIdx = (() => { let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; const ids = [...Array(E.players).keys()]; for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; } return ids.slice(0, E.bust); })();
  const bustAt = new Map(bustIdx.map((p, j) => [p, 77.6 + j * .09]));
  add(74, 83, L => {
    const {t} = L;
    head(L, '2016 年，{61} 个学金融、做金融的', '年轻人，玩这枚 {60%} 的硬币。', {t0: 74.2, out: 79.3});
    cells(L, {x: 198, y: 610, w: 684, cols: 9, n: E.players, gap: .22, state: i => {
      const k = ramp(t, 74.8 + i * .02, 75.0 + i * .02);
      if (k <= 0) return null;
      const b = bustAt.has(i) ? ramp(t, bustAt.get(i), bustAt.get(i) + .3) : 0;
      return [b > .5 ? C.cellLo : C.gold, k, (1 - b) * .45 * k, lerp(1.2, 1, outCubic(k)) * (1 - b * .15), lerp(1.2, 1, outCubic(k)) * (1 - b * .15)];
    }});
    const busted = bustIdx.filter(p => t >= bustAt.get(p) + .15).length;
    readout(L, 'Players', String(E.players), {x: 198, y: 1240, t0: 75.0, color: C.text, glow: 0});
    readout(L, 'Stake', '$' + E.stake, {x: 430, y: 1240, t0: 75.2, color: C.text, glow: 0});
    readout(L, 'Bust', String(busted), {x: 882, align: 'right', y: 1240, t0: 77.4});
    type(L, `{${pct(E.bustShare)}}，输光了。`, {y: Y.line1, t0: 79.6, out: 82.4});
    mono(L, 'Haghani & Dewey · 2016', {x: W / 2, align: 'center', y: 1380, size: 22, color: C.dim, t0: 79.9});
  });

  // ⑧ 凯利 1956：f* = p − q = 20%
  add(83, 92, L => {
    head(L, '1956 年，贝尔实验室的凯利，', '算出了该押多少：', {t0: 83.2, out: 91.4});
    type(L, 'f* = p − q', {font: FONT.mono, size: 60, weight: 600, y: 650, t0: 84.9, cps: 14});
    type(L, '= 60% − 40%', {font: FONT.mono, size: 44, weight: 500, color: C.gray, y: 745, t0: 85.8, cps: 16});
    bigNumber(L, Math.round(D.kelly * 100) + '%', {y: 960, size: 260, t0: 86.7});
    label(L, 'Kelly Criterion', {y: 1140, t0: 88.2});
    type(L, '只押，你比对面多出来的那点优势。', {y: 1215, size: 38, weight: 500, color: C.gray, t0: 88.6});
  });

  // ⑨ 永久性损失：跌得越深，回本越难
  const lost = 1 - fin['0.5'], rows = [[.5, '−50%'], [.9, '−90%'], [lost, '−' + pct(lost)]];
  add(92, 105, L => {
    const {t} = L, dimK = 1 - ramp(t, 99.8, 100.4) * .6;
    head(L, '风险不是波动，', '是{永久性}的资本损失。', {t0: 92.2, out: 95.9});
    type(L, '—— 霍华德·马克斯', {y: 500, size: 30, weight: 500, color: C.dim, t0: 94.2, out: 95.9});
    head(L, `跌掉 {${pct(lost)}}，`, `要再翻 {${Math.round(1 / fin['0.5'])}} 倍，才回得来。`, {t0: 96.2, out: 99.9});
    head(L, '赢面，决定你能不能赚。', '押多少，决定你{还在不在}。', {t0: 100.2, out: 104.5});
    label(L, 'Drawdown', {x: 120, y: 650, align: 'left', size: 20, ls: 5, color: '#6c707b', t0: 92.6, alpha: dimK});
    label(L, 'Gain needed to recover', {x: 330, y: 650, align: 'left', size: 20, ls: 5, color: '#6c707b', t0: 92.6, alpha: dimK});
    rows.forEach(([d, s], i) => {
      const y = 740 + i * 170, T = 93.0 + i * .8, need = 1 / (1 - d) - 1, k = outCubic(ramp(t, T, T + .9));
      if (k <= 0) return;
      mono(L, s, {x: 120, y, size: 40, color: C.gray, alpha: dimK});
      const len = need * 100 * .6 * k, x0 = 330;
      for (const [c, a] of [[L.c, .92], [L.g, .3]]) { c.globalAlpha = a * dimK; c.fillStyle = C.gold; c.fillRect(x0, y - 16, Math.min(len, W - x0), 32); }
      L.c.globalAlpha = L.g.globalAlpha = 1;
      const txt = '+' + fmt(need * 100) + '%', over = x0 + len + 210 > W;
      mono(L, txt + (over ? ' →' : ''), {x: over ? W - 60 : x0 + len + 16, y: over ? y - 46 : y, align: over ? 'right' : 'left', size: 34, color: C.goldHi, glow: .6, t0: T + .5, alpha: dimK});
    });
  });

  // ⑩ 清单
  add(105, 111, L => {
    check(L, '先算清楚，赢面有多大。', {x: 170, y: 760, t0: 105.3});
    check(L, '每次只押，你多出来的那点优势。', {x: 170, y: 900, t0: 106.6});
    check(L, '永远留着，下一局的本金。', {x: 170, y: 1040, t0: 107.9});
  });

  // ⑪ 致辞
  add(111, 115.5, L => {
    type(L, '致所有，', {y: 900, t0: 111.3, cps: 12});
    type(L, '还想{一把翻身}的人。', {y: 1000, t0: 112.0, cps: 12});
  });

  // ⑫ 片尾标题
  const tp = D.steps['0.2'].map((v, i) => [120 + i / 100 * 840, 1370 - (clamp(lg(v), -.15, 1.05) + .15) / 1.2 * 300]);
  add(115.5, 122, L => {
    const {t} = L;
    rule(L, 120, 532, 840, {alpha: .5});
    cells(L, {x: 120, y: 540, w: 840, cols: 10, n: 100, gap: .14, state: i => [seq[i] ? C.goldLo : C.cell, (seq[i] ? .13 : .22), 0]});
    line(L, tp, {prog: ramp(t, 115.8, 117.8), width: 4, glow: 1, alpha: .85, head: t < 117.8});
    type(L, '凯利公式', {y: 790, size: 140, weight: 900, t0: 116.4, cps: 6, glow: true, glowK: .35});
    label(L, 'Kelly Criterion', {y: 905, t0: 117.2});
    type(L, '下注比例 · {20%}', {y: 962, size: 34, weight: 500, color: C.gray, t0: 117.5});
    type(L, '凯撒的复利实验室', {y: 1030, size: 30, weight: 600, color: C.text, t0: 118.1});
    type(L, '算例为模拟，不构成投资建议', {y: 1430, size: 24, weight: 500, color: C.dim, t0: 118.5});
  }, .5, .6);

  ['钩子', '揭晓', '规则', '一档一档试', '一座山', '重做一万遍', '真实实验', '凯利 1956', '永久性损失', '清单', '致辞', '片名'].forEach((n, i) => { secs[i].name = n; });
  return {sections: secs, duration: 122};
}
