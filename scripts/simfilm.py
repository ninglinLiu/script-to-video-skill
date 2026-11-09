"""代码模拟 · 暗金排版（临界点风格）的工程工具。路线说明见 references/sim-typography.md。

python scripts/simfilm.py doctor
python scripts/simfilm.py new --episode ./ep                      # 起手场景
python scripts/simfilm.py new --episode ./ep --source caesar-kelly  # 从凯利样片改
python scripts/simfilm.py sheet ep/qa/s1 ep/qa/review-s1.jpg        # 静帧拼成一张审看图
分镜总览：node render.mjs cards 后用 diorama.py storyboard --timeline qa/cards.json。
"""
from pathlib import Path
import argparse
import json
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'assets/sim-kit'
EXAMPLES = {'caesar-kelly': ROOT / 'examples/caesar-kelly'}
SERIF = ['C:/Windows/Fonts/NotoSerifSC-VF.ttf', 'C:/Windows/Fonts/SourceHanSerifSC-VF.ttf', '/System/Library/Fonts/Supplemental/Songti.ttc',
         '/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc', '/usr/share/fonts/noto-cjk/NotoSerifCJK-Bold.ttc']
MONO = ['C:/Windows/Fonts/CascadiaMono.ttf', 'C:/Windows/Fonts/consolab.ttf', '/System/Library/Fonts/SFNSMono.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf']


def cmd_new(a):
    dest = Path(a.episode)
    if dest.exists() and any(dest.iterdir()):
        raise SystemExit('目标目录非空，不覆盖：' + str(dest))
    shutil.copytree(KIT, dest, dirs_exist_ok=True, ignore=shutil.ignore_patterns('README.md', '__pycache__'))
    if a.source:
        src = EXAMPLES[a.source]
        for rel in ('web/scene.js', 'web/data.json', 'data/build_data.py'):
            shutil.copy2(src / rel, dest / rel)
    print('工程已建立：', dest)
    print('下一步：改 data/build_data.py 并运行 → 改 web/scene.js → node render.mjs stills 3,10,30 --dir s1')


def cmd_doctor(_):
    import os
    find = lambda env, paths: os.environ.get(env) if os.environ.get(env) and Path(os.environ[env]).exists() else next((p for p in paths if Path(p).exists()), None)
    checks = {tool: shutil.which(tool) is not None for tool in ('node', 'ffmpeg', 'ffprobe')}
    checks['font:serif'] = find('SERIF_FONT', SERIF)
    checks['font:mono'] = find('MONO_FONT', MONO)
    if checks['node']:
        probe = subprocess.run(['node', '-e', "for (const n of [process.env.PLAYWRIGHT,'playwright','playwright-core']) { if (!n) continue; try { require(n); console.log('ok'); process.exit(0) } catch {} } process.exit(1)"],
                               capture_output=True, text=True)
        checks['playwright'] = probe.returncode == 0
    missing = [k for k, v in checks.items() if not v]
    print(json.dumps({'checks': checks, 'missing': missing,
                      'note': '字体不在常见位置时设 SERIF_FONT、MONO_FONT；playwright 不在全局时设 PLAYWRIGHT 指向包目录，或在工程里 npm install playwright。'}, ensure_ascii=False, indent=1))
    return 1 if missing else 0


def cmd_sheet(a):
    from PIL import Image, ImageDraw, ImageFont
    files = sorted(Path(a.dir).glob('*.png'))
    if not files:
        raise SystemExit('没有静帧：' + a.dir)
    ims = [Image.open(f).convert('RGB') for f in files]
    w = a.width
    h = round(ims[0].height * w / ims[0].width)
    rows = (len(ims) + a.cols - 1) // a.cols
    canvas = Image.new('RGB', (a.cols * w + (a.cols - 1) * 6, rows * h + (rows - 1) * 6), '#600')
    font_path = next((p for p in ('C:/Windows/Fonts/msyh.ttc', '/System/Library/Fonts/PingFang.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc') if Path(p).exists()), None)
    font = ImageFont.truetype(font_path, 20) if font_path else ImageFont.load_default()
    d = ImageDraw.Draw(canvas)
    for i, (f, im) in enumerate(zip(files, ims)):
        x, y = (i % a.cols) * (w + 6), (i // a.cols) * (h + 6)
        canvas.paste(im.resize((w, h), Image.LANCZOS), (x, y))
        d.text((x + 6, y + 4), f.stem, font=font, fill='#ff0', stroke_width=2, stroke_fill='#000')
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    canvas.save(a.out, quality=90)
    print(a.out, canvas.size)


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    n = sub.add_parser('new')
    n.add_argument('--episode', required=True)
    n.add_argument('--source', choices=sorted(EXAMPLES))
    n.set_defaults(fn=cmd_new)
    sub.add_parser('doctor').set_defaults(fn=cmd_doctor)
    s = sub.add_parser('sheet')
    s.add_argument('dir')
    s.add_argument('out')
    s.add_argument('--width', type=int, default=360)
    s.add_argument('--cols', type=int, default=6)
    s.set_defaults(fn=cmd_sheet)
    a = ap.parse_args()
    sys.exit(a.fn(a) or 0)


if __name__ == '__main__':
    main()
