// Design tokens for the 1080x1920 vertical piece. No randomness, no wall-clock time.
export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const C = {
  bg: '#06070A',
  bg2: '#0B0D12',
  ink: '#04050880',
  paper: '#F4EDDC',
  paperDim: '#B9B2A3',
  dim: '#8C877C',
  faint: '#4A4D54',
  gold: '#C9A227',
  goldLight: '#EBD08A',
  goldDim: '#5E4B1C',
  ember: '#B5543C',
  sage: '#5E8C74',
};

export const F = {
  serif: '"Noto Serif SC", "Songti SC", serif',
  sans: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
};

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeQuint = (t: number) => 1 - Math.pow(1 - t, 5);

/** 0..1 progress of an element that starts at `start` and takes `dur` frames. */
export const prog = (f: number, start: number, dur = 14, ease = easeOut) =>
  ease(clamp((f - start) / dur));

/** Quick fade-out helper: 1 while well inside, 0 after `end`. */
export const hold = (f: number, end: number, dur = 10) => 1 - clamp((f - (end - dur)) / dur);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const sup = (digits: string) =>
  digits
    .split('')
    .map((d) => ({ '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }[d] ?? d))
    .join('');
