// Reuses the proven local Remotion renderer from the skill; renders silently (audio is muxed later).
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill,openBrowser} from '@remotion/renderer';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';

const mode = process.argv[2] || 'stills';
const tl = JSON.parse(readFileSync('src/timing.json', 'utf8'));
const browserExecutable = process.env.REMOTION_BROWSER;
if (browserExecutable && !existsSync(browserExecutable)) throw new Error('REMOTION_BROWSER must point to a Chrome/Chromium build.');

const serveUrl = await bundle({entryPoint: path.resolve('src/entry.tsx'), webpackOverride: (c) => c});
const browser = await openBrowser('chrome', {browserExecutable, logLevel: 'error'});
const compositionId = mode === 'clean' ? 'clean' : 'chapter';
const composition = await selectComposition({
  serveUrl,
  id: compositionId,
  puppeteerInstance: browser,
  timeoutInMilliseconds: 120000,
});
const opts = {serveUrl, composition, puppeteerInstance: browser, timeoutInMilliseconds: 120000, logLevel: 'error'};
mkdirSync('../qa/stills', {recursive: true});
mkdirSync('../out', {recursive: true});
mkdirSync('../native', {recursive: true});

try {
  if (mode === 'stills') {
    const want = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
    const times = want ?? tl.chapters.flatMap((c) => [0.25, 0.62].map((p) => c.start + (c.end - c.start) * p));
    for (let i = 0; i < times.length; i += 1) {
      await renderStill({
        ...opts,
        frame: Math.round(times[i] * 30),
        output: `../qa/stills/${String(i).padStart(2, '0')}-${times[i].toFixed(2)}s.jpg`,
        imageFormat: 'jpeg',
        jpegQuality: 92,
        scale: 0.5,
      });
      console.log(`still ${i} @ ${times[i].toFixed(2)}s`);
    }
    writeFileSync('../qa/still-times.json', JSON.stringify(times));
  } else {
    const start = Date.now();
    let last = -1;
    const chapter = mode === 'segment' ? tl.chapters.find((c) => c.id === process.argv[3]) : null;
    if (mode === 'segment' && !chapter) throw new Error('Specify a chapter id, e.g. node render.mjs segment c3');
    const range = chapter
      ? [Math.round(chapter.start * 30), Math.round(chapter.end * 30) - 1]
      : undefined;
    const output =
      mode === 'proof'
        ? '../qa/proof.mp4'
        : mode === 'clean'
          ? '../native/clean-master.mp4'
          : mode === 'segment'
            ? `../native/segments/${chapter.id}.mp4`
            : '../out/final-silent.mp4';
    if (mode === 'segment') mkdirSync('../native/segments', {recursive: true});
    await renderMedia({
      ...opts,
      outputLocation: output,
      codec: 'h264',
      pixelFormat: 'yuv420p',
      colorSpace: 'bt709',
      crf: mode === 'proof' ? 23 : 19,
      muted: true,
      concurrency: 6,
      scale: mode === 'proof' ? 0.5 : 1,
      frameRange: range,
      onProgress: ({progress}) => {
        const n = Math.floor(progress * 20);
        if (n !== last) {
          console.log(`${mode}: ${n * 5}%`);
          last = n;
        }
      },
    });
    writeFileSync(
      `../qa/render-${mode}.json`,
      JSON.stringify({mode, seconds: (Date.now() - start) / 1000, compositionId, frameRange: range || [0, tl.frames - 1], output}, null, 2),
    );
  }
} finally {
  await browser.close({silent: true});
}
