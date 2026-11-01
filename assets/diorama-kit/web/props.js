// 道具库：从币安样片提炼的动作组件。每个组件都带“动作”，而不只是外观：
// 飞行交接、资金管道、钱币堆、冰冻、价格柱、闸门、光束、搬运角色。所有状态只依赖时间 t。
import {THREE} from './stage.js';
import {clamp01, lerp, win, ease, spring, arc, squash, rng} from './motion.js';

const along = (table, u, out) => { const f = clamp01(u) * (table.length - 1), i = Math.floor(f), k = f - i; return out.copy(table[i]).lerp(table[Math.min(i + 1, table.length - 1)], k); };
const resolve = x => (typeof x === 'function' ? x() : x.clone());

export function coinKit(s) {
  return {geo: new THREE.CylinderGeometry(.33, .33, .066, 36), mat: s.M('#ffffff', {metalness: .45, roughness: .28})};
}

// 飞行交接：物体从 A 真实移动到 B。凭空出现的东西等于动作没发生。
// add({col, from, to, te, dur, h, spin, flat, scale})；from 可为函数。写完调 commit()。
export function createFlights(s, coin, cap = 200) {
  const mesh = new THREE.InstancedMesh(coin.geo, coin.mat, cap); mesh.castShadow = true; mesh.frustumCulled = false; s.scene.add(mesh);
  const list = [];
  return {
    list,
    add(f) { list.push({h: 2, spin: 5, ...f}); return list[list.length - 1]; },
    commit() { if (list.length > cap) throw new Error(`flights ${list.length} > cap ${cap}`); list.forEach((f, i) => mesh.setColorAt(i, new THREE.Color(f.col))); },
    landed: (sub, t) => sub.reduce((a, f) => a + (t >= f.te + f.dur ? 1 : 0), 0),
    update(t) {
      list.forEach((f, i) => {
        const u = (t - f.te) / f.dur;
        if (u < 0 || u > 1) return s.setInst(mesh, i, s.HIDE, 0);
        const p = resolve(f.from).lerp(f.to, ease.inOutSine(u)); p.y += arc(u, f.h);
        s.setInst(mesh, i, p, f.scale || .9, u * f.spin, Math.PI / 2 * (f.flat ? 1 : Math.sin(u * Math.PI)));
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// 钱币堆：n 可为小数，顶部那枚从上方落下。堆高就是数据。
export function createStack(s, coin, {x, z, col, max = 70, y0 = .336, step = .072}) {
  const mesh = new THREE.InstancedMesh(coin.geo, coin.mat, max); mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; s.scene.add(mesh);
  const r = rng(Math.round(x * 100 + z * 7) + 11);
  const jit = Array.from({length: max}, () => [(r() - .5) * .04, (r() - .5) * .04, r() * 6]);
  for (let i = 0; i < max; i++) mesh.setColorAt(i, new THREE.Color(col).offsetHSL(0, 0, (r() - .5) * .05));
  return {
    x, z, top: n => y0 + n * step,
    set(n) {
      const full = Math.floor(n), frac = n - full;
      for (let i = 0; i < max; i++) {
        if (i > full || (i === full && frac < .02)) { s.setInst(mesh, i, s.HIDE, 0); continue; }
        const drop = i === full ? (1 - ease.outCubic(frac)) * .9 : 0, j = jit[i];
        s.setInst(mesh, i, s.v3(x + j[0], y0 + i * step + drop, z + j[1]), 1, j[2]);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// 管道网络：多条彩色玻璃管，代币按时间窗流过。routes: [{key, value, col, pts:[v3...], a, b, n}]
export function createPipes(s, routes, {travel = 1.45, seed = 1029} = {}) {
  const R = rng(seed), tokens = [];
  routes.forEach((c, ci) => {
    const curve = new THREE.CatmullRomCurve3(c.pts, false, 'centripetal');
    c.curve = curve; c.table = curve.getSpacedPoints(240);
    s.add(new THREE.TubeGeometry(curve, 160, .1, 12), s.glass(), 0, 0, 0, s.scene, false);
    c.core = s.add(new THREE.TubeGeometry(curve, 160, .05, 8), new THREE.MeshBasicMaterial({color: new THREE.Color(c.col), transparent: true, opacity: .5}), 0, 0, 0, s.scene, false);
    for (let j = 0; j < c.n; j++) tokens.push({ci, te: lerp(c.a, c.b, (j + R() * .8) / c.n), dur: travel * (.9 + R() * .2)});
  });
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.12, 12, 8), new THREE.MeshBasicMaterial({color: '#ffffff', toneMapped: false}), tokens.length);
  tokens.forEach((tk, i) => mesh.setColorAt(i, new THREE.Color(routes[tk.ci].col).multiplyScalar(4.5)));
  mesh.frustumCulled = false; s.scene.add(mesh);
  const frac = (ci, t) => { let a = 0; for (const tk of tokens) if (tk.ci === ci && t >= tk.te + tk.dur) a++; return a / routes[ci].n; };
  const _p = new THREE.Vector3();
  return {
    routes, frac, started: (ci, t) => tokens.some(tk => tk.ci === ci && t >= tk.te),
    total: t => routes.reduce((a, c, ci) => a + c.value * frac(ci, t), 0),
    update(t) {
      routes.forEach(c => { c.core.material.opacity = lerp(.42, 1, clamp01(Math.min((t - c.a + .3) / .3, (c.b + travel - t) / .6))); });
      tokens.forEach((tk, i) => {
        const u = (t - tk.te) / tk.dur;
        if (u < 0 || u > 1) s.setInst(mesh, i, s.HIDE, 0);
        else s.setInst(mesh, i, along(routes[tk.ci].table, ease.inOutSine(u), _p), 1 + .35 * Math.sin(u * Math.PI));
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// 冰冻：冰块从底部长出，高度 = 被冻结的比例；长出瞬间碎冰四溅。
export function createFreeze(s, {x, y = .3, z, w = .98, h, t0}) {
  const mat = new THREE.MeshPhysicalMaterial({color: '#d4f1ff', transmission: .92, thickness: .9, roughness: .14, ior: 1.31, metalness: 0, envMapIntensity: 1.3, transparent: true});
  const geo = s.rbox(w, h, w, .1, 3); geo.translate(0, h / 2, 0);
  const m = s.add(geo, mat, x, y, z, s.scene, false); m.scale.set(0, 0, 0);
  const frost = new THREE.InstancedMesh(new THREE.BoxGeometry(.07, .07, .07), s.glow('#e8f8ff', 1.6), 30); frost.frustumCulled = false; s.scene.add(frost);
  const r = rng(Math.round(x * 31) + 77);
  const P = Array.from({length: 30}, () => ({d: s.v3(r() - .5, r() * .9 + .3, r() - .5).normalize().multiplyScalar(1.6 + r() * 1.8), y: r()}));
  return {
    t0,
    update(t) {
      const k = t - t0, sy = spring(k, 1.6, .38), sx = spring(k - .05, 2.2, .3);
      m.scale.set(Math.max(0, sx), Math.max(0, sy), Math.max(0, sx));
      P.forEach((p, i) => {
        const q = t - t0 - .05;
        if (q < 0 || q > 1.1) return s.setInst(frost, i, s.HIDE, 0);
        const b = s.v3(x, y + .1 + p.y * h, z); b.addScaledVector(p.d, ease.outCubic(q / 1.1) * .9); b.y -= 1.2 * q * q;
        s.setInst(frost, i, b, (1 - q / 1.1) * 1.2, q * 6, q * 4);
      });
      frost.instanceMatrix.needsUpdate = true;
    },
  };
}

// 数值柱：填充高度由 map(value) 决定；背板和刻度保证“读得出是柱状图”。
export function createGauge(s, {x, z = 0, col, emis, map, ticks = [], height = 7, base = .56}) {
  s.add(s.rbox(1.7, .25, 1.7, .08), s.M('#e2d9ca'), x, base - .14, z);
  s.add(s.rbox(1.5, height, 1.5, .16), s.glass(.05), x, base - .01 + height / 2, z, s.scene, false);
  s.add(s.rbox(2.1, height + .4, .14, .06), s.M('#fbf8f2', {roughness: .7}), x, base - .01 + height / 2 + .2, z - .95);
  const g = s.rbox(1.2, 1, 1.2, .1); g.translate(0, .5, 0);
  const fill = s.add(g, new THREE.MeshStandardMaterial({color: col, emissive: emis || col, emissiveIntensity: .12, roughness: .35}), x, base, z, s.scene, false);
  for (const p of ticks) {
    s.add(new THREE.BoxGeometry(1.56, .03, 1.56), s.M('#8d8576'), x, base + map(p), z, s.scene, false);
    s.add(new THREE.BoxGeometry(2.0, .035, .04), s.M('#8d8576'), x, base + map(p), z - .86, s.scene, false);
  }
  return {x, z, set(v) { fill.scale.y = Math.max(.001, map(v)); }, top: v => s.v3(x + .75, base + map(v), z + .75), base};
}

// 闸门：先反向抬一点蓄力，砸下回弹并扬尘。沿 z 方向横跨。
export function createGate(s, {x, zA = -3.75, zB = 3.75, y = 2.25, close, open = Infinity}) {
  const stripe = s.canvasTex(256, 32, (g, w, h) => { g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#e1423a'; for (let px = -32; px < w; px += 64) { g.beginPath(); g.moveTo(px, h); g.lineTo(px + 32, 0); g.lineTo(px + 64, 0); g.lineTo(px + 32, h); g.fill(); } }, [6, 1]);
  const len = zB - zA;
  s.add(s.rbox(.4, y + .25, .4, .08), s.M('#e1423a'), x, .3 + (y - .05) / 2 - .02, zA);
  s.add(s.rbox(.4, y - .95, .4, .08), s.M('#e1423a'), x, .95, zB);
  const pivot = new THREE.Group(); pivot.position.set(x, y, zA); s.scene.add(pivot);
  s.add(s.rbox(.3, .3, len + .1, .08), s.M('#ffffff', {map: stripe}), 0, 0, len / 2 + .05, pivot);
  const lamp = s.add(new THREE.SphereGeometry(.17, 16, 12), s.glow('#ff3b30', 2.8), x, y + .7, zA, s.scene, false);
  const dust = new THREE.InstancedMesh(new THREE.SphereGeometry(.09, 8, 6), s.M('#d9cfbf', {roughness: 1}), 40); dust.frustumCulled = false; s.scene.add(dust);
  const raised = -1.3;
  return {
    update(t) {
      const pre = ease.inOutSine(win(t, close - .35, close)) * -.18, drop = t < close ? 0 : spring(t - close, 1.5, .32);
      pivot.rotation.x = lerp(raised + pre, 0, drop) + (t > open ? raised * spring(t - open, 1.2, .55) : 0);
      lamp.visible = t > close && t < open && Math.floor(t * 2.5) % 2 === 0;
      for (let i = 0; i < 40; i++) {
        const k = t - close - .12, r = rng(i + 300);
        if (k < 0 || k > 1.3) { s.setInst(dust, i, s.HIDE, 0); continue; }
        const ang = r() * Math.PI * 2, sp = .8 + r() * 1.6;
        s.setInst(dust, i, s.v3(x + Math.cos(ang) * sp * ease.outCubic(k / 1.3), .45 + .5 * r() * Math.sin(Math.PI * k / 1.3), zA + .25 + r() * (len - .5) + Math.sin(ang) * .4), (1 - k / 1.3) * (1 + r()));
      }
      dust.instanceMatrix.needsUpdate = true;
    },
  };
}

// 光束：逐段长出，之后脉冲持续传递。表示“信息能过去，实物过不去”。
export function createBeam(s, {pts, t0, grow = 1.4, col = '#ffd23f'}) {
  const curve = new THREE.CatmullRomCurve3(pts), geo = new THREE.TubeGeometry(curve, 200, .035, 8);
  const beam = s.add(geo, s.glow(col, 1.8), 0, 0, 0, s.scene, false), table = curve.getSpacedPoints(200);
  const pulses = new THREE.InstancedMesh(new THREE.SphereGeometry(.11, 12, 8), s.glow('#fff2b0', 3), 6); pulses.frustumCulled = false; s.scene.add(pulses);
  const _p = new THREE.Vector3();
  return {
    grown: t => ease.outCubic(win(t, t0, t0 + grow)),
    update(t) {
      const g = ease.outCubic(win(t, t0, t0 + grow));
      geo.setDrawRange(0, Math.floor(g * geo.index.count / 3) * 3); beam.visible = g > 0;
      for (let i = 0; i < 6; i++) { if (g < 1) s.setInst(pulses, i, s.HIDE, 0); else s.setInst(pulses, i, along(table, (t * .55 + i / 6) % 1, _p), 1); }
      pulses.instanceMatrix.needsUpdate = true;
    },
  };
}

// 角色：暖色圆角方块小人。原点在脚底，挤压拉伸以脚底为基准。
export function createMascot(s, coin, {col = '#ff8f3a', foot = '#d9611c', scale = 1.55} = {}) {
  const bot = new THREE.Group(), body = new THREE.Group(); bot.add(body); s.scene.add(bot);
  s.add(s.rbox(.72, .6, .62, .2, 4), s.M(col, {roughness: .42}), 0, .42, 0, body);
  s.add(s.rbox(.5, .3, .04, .1), s.M('#fff6ea', {roughness: .5}), 0, .47, .3, body);
  for (const k of [-1, 1]) {
    s.add(s.rbox(.07, .15, .04, .03), s.M('#1d1f25', {roughness: .3}), k * .12, .48, .33, body);
    s.add(s.rbox(.17, .12, .22, .04), s.M(foot), k * .18, .06, .02, body);
  }
  s.add(new THREE.CylinderGeometry(.025, .025, .25, 6), s.M('#8b8478'), 0, .84, 0, body);
  s.add(new THREE.SphereGeometry(.08, 12, 8), s.M('#ffd23f'), 0, .98, 0, body);
  const carry = s.add(coin.geo, s.M('#7d8bff', {metalness: .45, roughness: .28}), 0, 1.12, 0, body); carry.rotation.x = Math.PI / 2;
  const HEAD = s.v3(0, 1.12 * scale, 0);
  return {
    bot, HEAD, scale,
    // pose：位置、朝向、挤压 [sx, sy]、出场系数、头顶携带物颜色（null 不带）
    pose(t, pos, facing, sq = [1, 1], appear = 1, item = null) {
      bot.visible = appear > .001; bot.position.copy(pos); bot.rotation.y = facing;
      bot.scale.set(scale * appear * sq[0], scale * appear * sq[1], scale * appear * sq[0]);
      carry.visible = !!item; if (item) carry.material.color.set(item);
      carry.scale.setScalar(.78 / scale); carry.rotation.z = t * 3;
    },
  };
}

// 往返搬运：每趟四次交接（取→带去→投入→换回→带回→存入），趟数越往后越快。
// 3/4 面向镜头，落地阶段转身。hand = {pick, drop, get, put}（交接点坐标），items = [去程色, 回程色]。
export function createShuttle(s, mascot, flights, {A, B, start, end, hand, items = ['#7d8bff', '#26a17b'], durs = [2.1, 1.75, 1.45, 1.25, 1.1, 1.0, .95, .9, .88, .86, .86, .86, .86], hop = [1.2, 1.0], leftward = true}) {
  const trips = []; let t0 = start;
  for (const d of durs) { if (t0 + d > end) break; trips.push({t0, d}); t0 += d; }
  for (const tr of trips) {
    const {d, t0: u0} = tr, H = mascot.HEAD;
    if (hand.pick) flights.add({col: items[0], from: () => hand.pick.clone(), to: A.clone().add(H), te: u0, dur: .14 * d, h: .9, spin: 4, flat: 1, scale: .78});
    if (hand.drop) flights.add({col: items[0], from: () => B.clone().add(H), to: hand.drop.clone(), te: u0 + .44 * d, dur: .06 * d, h: .2, spin: 3, flat: 1, scale: .78});
    if (hand.get) flights.add({col: items[1], from: () => hand.get.clone(), to: B.clone().add(H), te: u0 + .5 * d, dur: .07 * d, h: .7, spin: 5, flat: 1, scale: .78});
    if (hand.put) flights.add({col: items[1], from: () => A.clone().add(H), to: hand.put.clone(), te: u0 + .88 * d, dur: .06 * d, h: .2, spin: 3, flat: 1, scale: .78});
  }
  const OUT = (leftward ? -1 : 1) * (Math.PI / 2 - .75), BACK = -OUT, FRONT = .2;
  return {
    trips,
    done: t => trips.filter(tr => t > tr.t0 + tr.d * .58).length,
    state(t) {   // 返回 {pos, facing, sq, item} 或 null（不在搬运）
      for (const tr of trips) {
        const u = (t - tr.t0) / tr.d; if (u < 0) return null; if (u > 1) continue;
        const seg = (a, b) => win(u, a, b);
        if (u < .14) return {pos: A.clone(), facing: lerp(FRONT, OUT, ease.inOutCubic(seg(0, .1))), sq: squash('pre', seg(.06, .14)), item: null};
        if (u < .44) { const p = seg(.14, .44), pos = A.clone().lerp(B, ease.inOutSine(p)); pos.y += arc(p, hop[0]); return {pos, facing: OUT, sq: squash('air', p), item: items[0]}; }
        if (u < .58) return {pos: B.clone(), facing: lerp(OUT, BACK, ease.inOutCubic(seg(.47, .58))), sq: squash('land', seg(.44, .58) * 1.4), item: u < .57 ? null : items[1]};
        if (u < .88) { const p = seg(.58, .88), pos = B.clone().lerp(A, ease.inOutSine(p)); pos.y += arc(p, hop[1]); return {pos, facing: BACK, sq: squash('air', p), item: items[1]}; }
        return {pos: A.clone(), facing: lerp(BACK, FRONT, ease.inOutCubic(seg(.9, 1))), sq: squash('land', seg(.88, 1) * 1.6), item: null};
      }
      return null;
    },
  };
}

// 液面罐：余额、水位类数据
export function createTank(s, {x, y, z, r = .95, h = 1.9, col = '#f5a700', emis = '#e08a00'}) {
  s.add(new THREE.CylinderGeometry(r, r, h, 40, 1, true), s.glass(.1), x, y + h / 2, z, s.scene, false);
  for (const yy of [y, y + h]) s.add(new THREE.TorusGeometry(r, .05, 8, 40), s.M('#d79a0e', {metalness: .5}), x, yy, z).rotation.x = Math.PI / 2;
  const g = new THREE.CylinderGeometry(r - .09, r - .09, 1, 40); g.translate(0, .5, 0);
  const liquid = s.add(g, new THREE.MeshStandardMaterial({color: col, emissive: emis, emissiveIntensity: .12, roughness: .22, metalness: .2}), x, y + .03, z, s.scene, false);
  return {set(f) { liquid.scale.y = Math.max(.04, (h - .08) * f); }};
}

// 通用实例组：人群、地块、柱阵都用它。set(i, pos, scale, col) 后 flush()。
export function createInstances(s, geo, mat, count, {shadow = true} = {}) {
  const mesh = new THREE.InstancedMesh(geo, mat, count); mesh.castShadow = mesh.receiveShadow = shadow; mesh.frustumCulled = false; s.scene.add(mesh);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) mesh.setColorAt(i, c.set('#ffffff'));
  return {
    mesh, count,
    set(i, pos, scale = 1, col = null, rotY = 0) { s.setInst(mesh, i, pos, scale, rotY); if (col) mesh.setColorAt(i, c.set(col)); },
    flush() { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; },
  };
}

// 小人群：rows × cols 方阵，可让一部分变色、升起。update((row, col, i) => ({y, col, k}))
export function createCrowd(s, {x, z, rows = 10, cols = 10, gap = .52, y0 = .3}) {
  const n = rows * cols;
  const body = createInstances(s, new THREE.CapsuleGeometry(.12, .16, 4, 10), s.M('#ffffff', {roughness: .5}), n);
  const head = createInstances(s, new THREE.SphereGeometry(.1, 12, 10), s.M('#ffffff', {roughness: .5}), n);
  const at = (r, c) => s.v3(x + (c - (cols - 1) / 2) * gap, y0, z + (r - (rows - 1) / 2) * gap);
  return {
    n, at,
    update(fn) {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = r * cols + c, st = fn(r, c, i), p = at(r, c), k = st.k ?? 1;
        if (k <= .001) { body.set(i, s.HIDE, 0); head.set(i, s.HIDE, 0); continue; }
        p.y += (st.y || 0);
        body.set(i, s.v3(p.x, p.y + .2 * k, p.z), k, st.col); head.set(i, s.v3(p.x, p.y + .46 * k, p.z), k, st.col);
      }
      body.flush(); head.flush();
    },
  };
}

// 立牌：结论写在场景里，从上方落下回弹。lines 为文字行，第一行最大。
export function createBoard(s, {x, z = 0, w = 5.4, h = 2.6, lines, t0, t1 = Infinity, y = 1.5, rot = 0, accent = '#e1423a', ink = '#1e1e24', bg = '#fffdf8'}) {
  const tex = s.canvasTex(1024, Math.round(1024 * h / w), (g, W, H) => {
    g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = accent; g.fillRect(0, 0, W, 18);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const big = Math.min(92, Math.floor(1700 / Math.max(...lines.map(l => l.length + 2))));
    lines.forEach((l, i) => { g.fillStyle = i ? accent : ink; g.font = `800 ${i ? big * .86 : big}px "Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif`; g.fillText(l, W / 2, H * (lines.length === 1 ? .52 : .36 + i * .33)); });
  });
  const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = rot; s.scene.add(G);
  const board = new THREE.Group(); G.add(board);
  const y0 = y + h / 2;
  s.add(s.rbox(w + .2, h + .2, .16, .06), s.M('#3a3a42', {roughness: .5}), 0, y0, -.09, board);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map: tex, roughness: .7})); face.position.set(0, y0, 0); board.add(face);
  for (const k of [-1, 1]) s.add(new THREE.CylinderGeometry(.07, .07, y + .3, 10), s.M('#3a3a42'), k * (w / 2 - .5), (y + .3) / 2, -.09, board);
  return {
    update(t) {
      const k = spring(t - t0, 1.5, .4), out = t > t1 ? ease.inCubic(win(t, t1, t1 + .4)) : 0;
      G.visible = t >= t0 && out < 1; board.position.y = (1 - k) * 7 + out * 8;
      board.scale.set(1 + (1 - k) * -.1, 1 + Math.max(0, k - 1) * .6, 1);
    },
  };
}

// 跳跃路径：keys = [{t, pos, facing, h}]，t 是落地时刻，每次跳跃 dur 秒；原地 key 就是原地跳。
export function hopPath(keys, {dur = .46, height = .9} = {}) {
  return t => {
    let i = 0; while (i + 1 < keys.length && keys[i + 1].t - dur <= t) i++;
    const cur = keys[i], nx = keys[i + 1];
    if (cur && i > 0 && t < cur.t) {
      const prev = keys[i - 1], p = win(t, cur.t - dur, cur.t), pos = prev.pos.clone().lerp(cur.pos, ease.inOutSine(p));
      pos.y += arc(p, cur.h ?? height);
      return {pos, facing: lerp(prev.facing ?? .3, cur.facing ?? .3, ease.inOutCubic(p)), sq: squash('air', p), air: true};
    }
    const since = t - cur.t;
    const sq = since >= 0 && since < .34 ? squash('land', since / .34 * 1.4) : (nx && t > nx.t - dur - .12 ? squash('pre', win(t, nx.t - dur - .12, nx.t - dur)) : [1, 1]);
    return {pos: cur.pos.clone(), facing: cur.facing ?? .3, sq, air: false};
  };
}
