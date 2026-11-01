// 《二八法则》同文重做：只用 diorama-kit 组件搭建，验证方法不绑定币安题材。
import {createStage, THREE} from './stage.js';
import {createOverlay} from './overlay.js';
import {coinKit, createFlights, createStack, createGauge, createBeam, createMascot, createInstances, createCrowd, createBoard, hopPath} from './props.js';
import {clamp01, lerp, win, ease, spring, stagger, track, rng} from './motion.js';

const s = await createStage({hemi: .85, keyLight: 2.4, exposure: .8, bg: '#c4bbab'});
const {v3, C, DUR} = s, o = createOverlay(s);
const ORANGE = '#ff8a3c', GREY = '#aeb6bf', RED = '#e1423a', GREEN = '#3fae6b', PURPLE = '#7d8bff';
const lineStart = (id, n) => o.subs.filter(x => x.a >= C[id].start && x.a < C[id].end + .01)[n].a;

// 帕累托份额：最富 p 的人占有 p^(1−1/α)
const A0 = Math.log(5) / Math.log(4);   // ≈1.161，恰好 20%→80%
const share = (p, a) => Math.pow(p, 1 - 1 / a);

s.ground('#d6cbb8'); s.cityscape({seed: 21, xMin: -30, xMax: 110, clear: (x, z) => z > 0});
const coin = coinKit(s), flights = createFlights(s, coin, 80);

// ───────── A 村庄：100 个人，50 枚币（每枚 2%） ─────────
const AX = 0; s.pad(AX, 0, 13, 8);
const crowd = createCrowd(s, {x: AX - .5, z: .2});
s.add(s.rbox(1.3, 1, 1.3, .16), s.M('#efb21a', {metalness: .35, roughness: .3}), AX + 4.6, .8, -1.8);
const richStack = createStack(s, coin, {x: AX - 4.7, z: 2.3, col: ORANGE, max: 45}), poorStack = createStack(s, coin, {x: AX + 4.3, z: 2.3, col: GREY, max: 15});
const toRich = [], toPoor = [];
for (let i = 0; i < 40; i++) toRich.push(flights.add({col: ORANGE, from: () => v3(AX + 4.6, 1.4, -1.8), to: v3(richStack.x, richStack.top(i), richStack.z), te: stagger(i, 40, C.L1.start + 1.5, 2.5), dur: .95, h: 3.4, spin: 7}));
for (let i = 0; i < 10; i++) toPoor.push(flights.add({col: GREY, from: () => v3(AX + 4.6, 1.4, -1.8), to: v3(poorStack.x, poorStack.top(i), poorStack.z), te: stagger(i, 10, C.L1.start + 1.7, 2.3), dur: .6, h: 1.4, spin: 7}));

// ───────── B 土地：100 块地，80 块转给 20 个人 ─────────
const BX = 17; s.pad(BX, 0, 8.6, 8.6);
const land = createInstances(s, s.rbox(.66, .14, .66, .04, 2), s.M('#ffffff', {roughness: .8}), 100);
const landOrder = Array.from({length: 100}, (_, i) => i).map(i => [i, rng(i + 5)()]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
const landRank = new Array(100); landOrder.forEach((id, k) => { landRank[id] = k; });
const owners = createCrowd(s, {x: BX, z: 4.05, rows: 1, cols: 10, gap: .68});

// ───────── C 豌豆：10 株，2 株 16 荚，8 株 1 荚（40 荚的 80% / 20%） ─────────
const CX = 30; s.pad(CX, 0, 8.4, 6.8);
const stems = createInstances(s, new THREE.CylinderGeometry(.05, .07, 1, 8), s.M('#5c9b52', {roughness: .7}), 10);
const leaves = createInstances(s, new THREE.SphereGeometry(.24, 10, 8), s.M('#7dbb6b', {roughness: .8}), 10);
const pods = createInstances(s, new THREE.SphereGeometry(.13, 10, 8), s.M('#b8e04a', {roughness: .5}), 40);
const plantX = i => CX + (i - 4.5) * .8, tallest = i => i === 3 || i === 6;
const podPlan = []; { const r = rng(9); for (let p = 0; p < 10; p++) { const n = tallest(p) ? 16 : 1; for (let j = 0; j < n; j++) podPlan.push({p, y: tallest(p) ? .8 + j * .24 : .55, a: j * 2.4, r: .2 + r() * .1}); } }

// ───────── D 结论立牌 ─────────
const board1 = createBoard(s, {x: 39.5, z: -.4, lines: ['分布不均', '≠ 普遍规律'], t0: C.L4.start + .9, accent: RED});

// ───────── E 模型：旋钮（输入 α）→ 十档柱（分布）→ 份额柱（结果） ─────────
const EX = 53; s.pad(EX, .3, 20, 9);
const dialX = EX - 7.6, dialZ = 2.5;
s.add(new THREE.CylinderGeometry(1.2, 1.32, .3, 40), s.M('#3a3a42', {roughness: .45}), dialX, .45, dialZ);
const dial = new THREE.Group(); dial.position.set(dialX, .62, dialZ); s.scene.add(dial);
s.add(new THREE.CylinderGeometry(1, 1, .16, 40), s.M('#f6f2ea', {roughness: .5}), 0, 0, 0, dial);
s.add(s.rbox(.16, .1, .95, .03), s.M(RED), 0, .12, -.46, dial);
const bars = createInstances(s, (() => { const g = s.rbox(.72, 1, .9, .08, 3); g.translate(0, .5, 0); return g; })(), s.M('#ffffff', {roughness: .42}), 10);
const barX = i => EX - 4.7 + i * .94;
const gauge = createGauge(s, {x: EX + 7.6, col: ORANGE, emis: '#c95f14', map: v => v * 6.6 / 100, ticks: [45, 58, 80], height: 7});
const beamIn = createBeam(s, {pts: [v3(dialX + .4, 1, dialZ - 1.1), v3(dialX + 2.4, 5.4, -1.2), v3(EX + 3, 8.3, -.8), v3(EX + 7.2, 6.8, 0)], t0: C.L8.start + .35});
const board2 = createBoard(s, {x: EX + .2, z: -3.1, w: 8.2, h: 2.2, y: 6.2, lines: ['前 20% 的份额 = 0.2^(1 − 1/α)', '比例，是公式算出来的结果'], t0: C.L8.start + .2, accent: PURPLE});

// ───────── F 继续成立？20→4，80→64 ─────────
const FX = 74; s.pad(FX, 0, 13, 8);
const crowd2 = createCrowd(s, {x: FX - .7, z: .2});
const CELL = .52, plateAt = (cols, rows) => [FX - .7 + (cols / 2 - 5) * CELL, .2 + (5 - rows / 2) * CELL];
const [p1x, p1z] = plateAt(5, 4), [p2x, p2z] = plateAt(2, 2);
const plate1 = s.add(s.rbox(5 * CELL - .03, 1, 4 * CELL - .03, .05), s.M(ORANGE, {roughness: .5}), p1x, 0, p1z);
const plate2 = s.add(s.rbox(2 * CELL - .03, 1, 2 * CELL - .03, .04), s.M(RED, {roughness: .5}), p2x, 0, p2z);
const stack64 = createStack(s, coin, {x: FX + 4.7, z: 2.2, col: RED, max: 34}), stack16 = createStack(s, coin, {x: FX + 4.7, z: .6, col: ORANGE, max: 12});
const inner = (r, c) => r >= 6 && c < 5, core = (r, c) => r >= 8 && c < 2;   // 20 人与其中的 4 人

// ───────── G 最后的立牌 ─────────
const board3 = createBoard(s, {x: 88, z: -.2, lines: ['符合比例', '≠ 解释了原因'], t0: C.L10.start + .25, accent: RED});

flights.commit();

// ───────── 角色：一路跳过每个站点，转旋钮 ─────────
const mascot = createMascot(s, coin);
const ground = (x, z = 4.3) => v3(x, .3, z), onDial = v3(dialX, .72, dialZ);
const hop = hopPath([
  {t: 0, pos: ground(5.9, 3.5), facing: -.5},
  {t: C.L2.start - .15, pos: ground(9.4), facing: .9, h: 1.3},
  {t: C.L2.start + .4, pos: ground(13), facing: .9, h: 1.3},
  {t: C.L2.start + 1.5, pos: ground(15), facing: .9}, {t: C.L2.start + 2.4, pos: ground(17), facing: .9}, {t: C.L2.start + 3.3, pos: ground(19), facing: .9}, {t: C.L2.start + 4.2, pos: ground(21), facing: .9},
  {t: C.L3.start - .1, pos: ground(24.6, 3.9), facing: .9, h: 1.4}, {t: C.L3.start + .5, pos: ground(27.2, 3.6), facing: .7},
  {t: C.L4.start + .2, pos: ground(31.5, 3.8), facing: .9}, {t: C.L4.start + .8, pos: ground(35.4, 3.2), facing: .6, h: 1.3},
  {t: C.L5.start, pos: ground(39.6, 3.6), facing: .9, h: 1.4}, {t: C.L5.start + .7, pos: ground(42.4, 3.4), facing: .9, h: 1.2},
  {t: C.L5.start + 3.0, pos: onDial.clone(), facing: .1, h: 1.4},
  {t: C.L6.start + .25, pos: onDial.clone(), facing: .1, h: .7},
  {t: lineStart('L6', 1) + .2, pos: onDial.clone(), facing: .1, h: .7},
  {t: C.L7.start + .5, pos: onDial.clone(), facing: .1, h: .7},
  {t: C.L8.start + .4, pos: ground(dialX + 2.6, 4.2), facing: .3, h: 1},
  {t: C.L9.start - .35, pos: ground(EX + 5, 4.3), facing: .8, h: 1.4}, {t: C.L9.start + .1, pos: ground(EX + 9.4, 4.3), facing: .8, h: 1.4}, {t: C.L9.start + .7, pos: ground(FX - 4.4, 4.4), facing: .5, h: 1.4},
  {t: C.L10.start - .2, pos: ground(FX + 4.2, 4.4), facing: .8, h: 1.2}, {t: C.L10.start + .4, pos: ground(84.5, 3.3), facing: .5, h: 1.5},
  {t: C.L11.start + .9, pos: ground(84.5, 3.3), facing: .1, h: .5}, {t: C.L11.start + 2, pos: ground(84.5, 3.3), facing: .1, h: .5},
]);

// ───────── α 随配音变化 ─────────
const alpha = t => {
  let a = A0;
  a += (1.5 - A0) * spring(t - C.L6.start - .25, 1.3, .7);
  a += .5 * spring(t - lineStart('L6', 1) - .2, 1.3, .7);
  a += (A0 - 2) * ease.inOutCubic(win(t, C.L7.start + .5, C.L7.start + 2.6));
  return a;
};

// ───────── 镜头 ─────────
const K = (t, x, y, z, d, az, el) => ({t, v: [x, y, z, d, az, el]});
const cam = track([
  K(0, AX - .4, 1.2, .4, 20, -24, 26), K(C.L1.start + 2.8, AX - .2, 1.6, .6, 18.5, -8, 25), K(C.L1.end, AX + 3.4, 1.6, .6, 19.5, 8, 24),
  K(C.L2.start + 1.2, BX - 1.6, 1.2, 1, 17.5, 8, 30), K(C.L2.end, BX + 1.2, 1, 1, 16.5, -6, 32),
  K(C.L3.start + 1.4, CX - .4, 1.7, .8, 13.5, 8, 16), K(C.L3.end, CX + .2, 2, .6, 13, -8, 15),
  K(C.L4.start + 1.6, 36, 2.7, .4, 21, 4, 15), K(C.L4.end, 39.4, 2.8, 0, 15.5, -5, 11),
  K(C.L5.start + 2.2, dialX + 1.6, 2, 1.4, 19, -14, 17), K(C.L5.end, EX - 1.5, 2.6, .8, 24, -8, 17),
  K(C.L6.start + 3.2, EX - 1, 2.8, .4, 25, 2, 15), K(C.L6.end, EX + 1.4, 3, .3, 24.5, 8, 14),
  K(C.L7.start + 2.6, EX - .2, 2.7, .8, 22.5, 3, 15), K(C.L7.end, EX + 1, 2.8, .6, 23, -4, 15),
  K(C.L8.start + 2.4, EX + .2, 4, 0, 27, 3, 12), K(C.L8.end, EX + 3.4, 3.8, 0, 26, 11, 13),
  K(C.L9.start + 1.8, FX - .5, 1.5, .6, 17.5, -13, 24), K(C.L9.start + 5, FX + .4, 1.8, .4, 15.5, 2, 21), K(C.L9.end, FX + 1.8, 1.9, .6, 16.5, 12, 20),
  K(C.L10.start + 1.3, 88, 2.7, .3, 15.5, -6, 12), K(C.L10.end, 87, 2.7, 0, 18, 4, 12),
  K(C.L11.start + 1.8, 72, 2, 0, 40, -6, 20), K(DUR, 45, 1, 0, 92, -5, 25),
]);

const landOwn = t => 80 * clamp01(win(t, C.L2.start + 1, C.L2.end - .6));
const podsOn = t => win(t, C.L3.start + 1.2, C.L3.end - .4);

s.run(t => {
  s.aim(cam(t));
  flights.update(t);

  // A：人群错峰站起，前两排 20 人变橙，币飞向两堆
    crowd.update((r, c) => {
    const k = spring(t - (C.L1.start - .4 + ((r * 7 + c * 13) % 23) * .025), 2.4, .5), rich = r >= 8;
    return {k: Math.max(0, k), y: rich ? .08 * Math.max(0, Math.sin((t - c * .08) * 3.4)) * clamp01(t - C.L1.start - 1) : 0, col: rich && t > C.L1.start + .95 ? ORANGE : GREY};
  });
  richStack.set(flights.landed(toRich, t)); poorStack.set(flights.landed(toPoor, t));

  // B：跟着小人脚步，地块逐块翻成橙色并隆起
  const own = landOwn(t);
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
    const i = r * 10 + c, on = landRank[i] < own, f = on ? spring((own - landRank[i]) * .045, 2, .45) : 0;
    land.set(i, v3(BX + (c - 4.5) * .74, .38 + f * .05, (r - 4.5) * .74), [1, 1 + f * .9, 1], on ? ORANGE : '#d9d2c4');
  }
  land.flush();
  owners.update((r, c) => ({k: Math.max(0, spring(t - C.L2.start - .3 - c * .05, 2.4, .5)), col: c < 2 ? ORANGE : GREY, y: c < 2 ? .06 * Math.abs(Math.sin(t * 4 + c)) : 0}));

  // C：豌豆错峰长高，两株结满荚
  for (let i = 0; i < 10; i++) {
    const g = spring(t - C.L3.start - .15 - i * .06, 1.3, .55), H = (tallest(i) ? 4.5 : 1.3) * Math.max(0, g);
    stems.set(i, v3(plantX(i), .3 + H / 2, 0), [1, Math.max(.001, H), 1]);
    leaves.set(i, v3(plantX(i), .3 + H, 0), Math.max(0, g) * (tallest(i) ? 1.15 : .8), tallest(i) ? '#6fb35d' : '#9ac98a');
  }
  stems.flush(); leaves.flush();
  const pn = podsOn(t) * podPlan.length;
  podPlan.forEach((p, i) => {
    const k = spring((pn - i) * .08, 2, .4), on = pn > i;
    pods.set(i, on ? v3(plantX(p.p) + Math.cos(p.a) * p.r, .3 + p.y, Math.sin(p.a) * p.r) : s.HIDE, on ? Math.max(0, k) : 0, tallest(p.p) ? '#a7d840' : '#cfe68f');
  });
  pods.flush();
  board1.update(t);

  // E：旋钮 → 分布 → 份额。三者由同一个 α 算出
  const a = alpha(t), tOn = C.L5.start + .4;
  dial.rotation.y = -(a - A0) * 1.8;
  for (let i = 0; i < 10; i++) {
    const v = share((i + 1) / 10, a) - share(i / 10, a), k = Math.max(0, spring(t - tOn - i * .09, 1.6, .55));
    bars.set(i, v3(barX(i), .6, 0), [1, Math.max(.001, v * 8.6 * k), 1], i < 2 ? ORANGE : GREY);
  }
  bars.flush();
  gauge.set(share(.2, a) * 100 * Math.max(0, spring(t - tOn - 1, 1.4, .7)));
  beamIn.update(t); board2.update(t);

  // F：20 人升上台，再有 4 人升更高；币堆从 80% 的一部分长到 64%
  const u1 = Math.max(0, spring(t - lineStart('L9', 0) - .7, 1.6, .5)), u2 = Math.max(0, spring(t - lineStart('L9', 2) - .1, 1.6, .5));
  plate1.position.y = u1 * 1 - .5; plate1.visible = u1 > .01;
  plate2.position.y = u1 + u2 * 1 - .5; plate2.visible = u2 > .01;
  crowd2.update((r, c) => { const k = spring(t - C.L9.start - .4 - ((r * 3 + c * 5) % 17) * .022, 2.4, .5), isCore = core(r, c), isIn = inner(r, c); return {k: Math.max(0, k), y: (isIn ? u1 : 0) + (isCore ? u2 : 0), col: isCore && u2 > .05 ? RED : isIn && u1 > .05 ? ORANGE : GREY}; });
  const n1 = 32 * win(t, lineStart('L9', 1) + .1, lineStart('L9', 2) - .1);
  stack64.set(n1); stack16.set(8 * win(t, lineStart('L9', 1) + .1, lineStart('L9', 2) - .1));
  board3.update(t);

  const st = hop(t), appear = Math.max(0, spring(t - C.L1.start - .3, 2, .45));
  mascot.pose(t, st.pos, st.facing, st.sq, appear, null);
}, t => {
  o.clear();
  const seg = [['L1', '一个说法'], ['L2', '土地的例子'], ['L3', '豌豆的例子'], ['L4', '只是分布不均'], ['L5', '换成数学模型'], ['L6', '转动指数 α'], ['L7', '尾巴越厚，越集中'], ['L8', '比例是算出来的'], ['L9', '如果继续成立'], ['L10', '仍未解释原因'], ['L11', '先问两件事']];
  const cur = [...seg].reverse().find(([id]) => t >= C[id].start - .1) || seg[0];
  o.chip(t, .2, C.L11.end + .1, '二八法则 · 同一篇稿件的 3D 微缩重做', cur[1], 500);

  const X = s.W - 478, Y = 44, rich = flights.landed(toRich, t) * 2, poor = flights.landed(toPoor, t) * 2;
  o.panel(X, Y, [{big: 1, label: '前 20% 的人占有', value: `${rich}%`, color: '#d9651a'}, {label: '其余 80% 的人', value: `${poor}%`}], o.fadeIn(t, C.L1.start + 1.2, C.L2.start));
  o.panel(X, Y, [{big: 1, label: '前 20% 的人占有的土地', value: `${Math.round(landOwn(t))}%`, color: '#d9651a'}, {label: '来源', value: '维基百科条目'}], o.fadeIn(t, C.L2.start, C.L3.start));
  const pc = Math.round(podsOn(t) * podPlan.length), big2 = podPlan.slice(0, pc).filter(p => tallest(p.p)).length;
  o.panel(X, Y, [{big: 1, label: '2 株（20%）结出的豆荚', value: `${big2} / 40`, color: '#5e9a22'}, {label: '占比', value: `${Math.round(big2 / 40 * 100)}%`}, {label: '来源', value: '维基百科条目'}], o.fadeIn(t, C.L3.start, C.L4.start + .4));
  const a = alpha(t), sh = share(.2, a) * 100;
  o.panel(X, Y, [{big: 1, label: '最富 20% 的份额', value: `${o.fmt(sh, 0)}%`, color: '#d9651a'}, {label: '指数 α', value: o.fmt(a, 2)}, {label: '公式', value: '0.2^(1−1/α)'}], o.fadeIn(t, C.L5.start + 1.3, C.L9.start));
  o.panel(X, Y, [{big: 1, label: '最富 4% 的人占有', value: `${Math.round(stack64 ? 64 * win(t, lineStart('L9', 1) + .1, lineStart('L9', 2) - .1) : 0)}%`, color: RED}, {label: '80% × 80%', value: '64%'}, {label: '20% × 20%', value: '4%'}], o.fadeIn(t, C.L9.start + .6, C.L10.start));

  o.tag(t, v3(AX - 2.8, .9, 2.7), '前 20% 的人', '20 / 100', C.L1.start + 1.1, C.L2.start - .2, {left: true, color: '#c95f14'});
  o.tag(t, v3(owners.at(0, 0).x + .3, .9, 4.05), '这 2 位 = 20%', null, C.L2.start + .8, C.L3.start - .1, {left: true, color: '#c95f14', size: 22});
  o.tag(t, v3(plantX(3), 5, 0), '2 株结了 32 荚', null, C.L3.start + 1.8, C.L4.start + .3, {left: true, color: '#5e9a22', size: 22});
  o.tag(t, v3(dialX, 1.2, dialZ - .2), '指数 α', '输入', C.L5.start + 2.4, C.L9.start - .2, {left: true, rise: 70});
  o.tag(t, v3(barX(0), .7 + 4.2, .45), '最富的 10%', null, C.L5.start + 1.8, C.L6.start + .3, {left: true, size: 20});
  o.tag(t, v3(barX(9), 1, .45), '最穷的 10%', null, C.L5.start + 2.2, C.L6.start + .3, {size: 20, rise: 60});
  o.tag(t, gauge.top(sh), `${o.fmt(sh, 0)}%`, null, C.L5.start + 1.3, C.L9.start - .1, {size: 28, rise: 20, color: '#c95f14', dot: ORANGE});
  o.tag(t, v3(p1x - 1.1, .75, p1z + 1.05), '20 人', '占 80%', lineStart('L9', 0) + .9, C.L10.start, {left: true, color: '#c95f14'});
  o.tag(t, v3(p2x - .1, 2.9, p2z), '其中 4 人', '占 64%', lineStart('L9', 2) + .1, C.L10.start, {left: true, rise: 50, color: RED});
  o.subtitle(t); o.progress(t);
  o.endCard(t, C.L11.end + .1, '二八法则，是算出来的结果', '先问尾巴有多厚，分母是谁', '例子与 α≈1.16：维基百科帕累托法则条目 · 58%、45%、64%、4% 由本片按公式计算');
});
