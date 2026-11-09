// 起手场景：21 秒，把每个画面原语用一遍。复制后改段落、文字和数据。
// 完整的成片写法见 examples/caesar-kelly/web/scene.js。
import {C, Y, lerp, ramp, outCubic, type, head, label, readout, bigNumber, cells, rule, axes, line, check} from './engine.js';

export function build(D) {
  const seq = [...D.flips].map(ch => ch === 'H');
  const secs = [];
  const add = (t0, t1, draw, fi, fo) => secs.push({t0, t1, draw, fi, fo});

  // 钩子：标题逐字打出，格子一格一格翻开
  add(0, 6, L => {
    const {t} = L;
    label(L, 'Starter Scene', {y: Y.label, t0: .1});
    head(L, `一枚硬币，正面概率 {${D.p * 100}%}。`, `抛 {${D.n}} 次：`, {t0: .3, out: 5.4});
    rule(L, 270, 590, 540, {alpha: ramp(t, .6, 1.0)});
    cells(L, {x: 270, y: 600, w: 540, cols: 10, n: D.n, state: i => {
      const k = ramp(t, 1.2 + i * .03, 1.4 + i * .03);
      if (k <= 0) return [C.cellLo, ramp(t, .6, 1.0), 0];
      const s = lerp(1.3, 1, outCubic(k));
      return [seq[i] ? C.gold : C.cell, 1, seq[i] ? .28 : 0, s, s];
    }});
    const m = Math.min(D.n, Math.max(0, Math.floor((t - 1.2) / .03) + 1));
    readout(L, 'Heads', `${seq.slice(0, m).filter(Boolean).length} / ${m}`, {x: 270, y: 1185, t0: 1.0});
  });

  // 揭晓：光条扫过大数字
  add(6, 11, L => {
    type(L, '每次押 20%，最后本金变成：', {y: 600, size: 40, weight: 500, color: C.gray, t0: 6.2});
    bigNumber(L, '×' + D.final.toFixed(2), {y: 880, size: 230, t0: 7.2});
    label(L, 'Final Balance', {y: 1070, t0: 8.6});
  });

  // 曲线：坐标轴 + 生长的折线
  const box = {x: 170, y: 600, w: 790, h: 680}, lo = Math.min(...D.wealth), hi = Math.max(...D.wealth);
  const X = i => box.x + i / D.n * box.w, Yv = v => box.y + (hi - v) / (hi - lo) * box.h;
  const pts = D.wealth.map((v, i) => [X(i), Yv(v)]);
  add(11, 17, L => {
    head(L, '一路走来：', '有起有落，{总体向上}。', {t0: 11.2, out: 16.4});
    axes(L, {...box, xs: [[0, '0'], [D.n / 2, String(D.n / 2)], [D.n, String(D.n)]], xmap: X, ys: [[1, '1×']], ymap: Yv, xLabel: '第几次', yLabel: '本金变成几倍', alpha: ramp(L.t, 11.1, 11.5)});
    line(L, pts, {prog: ramp(L.t, 11.6, 14.6), width: 3.5, glow: .9, head: L.t < 14.6});
  });

  // 清单和片名
  add(17, 21, L => {
    check(L, '先把数算出来。', {x: 170, y: 760, t0: 17.2});
    check(L, '再让画面一步一步演。', {x: 170, y: 900, t0: 18.2});
    check(L, '字和数用同一个变量。', {x: 170, y: 1040, t0: 19.2});
  }, .35, .6);

  ['钩子', '揭晓', '曲线', '清单'].forEach((n, i) => { secs[i].name = n; });
  return {sections: secs, duration: 21};
}
