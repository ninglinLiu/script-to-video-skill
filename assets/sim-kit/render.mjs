// 在工程根目录运行（含 web/index.html、web/scene.js、web/data.json）：
//   node render.mjs stills 3.5,10.2,30          静帧 → qa/stills/
//   node render.mjs clip 8 16                   连续片 → qa/clip-8-16.mp4
//   node render.mjs full                        整片（无声）→ out/video-silent.mp4
//   node render.mjs cards                       分段表 → qa/cards.json（分镜总览按段分色）
// 字体：SERIF_FONT、MONO_FONT 指向字体文件；不设时在系统字体目录里找思源宋体/Noto Serif SC 和等宽字体。
// PLAYWRIGHT 指向 playwright 包；CHROME 指向 Chrome/Edge/Chromium。
import {createRequire} from 'module';
import {spawn} from 'child_process';
import fs from 'fs';
import path from 'path';
const require = createRequire(path.join(process.cwd(), 'noop.js'));
const ROOT = process.cwd();
const [mode, a1, a2] = process.argv.slice(2);
const opt = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const FPS = +(opt('fps') || 30), W = 1080, H = 1920;

const first = list => list.find(x => x && fs.existsSync(x));
const FONTS = {
  serif: first([process.env.SERIF_FONT, 'C:/Windows/Fonts/NotoSerifSC-VF.ttf', 'C:/Windows/Fonts/SourceHanSerifSC-VF.ttf',
    '/System/Library/Fonts/Supplemental/Songti.ttc', '/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc', '/usr/share/fonts/noto-cjk/NotoSerifCJK-Bold.ttc']),
  mono: first([process.env.MONO_FONT, 'C:/Windows/Fonts/CascadiaMono.ttf', 'C:/Windows/Fonts/consolab.ttf',
    '/System/Library/Fonts/SFNSMono.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf']),
};
for (const [k, v] of Object.entries(FONTS)) if (!v) { console.error(`找不到 ${k} 字体：设 ${k.toUpperCase()}_FONT 环境变量`); process.exit(3); }

let pw;
for (const name of [process.env.PLAYWRIGHT, 'playwright', 'playwright-core']) { if (!name) continue; try { pw = require(name); break; } catch {} }
if (!pw) { console.error('找不到 playwright：npm install，或设 PLAYWRIGHT=<node_modules/playwright>'); process.exit(3); }
const CHROME = first([process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']);
const browser = await pw.chromium.launch({executablePath: CHROME, headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--force_high_performance_gpu', '--mute-audio']});
const page = await browser.newPage({viewport: {width: W, height: H}, deviceScaleFactor: 1});
page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png'};
await page.route('http://local.test/**', r => {
  const u = decodeURIComponent(new URL(r.request().url()).pathname);
  if (u.startsWith('/font/')) return r.fulfill({status: 200, body: fs.readFileSync(FONTS[u.slice(6)]), contentType: 'font/ttf'});
  const p = path.join(ROOT, 'web', u);
  if (!p.startsWith(path.join(ROOT, 'web')) || !fs.existsSync(p)) return r.fulfill({status: 404, body: 'nf'});
  r.fulfill({status: 200, body: fs.readFileSync(p), contentType: TYPES[path.extname(p)] || 'application/octet-stream'});
});
await page.goto('http://local.test/index.html');
await page.waitForFunction(() => window.__ready || window.__bootFailed, null, {timeout: 120000});
const failed = await page.evaluate(() => window.__bootFailed);
if (failed) { console.error('BOOT FAILED', failed); process.exit(2); }
const dur = await page.evaluate(() => window.__dur);
console.log('dur', dur, '| fonts', FONTS.serif, FONTS.mono);
const shot = async t => { await page.evaluate(t => window.renderFrame(t), t); return page.screenshot({type: 'png'}); };

if (mode === 'stills') {
  const dir = path.join(ROOT, 'qa', opt('dir') || 'stills'); fs.mkdirSync(dir, {recursive: true});
  for (const t of a1.split(',').map(Number)) { fs.writeFileSync(path.join(dir, `${opt('tag') || ''}t${t.toFixed(2).padStart(6, '0')}.png`), await shot(t)); console.log('still', t); }
} else if (mode === 'clip' || mode === 'full') {
  const start = mode === 'clip' ? +a1 : 0, end = mode === 'clip' ? +a2 : dur;
  const out = opt('out') ? path.resolve(opt('out')) : mode === 'clip' ? path.join(ROOT, 'qa', `clip-${start}-${end}.mp4`) : path.join(ROOT, 'out', 'video-silent.mp4');
  fs.mkdirSync(path.dirname(out), {recursive: true});
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-r', String(FPS), '-movflags', '+faststart', out], {stdio: ['pipe', 'inherit', 'inherit']});
  const n = Math.round((end - start) * FPS), t0 = Date.now();
  for (let f = 0; f < n; f++) {
    if (!ff.stdin.write(await shot(start + f / FPS))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`frame ${f}/${n}  ${((Date.now() - t0) / 1000 / (f + 1)).toFixed(3)}s/f`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log('wrote', out);
} else if (mode === 'cards') {
  fs.mkdirSync(path.join(ROOT, 'qa'), {recursive: true});
  fs.writeFileSync(path.join(ROOT, 'qa', 'cards.json'), JSON.stringify({seconds: dur, cues: await page.evaluate(() => window.__cards)}, null, 1));
  console.log('wrote qa/cards.json');
} else console.error('mode: stills | clip | full | cards');
await browser.close();
