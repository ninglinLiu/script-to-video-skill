import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {clamp01, lerp, win, ease, spring, stagger, arc, squash, track, count, rng} from './motion.js';

const W = 1920, H = 1080, FPS = 30;
const Q = new URLSearchParams(location.search);
const SUB = +(Q.get('mb') || 1);           // 运动模糊子帧数
const SHUTTER = 0.5;                       // 180° 快门

const TL = await (await fetch('/audio/timeline.json')).json();
const C = Object.fromEntries(TL.cues.map(c => [c.id, c]));
const DUR = TL.seconds;
const R = rng(1029);

// ───────── 渲染器与后期 ─────────
const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('gl'), antialias: false, preserveDrawingBuffer: true});
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = +(Q.get('exp') || 1.0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const BG = new THREE.Color('#cfc7ba');
scene.background = BG; scene.fog = new THREE.Fog(BG, 45, 120);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(30, W / H, 0.5, 400);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, {type: THREE.HalfFloatType, samples: 4}));
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, {focus: 20, aperture: 0.0011, maxblur: 0.010});
if (!Q.has('nodof')) composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.5, 0.45, 2.2);
if (!Q.has('nobloom')) composer.addPass(bloom);
composer.addPass(new OutputPass());
composer.renderToScreen = false;

// 子帧累积（运动模糊）
const accRT = new THREE.WebGLRenderTarget(W, H, {type: THREE.HalfFloatType});
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quadGeo = new THREE.PlaneGeometry(2, 2);
const accMat = new THREE.ShaderMaterial({
  uniforms: {tex: {value: null}, w: {value: 1}},
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tex, vUv).rgb * w, 1.); }',
  blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation,
  depthTest: false, depthWrite: false,
});
const copyMat = new THREE.ShaderMaterial({
  uniforms: {tex: {value: accRT.texture}},
  vertexShader: accMat.vertexShader,
  fragmentShader: 'uniform sampler2D tex; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tex, vUv).rgb, 1.); }',
  depthTest: false, depthWrite: false,
});
const accScene = new THREE.Scene(); accScene.add(new THREE.Mesh(quadGeo, accMat));
const copyScene = new THREE.Scene(); copyScene.add(new THREE.Mesh(quadGeo, copyMat));

// ───────── 灯光 ─────────
scene.add(new THREE.HemisphereLight('#ffffff', '#b8ad9a', 1.15));
const key = new THREE.DirectionalLight('#fff1dd', 2.7);
key.castShadow = true; key.shadow.mapSize.set(4096, 4096);
key.shadow.bias = -0.0003; key.shadow.normalBias = 0.025; key.shadow.radius = 5;
Object.assign(key.shadow.camera, {near: 1, far: 120});
scene.add(key, key.target);
const fill = new THREE.DirectionalLight('#d4e2ff', 0.75); fill.position.set(14, 7, -16); scene.add(fill);

// ───────── 工具 ─────────
const M = (color, o = {}) => new THREE.MeshStandardMaterial({color, roughness: .55, metalness: 0, envMapIntensity: .75, ...o});
const rbox = (w, h, d, r = .12, s = 3) => new RoundedBoxGeometry(w, h, d, s, r);
function add(geo, mat, x = 0, y = 0, z = 0, parent = scene, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const glass = (op = .3) => new THREE.MeshPhysicalMaterial({color: '#ffffff', roughness: .06, metalness: 0, transparent: true, opacity: op, depthWrite: false, envMapIntensity: 1.2});
const glow = (hex, k = 4.2) => { const m = new THREE.MeshBasicMaterial({color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false}); return m; };
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();
function setInst(mesh, i, pos, scale = 1, rotY = 0, rotX = 0) {
  _q.setFromEuler(_e.set(rotX, rotY, 0)); _s.setScalar(scale);
  if (Array.isArray(scale)) _s.set(...scale);
  mesh.setMatrixAt(i, _m.compose(pos, _q, _s));
}
const HIDE = v3(0, -50, 0);

// ───────── 地面与远景 ─────────
const groundTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#e2d9cb'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(80,70,55,.07)'; g.lineWidth = 2;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); }
}, [100, 100]);
const ground = add(new THREE.PlaneGeometry(400, 400), M('#ffffff', {map: groundTex, roughness: .92}), 0, 0, 0, scene, false);
ground.rotation.x = -Math.PI / 2;

const pad = (x, z, w, d) => add(rbox(w, .3, d, .14), M('#f6f2ea', {roughness: .8}), x, .15, z);
pad(0, 0, 8.5, 7); pad(15, .6, 7.6, 7.4); pad(34.2, 0, 19.5, 9.5);

{ // 建筑模型式的远景街区与树
  const pal = ['#f4f0e8', '#ebe4d9', '#dfd8cc', '#f1e7d9', '#dde3e8', '#e9e2ef'].map(c => new THREE.Color(c));
  const blocks = []; const r = rng(7);
  for (let i = 0; i < 150; i++) {
    const x = -40 + r() * 120, z = r() < .78 ? -11 - r() * 38 : 11 + r() * 26;
    if (z > 0 && Math.abs(x - 20) < 30) continue;
    blocks.push([x, z, 1.6 + r() * 3.2, 1.2 + r() * (z < -25 ? 7 : 4), 1.6 + r() * 3.2]);
  }
  const bm = new THREE.InstancedMesh(rbox(1, 1, 1, .06, 2), M('#ffffff', {roughness: .85}), blocks.length);
  blocks.forEach((b, i) => { setInst(bm, i, v3(b[0], b[3] / 2, b[1]), [b[2], b[3], b[4]], r() * .5); bm.setColorAt(i, pal[i % pal.length]); });
  bm.castShadow = bm.receiveShadow = true; scene.add(bm);
  const trees = []; for (let i = 0; i < 90; i++) { const x = -38 + r() * 115, z = r() < .7 ? -9 - r() * 30 : 9 + r() * 18; if (z > 0 && Math.abs(x - 20) < 28) continue; trees.push([x, z, .7 + r() * .7]); }
  const crown = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), M('#9cc48a', {roughness: .9}), trees.length);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.12, .16, 1, 8), M('#a08466'), trees.length);
  trees.forEach((t, i) => { setInst(crown, i, v3(t[0], 1.1 * t[2] + .9, t[1]), [t[2], t[2] * 1.15, t[2]]); setInst(trunk, i, v3(t[0], .5, t[1]), [1, 1.1, 1]); crown.setColorAt(i, new THREE.Color().setHSL(.27 + r() * .06, .35, .55 + r() * .1)); });
  crown.castShadow = trunk.castShadow = true; scene.add(crown, trunk);
}

// ───────── 链与资产数据（TRM Labs, 2026-10-30） ─────────
const chains = [
  {k: 'ETH', v: 3.79, col: '#7d8bff', w: [16.5, 19.5]},
  {k: 'BTC', v: 1.47, col: '#f7931a', w: [15, 16.5]},
  {k: 'TRON', v: .628, col: '#ff4d4f', w: [16, 17.5]},
  {k: 'XRP', v: .296, col: '#9aa3ad', w: [0, 4]},
  {k: 'SOL', v: .096, col: '#1fd8a4', w: [5, 7]},
  {k: 'ARB', v: .015, col: '#2d9cdb', w: [8, 10]},
  {k: 'OP', v: .012, col: '#ff2a4f', w: [5, 7]},
  {k: 'BASE', v: .012, col: '#2a5bff', w: [8, 10]},
  {k: 'AVAX', v: .028, col: '#e84142', w: [18.5, 20]},
  {k: 'POL', v: .010, col: '#8a4fe8', w: [18.5, 20]},
];
const TOTAL = chains.reduce((a, c) => a + c.v, 0); // ≈6.36
const s0 = C.L1.start + .4, s1 = C.L2.end - .6, minToT = m => s0 + m / 20 * (s1 - s0);
const TRAVEL = 1.45;

// ───────── A：交易所热钱包金库 ─────────
const gold = M('#efb21a', {metalness: .35, roughness: .3});
add(rbox(4.6, .3, 4.2, .1), M('#e4dac8'), 0, .45, 0);
add(rbox(3.6, 3.0, 3.2, .26, 4), gold, 0, 2.1, 0);
add(rbox(3.95, .32, 3.55, .12), M('#d79a0e', {metalness: .4, roughness: .3}), 0, 3.72, 0);
add(new THREE.CylinderGeometry(.98, .98, .08, 40), M('#3a3226', {roughness: .9}), 0, 2.05, 1.6).rotation.x = Math.PI / 2;
const doorPivot = new THREE.Group(); doorPivot.position.set(-1.02, 2.05, 1.68); scene.add(doorPivot);
const door = new THREE.Group(); door.position.x = 1.02; doorPivot.add(door);
add(new THREE.CylinderGeometry(1.0, 1.0, .2, 40), M('#f7c94b', {metalness: .55, roughness: .25}), 0, 0, 0, door).rotation.x = Math.PI / 2;
add(new THREE.TorusGeometry(.62, .06, 10, 40), M('#c98a08', {metalness: .6, roughness: .3}), 0, 0, .12, door);
for (let i = 0; i < 4; i++) { const s = add(rbox(.1, 1.1, .08, .03), M('#c98a08', {metalness: .6, roughness: .3}), 0, 0, .14, door); s.rotation.z = i * Math.PI / 4; }
const tankGlass = add(new THREE.CylinderGeometry(.95, .95, 1.9, 40, 1, true), glass(), 0, 4.85, 0, scene, false);
add(new THREE.TorusGeometry(.95, .05, 8, 40), M('#d79a0e', {metalness: .5}), 0, 3.92, 0).rotation.x = Math.PI / 2;
add(new THREE.TorusGeometry(.95, .05, 8, 40), M('#d79a0e', {metalness: .5}), 0, 5.8, 0).rotation.x = Math.PI / 2;
const liquidGeo = new THREE.CylinderGeometry(.86, .86, 1, 40); liquidGeo.translate(0, .5, 0);
const liquid = add(liquidGeo, new THREE.MeshStandardMaterial({color: '#f5a700', emissive: '#e08a00', emissiveIntensity: .45, roughness: .18, metalness: .2}), 0, 3.95, 0, scene, false);
const beacon = add(new THREE.SphereGeometry(.16, 16, 12), glow('#ff3b30', 3), 1.45, 4.05, 1.25, scene, false);

// 端口与管道
const ports = [], tubes = [], cores = [];
chains.forEach((c, i) => {
  const row = i < 5 ? 0 : 1, col = i % 5;
  const p = v3(1.95, 1.45 + row * 1.15, -1.2 + col * .6);
  const port = add(new THREE.CylinderGeometry(.17, .17, .38, 20), M(c.col, {roughness: .4}), p.x, p.y, p.z); port.rotation.z = Math.PI / 2; ports.push(port);
  const zf = (i - 4.5) * .95;
  const curve = new THREE.CatmullRomCurve3([v3(2.1, p.y, p.z), v3(4.4, p.y + .7, p.z * 1.3 + zf * .3), v3(7.8, 3.6 + .18 * Math.abs(zf), zf), v3(11.3, 3.1, zf * .45), v3(13.75, 2.7 + (i % 2) * .22, zf * .07)], false, 'centripetal');
  c.curve = curve; c.table = curve.getSpacedPoints(240);
  tubes.push(add(new THREE.TubeGeometry(curve, 160, .1, 12), glass(), 0, 0, 0, scene, false));
  const core = add(new THREE.TubeGeometry(curve, 160, .05, 8), new THREE.MeshBasicMaterial({color: new THREE.Color(c.col), transparent: true, opacity: .5}), 0, 0, 0, scene, false);
  cores.push(core);
});
const along = (table, u) => { const f = clamp01(u) * (table.length - 1), i = Math.floor(f), k = f - i; return _p.copy(table[i]).lerp(table[Math.min(i + 1, table.length - 1)], k); };

// 流出代币
const tokens = [];
chains.forEach((c, ci) => {
  const n = Math.round(8 + 150 * Math.sqrt(c.v / 3.79));
  const a = minToT(c.w[0]), b = minToT(c.w[1]);
  for (let j = 0; j < n; j++) tokens.push({ci, te: lerp(a, b, (j + R() * .8) / n), dur: TRAVEL * (.9 + R() * .2)});
  c.n = n;
});
const tokMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.12, 12, 8), new THREE.MeshBasicMaterial({color: '#ffffff', toneMapped: false}), tokens.length);
tokens.forEach((tk, i) => tokMesh.setColorAt(i, new THREE.Color(chains[tk.ci].col).multiplyScalar(4.5)));
tokMesh.frustumCulled = false; scene.add(tokMesh);
const arrivedFrac = (ci, t) => { let a = 0; for (const tk of tokens) if (tk.ci === ci && t >= tk.te + tk.dur) a++; return a / chains[ci].n; };
const outflow = t => chains.reduce((s, c, ci) => s + c.v * arrivedFrac(ci, t), 0);

// ───────── B：攻击者地址 + 资产堆 ─────────
const BX = 15;
add(new THREE.CylinderGeometry(1.0, 1.15, 4.4, 6), M('#2b2d35', {roughness: .38, metalness: .2}), BX, 2.5, -.4);
add(new THREE.CylinderGeometry(1.12, 1.12, .12, 6), M('#1d1f25'), BX, 4.76, -.4);
const slit = add(rbox(.14, 2.8, .06, .03), glow('#ff3d2e', 2.2), BX, 2.6, .55, scene, false);
const intake = add(new THREE.TorusGeometry(.42, .1, 10, 30), M('#1d1f25', {roughness: .3}), 13.95, 2.85, -.1); intake.rotation.y = Math.PI / 2;
const assets = [
  {k: 'USDT', col: '#26a17b', x: 12.7, n: 50, src: {ETH: 1.875, TRON: .613}, frozen: 1.77 / 2.49},
  {k: 'BTC', col: '#f7931a', x: 13.75, n: 29, src: {BTC: 1.47}},
  {k: '其他', col: '#cfc9bf', x: 14.8, n: 24, src: {ETH: .63, XRP: .296, SOL: .096, ARB: .015, OP: .012, BASE: .012, AVAX: .028, POL: .010}},
  {k: 'USDC', col: '#2775ca', x: 15.85, n: 16, src: {ETH: .823}, frozen: 1},
  {k: 'ETH', col: '#7d8bff', x: 16.9, n: 9, src: {ETH: .46}},
];
const COIN_H = .072, STACK_Y = .3 + .036, SZ = 2.2;
const coinGeo = new THREE.CylinderGeometry(.33, .33, .066, 36);
const coinMat = M('#ffffff', {metalness: .45, roughness: .28});
const STACK_MAX = 70;
assets.forEach(a => {
  a.mesh = new THREE.InstancedMesh(coinGeo, coinMat, STACK_MAX); a.mesh.castShadow = a.mesh.receiveShadow = true; a.mesh.frustumCulled = false;
  const r = rng(a.x * 100);
  a.jit = Array.from({length: STACK_MAX}, () => [(r() - .5) * .04, (r() - .5) * .04, r() * 6]);
  for (let i = 0; i < STACK_MAX; i++) a.mesh.setColorAt(i, new THREE.Color(a.col).offsetHSL(0, 0, (r() - .5) * .05));
  scene.add(a.mesh);
});
const stackTop = (a, n) => STACK_Y + n * COIN_H;
// 冰冻
const iceMat = new THREE.MeshPhysicalMaterial({color: '#d4f1ff', transmission: .92, thickness: .9, roughness: .14, ior: 1.31, metalness: 0, envMapIntensity: 1.3, transparent: true});
const ices = assets.filter(a => a.frozen).map((a, i) => {
  const h = a.n * a.frozen * COIN_H + .12, g = rbox(.98, h, .98, .1, 3); g.translate(0, h / 2, 0);
  const m = add(g, iceMat, a.x, .3, SZ, scene, false); m.scale.set(0, 0, 0);
  return {a, m, t0: C.L3.start + .45 + i * .95};
});
const frost = new THREE.InstancedMesh(new THREE.BoxGeometry(.07, .07, .07), glow('#e8f8ff', 1.6), 60); frost.frustumCulled = false; scene.add(frost);
const frostP = Array.from({length: 60}, (_, i) => { const r = rng(i + 77); return {ice: i % 2, d: v3(r() - .5, r() * .9 + .3, r() - .5).normalize().multiplyScalar(1.6 + r() * 1.8), y: r()}; });

// ───────── C：价格区 ─────────
const DX = 27.6, AX = 34.0, GX = 37.7, EX = 41.2;
const priceH = p => (p - 2000) / 1000 * 6.4;
function column(x, col, emis) {
  add(rbox(1.7, .25, 1.7, .08), M('#e2d9ca'), x, .42, 0);
  add(rbox(1.5, 7.0, 1.5, .16), glass(.14), x, .55 + 3.5, 0, scene, false);
  add(rbox(2.1, 7.4, .14, .06), M('#fbf8f2', {roughness: .7}), x, .55 + 3.7, -.95);
  const g = rbox(1.2, 1, 1.2, .1); g.translate(0, .5, 0);
  const fillM = add(g, new THREE.MeshStandardMaterial({color: col, emissive: emis, emissiveIntensity: .35, roughness: .3}), x, .56, 0, scene, false);
  for (const p of [2300, 2500, 2700]) { add(new THREE.BoxGeometry(1.56, .03, 1.56), M('#8d8576'), x, .56 + priceH(p), 0, scene, false); add(new THREE.BoxGeometry(2.0, .035, .04), M('#8d8576'), x, .56 + priceH(p), -.86, scene, false); }
  return fillM;
}
const dexFill = column(DX, '#0fb488', '#078a66');
const exFill = column(EX, '#f0a300', '#b77800');
const funnel = add(new THREE.CylinderGeometry(1.15, .45, .8, 28, 1, true), M('#ffffff', {side: THREE.DoubleSide, roughness: .35}), DX, 8.0, 0);
const sellHop = add(rbox(.9, .7, .9, .12), M('#ffffff', {roughness: .4}), DX + 1.35, .65, 1.55);
add(rbox(.92, .12, .92, .05), M('#17c79c'), DX + 1.35, .98, 1.55);
// 交易所里搬不动的 ETH
const exCoins = new THREE.InstancedMesh(coinGeo, coinMat, 8); exCoins.castShadow = true; exCoins.frustumCulled = false; scene.add(exCoins);
for (let i = 0; i < 8; i++) exCoins.setColorAt(i, new THREE.Color('#7d8bff'));
add(rbox(3.4, .14, 1.0, .05), M('#c9c0b0'), (GX + EX) / 2 + .2, .37, 2.2);
// 闸门
const stripe = canvasTex(256, 32, (g, w, h) => { g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#e1423a'; for (let x = -32; x < w; x += 64) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 32, 0); g.lineTo(x + 64, 0); g.lineTo(x + 32, h); g.fill(); } }, [6, 1]);
add(rbox(.4, 2.5, .4, .08), M('#e1423a'), GX, 1.55, -3.75); add(rbox(.4, 1.3, .4, .08), M('#e1423a'), GX, .95, 3.75);
const gatePivot = new THREE.Group(); gatePivot.position.set(GX, 2.25, -3.75); scene.add(gatePivot);
const arm = add(rbox(.3, .3, 7.6, .08), M('#ffffff', {map: stripe}), 0, 0, 3.8, gatePivot);
const lamp = add(new THREE.SphereGeometry(.17, 16, 12), glow('#ff3b30', 2.8), GX, 2.95, -3.75, scene, false);
const dust = new THREE.InstancedMesh(new THREE.SphereGeometry(.09, 8, 6), M('#d9cfbf', {roughness: 1}), 40); dust.frustumCulled = false; scene.add(dust);
// Aave 借贷池
add(rbox(3.0, 2.3, 2.7, .32, 4), M('#b47fd9', {roughness: .42}), AX, .3 + 1.15, 0);
add(new THREE.TorusGeometry(1.05, .17, 14, 40), M('#3ccaca', {roughness: .3}), AX, 2.75, 0).rotation.x = Math.PI / 2;
add(new THREE.CylinderGeometry(.98, .98, .1, 36), M('#8e5fbf'), AX, 2.62, 0);
const poolCoins = new THREE.InstancedMesh(coinGeo, coinMat, 14); poolCoins.castShadow = true;
for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r = .35 + (i % 3) * .2; setInst(poolCoins, i, v3(AX + Math.cos(a) * r, 2.72 + (i % 4) * .05, Math.sin(a) * r), 1, 0, (i % 5) * .2); poolCoins.setColorAt(i, new THREE.Color('#7d8bff')); }
scene.add(poolCoins);
add(new THREE.CylinderGeometry(.05, .05, 1.7, 8), M('#8b8478'), AX + .9, 3.45, -.7);
const antenna = add(new THREE.SphereGeometry(.2, 16, 12), glow('#ffd23f', 1.6), AX + .9, 4.35, -.7, scene, false);
const winFrame = new THREE.Group(); winFrame.position.set(AX - 1.52, 1.5, .25); winFrame.rotation.y = -Math.PI / 2; scene.add(winFrame);
const frameMat = new THREE.MeshBasicMaterial({color: new THREE.Color('#ffffff'), toneMapped: false});
for (const [w, h, x, y] of [[1.25, .1, 0, .55], [1.25, .1, 0, -.55], [.1, 1.2, .6, 0], [.1, 1.2, -.6, 0]]) add(new THREE.BoxGeometry(w, h, .06), frameMat, x, y, 0, winFrame, false);
const winPane = add(new THREE.PlaneGeometry(1.1, 1.0), new THREE.MeshBasicMaterial({color: '#fff3c4', toneMapped: false, transparent: true, opacity: 0}), 0, 0, -.01, winFrame, false);
const shG = rbox(1.3, 1.2, .1, .04); shG.translate(0, -.6, 0);
const shutter = add(shG, M('#6d4a8f', {roughness: .5}), 0, .62, .06, winFrame); shutter.scale.y = 0;
const depHop = add(rbox(.8, .6, .8, .12), M('#ffffff', {roughness: .4}), AX - 2.0, .6, 1.6);
add(rbox(.82, .1, .82, .05), M('#b47fd9'), AX - 2.0, .9, 1.6);
// 预言机光束
const beamCurve = new THREE.CatmullRomCurve3([v3(EX, .56 + 7.1, 0), v3(EX - 1.4, 9.3, 0), v3(GX, 9.9, -.3), v3(AX + 2.4, 7.6, -.6), v3(AX + .9, 4.45, -.7)]);
const beamGeo = new THREE.TubeGeometry(beamCurve, 200, .035, 8);
const beam = add(beamGeo, glow('#ffd23f', 1.8), 0, 0, 0, scene, false);
const beamTable = beamCurve.getSpacedPoints(200);
const pulses = new THREE.InstancedMesh(new THREE.SphereGeometry(.11, 12, 8), glow('#fff2b0', 3), 6); pulses.frustumCulled = false; scene.add(pulses);

// ───────── 搬砖小人 ─────────
const bot = new THREE.Group(); scene.add(bot);
const body = new THREE.Group(); bot.add(body);
add(rbox(.72, .6, .62, .2, 4), M('#ff8f3a', {roughness: .42}), 0, .42, 0, body);
add(rbox(.5, .3, .04, .1), M('#fff6ea', {roughness: .5}), 0, .47, .3, body);
for (const s of [-1, 1]) {
  add(rbox(.07, .15, .04, .03), M('#1d1f25', {roughness: .3}), s * .12, .48, .33, body);
  add(rbox(.17, .12, .22, .04), M('#d9611c'), s * .18, .06, .02, body);
}
add(new THREE.CylinderGeometry(.025, .025, .25, 6), M('#8b8478'), 0, .84, 0, body);
add(new THREE.SphereGeometry(.08, 12, 8), M('#ffd23f'), 0, .98, 0, body);
const carry = add(coinGeo, M('#7d8bff', {metalness: .45, roughness: .28}), 0, 1.12, 0, body); carry.rotation.x = Math.PI / 2; carry.scale.setScalar(.5);
const PA = v3(AX - 2.0, .3, 2.65), PD = v3(DX + 1.35, .3, 2.65);
const trips = []; {
  let t = C.L7.start + .35; const end = C.L8.end - .15;
  for (const d of [2.1, 1.75, 1.45, 1.25, 1.1, 1.0, .95, .9, .88, .86, .86, .86, .86]) { if (t + d > end) break; trips.push({t0: t, d}); t += d; }
}
const PROFIT = 3.47;
const _carry = new THREE.Vector3();

// 飞行硬币（换币、借出、卖出）
const flyers = new THREE.InstancedMesh(coinGeo, coinMat, 160); flyers.castShadow = true; flyers.frustumCulled = false; scene.add(flyers);
const flights = [];
const stackPos = (a, n) => v3(a.x, stackTop(a, n), SZ);
const USDT = assets[0], ETHa = assets[4];
for (let i = 0; i < 26; i++) flights.push({col: USDT.col, from: () => stackPos(USDT, USDT.n), to: v3(DX, 8.3, 0), te: stagger(i, 26, C.L4.start + .25, 3.4), dur: 1.55, h: 4.2, spin: 7});
for (let i = 0; i < 10; i++) flights.push({col: ETHa.col, from: () => v3(DX - .2, 1.2, .8), to: v3(ETHa.x, stackTop(ETHa, ETHa.n + 8), SZ), te: stagger(i, 10, C.L4.start + 1.5, 3.3), dur: 1.45, h: 3.2, spin: 5});
for (let i = 0; i < 16; i++) flights.push({col: '#7d8bff', from: () => v3(AX - 1.5, 1.5, .25), to: v3(DX + 1.35, 1.1, 1.55), te: stagger(i, 16, C.L9.start + .5, 3.2), dur: .95, h: 1.4, spin: 6});
const HEAD = v3(0, 1.74, 0), poolTop = v3(AX, 2.95, 0), sellTop = v3(DX + 1.35, 1.05, 1.55), depTop = v3(AX - 2.0, .95, 1.6);
for (const tr of trips) {
  const d = tr.d, t0 = tr.t0;
  flights.push({col: '#7d8bff', from: () => poolTop.clone(), to: PA.clone().add(HEAD), te: t0, dur: .14 * d, h: .9, spin: 4, small: 1});
  flights.push({col: '#7d8bff', from: () => PD.clone().add(HEAD), to: sellTop.clone(), te: t0 + .44 * d, dur: .06 * d, h: .2, spin: 3, small: 1});
  flights.push({col: '#26a17b', from: () => sellTop.clone(), to: PD.clone().add(HEAD), te: t0 + .5 * d, dur: .07 * d, h: .7, spin: 5, small: 1});
  flights.push({col: '#26a17b', from: () => PA.clone().add(HEAD), to: depTop.clone(), te: t0 + .88 * d, dur: .06 * d, h: .2, spin: 3, small: 1});
}
flights.forEach((f, i) => flyers.setColorAt(i, new THREE.Color(f.col)));
const landed = (list, t) => list.reduce((s, f) => s + (t >= f.te + f.dur ? 1 : 0), 0);
const swapFlights = flights.slice(0, 26), ethBack = flights.slice(26, 36);

// ───────── 镜头：目标点 + 距离/方位/俯仰，速度连续 ─────────
const K = (t, x, y, z, d, az, el) => ({t, v: [x, y, z, d, az, el]});
const cam = track([
  K(0, 0, 2.2, 0, 21, -30, 17),
  K(C.L1.start + 2.6, .8, 2.6, 0, 17, -12, 19),
  K(C.L1.end, 3.6, 2.6, 0, 20, 2, 23),
  K(C.L2.start + 3.0, 8.0, 2.4, 0, 30, 6, 30),
  K(C.L2.end, 13.8, 2.3, .8, 21, 14, 21),
  K(C.L3.start + 1.6, 14.6, 1.9, 1.8, 14.5, 9, 15),
  K(C.L3.end, 15.4, 2.0, 1.6, 15.5, -5, 17),
  K(C.L4.start + 2.4, 21.5, 4.2, .6, 26, 5, 17),
  K(C.L4.end, 27.6, 3.8, .3, 19.5, 9, 13),
  K(C.L5.start + 1.0, 38.2, 2.2, .4, 18, 24, 13),
  K(C.L5.end, 39.3, 2.5, .8, 16.5, 12, 15),
  K(C.L6.start + 2.4, 37.8, 5.0, 0, 24, 3, 17),
  K(C.L6.end, 34.3, 3.3, .4, 19, -3, 15),
  K(C.L7.start + 2.0, 30.6, 1.9, 1.9, 13.5, 4, 12),
  K(C.L7.end, 30.5, 1.9, 1.7, 14, -5, 14),
  K(C.L8.end, 31.0, 2.9, .8, 20.5, 3, 19),
  K(C.L9.start + 2.2, 33.0, 1.8, .6, 12.5, -32, 11),
  K(C.L10.start + 1.4, 31.2, 2.8, 0, 22, -12, 18),
  K(DUR, 20.5, 1.2, 0, 66, -6, 29),
]);
const target = new THREE.Vector3();

// ───────── 价格模型 ─────────
const oracle = t => 2280 + 7 * Math.sin(t * .9);
function dexPrice(t) {
  const f = landed(swapFlights, t) / swapFlights.length;
  let p = 2300 + 360 * ease.outCubic(f) + 95 * Math.exp(-Math.pow((t - (C.L4.end - .4)) / .7, 2));
  p += 12 * Math.sin(t * 2.3) * win(t, C.L4.end, C.L4.end + 1);
  p -= 70 * ease.inOutSine(win(t, C.L7.start, C.L8.start));        // 套利卖压
  for (const tr of trips) { const k = t - (tr.t0 + tr.d * .55); if (k > 0) p -= 14 * Math.exp(-k * 3); }
  p -= 300 * ease.inOutCubic(win(t, C.L10.start + .4, C.L10.start + 2.8));
  return p;
}

// ───────── 每帧状态 ─────────
function update(t) {
  // 镜头
  const [tx, ty, tz, d, az, el] = cam(t);
  target.set(tx, ty, tz);
  const a = az * Math.PI / 180, e = el * Math.PI / 180;
  camera.position.set(tx + d * Math.cos(e) * Math.sin(a), ty + d * Math.sin(e), tz + d * Math.cos(e) * Math.cos(a));
  camera.lookAt(target); camera.updateMatrixWorld();
  bokeh.uniforms.focus.value = camera.position.distanceTo(target);
  bokeh.uniforms.aperture.value = 0.0011 * 20 / Math.max(14, d);
  key.position.copy(target).add(v3(-10, 18, 12)); key.target.position.copy(target);
  const sb = Math.min(45, Math.max(13, d * .75));
  Object.assign(key.shadow.camera, {left: -sb, right: sb, top: sb, bottom: -sb}); key.shadow.camera.updateProjectionMatrix();

  // A：金库
  doorPivot.rotation.y = -1.95 * spring(t - (C.L1.start + .15), 1.1, .5);
  const out = outflow(t);
  liquid.scale.y = Math.max(.04, 1.82 * (1 - .95 * out / TOTAL));
  beacon.visible = t > C.L1.start + .7 && t < C.L4.start && Math.floor(t * 3) % 2 === 0;
  chains.forEach((c, ci) => {
    const a0 = minToT(c.w[0]) - .3, a1 = minToT(c.w[1]) + TRAVEL;
    cores[ci].material.opacity = lerp(.42, 1, clamp01(Math.min((t - a0) / .3, (a1 - t) / .6)));
    ports[ci].scale.setScalar(1 + .25 * Math.max(0, Math.sin((t - a0) * 9)) * (t > a0 && t < a1 ? 1 : 0));
  });
  tokens.forEach((tk, i) => {
    const u = (t - tk.te) / tk.dur;
    if (u < 0 || u > 1) setInst(tokMesh, i, HIDE, 0);
    else setInst(tokMesh, i, along(chains[tk.ci].table, ease.inOutSine(u)), 1 + .35 * Math.sin(u * Math.PI));
  });
  tokMesh.instanceMatrix.needsUpdate = true;

  // B：资产堆
  slit.material.color.setRGB(4.2, .5 + .4 * Math.sin(t * 6), .35);
  const arr = Object.fromEntries(chains.map((c, ci) => [c.k, arrivedFrac(ci, t)]));
  assets.forEach(as => {
    let wsum = 0, f = 0; for (const [k, w] of Object.entries(as.src)) { wsum += w; f += w * arr[k]; }
    let n = as.n * f / wsum;
    if (as === USDT) n -= 8 * landed(swapFlights, t) / swapFlights.length;
    if (as === ETHa) n += 8 * landed(ethBack, t) / ethBack.length;
    const full = Math.floor(n), frac = n - full;
    for (let i = 0; i < STACK_MAX; i++) {
      if (i > full || (i === full && frac < .02)) { setInst(as.mesh, i, HIDE, 0); continue; }
      const drop = i === full ? (1 - ease.outCubic(frac)) * .9 : 0;
      const j = as.jit[i];
      setInst(as.mesh, i, v3(as.x + j[0], STACK_Y + i * COIN_H + drop, SZ + j[1]), 1, j[2]);
    }
    as.mesh.instanceMatrix.needsUpdate = true;
  });
  ices.forEach(ic => {
    const k = t - ic.t0, sy = spring(k, 1.6, .38), sx = spring(k - .05, 2.2, .3);
    ic.m.scale.set(Math.max(0, sx), Math.max(0, sy), Math.max(0, sx));
  });
  frostP.forEach((p, i) => {
    const ic = ices[p.ice], k = t - ic.t0 - .05;
    if (k < 0 || k > 1.1) { setInst(frost, i, HIDE, 0); return; }
    const base = v3(ic.a.x, .4 + p.y * ic.a.n * (ic.a.frozen) * COIN_H, SZ);
    base.addScaledVector(p.d, ease.outCubic(k / 1.1) * .9); base.y -= 1.2 * k * k;
    setInst(frost, i, base, (1 - k / 1.1) * 1.2, k * 6, k * 4);
  });
  frost.instanceMatrix.needsUpdate = true;

  // 飞行硬币
  flights.forEach((f, i) => {
    const u = (t - f.te) / f.dur;
    if (u < 0 || u > 1) { setInst(flyers, i, HIDE, 0); return; }
    const p = f.from().lerp(f.to, ease.inOutSine(u)); p.y += arc(u, f.h);
    setInst(flyers, i, p, f.small ? .78 : .9, u * f.spin, Math.PI / 2 * (f.small ? 1 : Math.sin(u * Math.PI)));
  });
  flyers.instanceMatrix.needsUpdate = true;
  funnel.scale.setScalar(1 + .06 * Math.max(0, Math.sin(t * 14)) * (t > C.L4.start + 1.6 && t < C.L4.end + .3 ? 1 : 0));

  // C：价格柱
  const dp = dexPrice(t);
  dexFill.scale.y = priceH(dp); exFill.scale.y = priceH(oracle(t));
  // 闸门：先抬一点蓄力，再砸下回弹
  const tg = C.L5.start + .3;
  const raised = -1.3, pre = ease.inOutSine(win(t, tg - .35, tg)) * -.18;
  const drop = t < tg ? 0 : spring(t - tg, 1.5, .32);
  gatePivot.rotation.x = lerp(raised + pre, 0, drop) + (t > C.L10.start + 2.9 ? -1.3 * spring(t - C.L10.start - 2.9, 1.2, .55) : 0);
  lamp.visible = t > tg && Math.floor(t * 2.5) % 2 === 0 && t < C.L10.start + 2.9;
  for (let i = 0; i < 40; i++) {
    const k = t - tg - .12; const r = rng(i + 300);
    if (k < 0 || k > 1.3) { setInst(dust, i, HIDE, 0); continue; }
    const ang = r() * Math.PI * 2, sp = .8 + r() * 1.6;
    setInst(dust, i, v3(GX + Math.cos(ang) * sp * ease.outCubic(k / 1.3), .45 + .5 * r() * Math.sin(Math.PI * k / 1.3), -3.5 + r() * 7.2 + Math.sin(ang) * .4), (1 - k / 1.3) * (1 + r()));
  }
  dust.instanceMatrix.needsUpdate = true;
  // 交易所 ETH 滑向闸门、被挡住
  for (let i = 0; i < 8; i++) {
    const ts = C.L5.start + .9 + i * .16, u = t < ts ? 0 : spring(t - ts, 1.3, .45);
    const x = lerp(EX - .2, GX + .55 + i * .38, u);
    setInst(exCoins, i, v3(x, .5 + (i % 2) * .07, 2.2), 1, 0, 0);
  }
  exCoins.instanceMatrix.needsUpdate = true;
  // 预言机光束逐段生长 + 脉冲
  const bg = ease.outCubic(win(t, C.L6.start + .2, C.L6.start + 1.6));
  beam.geometry.setDrawRange(0, Math.floor(bg * beamGeo.index.count / 3) * 3);
  beam.visible = bg > 0;
  for (let i = 0; i < 6; i++) {
    const u = ((t * .55 + i / 6) % 1);
    if (bg < 1 || t > DUR) setInst(pulses, i, HIDE, 0); else setInst(pulses, i, along(beamTable, u), 1);
  }
  pulses.instanceMatrix.needsUpdate = true;
  antenna.scale.setScalar(1 + .3 * Math.max(0, Math.sin(t * 6)) * (bg >= 1 ? 1 : 0));

  // 窗口
  const wg = ease.outCubic(win(t, C.L9.start + .1, C.L9.start + .9)) * (1 - ease.inOutCubic(win(t, C.L10.start + 1.0, C.L10.start + 1.8)));
  winPane.material.opacity = .9 * wg;
  frameMat.color.setScalar(1 + 4 * wg);
  const ts = C.L10.start + .8;
  shutter.scale.y = Math.max(.001, t < ts ? 0 : spring(t - ts, 1.6, .35)); shutter.visible = t > ts;

  // 小人
  const appear = spring(t - (C.L7.start - .5), 2.0, .4);
  bot.visible = appear > .001;
  let pos = PA.clone(), facing = .2, sq = [1, 1], item = null;
  for (const tr of trips) {
    const u = (t - tr.t0) / tr.d; if (u < 0) break; if (u > 1) continue;
    const seg = (a, b) => win(u, a, b);
    const L = -Math.PI / 2 + .75, Rt = Math.PI / 2 - .75;
    if (u < .14) { item = null; sq = squash('pre', seg(.06, .14)); facing = lerp(.2, L, ease.inOutCubic(seg(0, .1))); }
    else if (u < .44) { const p = seg(.14, .44); pos = PA.clone().lerp(PD, ease.inOutSine(p)); pos.y += arc(p, 1.2); sq = squash('air', p); item = '#7d8bff'; facing = L; }
    else if (u < .58) { pos = PD.clone(); sq = squash('land', seg(.44, .58) * 1.4); item = u < .44 ? '#7d8bff' : u < .57 ? null : '#26a17b'; facing = lerp(L, Rt, ease.inOutCubic(seg(.47, .58))); }
    else if (u < .88) { const p = seg(.58, .88); pos = PD.clone().lerp(PA, ease.inOutSine(p)); pos.y += arc(p, 1.0); sq = squash('air', p); item = '#26a17b'; facing = Rt; }
    else { pos = PA.clone(); sq = squash('land', seg(.88, 1) * 1.6); item = null; facing = lerp(Rt, .2, ease.inOutCubic(seg(.9, 1))); }
  }
  if (!trips.length || t > trips[trips.length - 1].t0 + trips[trips.length - 1].d) {
    const idle = t - C.L8.end; pos = PA.clone(); pos.y += Math.max(0, Math.sin(idle * 5)) * .12 * Math.exp(-Math.max(0, idle) * .2);
    facing = t > C.L9.start ? -.6 : .2;
  }
  bot.position.copy(pos); bot.rotation.y = facing;
  bot.scale.set(1.55 * appear * sq[0], 1.55 * appear * sq[1], 1.55 * appear * sq[0]);
  carry.visible = !!item; if (item) carry.material.color.set(item); carry.scale.setScalar(.78 / 1.55);
  carry.rotation.z = t * 3;
}

// ───────── 2D 叠加层：HUD、跟随标签、字幕 ─────────
const ov = document.getElementById('ov'); ov.width = W; ov.height = H;
const g = ov.getContext('2d');
const CN = '"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif';
const MONO = 'Consolas,"Cascadia Mono",monospace';
const fadeIn = (t, a, b, fi = .35, fo = .35) => Math.min(clamp01((t - a) / fi), clamp01((b - t) / fo));
const proj = p => { const v = p.clone().project(camera); return {x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1}; };
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function tag(t, p3, title, sub, a0, a1, opt = {}) {
  const al = fadeIn(t, a0, a1); if (al <= 0) return;
  const p = proj(p3); if (!p.ok) return;
  const dir = opt.left ? -1 : 1, rise = opt.rise ?? 46;
  const k = ease.outCubic(clamp01((t - a0) / .45));
  const ex = p.x + dir * 30 * k, ey = p.y - rise * k, hx = ex + dir * 22 * k;
  g.save(); g.globalAlpha = al;
  g.strokeStyle = 'rgba(30,30,36,.75)'; g.lineWidth = 2;
  g.beginPath(); g.arc(p.x, p.y, 5, 0, Math.PI * 2); g.fillStyle = opt.dot || '#1e1e24'; g.fill();
  g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(ex, ey); g.lineTo(hx, ey); g.stroke();
  const n = Math.ceil(title.length * clamp01((t - a0 - .1) / .35));
  const txt = title.slice(0, n);
  g.font = `600 ${opt.size || 26}px ${CN}`; const tw = g.measureText(title).width;
  g.font = `400 17px ${MONO}`; const sw = sub ? g.measureText(sub).width : 0;
  const bw = Math.max(tw, sw) + 28, bh = sub ? 66 : 42;
  const bx = dir > 0 ? hx : hx - bw, by = ey - bh / 2;
  g.fillStyle = 'rgba(255,253,248,.88)'; rr(bx, by, bw, bh, 8); g.fill();
  g.strokeStyle = 'rgba(30,30,36,.18)'; g.lineWidth = 1; g.stroke();
  g.fillStyle = opt.color || '#1e1e24'; g.textBaseline = 'middle';
  g.font = `600 ${opt.size || 26}px ${CN}`; g.fillText(txt, bx + 14, by + (sub ? 22 : bh / 2));
  if (sub) { g.font = `400 17px ${MONO}`; g.fillStyle = 'rgba(30,30,36,.62)'; g.fillText(sub, bx + 14, by + 48); }
  g.restore();
}
const fmt = (n, d = 0) => n.toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
const bjClock = t => { const m = 5 + 20 * clamp01((t - s0) / (s1 - s0)); return `04:${String(Math.floor(m)).padStart(2, '0')}:${String(Math.floor((m % 1) * 60)).padStart(2, '0')}`; };

// 字幕分行：按真实词界找到每行的起点
const subs = [];
for (const c of TL.cues) {
  const clean = s => s.replace(/[，。、,.!！?？\s]/g, '');
  let acc = 0, wi = 0, cum = 0; const starts = [];
  const wl = c.words.map(w => clean(w.w).length);
  for (const line of c.sub) {
    while (wi < c.words.length && cum < acc) { cum += wl[wi]; wi++; }
    starts.push(wi < c.words.length ? c.words[wi].t : c.end);
    acc += clean(line).length;
  }
  c.sub.forEach((line, i) => subs.push({text: line, a: i === 0 ? c.start : starts[i], b: i === c.sub.length - 1 ? c.end + .15 : starts[i + 1]}));
}
function subtitle(t) {
  const s = subs.find(s => t >= s.a && t < s.b); if (!s) return;
  g.save(); g.font = `700 46px ${CN}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = 4.5; g.strokeStyle = 'rgba(22,22,28,.78)'; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 14; g.shadowOffsetY = 2;
  g.strokeText(s.text, W / 2, H - 96); g.shadowBlur = 0; g.fillStyle = '#ffffff'; g.fillText(s.text, W / 2, H - 96); g.restore();
}
function panel(t, x, y, rows, al) {
  if (al <= 0) return;
  g.save(); g.globalAlpha = al;
  const w = 430, h = 34 + rows.reduce((s, r) => s + (r.big ? 64 : 34), 0);
  g.fillStyle = 'rgba(255,253,248,.86)'; rr(x, y, w, h, 12); g.fill();
  g.strokeStyle = 'rgba(30,30,36,.14)'; g.stroke();
  let yy = y + 22;
  for (const r of rows) {
    g.textBaseline = 'top';
    if (r.big) { g.font = `600 17px ${CN}`; g.fillStyle = 'rgba(30,30,36,.6)'; g.fillText(r.label, x + 20, yy); g.font = `700 44px ${MONO}`; g.fillStyle = r.color || '#1e1e24'; g.fillText(r.value, x + 20, yy + 18); yy += 64; }
    else { g.font = `500 19px ${CN}`; g.fillStyle = 'rgba(30,30,36,.72)'; g.fillText(r.label, x + 20, yy + 4); g.font = `700 22px ${MONO}`; g.fillStyle = r.color || '#1e1e24'; g.textAlign = 'right'; g.fillText(r.value, x + w - 20, yy + 2); g.textAlign = 'left'; yy += 34; }
  }
  g.restore();
}
function hud(t) {
  // 左上：事件与时钟
  g.save(); g.globalAlpha = fadeIn(t, .2, DUR - 1.6, .5, .5);
  g.fillStyle = 'rgba(255,253,248,.86)'; rr(48, 44, 470, 92, 12); g.fill();
  g.fillStyle = '#e1423a'; rr(64, 62, 10, 10, 5); g.fill();
  g.font = `600 19px ${CN}`; g.fillStyle = 'rgba(30,30,36,.75)'; g.textBaseline = 'middle'; g.fillText('币安热钱包被盗 · 2026.10.30 北京时间', 84, 68);
  g.font = `700 36px ${MONO}`; g.fillStyle = '#1e1e24';
  let clock;
  if (t < C.L3.start) clock = bjClock(t);
  else if (t < C.L4.start) clock = t < ices[1].t0 ? '05:01  Tether 冻结' : '05:04  Circle 冻结';
  else if (t < C.L10.start + 2.8) clock = '04:40–05:40 价差窗口';
  else clock = '05:40  价差抹平';
  g.font = clock.length > 9 ? `700 30px ${CN}` : `700 36px ${MONO}`;
  g.fillText(clock, 64, 108); g.restore();
  // 右上：数字面板
  const X = W - 48 - 430, Y = 44;
  const o = outflow(t);
  const oa = fadeIn(t, C.L1.start + .3, C.L3.start + .1);
  panel(t, X, Y, [{big: 1, label: '已流出（转出时估值）', value: `$${fmt(o, 2)}B`, color: '#d4362e'}, {label: '涉及链', value: `${chains.filter((c, ci) => arrivedFrac(ci, t) > 0).length} / 10`}, {label: '', value: ''}, {label: '', value: ''}, {label: '来源', value: 'TRM Labs'}], oa);
  if (oa > 0) { g.save(); g.globalAlpha = oa; chains.forEach((c, i) => { const on = arrivedFrac(i, t) > 0 || tokens.some(tk => tk.ci === i && t >= tk.te); const k = on ? 1 : .28; const cx = X + 20 + (i % 5) * 80, cy = Y + 22 + 64 + 34 + 4 + Math.floor(i / 5) * 34; g.globalAlpha = oa * k; g.fillStyle = c.col; rr(cx, cy + 4, 12, 12, 6); g.fill(); g.font = `700 16px ${MONO}`; g.fillStyle = '#1e1e24'; g.textBaseline = 'top'; g.fillText(c.k, cx + 17, cy + 2); }); g.restore(); }
  const fz = (t > ices[0].t0 ? 1.77 * ease.outExpo(win(t, ices[0].t0, ices[0].t0 + .9)) : 0) + (t > ices[1].t0 ? .825 * ease.outExpo(win(t, ices[1].t0, ices[1].t0 + .9)) : 0) + .105 * win(t, ices[1].t0 + .6, ices[1].t0 + 1.4);
  panel(t, X, Y, [{big: 1, label: '已冻结（截至 UTC 00:30）', value: `$${fmt(fz, 2)}B`, color: '#2c86c9'}, {label: 'Tether · USDT', value: '17.7 亿'}, {label: 'Circle · USDC', value: '8.25 亿'}, {label: '来源', value: 'TRM Labs'}], fadeIn(t, C.L3.start + .1, C.L4.start + .2));
  const dp = dexPrice(t), op = oracle(t), spread = (dp / op - 1) * 100;
  const rows = [{big: 1, label: '链上 DEX · ETH', value: `$${fmt(dp)}`, color: '#0f9d7a'}, {label: 'Aave 预言机（≈交易所价）', value: `$${fmt(op)}`, color: '#b07c00'}, {label: '价差', value: `${spread >= 0 ? '+' : ''}${fmt(spread, 1)}%`, color: spread > 5 ? '#d4362e' : '#1e1e24'}];
  if (t > C.L7.start) { const done = trips.filter(tr => t > tr.t0 + tr.d * .58).length; rows.push({label: '第一名地址累计', value: `+$${fmt(PROFIT * ease.outCubic(done / trips.length), 2)}M`, color: '#d4362e'}); }
  rows.push({label: '来源', value: t > C.L6.start ? '@0xNaiXi 链上统计' : 'TRM / @0xNaiXi'});
  panel(t, X, Y, rows, fadeIn(t, C.L4.start + .2, C.L10.end + .4));
  // 底部进度
  g.fillStyle = 'rgba(30,30,36,.12)'; g.fillRect(0, H - 6, W, 6);
  g.fillStyle = '#e1423a'; g.fillRect(0, H - 6, W * t / DUR, 6);
}
function labels(t) {
  tag(t, v3(0, 6.0, 0), '交易所热钱包', 'BINANCE HOT WALLETS', C.L1.start + .2, C.L2.start + 1.2);
  tag(t, v3(BX, 5.1, -.4), '攻击者地址', 'TRM 归因：TraderTraitor', C.L2.end - 1.6, C.L3.start + .6, {left: true});
  tag(t, v3(USDT.x - .45, stackTop(USDT, USDT.n) * .45, SZ), 'USDT  冻结 71%', '17.7亿 / 24.9亿', ices[0].t0 + .3, C.L4.start + .3, {left: true, rise: -10, color: '#2c86c9'});
  tag(t, v3(assets[3].x, stackTop(assets[3], assets[3].n) + .2, SZ), 'USDC  基本全冻', '8.25亿', ices[1].t0 + .3, C.L4.start + .3, {color: '#2c86c9'});
  tag(t, v3(DX, 8.6, 0), '链上 DEX', 'USDT → ETH 狂买', C.L4.start + 1.2, C.L5.start + .6, {left: true});
  tag(t, v3(GX, 2.6, 0), '提币暂停', 'ETH 搬不上链', C.L5.start + .5, C.L6.start + .4, {color: '#d4362e'});
  tag(t, v3(EX, 4.1, 0), '交易所价格', '≈ $2,300', C.L5.start + 1.4, C.L6.end, {});
  tag(t, v3(AX + .9, 4.6, -.7), 'Aave 预言机', '跟交易所价 ≈ $2,280', C.L6.start + 1.4, C.L7.start + .8, {left: true});
  tag(t, v3((PA.x + PD.x) / 2, 3.3, PA.z), '套利地址 0x0cdd…61D8', '借 ETH @2,280 → 卖 @2,580', C.L7.start + .6, C.L8.start + .3, {left: true, size: 22});
  const dp = dexPrice(t), op = oracle(t);
  tag(t, v3(DX + .75, .56 + priceH(dp), .75), `$${fmt(dp)}`, null, C.L4.start + 1.4, C.L10.end + .2, {size: 24, rise: 18, color: '#0b8a66', dot: '#0fb488'});
  tag(t, v3(EX + .75, .56 + priceH(op), .75), `$${fmt(op)}`, null, C.L5.start + 1.4, C.L10.end + .2, {size: 24, rise: 18, color: '#9a6a00', dot: '#f0a300'});
  tag(t, v3(AX - 1.55, 2.2, .25), '按旧价格出货的窗口', null, C.L9.start + 1.4, C.L10.start + 1.0, {left: true, color: '#7a3fb0'});
}
function endCard(t) {
  const al = ease.outCubic(win(t, C.L10.end + .1, C.L10.end + .9)); if (al <= 0) return;
  g.save(); g.globalAlpha = al;
  const grd = g.createLinearGradient(0, H * .25, 0, H * .78); grd.addColorStop(0, 'rgba(250,247,240,0)'); grd.addColorStop(.35, 'rgba(250,247,240,.88)'); grd.addColorStop(1, 'rgba(250,247,240,.92)');
  g.fillStyle = grd; g.fillRect(0, H * .25, W, H * .6);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1e1e24';
  g.font = `800 72px ${CN}`; g.fillText('币安被盗的那一小时', W / 2, H * .5 - 20 + 16 * (1 - al));
  g.font = `500 32px ${CN}`; g.fillStyle = 'rgba(30,30,36,.7)'; g.fillText('黑客偷走的是币，市场暴露的是价差', W / 2, H * .5 + 50);
  g.font = `400 18px ${CN}`; g.fillStyle = 'rgba(30,30,36,.5)';
  g.fillText('数据：TRM Labs（2026.10.30 快照）· 套利收益为 @0xNaiXi 链上统计，本片未独立复算 · 不构成投资建议', W / 2, H * .5 + 108);
  g.restore();
}
function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  labels(t); hud(t); subtitle(t); endCard(t);
}

// ───────── 帧接口 ─────────
window.renderFrame = t => {
  renderer.setRenderTarget(accRT); renderer.setClearColor(0x000000, 1); renderer.clear();
  for (let k = 0; k < SUB; k++) {
    const tk = SUB === 1 ? t : t + ((k + .5) / SUB - .5) * SHUTTER / FPS;
    update(tk); composer.render();
    accMat.uniforms.tex.value = composer.readBuffer.texture; accMat.uniforms.w.value = 1 / SUB;
    renderer.setRenderTarget(accRT); renderer.autoClear = false; renderer.render(accScene, quadCam); renderer.autoClear = true;
  }
  renderer.setRenderTarget(null); renderer.render(copyScene, quadCam);
  update(t); drawOverlay(t);
  return true;
};
window.__dur = DUR; window.__frames = TL.frames;
window.__ready = true;
