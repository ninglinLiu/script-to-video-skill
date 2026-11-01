"""3D 微缩路线的工程命令：起工程、查环境、出分镜总览、量动作、查交付。只调 ffmpeg/ffprobe/Pillow，不调模型。"""
from pathlib import Path
import argparse
import json
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'assets/diorama-kit'
EXAMPLES = {'binance-1029': 'examples/binance-1029', 'pareto-diorama': 'examples/pareto-diorama'}


def run(*args):
    return subprocess.run([str(a) for a in args], capture_output=True, text=True, encoding='utf-8', errors='replace')


def probe(video):
    out = run('ffprobe', '-v', 'error', '-count_frames', '-show_entries',
              'format=duration,bit_rate:stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,pix_fmt,sample_rate,channels,duration',
              '-of', 'json', video)
    if out.returncode:
        raise RuntimeError(out.stderr.strip() or 'ffprobe failed')
    return json.loads(out.stdout)


def cmd_new(a):
    dest = Path(a.episode)
    if dest.exists() and any(dest.iterdir()):
        raise SystemExit('目标目录非空，不覆盖：' + str(dest))
    shutil.copytree(KIT, dest, dirs_exist_ok=True)
    (dest / 'source').mkdir(exist_ok=True)
    if a.source:
        src = ROOT / EXAMPLES[a.source]
        for part in ('source', 'audio'):
            if (src / part).exists():
                shutil.copytree(src / part, dest / part, dirs_exist_ok=True)
        shutil.copy2(src / 'web/scene.js', dest / 'web/scene.js')
    else:
        (dest / 'source/script.json').write_text(json.dumps({
            'title': '片名', 'voice': 'zh-CN-YunxiNeural', 'rate': '+12%',
            'lines': [{'id': 'L1', 'text': '第一句旁白。', 'sub': ['第一句旁白'], 'src': '这句话的来源'}]}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('工程已建立：', dest)
    print('下一步：写 source/script.json → python tts.py . → npm install → node render.mjs setup → node render.mjs stills 1,5,9')


def cmd_doctor(a):
    checks = {}
    for tool, flag in (('ffmpeg', '-version'), ('ffprobe', '-version'), ('node', '--version')):
        path = shutil.which(tool)
        checks[tool] = run(tool, flag).stdout.splitlines()[0] if path else None
    for mod in ('edge_tts', 'PIL'):
        checks['python:' + mod] = run(sys.executable, '-c', f'import {mod}; print("ok")').stdout.strip() == 'ok'
    candidates = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
                  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
    checks['chrome'] = next((c for c in candidates if Path(c).exists()), None)
    missing = [k for k, v in checks.items() if not v]
    print(json.dumps({'checks': checks, 'missing': missing, 'note': 'GPU 要跑一次 render.mjs 看它打印的 WebGL 名称；SwiftShader 表示软件渲染。Chrome 不在常见路径时设 CHROME 环境变量。'}, ensure_ascii=False, indent=1))
    return 1 if [m for m in missing if m != 'chrome'] else 0


def load_cues(timeline):
    if not timeline or not Path(timeline).is_file():
        return []
    return json.loads(Path(timeline).read_text(encoding='utf-8'))['cues']


PALETTE = ['#e1423a', '#f08c2e', '#e6b422', '#5aa84f', '#2fa39a', '#3b82c4', '#6a5acd', '#b05cc6', '#d9558f', '#8d6e4f', '#5f6b76', '#1f7a5c']


def cmd_storyboard(a):
    """分镜总览：等间隔取帧排成大图，带时间码；有 timeline 时按旁白句分色，并标出这句话。"""
    from PIL import Image, ImageDraw, ImageFont
    info = probe(a.video)
    dur = float(info['format']['duration'])
    cols, rows = a.cols, a.rows
    n = cols * rows
    tw = a.width
    v = next(s for s in info['streams'] if s['codec_type'] == 'video')
    th = round(tw * v['height'] / v['width'])
    pipe = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(a.video), '-vf', f'fps={n}/{dur:.4f},scale={tw}:{th}', '-frames:v', str(n), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True)
    if pipe.returncode:
        raise SystemExit(pipe.stderr.decode(errors='replace'))
    frames = len(pipe.stdout) // (tw * th * 3)
    cues = load_cues(a.timeline)
    font_path = next((p for p in (a.font, 'C:/Windows/Fonts/msyhbd.ttc', 'C:/Windows/Fonts/msyh.ttc', '/System/Library/Fonts/PingFang.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc') if p and Path(p).exists()), None)
    font = (lambda size: ImageFont.truetype(font_path, size)) if font_path else (lambda size: ImageFont.load_default())
    gap, margin, band, head = 6, 28, 30 if cues else 0, 150 if a.title else 0
    W = margin * 2 + cols * tw + (cols - 1) * gap
    H = margin * 2 + head + rows * (th + band) + (rows - 1) * gap
    canvas = Image.new('RGB', (W, H), '#14161c')
    d = ImageDraw.Draw(canvas)
    if a.title:
        d.text((margin, margin - 4), a.title, font=font(64), fill='#ffffff')
        d.text((margin, margin + 80), a.subtitle or f'{n} 个画面 · 每 {dur / n:.2f} 秒一格 · 共 {dur:.1f} 秒 · 取自实际编码成片', font=font(30), fill='#b8bcc6')
    for i in range(min(frames, n)):
        im = Image.frombytes('RGB', (tw, th), pipe.stdout[i * tw * th * 3:(i + 1) * tw * th * 3])
        x, y = margin + (i % cols) * (tw + gap), margin + head + (i // cols) * (th + band + gap)
        canvas.paste(im, (x, y))
        t = (i + .5) * dur / n
        stamp = f'{int(t // 60):02d}:{t % 60:04.1f}'
        box = d.textbbox((0, 0), stamp, font=font(20))
        d.rectangle((x + 6, y + 6, x + 14 + box[2], y + 12 + box[3]), fill='#000000')
        d.text((x + 10, y + 6), stamp, font=font(20), fill='#ffe45c')
        if cues:
            ci = next((k for k, c in enumerate(cues) if c['start'] - .2 <= t < (cues[k + 1]['start'] - .2 if k + 1 < len(cues) else 1e9)), None)
            col = PALETTE[ci % len(PALETTE)] if ci is not None and t >= cues[0]['start'] - .2 else '#3a3d46'
            d.rectangle((x, y + th, x + tw, y + th + band - 2), fill=col)
            if ci is not None and (i == 0 or i % cols == 0 or ci != next((k for k, c in enumerate(cues) if c['start'] - .2 <= (i - .5) * dur / n < (cues[k + 1]['start'] - .2 if k + 1 < len(cues) else 1e9)), None)):
                text = cues[ci]['text']
                while d.textlength(text, font=font(18)) > tw - 12 and len(text) > 2:
                    text = text[:-2] + '…'
                d.text((x + 6, y + th + 3), text, font=font(18), fill='#ffffff')
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, quality=a.quality, optimize=True)
    print(json.dumps({'out': str(out), 'size': [W, H], 'frames': min(frames, n), 'bytes': out.stat().st_size}, ensure_ascii=False))


def cmd_atlas(a):
    """动作图集：每行一个动作，从起点到终点等间隔取帧，看得出动作过程。spec = [{"label","start","end"}]。"""
    from PIL import Image, ImageDraw, ImageFont
    spec = json.loads(Path(a.spec).read_text(encoding='utf-8'))
    v = next(x for x in probe(a.video)['streams'] if x['codec_type'] == 'video')
    tw, th, cols = a.width, round(a.width * v['height'] / v['width']), a.cols
    font_path = next((p for p in (a.font, 'C:/Windows/Fonts/msyhbd.ttc', '/System/Library/Fonts/PingFang.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc') if p and Path(p).exists()), None)
    font = (lambda size: ImageFont.truetype(font_path, size)) if font_path else (lambda size: ImageFont.load_default())
    gap, margin, label = 6, 24, 54
    W, H = margin * 2 + cols * tw + (cols - 1) * gap, margin * 2 + len(spec) * (th + label + gap)
    canvas = Image.new('RGB', (W, H), '#14161c')
    d = ImageDraw.Draw(canvas)
    for r, row in enumerate(spec):
        y = margin + r * (th + label + gap)
        d.rectangle((margin, y + 6, margin + 10, y + label - 12), fill=PALETTE[r % len(PALETTE)])
        d.text((margin + 22, y + 6), row['label'], font=font(30), fill='#ffffff')
        d.text((W - margin - 220, y + 12), f"{row['start']:.1f}s → {row['end']:.1f}s", font=font(24), fill='#9aa0ac')
        span = row['end'] - row['start']
        out = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(row['start']), '-t', str(span), '-i', str(a.video), '-vf', f'fps={cols}/{span:.4f},scale={tw}:{th}', '-frames:v', str(cols), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
        for i in range(min(cols, len(out) // (tw * th * 3))):
            canvas.paste(Image.frombytes('RGB', (tw, th), out[i * tw * th * 3:(i + 1) * tw * th * 3]), (margin + i * (tw + gap), y + label))
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    canvas.save(a.out, quality=a.quality, optimize=True)
    print(json.dumps({'out': str(a.out), 'size': [W, H], 'rows': len(spec), 'bytes': Path(a.out).stat().st_size}, ensure_ascii=False))


def cmd_gif(a):
    """把若干时间段拼成一张循环 GIF，放 README 用。segments 写成 起-止，可多段。"""
    filt, inputs = [], []
    for i, seg in enumerate(a.segments):
        start, end = (float(x) for x in seg.split('-'))
        inputs += ['-ss', str(start), '-t', str(end - start), '-i', str(a.video)]
        filt.append(f'[{i}:v]fps={a.fps},scale={a.width}:-2:flags=lanczos,setpts=PTS-STARTPTS[v{i}]')
    join = ''.join(f'[v{i}]' for i in range(len(a.segments)))
    graph = ';'.join(filt) + f';{join}concat=n={len(a.segments)}:v=1:a=0,split[x][y];[x]palettegen=max_colors={a.colors}:stats_mode=diff[p];[y][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle'
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    done = subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', graph, '-loop', '0', str(a.out)], capture_output=True, text=True, encoding='utf-8', errors='replace')
    if done.returncode:
        raise SystemExit(done.stderr)
    print(json.dumps({'out': str(a.out), 'bytes': Path(a.out).stat().st_size}, ensure_ascii=False))


def motion_series(video, crop=None, fps=10):
    """主体区逐帧差（0–255），裁掉字幕和数字面板。描述画面在动多少，不判断好不好看。"""
    w, h = 96, 54
    vf = (f'crop={crop},' if crop else '') + f'fps={fps},scale={w}:{h},format=gray'
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(video), '-vf', vf, '-f', 'rawvideo', '-'], capture_output=True).stdout
    n = len(raw) // (w * h)
    frames = [raw[i * w * h:(i + 1) * w * h] for i in range(n)]
    return [sum(abs(a - b) for a, b in zip(frames[i - 1], frames[i])) / (w * h) for i in range(1, n)]


def cmd_motion(a):
    v = next(s for s in probe(a.video)['streams'] if s['codec_type'] == 'video')
    # 默认裁掉上 17%（HUD）与下 17%（字幕）
    crop = a.crop or f"{v['width']}:{round(v['height'] * .66)}:0:{round(v['height'] * .17)}"
    series = motion_series(a.video, crop, a.fps)
    still = a.still
    runs, cur = [], None
    for i, value in enumerate(series):
        if value < still:
            cur = cur if cur is not None else i
        else:
            if cur is not None and (i - cur) / a.fps >= a.min_hold:
                runs.append([round(cur / a.fps, 1), round(i / a.fps, 1)])
            cur = None
    if cur is not None and (len(series) - cur) / a.fps >= a.min_hold:
        runs.append([round(cur / a.fps, 1), round(len(series) / a.fps, 1)])
    ordered = sorted(series)
    report = {'video': str(a.video), 'crop': crop, 'seconds': round(len(series) / a.fps, 1),
              'mean_motion': round(sum(series) / len(series), 3), 'median_motion': round(ordered[len(ordered) // 2], 3),
              'still_ratio': round(sum(1 for x in series if x < still) / len(series), 3), 'holds': runs,
              'scope': '只描述画面变化量。长停留可能是阅读，一直动也不等于解释清楚；不能替代看片。'}
    if a.series:
        report['series'] = [round(x, 3) for x in series]
    text = json.dumps(report, ensure_ascii=False, indent=1)
    if a.output:
        Path(a.output).write_text(text + '\n', encoding='utf-8')
    print(text if not a.series else json.dumps({k: v for k, v in report.items() if k != 'series'}, ensure_ascii=False, indent=1))


def cmd_deliver(a):
    ep = Path(a.episode)
    video = ep / 'out/final.mp4'
    info = probe(video)
    v = next(s for s in info['streams'] if s['codec_type'] == 'video')
    au = [s for s in info['streams'] if s['codec_type'] == 'audio']
    dec = run('ffmpeg', '-v', 'error', '-i', video, '-f', 'null', '-')
    srt = ep / 'out/subtitles.srt'
    tl = load_cues(ep / 'audio/timeline.json')
    script = ep / 'source/script.json'
    unsourced = [x['id'] for x in json.loads(script.read_text(encoding='utf-8'))['lines'] if not x.get('src')] if script.is_file() else ['缺 script.json']
    problems = []
    if dec.returncode or dec.stderr.strip():
        problems.append('解码报错')
    if not au:
        problems.append('没有音轨')
    if not srt.is_file():
        problems.append('缺 SRT（运行 python srt.py .）')
    elif tl and len(re.findall(r'-->', srt.read_text(encoding='utf-8'))) < len(tl):
        problems.append('SRT 条数少于旁白句数')
    if unsourced:
        problems.append('这些句子没写来源：' + ', '.join(unsourced))
    vd, ad = float(v.get('duration', 0)), float(au[0].get('duration', 0)) if au else 0
    if au and abs(vd - ad) > .2:
        problems.append(f'音画时长差 {abs(vd - ad):.2f} 秒')
    report = {'video': f"{v['codec_name']} {v['width']}x{v['height']} {v['r_frame_rate']} {v.get('pix_fmt')}", 'frames': v.get('nb_read_frames'),
              'seconds': round(float(info['format']['duration']), 2), 'mbps': round(int(info['format']['bit_rate']) / 1e6, 2), 'problems': problems,
              'scope': '技术与来源记录检查。技术通过、制作方自查、用户认可是三件事。'}
    print(json.dumps(report, ensure_ascii=False, indent=1))
    return 2 if problems else 0


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest='cmd', required=True)
    n = sub.add_parser('new', help='复制套件，起一个新工程')
    n.add_argument('--episode', required=True)
    n.add_argument('--source', choices=sorted(EXAMPLES), help='从完整案例起步（带稿件、时间线和场景）')
    n.set_defaults(fn=cmd_new)
    sub.add_parser('doctor', help='检查运行依赖').set_defaults(fn=cmd_doctor)
    b = sub.add_parser('storyboard', help='从成片生成分镜总览大图')
    b.add_argument('--video', required=True)
    b.add_argument('--out', required=True)
    b.add_argument('--timeline')
    b.add_argument('--cols', type=int, default=12)
    b.add_argument('--rows', type=int, default=10)
    b.add_argument('--width', type=int, default=320)
    b.add_argument('--quality', type=int, default=82)
    b.add_argument('--title')
    b.add_argument('--subtitle')
    b.add_argument('--font')
    b.set_defaults(fn=cmd_storyboard)
    t = sub.add_parser('atlas', help='动作图集：每行一个动作的连续帧')
    t.add_argument('--video', required=True)
    t.add_argument('--spec', required=True)
    t.add_argument('--out', required=True)
    t.add_argument('--cols', type=int, default=8)
    t.add_argument('--width', type=int, default=400)
    t.add_argument('--quality', type=int, default=82)
    t.add_argument('--font')
    t.set_defaults(fn=cmd_atlas)
    g = sub.add_parser('gif', help='把时间段拼成循环 GIF')
    g.add_argument('--video', required=True)
    g.add_argument('--out', required=True)
    g.add_argument('--fps', type=int, default=12)
    g.add_argument('--width', type=int, default=640)
    g.add_argument('--colors', type=int, default=160)
    g.add_argument('segments', nargs='+', help='如 10.5-12.5 24.7-26.3')
    g.set_defaults(fn=cmd_gif)
    m = sub.add_parser('motion', help='量主体区动作：变化量、近静止占比、长停留')
    m.add_argument('--video', required=True)
    m.add_argument('--crop', help='ffmpeg crop 参数 w:h:x:y；默认裁掉上下各 17%%')
    m.add_argument('--fps', type=int, default=10)
    m.add_argument('--still', type=float, default=.25, help='低于它算近静止')
    m.add_argument('--min-hold', type=float, default=2.0)
    m.add_argument('--series', action='store_true')
    m.add_argument('--output')
    m.set_defaults(fn=cmd_motion)
    d = sub.add_parser('deliver', help='查 out/final.mp4、SRT 和来源')
    d.add_argument('--episode', required=True)
    d.set_defaults(fn=cmd_deliver)
    a = ap.parse_args()
    return a.fn(a) or 0


if __name__ == '__main__':
    raise SystemExit(main())
