// 组件目录：每个道具一个站点，镜头依次走过。用于检查组件能否独立工作，也生成 README 的组件总览。
// node render.mjs clip 0 34 --q scene=catalog --mb 4
import {createStage} from './stage.js';
import {createOverlay} from './overlay.js';
import {coinKit, createFlights, createStack, createPipes, createFreeze, createGauge, createGate, createBeam, createMascot, createShuttle, createTank, createCrowd, createBoard, hopPath} from './props.js';
import {stagger, track, spring, ease, win, lerp} from './motion.js';

const SLOT = 5.6, NAMES = [['管道网络', 'createPipes · 多路流出，按时间窗点亮'], ['液面罐 + 钱币堆', 'createTank / createStack · 高度就是数据'], ['冰冻', 'createFreeze · 高度=冻结比例，碎冰四溅'], ['数值柱 + 飞行交接', 'createGauge / createFlights · 飞进漏斗，柱子升高'], ['闸门', 'createGate · 蓄力、砸下、回弹扬尘'], ['光束', 'createBeam · 信息过得去，实物过不去'], ['往返搬运', 'createShuttle · 蓄力腾空落地，四次交接，逐趟加速'], ['人群 + 立牌 + 跳跃路径', 'createCrowd / createBoard / hopPath · 错峰站起，结论落地']];
const DUR = SLOT * NAMES.length + 1.5;
const s = await createStage({timeline: {cues: [], seconds: DUR}, hemi: .85, keyLight: 2.4, exposure: .8, bg: '#c4bbab'});
const {v3} = s, o = createOverlay(s);
const X = i => i * 15, T = i => i * SLOT + .4;
s.ground('#d6cbb8'); s.cityscape({xMin: -25, xMax: 130, clear: (x, z) => z > 0});
NAMES.forEach((_, i) => s.pad(X(i), 0, 11, 7.5));
const coin = coinKit(s), flights = createFlights(s, coin, 140);

// 0 管道
const cols = ['#7d8bff', '#f7931a', '#ff4d4f', '#1fd8a4', '#2d9cdb'];
s.add(s.rbox(1.8, 2.2, 2.4, .2, 4), s.M('#efb21a', {metalness: .35, roughness: .3}), X(0) - 4, 1.4, 0);
s.add(s.rbox(1.6, 3, 1.6, .2, 4), s.M('#2b2d35', {roughness: .4}), X(0) + 4.4, 1.8, 0);
const pipes = createPipes(s, cols.map((col, i) => ({key: 'c' + i, value: 1, col, n: 34, a: T(0) + i * .35, b: T(0) + i * .35 + 2.6,
  pts: [v3(X(0) - 3, 1 + i * .3, -.8 + i * .4), v3(X(0) - 1.5, 2.2 + i * .15, (i - 2) * .9), v3(X(0) + 1.5, 2.4, (i - 2) * .7), v3(X(0) + 3.5, 1.9 + i * .1, (i - 2) * .12)]})));

// 1 液面 + 堆
const tank = createTank(s, {x: X(1) - 2.5, y: .3, z: 0, h: 3.2}), stacks = [0, 1, 2].map(i => createStack(s, coin, {x: X(1) + 1 + i * 1.1, z: 0, col: ['#26a17b', '#f7931a', '#2775ca'][i], max: 40}));

// 2 冰冻
const fzStacks = [0, 1].map(i => createStack(s, coin, {x: X(2) - 1 + i * 2, z: 0, col: ['#26a17b', '#2775ca'][i], max: 40}));
fzStacks.forEach((st, i) => st.set(36));
const fz = [createFreeze(s, {x: X(2) - 1, z: 0, h: 36 * .71 * .072 + .12, t0: T(2) + .6}), createFreeze(s, {x: X(2) + 1, z: 0, h: 36 * .072 + .12, t0: T(2) + 1.6})];

// 3 数值柱 + 飞行
const map = v => (v - 2000) / 1000 * 6.4;
const g3 = createGauge(s, {x: X(3) + 1.8, col: '#0fb488', emis: '#078a66', map, ticks: [2300, 2500, 2700]});
const src = createStack(s, coin, {x: X(3) - 3, z: 0, col: '#26a17b', max: 40}); src.set(30);
const fl3 = []; for (let i = 0; i < 18; i++) fl3.push(flights.add({col: '#26a17b', from: () => v3(X(3) - 3, 2.5, 0), to: v3(X(3) + 1.8, 7.6, 0), te: stagger(i, 18, T(3) + .2, 2.6), dur: 1.3, h: 2.6, spin: 7}));

// 4 闸门
const gate = createGate(s, {x: X(4), close: T(4) + 1.1, open: T(4) + 4.4});
const gc = createStack(s, coin, {x: X(4) + 2, z: 0, col: '#7d8bff', max: 30}); gc.set(16);

// 5 光束
s.add(s.rbox(1.4, 3.6, 1.4, .2, 4), s.M('#f0a300', {roughness: .4}), X(5) + 3.6, 2.1, 0);
s.add(s.rbox(2.4, 1.8, 2.2, .3, 4), s.M('#b47fd9', {roughness: .42}), X(5) - 3.6, 1.2, 0);
const beam = createBeam(s, {pts: [v3(X(5) + 3.6, 4, 0), v3(X(5) + 1.5, 6, 0), v3(X(5) - 1.5, 5.4, 0), v3(X(5) - 3.6, 2.2, 0)], t0: T(5) + .4});

// 6 搬运
const m = createMascot(s, coin), A = v3(X(6) + 2.6, .3, 1.8), B = v3(X(6) - 2.6, .3, 1.8);
s.add(s.rbox(2, 1.6, 1.8, .26, 4), s.M('#b47fd9', {roughness: .42}), X(6) + 3.8, 1.1, -.7);
s.add(s.rbox(1.2, 3, 1.2, .16, 4), s.M('#0fb488', {roughness: .35}), X(6) - 3.8, 1.8, -.7);
const shuttle = createShuttle(s, m, flights, {A, B, start: T(6) + .3, end: T(6) + SLOT + .9, hand: {pick: v3(X(6) + 3.8, 2.1, -.7), drop: v3(X(6) - 3.8, 1, .6), get: v3(X(6) - 3.8, 1, .6), put: v3(X(6) + 3.8, 2.1, -.7)}, durs: [2.1, 1.6, 1.25, 1, .9]});
// 7 人群 + 立牌 + 跳跃
const crowd = createCrowd(s, {x: X(7) - 2.2, z: .4}), board = createBoard(s, {x: X(7) + 3, z: -1.4, w: 4.4, h: 2.2, lines: ['结论写在场景里', '不贴在屏幕上'], t0: T(7) + 2.2});
const m2 = createMascot(s, coin), hop = hopPath([{t: 0, pos: v3(X(7) - 4.9, .3, 3), facing: .9}, {t: T(7) + .9, pos: v3(X(7) - 2.6, .3, 3.1), facing: .9}, {t: T(7) + 1.6, pos: v3(X(7) - .4, .3, 3.1), facing: .9}, {t: T(7) + 2.3, pos: v3(X(7) + 1.8, .3, 2.6), facing: .4}]);
flights.commit();

const K = (i, ph, d, az) => ({t: T(i) + ph, v: [X(i), 2.2, 0, d, az, 15]});
const keys = [{t: 0, v: [X(0), 2.2, 0, 19, -14, 18]}];
NAMES.forEach((_, i) => keys.push(K(i, SLOT * .15, 17, -9), K(i, SLOT * .78, 16, 9)));
keys.push({t: DUR, v: [X(6), 2.2, 0, 20, 14, 18]});
const cam = track(keys);

s.run(t => {
  s.aim(cam(t));
  flights.update(t); pipes.update(t);
  const f = pipes.total(t) / cols.length;
  const k1 = ease.inOutSine(win(t, T(1) + .3, T(1) + 4.4));
  tank.set(1 - k1 * .92); stacks.forEach((st, i) => st.set(k1 * [34, 20, 26][i]));
  fz.forEach(x => x.update(t));
  g3.set(2300 + 400 * ease.outCubic(flights.landed(fl3, t) / fl3.length));
  gate.update(t); beam.update(t);
  const st = shuttle.state(t), ap = spring(t - T(6) + .2, 2, .4);
  if (st) m.pose(t, st.pos, st.facing, st.sq, ap, st.item); else m.pose(t, A, .2, [1, 1], ap);
  crowd.update((r, c) => ({k: Math.max(0, spring(t - T(7) - .2 - ((r * 7 + c * 13) % 23) * .03, 2.4, .5)), col: r >= 8 && t > T(7) + 1.5 ? '#ff8a3c' : '#aeb6bf'}));
  board.update(t); const h = hop(t); m2.pose(t, h.pos, h.facing, h.sq, Math.max(0, spring(t - T(7) + .3, 2, .45)));
}, t => {
  o.clear();
  const i = Math.min(NAMES.length - 1, Math.floor(Math.max(0, t - .4) / SLOT));
  o.chip(t, 0, DUR + 1, NAMES[i][1], NAMES[i][0], 780);
  o.progress(t);
});
