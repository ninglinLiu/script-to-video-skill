// 起手场景：两站点 + 飞行交接 + 钱币堆 + 搬运小人 + 连续镜头 + 跟随标签 + 词界字幕。
// 复制到 episode/web/ 后按分镜改「站点」「动作」「镜头」三段；stage/overlay/props 一般不用改。
import {createStage} from './stage.js';
import {createOverlay} from './overlay.js';
import {coinKit, createFlights, createStack, createMascot, createShuttle} from './props.js';
import {stagger, track, spring, ease} from './motion.js';

const s = await createStage();
const {v3, CUE, DUR} = s, o = createOverlay(s);
const c0 = CUE[0], c1 = CUE[Math.min(1, CUE.length - 1)], cN = CUE[CUE.length - 1];
const shift = c1 === c0 ? c0.start + (c0.end - c0.start) / 2 : c1.start;

// ───────── 站点 ─────────
s.ground(); s.cityscape({xMin: -30, xMax: 45, clear: (x, z) => z > 0 && Math.abs(x - 6) < 22});
s.pad(0, 0, 6, 6); s.pad(12, .6, 6, 6.6);
s.add(s.rbox(3.2, 2.6, 3, .26, 4), s.M('#efb21a', {metalness: .35, roughness: .3}), 0, 1.6, 0);
s.add(s.rbox(2.4, 3.4, 2.4, .2, 4), s.M('#2b2d35', {roughness: .4}), 12, 2, -.4);
const coin = coinKit(s), flights = createFlights(s, coin, 120);
const stack = createStack(s, coin, {x: 12.8, z: 2.2, col: '#7d8bff', max: 40});

// ───────── 动作：时间全部来自真实配音 cue，改稿重配后自动对齐 ─────────
const N = 30, flow = [];
for (let i = 0; i < N; i++) flow.push(flights.add({col: '#7d8bff', from: () => v3(1.6, 2.6, 0), to: v3(12.8, 2.5, 2.2), te: stagger(i, N, c0.start + .3, (shift - c0.start) * .8), dur: 1.3, h: 2.4, spin: 6}));
const mascot = createMascot(s, coin);
const A = v3(1, .3, 3.1), B = v3(10.2, .3, 3.1);
const shuttle = createShuttle(s, mascot, flights, {A, B, start: shift + .4, end: cN.end, hand: {pick: v3(1, 3.1, 0), drop: v3(12.8, 2.5, 2.2), get: v3(12, 3.9, -.4), put: v3(1, 3.1, 0)}, durs: [3.2, 2.8, 2.4, 2, 1.8, 1.6, 1.5, 1.4, 1.4, 1.4]});
flights.commit();

// ───────── 镜头：目标 xyz + 距离 / 方位° / 俯仰°，经过关键帧不减速 ─────────
const K = (t, x, y, z, d, az, el) => ({t, v: [x, y, z, d, az, el]});
const cam = track([K(0, 0, 2, 0, 18, -25, 18), K(shift, 6, 2.4, 0, 26, 5, 24), K(DUR, 8, 1.8, 1, 24, 14, 18)]);

s.run(t => {
  s.aim(cam(t));
  flights.update(t);
  stack.set(N * flights.landed(flow, t) / N);
  const st = shuttle.state(t), appear = spring(t - shift, 2, .4);
  if (st) mascot.pose(t, st.pos, st.facing, st.sq, appear, st.item); else mascot.pose(t, A, .2, [1, 1], appear);
}, t => {
  o.clear();
  o.tag(t, v3(0, 3.3, 0), '源头', 'SOURCE', c0.start, c1.end);
  o.tag(t, v3(12, 4, -.4), '去向', 'DESTINATION', c0.start + 1, DUR, {left: true});
  o.panel(s.W - 478, 44, [{big: 1, label: '已到达', value: `${flights.landed(flow, t)} / ${N}`}, {label: '搬运趟数', value: String(shuttle.done(t))}], o.fadeIn(t, c0.start, DUR));
  o.subtitle(t); o.progress(t);
});
