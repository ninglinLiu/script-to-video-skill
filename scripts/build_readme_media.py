"""生成 README 的图：分镜总览、动作图集、GIF、组件目录、同文对照、历史墙、动作量小倍图。

python scripts/build_readme_media.py --binance <1080p成片> --pareto <成片> --catalog-stills <目录> --pick all
只读成片和 Git 对象，不渲染、不调模型。第三方参考片一律不进这些图。
"""
from pathlib import Path
import argparse
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/media'
sys.path.insert(0, str(ROOT / 'scripts'))
import diorama  # noqa: E402

BG, INK, MUTED, RULE = '#14161c', '#ffffff', '#a8adb8', '#2c2f38'
FONTS = ['C:/Windows/Fonts/msyhbd.ttc', '/System/Library/Fonts/PingFang.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc']


def font(size):
    from PIL import ImageFont
    path = next((p for p in FONTS if Path(p).exists()), None)
    return ImageFont.truetype(path, size) if path else ImageFont.load_default()


def fit(im, w, h):
    from PIL import Image
    r = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def frame(video, t, w=None):
    """取一帧为 PIL 图。"""
    from PIL import Image
    import io
    vf = ['-vf', f'scale={w}:-2'] if w else []
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', str(video), *vf, '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', '-'], capture_output=True).stdout
    return Image.open(io.BytesIO(raw)).convert('RGB')


def story(video, timeline, title, subtitle, out, cols=12, rows=10, width=320):
    a = argparse.Namespace(video=video, timeline=timeline, cols=cols, rows=rows, width=width, quality=86, title=title, subtitle=subtitle, font=None, out=str(OUT / out))
    diorama.cmd_storyboard(a)


def atlas(video, spec, out, cols=8, width=400):
    path = OUT / (out + '.spec.json')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(spec, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    a = argparse.Namespace(video=video, spec=str(path), cols=cols, width=width, quality=84, font=None, out=str(OUT / (out + '.jpg')))
    diorama.cmd_atlas(a)
    path.unlink()


def gif(video, out, segments, width=640, fps=12, colors=160):
    diorama.cmd_gif(argparse.Namespace(video=video, out=str(OUT / out), segments=segments, width=width, fps=fps, colors=colors))


def binance(video):
    tl = str(ROOT / 'examples/binance-1029/audio/timeline.json')
    story(video, tl, '币安被盗的那一小时 · 分镜总览', '用户认可的初版基准 · 120 个画面 · 每 0.5 秒一格 · 颜色对应旁白句 · 取自实际编码成片', 'storyboard-binance.jpg')
    atlas(video, [
        {'label': '① 金库被转空：十条链依次点亮，资金涌向攻击者', 'start': 8.2, 'end': 12.4},
        {'label': '② 冰冻：冰块从底部长出，高度等于被冻结的比例', 'start': 13.0, 'end': 15.2},
        {'label': '③ 砸盘拉升：USDT 抛物线飞进漏斗，价格柱升高', 'start': 19.5, 'end': 24.0},
        {'label': '④ 闸门：先蓄力，砸下回弹，交易所的 ETH 被挡住', 'start': 24.5, 'end': 27.5},
        {'label': '⑤ 预言机光束：信息跨过闸门，实物过不去', 'start': 30.0, 'end': 32.4},
        {'label': '⑥ 搬砖小人：接币、起跳、卖出、换回、存入', 'start': 35.1, 'end': 37.4},
        {'label': '⑦ 窗口：按旧价出货的窗口发光，ETH 流向 DEX', 'start': 49.4, 'end': 52.4},
        {'label': '⑧ 窗口关闭：价差抹平，卷帘落下，镜头拉到全景', 'start': 54.4, 'end': 58.2},
    ], 'atlas-binance')
    gif(video, 'hero-binance.gif', ['10.4-12.3', '13.5-15', '24.6-26.2', '35.2-37.2', '50.4-51.6', '55.6-57.6'], width=720, fps=10, colors=128)
    gif(video, 'gif-flow.gif', ['9.6-12.2'], width=480, fps=15, colors=128)
    gif(video, 'gif-freeze.gif', ['13.1-15.3'], width=480, fps=15, colors=128)
    gif(video, 'gif-gate.gif', ['24.5-26.7'], width=480, fps=15, colors=128)
    gif(video, 'gif-mascot.gif', ['35.1-37.4'], width=480, fps=15, colors=128)


def pareto(video):
    tl = str(ROOT / 'examples/pareto-diorama/audio/timeline.json')
    story(video, tl, '二八法则 · 同文重做 · 分镜总览', '第二内容验证：只用组件库搭建 · 120 个画面 · 制作方自查，尚未经用户观看', 'storyboard-pareto.jpg')
    gif(video, 'gif-pareto-dial.gif', ['27.3-30.2', '32.4-34.4'], width=480, fps=15, colors=128)
    gif(video, 'gif-pareto-land.gif', ['6.6-10.6'], width=480, fps=12, colors=128)


def catalog(stills):
    from PIL import Image, ImageDraw
    names = [('管道网络', 'createPipes'), ('液面罐 + 钱币堆', 'createTank / createStack'), ('冰冻', 'createFreeze'), ('数值柱 + 飞行交接', 'createGauge / createFlights'),
             ('闸门', 'createGate'), ('光束', 'createBeam'), ('往返搬运', 'createShuttle'), ('人群 + 立牌 + 跳跃', 'createCrowd / createBoard / hopPath')]
    files = sorted(Path(stills).glob('cat_t*.png'))
    if len(files) < len(names):
        raise SystemExit('catalog stills 不足')
    tw, th, gap, margin, band, head = 640, 360, 8, 28, 46, 110
    W, H = margin * 2 + 4 * tw + 3 * gap, margin * 2 + head + 2 * (th + band) + gap
    c = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(c)
    d.text((margin, margin - 4), '组件库：每个组件都带动作', font=font(52), fill=INK)
    d.text((margin, margin + 62), '由 assets/diorama-kit/web/catalog.js 实际渲染，脱离币安内容独立运行', font=font(26), fill=MUTED)
    for i, (n, fn) in enumerate(names):
        x, y = margin + (i % 4) * (tw + gap), margin + head + (i // 4) * (th + band + gap)
        c.paste(fit(Image.open(files[i]).convert('RGB'), tw, th), (x, y))
        d.text((x + 6, y + th + 4), n, font=font(24), fill=INK)
        w = d.textlength(fn, font=font(18))
        d.text((x + tw - w - 6, y + th + 12), fn, font=font(18), fill=MUTED)
    c.save(OUT / 'components.jpg', quality=86, optimize=True)


def blob(path):
    import io
    from PIL import Image
    return Image.open(io.BytesIO(subprocess.check_output(['git', 'cat-file', 'blob', 'HEAD:' + path], cwd=ROOT))).convert('RGB')


def same_text(new_video, before, after):
    """同一篇稿件三个版本、相同论证节点。"""
    from PIL import Image, ImageDraw
    beats = [('一个说法', 2.5, 3, 3.5), ('举例', 11, 12, 9.5), ('α≈1.16', 21, 26, 25.5), ('换指数', 31, 34, 30), ('继续成立？', 45, 52, 53)]
    rows = [('R03 初版（用户否决）', '没字幕、节奏差、画风阴郁', before, 1), ('同文修订版（制作方自查）', '补字幕和节奏，主体多数时间不动', after, 2), ('3D 微缩重做（制作方自查，未经用户观看）', '只用组件库搭建', new_video, 3)]
    tw, th, gap, margin, label, head = 480, 270, 6, 24, 56, 54
    W, H = margin * 2 + 180 + 5 * tw + 5 * gap, margin * 2 + head + 3 * (th + label) + 2 * gap
    c = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(c)
    for j, b in enumerate(beats):
        d.text((margin + 180 + gap + j * (tw + gap) + 6, margin + 4), b[0], font=font(28), fill=INK)
    for r, (name, note, video, col) in enumerate(rows):
        y = margin + head + r * (th + label + gap)
        d.text((margin, y + 6), name, font=font(28), fill=INK)
        d.text((margin + d.textlength(name, font=font(28)) + 18, y + 12), note, font=font(20), fill=MUTED)
        for j, b in enumerate(beats):
            im = frame(video, b[col], 960)
            c.paste(fit(im, tw, th) if im.height <= im.width else _letter(im, tw, th), (margin + 180 + gap + j * (tw + gap), y + label))
    c.save(OUT / 'same-text-pareto.jpg', quality=84, optimize=True)


def _letter(im, w, h):
    from PIL import Image
    r = h / im.height
    fg = im.resize((round(im.width * r), h), Image.LANCZOS)
    bg = Image.new('RGB', (w, h), '#000000')
    bg.paste(fg, ((w - fg.width) // 2, 0))
    return bg


def history():
    """历史墙：过去每条片子的真实封面和当时记录的状态。"""
    from PIL import Image, ImageDraw
    items = json.loads(subprocess.check_output(['git', 'show', 'HEAD:examples/gallery/history.json'], cwd=ROOT).decode('utf-8'))
    files = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', 'HEAD', 'examples/gallery/media/'], cwd=ROOT).decode('utf-8').splitlines()
    cards = []
    for it in items:
        hit = next((f for f in sorted(files) if f.endswith('.jpg') and Path(f).name.startswith(it['id'] + '-')), None)
        if hit:
            cards.append((it['title'], it['status'], hit))
    cols, tw, th, gap, margin, band, head = 6, 400, 225, 8, 28, 74, 110
    rows = (len(cards) + cols - 1) // cols
    W, H = margin * 2 + cols * tw + (cols - 1) * gap, margin * 2 + head + rows * (th + band) + (rows - 1) * gap
    c = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(c)
    d.text((margin, margin - 4), '走到币安样片之前', font=font(52), fill=INK)
    d.text((margin, margin + 62), f'{len(cards)} 组历史制作的真实封面，文字是当时记录的状态 · 全部保留，作为经验来源', font=font(26), fill=MUTED)
    for i, (title, status, path) in enumerate(cards):
        x, y = margin + (i % cols) * (tw + gap), margin + head + (i // cols) * (th + band + gap)
        im = blob(path)
        c.paste(fit(im, tw, th) if im.width >= im.height else _letter(im, tw, th), (x, y))
        d.text((x + 4, y + th + 4), title[:20], font=font(21), fill=INK)
        d.text((x + 4, y + th + 36), status[:22], font=font(19), fill='#f0806e' if '否决' in status or '不满意' in status else MUTED)
    c.save(OUT / 'history-wall.jpg', quality=84, optimize=True)


def motion_chart(series):
    """小倍图：同一 y 轴。每片一格，标题直接写片名和状态，不靠颜色区分。"""
    from PIL import Image, ImageDraw
    films = json.loads(Path(series).read_text(encoding='utf-8'))
    w, ph, margin, gap, head, left = 1800, 150, 36, 30, 120, 84
    S = 2
    H = margin * 2 + head + len(films) * (ph + gap + 50)
    c = Image.new('RGB', ((w + margin * 2) * S, H * S), '#fbfaf7')
    d = ImageDraw.Draw(c)
    ink, muted, rule, mark, mark2 = '#20222a', '#6b6f7a', '#e4e1da', '#c2410c', '#6b7280'
    d.text((margin * S, (margin - 6) * S), '画面在动多少：主体区逐帧变化量', font=font(44 * S), fill=ink)
    d.text((margin * S, (margin + 54) * S), '同一 y 轴，已裁掉字幕和面板。只描述变化量，不判断好坏：镜头推拉也算动作，所以它抓得住静止，抓不住"贴纸加推镜头"。', font=font(22 * S), fill=muted)
    cap = 14.0
    tmax = max(len(f['series']) / 10 for f in films)
    plot_w = w - left
    for i, f in enumerate(films):
        y0 = margin + head + i * (ph + gap + 50)
        d.text((margin * S, y0 * S), f['title'], font=font(26 * S), fill=ink)
        tt = f"均值 {f['mean']:.2f}  中位 {f['median']:.2f}  近静止 {f['still'] * 100:.0f}%"
        d.text(((margin + w - d.textlength(tt, font=font(20 * S)) / S) * S, (y0 + 6) * S), tt, font=font(20 * S), fill=muted)
        top, base = y0 + 42, y0 + 42 + ph
        for v in (0, 7, 14):
            yy = base - v / cap * ph
            d.line([((margin + left) * S, yy * S), ((margin + w) * S, yy * S)], fill=rule, width=S)
            d.text(((margin + 40) * S, (yy - 12) * S), str(v), font=font(18 * S), fill=muted)
        pts = [(margin + left + k / 10 / tmax * plot_w, base - min(v, cap) / cap * ph) for k, v in enumerate(f['series'])]
        col = mark if f.get('approved') else mark2
        d.polygon([((margin + left) * S, base * S)] + [(x * S, y * S) for x, y in pts] + [(pts[-1][0] * S, base * S)], fill=('#f6d9c8' if f.get('approved') else '#dfe1e5'))
        d.line([(x * S, y * S) for x, y in pts], fill=col, width=2 * S, joint='curve')
    for sec in range(0, int(tmax) + 1, 15):
        x = margin + left + sec / tmax * plot_w
        d.text((x * S, (H - margin + 2) * S), f'{sec}s', font=font(18 * S), fill=muted)
    c = c.resize((w + margin * 2, H), Image.LANCZOS)
    c.save(OUT / 'motion-compare.png', optimize=True)


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--binance'); ap.add_argument('--pareto'); ap.add_argument('--catalog-stills')
    ap.add_argument('--before'); ap.add_argument('--after'); ap.add_argument('--motion-series')
    ap.add_argument('--pick', default='all')
    a = ap.parse_args()
    pick = set(a.pick.split(','))
    want = lambda k: 'all' in pick or k in pick
    OUT.mkdir(parents=True, exist_ok=True)
    if want('binance') and a.binance: binance(a.binance)
    if want('pareto') and a.pareto: pareto(a.pareto)
    if want('catalog') and a.catalog_stills: catalog(a.catalog_stills)
    if want('history'): history()
    if want('same') and a.pareto and a.before: same_text(a.pareto, a.before, a.after)
    if want('motion') and a.motion_series: motion_chart(a.motion_series)


if __name__ == '__main__':
    main()
