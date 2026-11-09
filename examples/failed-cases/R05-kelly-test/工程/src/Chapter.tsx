import React, { useEffect, useMemo, useState } from 'react';
import {
  AbsoluteFill,
  Sequence,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { C, F, FPS, clamp } from './theme';
import { Grain, Ground, SubtitleScrim } from './ui';
import { SceneAverage, SceneCoin, SceneExpected, SceneGeometric, SceneHundred, SceneMultiply } from './scenes';
import timing from './timing.json';

type Cue = { text: string; start: number; end: number };
type Sub = Cue & { cueIndices: number[] };
type Chapter = {
  id: string;
  title: string;
  start: number;
  end: number;
  cueStart: number;
  cueEnd: number;
  voiceStart: number;
  voiceEnd: number;
};
type Timeline = { cues: Cue[]; subtitles: Sub[]; chapters: Chapter[]; seconds: number; frames: number; fps: number };
const TL = timing as Timeline;

const SCENES = [SceneCoin, SceneExpected, SceneMultiply, SceneHundred, SceneAverage, SceneGeometric];

/** Soft 5-frame entry so a hard cut never pops; the cut itself stays hard. */
const Fade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const local = useCurrentFrame();
  const p = clamp(local / 5);
  return <AbsoluteFill style={{ opacity: p }}>{children}</AbsoluteFill>;
};

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender('noto-fonts'));
  useEffect(() => {
    const url = (p: string) => staticFile(p);
    const style = document.createElement('style');
    style.textContent = `
      @font-face{font-family:"Noto Serif SC";src:url("${url('fonts/NotoSerifSC-VF.ttf')}") format("truetype");font-weight:100 900;font-style:normal;font-display:block;}
      @font-face{font-family:"Noto Sans SC";src:url("${url('fonts/NotoSansSC-VF.ttf')}") format("truetype");font-weight:100 900;font-style:normal;font-display:block;}
    `;
    document.head.appendChild(style);
    Promise.all([
      document.fonts.load('400 40px "Noto Sans SC"'),
      document.fonts.load('500 40px "Noto Sans SC"'),
      document.fonts.load('700 80px "Noto Sans SC"'),
      document.fonts.load('600 80px "Noto Serif SC"'),
      document.fonts.load('700 90px "Noto Serif SC"'),
    ])
      .then(() => continueRender(handle))
      .catch((err) => {
        console.error('font load failed', err);
        continueRender(handle);
      });
  }, [handle]);
  return null;
};

const Chrome: React.FC<{ frame: number; total: number; index: number; count: number }> = ({
  frame,
  total,
  index,
  count,
}) => {
  const t = clamp(frame / Math.max(1, total - 1));
  return (
    <>
      <div style={{ position: 'absolute', left: 96, top: 86, width: 888, height: 1, background: 'rgba(244,237,220,0.14)' }} />
      <div style={{ position: 'absolute', left: 96, top: 86, width: 888 * t, height: 1, background: C.gold, opacity: 0.9 }} />
      <div
        style={{
          position: 'absolute',
          right: 96,
          top: 112,
          fontFamily: F.sans,
          fontSize: 22,
          letterSpacing: '0.34em',
          color: C.dim,
        }}
      >
        {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
      </div>
    </>
  );
};

const WIDE = (ch: string) => (/[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? 1 : 0.55);

/** Keep subtitle lines balanced: break on the punctuation nearest the visual middle. */
const breakLines = (text: string): string[] => {
  const total = [...text].reduce((n, ch) => n + WIDE(ch), 0);
  if (total <= 14) return [text];
  const mid = total / 2;
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  let acc = 0;
  [...text].forEach((ch, i) => {
    acc += WIDE(ch);
    if ('，；：、。！？'.includes(ch) && i > 0 && i < text.length - 1) {
      const d = Math.abs(acc - mid);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
  });
  const cut = best > 0 ? best + 1 : Math.round(text.length / 2);
  return [text.slice(0, cut), text.slice(cut)];
};

const Captions: React.FC<{ frame: number }> = ({ frame }) => {
  const sub = TL.subtitles.find((s) => frame >= s.start * FPS - 2 && frame < s.end * FPS + 4);
  if (!sub) return null;
  const p = clamp((frame - (sub.start * FPS - 2)) / 7) * clamp((sub.end * FPS + 4 - frame) / 6);
  const lines = breakLines(sub.text);
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        width: 900,
        top: 1544,
        opacity: p,
        transform: `translateY(${(1 - p) * 10}px)`,
        textAlign: 'center',
        fontFamily: F.sans,
        fontSize: 40,
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '0.015em',
        color: '#F4EDDC',
        textShadow: '0 2px 16px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)',
      }}
    >
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
};

export const Chapter: React.FC<{ captions?: boolean }> = ({ captions = true }) => {
  const frame = useCurrentFrame();
  const windows = useMemo(
    () =>
      TL.chapters.map((c, i) => {
        const from = Math.round(c.start * FPS);
        const to = i + 1 < TL.chapters.length ? Math.round(TL.chapters[i + 1].start * FPS) : TL.frames;
        const cues = TL.cues.slice(c.cueStart, c.cueEnd + 1).map((q) => Math.round(q.start * FPS) - from);
        return { from, duration: to - from, cues };
      }),
    []
  );
  const current = windows.findIndex((w) => frame >= w.from && frame < w.from + w.duration);
  const fadeOut = clamp((TL.frames - frame) / 14);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <FontLoader />
      {windows.map((w, i) => {
        const Scene = SCENES[i];
        return (
          <Sequence key={TL.chapters[i].id} from={w.from} durationInFrames={w.duration} name={TL.chapters[i].title}>
            <Fade>
              <Scene cues={w.cues} duration={w.duration} end={w.from + w.duration} />
            </Fade>
          </Sequence>
        );
      })}
      <SubtitleScrim />
      <Chrome frame={frame} total={TL.frames} index={Math.max(0, current)} count={TL.chapters.length} />
      {captions && <Captions frame={frame} />}
      <Grain />
      <AbsoluteFill style={{ background: '#000', opacity: 1 - fadeOut, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
