// 在 episode 根目录运行（含 web/、audio/timeline.json）：
//   node render.mjs setup                      复制 three.js 到 web/vendor（THREE_DIR 指向 node_modules/three）
//   node render.mjs stills 1,8,15 [--q nobloom]  静帧 → qa/stills/
//   node render.mjs clip 17 26 [--mb 4]          连续片 → qa/clip-17-26.mp4
//   node render.mjs full [--mb 4]                整片 → out/video-silent.mp4 + out/final.mp4（混入 audio/voice.wav）
//   --q scene=catalog 换场景文件；--q nobloom、--q nodof 关后期定位问题；--out 指定输出
// 竖屏：加 --w 1080 --h 1920。PLAYWRIGHT 可指向已安装的 playwright 包；CHROME 可指向 Chromium/Chrome（默认找系统 Chrome/Edge）。
import {createRequire} from 'module';
import {spawn, execFileSync} from 'child_process';
import fs from 'fs';
import path from 'path';
const require = createRequire(path.join(process.cwd(), 'noop.js'));
const ROOT = process.cwd();
const [mode, a1, a2] = process.argv.slice(2);
const opt = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };

if (mode === 'setup') {
  const src = process.env.THREE_DIR || path.join(ROOT, 'node_modules', 'three');
  if (!fs.existsSync(path.join(src, 'build', 'three.module.js'))) { console.error('找不到 three.js：先 npm install，或设 THREE_DIR=<node_modules/three>'); process.exit(3); }
  const dst = path.join(ROOT, 'web', 'vendor', 'three');
  fs.mkdirSync(path.join(dst, 'build'), {recursive: true});
  fs.copyFileSync(path.join(src, 'build', 'three.module.js'), path.join(dst, 'build', 'three.module.js'));
  fs.copyFileSync(path.join(src, 'LICENSE'), path.join(dst, 'LICENSE'));
  for (const d of ['postprocessing', 'shaders', 'geometries', 'environments', 'math', 'utils'])
    fs.cpSync(path.join(src, 'examples', 'jsm', d), path.join(dst, 'examples', 'jsm', d), {recursive: true});
  console.log('three', JSON.parse(fs.readFileSync(path.join(src, 'package.json'))).version, '→', dst);
  process.exit(0);
}

let pw;
for (const name of [process.env.PLAYWRIGHT, 'playwright', 'playwright-core']) { if (!name) continue; try { pw = require(name); break; } catch {} }
if (!pw) { console.error('找不到 playwright：在 episode 里 npm install，或设 PLAYWRIGHT=<node_modules/playwright>'); process.exit(3); }
const {chromium} = pw;
const CANDIDATES = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'];
const CHROME = CANDIDATES.find(x => x && fs.existsSync(x));
const MB = +(opt('mb') || (mode === 'stills' ? 1 : 4));
const W = +(opt('w') || 1920), H = +(opt('h') || 1080), FPS = 30;
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png'};
// --force_high_performance_gpu：笔记本双显卡时让 WebGL 走独显
const browser = await chromium.launch({executablePath: CHROME, headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu']});
const page = await browser.newPage({viewport: {width: W, height: H}, deviceScaleFactor: 1});
page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
await page.route('http://local.test/**', r => {
  const p = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) return r.fulfill({status: 404, body: 'nf'});
  r.fulfill({status: 200, body: fs.readFileSync(p), contentType: TYPES[path.extname(p)] || 'application/octet-stream'});
});
await page.goto(`http://local.test/web/index.html?mb=${MB}&w=${W}&h=${H}${opt('q') ? '&' + opt('q') : ''}`);
await page.waitForFunction(() => window.__ready || window.__bootFailed, null, {timeout: 120000});
const failed = await page.evaluate(() => window.__bootFailed);
if (failed) { console.error('BOOT FAILED', failed); process.exit(2); }
const gpu = await page.evaluate(() => { const gl = document.getElementById('gl').getContext('webgl2'); const e = gl.getExtension('WEBGL_debug_renderer_info'); return gl.getParameter(e.UNMASKED_RENDERER_WEBGL); });
const dur = await page.evaluate(() => window.__dur);
console.log('gpu', gpu, '| dur', dur, '| mb', MB, '|', W + 'x' + H);
if (/SwiftShader|llvmpipe/i.test(gpu)) console.warn('警告：WebGL 走的是软件渲染，画质与速度都会差很多');
const shot = async t => { await page.evaluate(t => window.renderFrame(t), t); return page.screenshot({type: 'png'}); };

if (mode === 'stills') {
  const dir = path.join(ROOT, 'qa', 'stills'); fs.mkdirSync(dir, {recursive: true});
  for (const t of a1.split(',').map(Number)) { fs.writeFileSync(path.join(dir, `${opt('tag') || ''}t${t.toFixed(2).padStart(6, '0')}.png`), await shot(t)); console.log('still', t); }
} else if (mode === 'clip' || mode === 'full') {
  const start = mode === 'clip' ? +a1 : 0, end = mode === 'clip' ? +a2 : dur;
  const out = opt('out') ? path.resolve(opt('out')) : mode === 'clip' ? path.join(ROOT, 'qa', `clip-${start}-${end}.mp4`) : path.join(ROOT, 'out', 'video-silent.mp4');
  fs.mkdirSync(path.dirname(out), {recursive: true});
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', out], {stdio: ['pipe', 'inherit', 'inherit']});
  const n = Math.round((end - start) * FPS), t0 = Date.now();
  for (let f = 0; f < n; f++) {
    if (!ff.stdin.write(await shot(start + f / FPS))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.log(`frame ${f}/${n}  ${((Date.now() - t0) / 1000 / (f + 1)).toFixed(3)}s/f`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log('wrote', out);
  if (mode === 'full') {
    const fin = path.join(ROOT, 'out', 'final.mp4');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', out, '-i', path.join(ROOT, 'audio', 'voice.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', fin]);
    console.log('wrote', fin);
  }
} else {
  console.error('mode: setup | stills | clip | full');
}
await browser.close();
