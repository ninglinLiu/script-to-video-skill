// 叠加层：跟随 3D 物体的标签、数字面板、按真实词界分行的字幕、进度条、片尾卡。
import {clamp01, ease, win} from './motion.js';

export function createOverlay(s) {
  const {W, H, camera, CUE} = s;
  const g = document.getElementById('ov').getContext('2d');
  const CN = '"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif', MONO = 'Consolas,"Cascadia Mono","DejaVu Sans Mono",monospace';
  const INK = '#1e1e24';
  const fadeIn = (t, a, b, fi = .35, fo = .35) => Math.min(clamp01((t - a) / fi), clamp01((b - t) / fo));
  const proj = p => { const v = p.clone().project(camera); return {x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ok: v.z < 1 && v.z > -1}; };
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const fmt = (n, d = 0) => n.toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});

  // 引线标签：锚点跟随 3D 坐标，文字逐字展开。opt: left, rise, size, color, dot
  function tag(t, p3, title, sub, a0, a1, opt = {}) {
    const al = fadeIn(t, a0, a1); if (al <= 0) return;
    const p = proj(p3); if (!p.ok) return;
    const dir = opt.left ? -1 : 1, rise = opt.rise ?? 46, k = ease.outCubic(clamp01((t - a0) / .45));
    const ex = p.x + dir * 30 * k, ey = p.y - rise * k, hx = ex + dir * 22 * k, size = opt.size || 26;
    g.save(); g.globalAlpha = al; g.strokeStyle = 'rgba(30,30,36,.75)'; g.lineWidth = 2;
    g.beginPath(); g.arc(p.x, p.y, 5, 0, Math.PI * 2); g.fillStyle = opt.dot || INK; g.fill();
    g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(ex, ey); g.lineTo(hx, ey); g.stroke();
    const txt = title.slice(0, Math.ceil(title.length * clamp01((t - a0 - .1) / .35)));
    g.font = `600 ${size}px ${CN}`; const tw = g.measureText(title).width;
    g.font = `400 17px ${MONO}`; const sw = sub ? g.measureText(sub).width : 0;
    const bw = Math.max(tw, sw) + 28, bh = sub ? 66 : Math.max(42, size + 16), bx = dir > 0 ? hx : hx - bw, by = ey - bh / 2;
    g.fillStyle = 'rgba(255,253,248,.88)'; rr(bx, by, bw, bh, 8); g.fill();
    g.strokeStyle = 'rgba(30,30,36,.18)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = opt.color || INK; g.textBaseline = 'middle'; g.font = `600 ${size}px ${CN}`; g.fillText(txt, bx + 14, by + (sub ? 22 : bh / 2));
    if (sub) { g.font = `400 17px ${MONO}`; g.fillStyle = 'rgba(30,30,36,.62)'; g.fillText(sub, bx + 14, by + 48); }
    g.restore();
  }

  // 数字面板：rows = [{big, label, value, color}]。只放会变化的数字和来源。
  function panel(x, y, rows, al, w = 430) {
    if (al <= 0) return;
    g.save(); g.globalAlpha = al;
    const h = 34 + rows.reduce((a, r) => a + (r.big ? 64 : 34), 0);
    g.fillStyle = 'rgba(255,253,248,.86)'; rr(x, y, w, h, 12); g.fill();
    g.strokeStyle = 'rgba(30,30,36,.14)'; g.stroke();
    let yy = y + 22;
    for (const r of rows) {
      g.textBaseline = 'top';
      if (r.big) {
        g.font = `600 17px ${CN}`; g.fillStyle = 'rgba(30,30,36,.6)'; g.fillText(r.label, x + 20, yy);
        g.font = `700 44px ${MONO}`; g.fillStyle = r.color || INK; g.fillText(r.value, x + 20, yy + 18); yy += 64;
      } else {
        g.font = `500 19px ${CN}`; g.fillStyle = 'rgba(30,30,36,.72)'; g.fillText(r.label, x + 20, yy + 4);
        g.font = `700 22px ${MONO}`; g.fillStyle = r.color || INK; g.textAlign = 'right'; g.fillText(r.value, x + w - 20, yy + 2); g.textAlign = 'left'; yy += 34;
      }
    }
    g.restore();
  }

  // 左上角状态条：小标题 + 大字（时钟或当前阶段）
  function chip(t, a0, a1, title, value, w = 470) {
    const al = fadeIn(t, a0, a1, .5, .5); if (al <= 0) return;
    g.save(); g.globalAlpha = al; g.fillStyle = 'rgba(255,253,248,.86)'; rr(48, 44, w, 92, 12); g.fill();
    g.fillStyle = '#e1423a'; rr(64, 62, 10, 10, 5); g.fill();
    g.font = `600 19px ${CN}`; g.fillStyle = 'rgba(30,30,36,.75)'; g.textBaseline = 'middle'; g.fillText(title, 84, 68);
    g.fillStyle = INK; g.font = /^[\d:.,$%+\-\s]+$/.test(value) ? `700 36px ${MONO}` : `700 30px ${CN}`; g.fillText(value, 64, 108);
    g.restore();
  }

  // 字幕分行：按真实词界找到每行起点，与 srt.py 同一规则
  const subs = [], clean = x => x.replace(/[，。、,.!！?？\s]/g, '');
  for (const c of CUE) {
    const wl = c.words.map(w => clean(w.w).length), starts = [];
    let acc = 0, wi = 0, cum = 0;
    for (const line of c.sub) { while (wi < c.words.length && cum < acc) { cum += wl[wi]; wi++; } starts.push(wi < c.words.length ? c.words[wi].t : c.end); acc += clean(line).length; }
    c.sub.forEach((line, i) => subs.push({text: line, a: i === 0 ? c.start : starts[i], b: i === c.sub.length - 1 ? c.end + .15 : starts[i + 1]}));
  }
  function subtitle(t) {
    const it = subs.find(x => t >= x.a && t < x.b); if (!it) return;
    let fs = Math.round(Math.min(H, W * 1.2) * .043); g.save(); g.font = `700 ${fs}px ${CN}`;
    const tw = g.measureText(it.text).width; if (tw > W * .9) { fs = Math.floor(fs * W * .9 / tw); g.font = `700 ${fs}px ${CN}`; }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = 4.5; g.strokeStyle = 'rgba(22,22,28,.78)'; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 14; g.shadowOffsetY = 2;
    g.strokeText(it.text, W / 2, H - H * .089); g.shadowBlur = 0; g.fillStyle = '#fff'; g.fillText(it.text, W / 2, H - H * .089); g.restore();
  }
  function progress(t) {
    g.fillStyle = 'rgba(30,30,36,.12)'; g.fillRect(0, H - 6, W, 6);
    g.fillStyle = '#e1423a'; g.fillRect(0, H - 6, W * t / s.DUR, 6);
  }
  // 片尾卡：标题 + 一句结论 + 来源口径
  function endCard(t, a0, title, line, sources) {
    const al = ease.outCubic(win(t, a0, a0 + .8)); if (al <= 0) return;
    g.save(); g.globalAlpha = al;
    const grd = g.createLinearGradient(0, H * .25, 0, H * .78); grd.addColorStop(0, 'rgba(250,247,240,0)'); grd.addColorStop(.35, 'rgba(250,247,240,.88)'); grd.addColorStop(1, 'rgba(250,247,240,.92)');
    g.fillStyle = grd; g.fillRect(0, H * .25, W, H * .6);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK;
    g.font = `800 72px ${CN}`; g.fillText(title, W / 2, H * .5 - 20 + 16 * (1 - al));
    g.font = `500 32px ${CN}`; g.fillStyle = 'rgba(30,30,36,.7)'; g.fillText(line, W / 2, H * .5 + 50);
    g.font = `400 18px ${CN}`; g.fillStyle = 'rgba(30,30,36,.5)'; g.fillText(sources, W / 2, H * .5 + 108);
    g.restore();
  }
  const clear = () => g.clearRect(0, 0, W, H);
  return {g, CN, MONO, INK, fadeIn, proj, rr, fmt, tag, panel, chip, subtitle, progress, endCard, clear, subs};
}
