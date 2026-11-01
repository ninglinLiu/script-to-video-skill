// 舞台：渲染器、后期、灯光、运动模糊累积、连续镜头、地面与远景。参数来自用户认可的币安样片。
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {rng} from './motion.js';

export {THREE};
const FPS = 30, SHUTTER = 0.5;   // 180° 快门

export async function createStage(opt = {}) {
  const Q = new URLSearchParams(location.search);
  const W = +(Q.get('w') || 1920), H = +(Q.get('h') || 1080), SUB = +(Q.get('mb') || 1);
  const TL = opt.timeline || await (await fetch('/audio/timeline.json')).json();
  const CUE = TL.cues, C = Object.fromEntries(CUE.map(c => [c.id, c])), DUR = TL.seconds;

  document.querySelectorAll('canvas').forEach(c => { c.width = W; c.height = H; c.style.width = W + 'px'; c.style.height = H + 'px'; });
  const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('gl'), antialias: false, preserveDrawingBuffer: true});
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = +(Q.get('exp') || opt.exposure || 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const BG = new THREE.Color(opt.bg || '#cfc7ba');
  scene.background = BG; scene.fog = new THREE.Fog(BG, 45, 120);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), .04).texture;

  // 长焦 + 景深 = 微缩感。竖屏横向视野太窄：放宽 fov 并拉远，但构图仍要按竖屏重排关键帧。
  const PORTRAIT = H > W, DZ = PORTRAIT ? 1.6 : 1;
  const camera = new THREE.PerspectiveCamera(PORTRAIT ? 42 : (opt.fov || 30), W / H, .5, 400);
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, {type: THREE.HalfFloatType, samples: 4}));
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, {focus: 20, aperture: .0011, maxblur: .010});
  if (!Q.has('nodof')) composer.addPass(bokeh);
  // 阈值必须高于浅色背景亮度，否则整屏发白；只有 toneMapped:false 的发光材质才触发
  if (!Q.has('nobloom')) composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), .5, .45, 2.2));
  composer.addPass(new OutputPass());
  composer.renderToScreen = false;

  const accRT = new THREE.WebGLRenderTarget(W, H, {type: THREE.HalfFloatType});
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new THREE.PlaneGeometry(2, 2);
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  const accMat = new THREE.ShaderMaterial({uniforms: {tex: {value: null}, w: {value: 1}}, vertexShader: VS,
    fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tex, vUv).rgb * w, 1.); }',
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation, depthTest: false, depthWrite: false});
  const copyMat = new THREE.ShaderMaterial({uniforms: {tex: {value: accRT.texture}}, vertexShader: VS,
    fragmentShader: 'uniform sampler2D tex; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tex, vUv).rgb, 1.); }', depthTest: false, depthWrite: false});
  const accScene = new THREE.Scene(); accScene.add(new THREE.Mesh(quad, accMat));
  const copyScene = new THREE.Scene(); copyScene.add(new THREE.Mesh(quad, copyMat));

  scene.add(new THREE.HemisphereLight('#ffffff', '#b8ad9a', opt.hemi ?? 1.15));
  const key = new THREE.DirectionalLight('#fff1dd', opt.keyLight ?? 2.7);
  key.castShadow = true; key.shadow.mapSize.set(4096, 4096); key.shadow.bias = -.0003; key.shadow.normalBias = .025; key.shadow.radius = 5;
  Object.assign(key.shadow.camera, {near: 1, far: 120}); scene.add(key, key.target);
  const fill = new THREE.DirectionalLight('#d4e2ff', .75); fill.position.set(14, 7, -16); scene.add(fill);

  const M = (color, o = {}) => new THREE.MeshStandardMaterial({color, roughness: .55, metalness: 0, envMapIntensity: .75, ...o});
  const rbox = (w, h, d, r = .12, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, r);
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  function add(geo, mat, x = 0, y = 0, z = 0, parent = scene, shadow = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; }
  const glow = (hex, k = 4.2) => new THREE.MeshBasicMaterial({color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false});
  const glass = (op = .3) => new THREE.MeshPhysicalMaterial({color: '#ffffff', roughness: .06, metalness: 0, transparent: true, opacity: op, depthWrite: false, envMapIntensity: 1.2});
  function canvasTex(w, h, draw, repeat) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
    return t;
  }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler(), HIDE = v3(0, -50, 0);
  function setInst(mesh, i, pos, scale = 1, rotY = 0, rotX = 0) {
    _q.setFromEuler(_e.set(rotX, rotY, 0));
    if (Array.isArray(scale)) _s.set(...scale); else _s.setScalar(scale);
    mesh.setMatrixAt(i, _m.compose(pos, _q, _s));
  }

  function ground(color = '#e2d9cb') {
    const t = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = color; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,70,55,.07)'; g.lineWidth = 2;
      for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); }
    }, [100, 100]);
    add(new THREE.PlaneGeometry(400, 400), M('#ffffff', {map: t, roughness: .92}), 0, 0, 0, scene, false).rotation.x = -Math.PI / 2;
  }
  const pad = (x, z, w, d, color = '#f6f2ea') => add(rbox(w, .3, d, .14), M(color, {roughness: .8}), x, .15, z);

  // 建筑模型式远景：给景深提供层次。clear(x, z) 为 true 的位置留空（别挡镜头）。
  function cityscape({seed = 7, xMin = -40, xMax = 80, clear = (x, z) => z > 0 && Math.abs(x - (xMin + xMax) / 2) < 30} = {}) {
    const pal = ['#f4f0e8', '#ebe4d9', '#dfd8cc', '#f1e7d9', '#dde3e8', '#e9e2ef'].map(c => new THREE.Color(c));
    const blocks = [], r = rng(seed);
    for (let i = 0; i < 150; i++) {
      const x = xMin + r() * (xMax - xMin), z = r() < .78 ? -11 - r() * 38 : 11 + r() * 26;
      if (clear(x, z)) continue;
      blocks.push([x, z, 1.6 + r() * 3.2, 1.2 + r() * (z < -25 ? 7 : 4), 1.6 + r() * 3.2]);
    }
    const bm = new THREE.InstancedMesh(rbox(1, 1, 1, .06, 2), M('#ffffff', {roughness: .85}), blocks.length);
    blocks.forEach((b, i) => { setInst(bm, i, v3(b[0], b[3] / 2, b[1]), [b[2], b[3], b[4]], r() * .5); bm.setColorAt(i, pal[i % pal.length]); });
    bm.castShadow = bm.receiveShadow = true; scene.add(bm);
    const trees = [];
    for (let i = 0; i < 90; i++) { const x = xMin + 2 + r() * (xMax - xMin - 5), z = r() < .7 ? -9 - r() * 30 : 9 + r() * 18; if (clear(x, z)) continue; trees.push([x, z, .7 + r() * .7]); }
    const crown = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), M('#9cc48a', {roughness: .9}), trees.length);
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.12, .16, 1, 8), M('#a08466'), trees.length);
    trees.forEach((t, i) => { setInst(crown, i, v3(t[0], 1.1 * t[2] + .9, t[1]), [t[2], t[2] * 1.15, t[2]]); setInst(trunk, i, v3(t[0], .5, t[1]), [1, 1.1, 1]); crown.setColorAt(i, new THREE.Color().setHSL(.27 + r() * .06, .35, .55 + r() * .1)); });
    crown.castShadow = trunk.castShadow = true; scene.add(crown, trunk);
  }

  const target = new THREE.Vector3();
  // 镜头：[目标 x,y,z, 距离, 方位°, 俯仰°]。焦点跟目标走，阴影相机跟目标走并随距离放大。
  function aim([tx, ty, tz, d, az, el]) {
    d *= DZ; target.set(tx, ty, tz);
    const a = az * Math.PI / 180, e = el * Math.PI / 180;
    camera.position.set(tx + d * Math.cos(e) * Math.sin(a), ty + d * Math.sin(e), tz + d * Math.cos(e) * Math.cos(a));
    camera.lookAt(target); camera.updateMatrixWorld();
    bokeh.uniforms.focus.value = camera.position.distanceTo(target);
    bokeh.uniforms.aperture.value = .0011 * 20 / Math.max(14, d);
    key.position.copy(target).add(v3(-10, 18, 12)); key.target.position.copy(target);
    const sb = Math.min(45, Math.max(13, d * .75));
    Object.assign(key.shadow.camera, {left: -sb, right: sb, top: sb, bottom: -sb}); key.shadow.camera.updateProjectionMatrix();
  }

  // 帧接口：update(t) 可被子帧多次调用，必须只依赖 t；draw(t) 每帧一次。
  function run(update, draw = () => {}) {
    window.renderFrame = t => {
      renderer.setRenderTarget(accRT); renderer.setClearColor(0, 1); renderer.clear();
      for (let k = 0; k < SUB; k++) {
        update(SUB === 1 ? t : t + ((k + .5) / SUB - .5) * SHUTTER / FPS); composer.render();
        accMat.uniforms.tex.value = composer.readBuffer.texture; accMat.uniforms.w.value = 1 / SUB;
        renderer.setRenderTarget(accRT); renderer.autoClear = false; renderer.render(accScene, quadCam); renderer.autoClear = true;
      }
      renderer.setRenderTarget(null); renderer.render(copyScene, quadCam);
      update(t); draw(t); return true;
    };
    window.__dur = DUR; window.__ready = true;
  }

  return {THREE, Q, W, H, SUB, PORTRAIT, TL, CUE, C, DUR, scene, camera, renderer, bokeh, target, M, rbox, v3, add, glow, glass, canvasTex, setInst, HIDE, ground, pad, cityscape, aim, run};
}
