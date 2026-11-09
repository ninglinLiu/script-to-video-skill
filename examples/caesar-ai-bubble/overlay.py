"""竖屏叠加层：顶部标识、每段的大数字、按真实词界分行的字幕、进度条、片尾卡。
数字由画面驱动：天平上每落一枚币 = 10 亿美元。

python overlay.py <工程根>   → out/video-silent.mp4（叠好字的无声画面）
"""
import json, re, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(sys.argv[1]); FR = ROOT / 'out' / 'frames'
W, H, FPS = 1080, 1920, 30
TL = json.loads((ROOT / 'audio' / 'timeline.json').read_text(encoding='utf-8'))
C = {c['id']: c for c in TL['cues']}; DUR = TL['seconds']; N = int(round(DUR * FPS))
clamp = lambda x: max(0., min(1., x)); win = lambda t, a, b: clamp((t - a) / (b - a))
oc = lambda x: 1 - (1 - x) ** 3
def ob(x, s=1.70158): return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2
CNB = lambda n: ImageFont.truetype('C:/Windows/Fonts/msyhbd.ttc', n)
CN = lambda n: ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', n)
NUM = lambda n: ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', n)
WHITE, MUTE, GOLD, RED, ORANGE, GREEN = (255, 255, 255), (196, 198, 208), (240, 196, 92), (240, 74, 60), (255, 143, 58), (140, 210, 90)

def word_t(cid, s):
    for w in C[cid]['words']:
        if s in w['w']: return w['t']
    return C[cid]['start']

# 字幕：与 srt.py 同一规则
subs, clean = [], (lambda x: re.sub(r'[，。、,.!！?？\s]', '', x))
for c in TL['cues']:
    wl = [len(clean(w['w'])) for w in c['words']]; starts = []; acc = wi = cum = 0
    for line in c['sub']:
        while wi < len(c['words']) and cum < acc: cum += wl[wi]; wi += 1
        starts.append(c['words'][wi]['t'] if wi < len(c['words']) else c['end']); acc += len(clean(line))
    for i, line in enumerate(c['sub']):
        subs.append((c['start'] if i == 0 else starts[i], c['end'] + .15 if i == len(c['sub']) - 1 else starts[i + 1], line))

# 与场景相同的落币时刻（caesar.py 的 coin_plan）
def stag(i, n, a, span): return a + (0 if n <= 1 else span * i / (n - 1))
T_IN, T_OUT = word_t('L5', '收入'), word_t('L5', '花')
coin_in = [stag(i, 13, T_IN, 1.1) + .2 for i in range(13)]
coin_out = [stag(i, 34, T_OUT, 1.6) + .2 for i in range(34)]

def text(d, xy, s, f, fill, anchor='mm', alpha=1., stroke=0):
    d.text(xy, s, font=f, fill=(*fill, int(255 * alpha)), anchor=anchor, stroke_width=stroke, stroke_fill=(10, 10, 14, int(200 * alpha)))

def fade(t, a, b, fi=.3, fo=.3): return min(clamp((t - a) / fi), clamp((b - t) / fo))

def beats(d, t):
    Y = 430
    # L1–L2：雅虎
    a = fade(t, C['L1']['start'], C['L2']['start'] + .1)
    if a: text(d, (W / 2, Y), '2000', NUM(150), WHITE, alpha=a); text(d, (W / 2, Y + 110), '互联网泡沫的锚：雅虎', CNB(44), MUTE, alpha=a)
    a = fade(t, C['L2']['start'], C['L3']['start'])
    if a:
        k = oc(win(t, word_t('L2', '倒'), word_t('L2', '78') + .2))
        text(d, (W / 2, Y - 40), '纳斯达克  5048 → 1100', CNB(42), MUTE, alpha=a)
        text(d, (W / 2, Y + 70), f'−{round(78 * k)}%', NUM(170), RED, alpha=a)
    # L3：OpenAI
    a = fade(t, C['L3']['start'], C['L4']['start'])
    if a: text(d, (W / 2, Y), '2026', NUM(150), WHITE, alpha=a); text(d, (W / 2, Y + 110), 'AI泡沫的锚：OpenAI', CNB(44), MUTE, alpha=a)
    # L4：押注的公司 + 融资
    a = fade(t, C['L4']['start'], C['L5']['start'])
    if a:
        names = [('微软', (110, 160, 255)), ('英伟达', GREEN), ('亚马逊', ORANGE), ('甲骨文', RED)]
        xs = [W / 2 - 330, W / 2 - 110, W / 2 + 110, W / 2 + 330]
        for (n, col), x in zip(names, xs):
            k = ob(win(t, word_t('L4', n[:2]), word_t('L4', n[:2]) + .35))
            if k > 0: text(d, (x, Y - 60 + 20 * (1 - k)), n, CNB(52), col, alpha=a * clamp(k))
        k = oc(win(t, word_t('L4', '几千'), word_t('L4', '几千') + .8))
        if k > 0:
            text(d, (W / 2, Y + 60), f'融资 {round(1220 * k)} 亿美元', CNB(56), WHITE, alpha=a * k)
            text(d, (W / 2, Y + 135), '估值 8520 亿 · 2026 年 3 月', CN(34), MUTE, alpha=a * k)
    # L5：收入 vs 支出，由落币数驱动
    a = fade(t, C['L5']['start'], C['L6']['start'] + .1)
    if a:
        nin = sum(1 for x in coin_in if t >= x); nout = sum(1 for x in coin_out if t >= x)
        if t >= T_IN - .1: text(d, (W / 2 - 220, Y - 40), '收入', CNB(40), MUTE, alpha=a); text(d, (W / 2 - 220, Y + 50), f'{nin * 10}亿', CNB(92), GOLD, alpha=a)
        if t >= T_OUT - .1: text(d, (W / 2 + 220, Y - 40), '支出', CNB(40), MUTE, alpha=a); text(d, (W / 2 + 220, Y + 50), f'{nout * 10}亿', CNB(92), RED, alpha=a)
        text(d, (W / 2, Y + 150), '单位：美元 · 2025 年', CN(30), MUTE, alpha=a * .8)
    # L6：1 : 2.6
    a = fade(t, C['L6']['start'], C['L7']['start'])
    if a:
        k = ob(win(t, C['L6']['start'], C['L6']['start'] + .45))
        text(d, (W / 2, Y + 10 * (1 - k)), '1 : 2.6', NUM(int(150 + 30 * clamp(k))), WHITE, alpha=a)
        text(d, (W / 2, Y + 120), '每赚 1 块，花掉 2.6 块', CNB(44), MUTE, alpha=a)
    # L7：付费率
    a = fade(t, C['L7']['start'], C['L8']['start'])
    if a:
        k = oc(win(t, word_t('L7', '付费'), word_t('L7', '付费') + .6))
        text(d, (W / 2, Y - 50), '月活超 10 亿', CNB(44), MUTE, alpha=a)
        if k > 0: text(d, (W / 2, Y + 70), f'付费 ≈ {max(1, round(5 * k))}%', CNB(110), ORANGE, alpha=a * k)
    # L8：循环融资
    a = fade(t, C['L8']['start'], C['L9']['start'])
    if a:
        text(d, (W / 2, Y - 70), '循环融资', CNB(64), WHITE, alpha=a)
        k1 = oc(win(t, word_t('L8', '投资'), word_t('L8', '投资') + .4)); k2 = oc(win(t, word_t('L8', '再买'), word_t('L8', '再买') + .4))
        if k1: text(d, (W / 2, Y + 30), '英伟达  ── 投资 ─→  CoreWeave', CNB(40), GREEN, alpha=a * k1)
        if k2: text(d, (W / 2, Y + 100), '英伟达  ←─ 买芯片 ──  CoreWeave', CNB(40), (120, 160, 255), alpha=a * k2)
    a = fade(t, C['L9']['start'], C['L9']['start'] + 1.9)
    if a: text(d, (W / 2, Y), 'AI 是真的', CNB(90), WHITE, alpha=a)

SRC = [('L1', 'L4', '观点与历史数据：凯撒的复利实验室'), ('L4', 'L5', '融资：Bloomberg 等，2026.3.31'), ('L5', 'L7', '2025 审计文件，FT 核实；总支出约 340 亿美元'),
       ('L7', 'L8', '月活：Reuters / Sensor Tower；付费约 5000 万：OpenAI'), ('L8', 'L9', '观点：凯撒的复利实验室')]

def overlay(t):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    end = C['L9']['start'] + 2.0
    # 上下压暗，保证字可读
    grad = Image.new('L', (1, H))
    for y in range(H): grad.putpixel((0, y), int(150 * max(clamp(1 - y / 620), clamp((y - 1300) / 620))))
    im.paste((0, 0, 0, 255), (0, 0, W, H), grad.resize((W, H)))
    d = ImageDraw.Draw(im)
    a = fade(t, .2, end + .2)
    if a:
        d.ellipse((64, 112, 80, 128), fill=(225, 66, 58, int(255 * a)))
        text(d, (94, 120), '凯撒的复利实验室 · 宏观周期系列', CN(30), MUTE, anchor='lm', alpha=a)
        text(d, (64, 186), 'AI不是泡沫，OpenAI才是', CNB(54), WHITE, anchor='lm', alpha=a)
    beats(d, t)
    s = next((x for x in subs if x[0] <= t < x[1]), None)
    if s and t < end + .3:
        f = CNB(58)
        while d.textlength(s[2], font=f) > W - 120: f = CNB(f.size - 2)
        text(d, (W / 2, 1560), s[2], f, WHITE, stroke=5)
    src = next((x[2] for x in SRC if C[x[0]]['start'] <= t < C[x[1]]['start']), None)
    if src: text(d, (W / 2, 1680), src, CN(26), MUTE, alpha=.85)
    # 片尾卡
    k = oc(win(t, end, end + .7))
    if k:
        card = Image.new('RGBA', (W, H), (8, 8, 12, int(170 * k))); im = Image.alpha_composite(im, card); d = ImageDraw.Draw(im)
        text(d, (W / 2, 760 + 30 * (1 - k)), 'AI 不是泡沫', CNB(110), WHITE, alpha=k)
        text(d, (W / 2, 900 + 30 * (1 - k)), 'OpenAI 才是', CNB(110), ORANGE, alpha=k)
        text(d, (W / 2, 1040), '泡沫还没破，但账本已经在说话', CNB(44), MUTE, alpha=k)
        text(d, (W / 2, 1180), '凯撒的复利实验室', CNB(40), WHITE, alpha=k)
        text(d, (W / 2, 1600), '数据：2025 审计文件（FT 核实）· Bloomberg · Reuters · OpenAI', CN(26), MUTE, alpha=k * .85)
        text(d, (W / 2, 1645), '观点改编自凯撒文章 · 不构成投资建议', CN(26), MUTE, alpha=k * .85)
    d.rectangle((0, H - 8, W, H), fill=(255, 255, 255, 40)); d.rectangle((0, H - 8, int(W * t / DUR), H), fill=(225, 66, 58, 255))
    return im

def frames_mode(a, b):
    """逐帧写 out/comp/####.jpg，已存在的跳过；断线后重跑接着做。"""
    out = ROOT / 'out' / 'comp'; out.mkdir(exist_ok=True)
    for f in range(a, b + 1):
        dst = out / f'{f:04d}.jpg'
        if dst.exists(): continue
        base = Image.open(FR / f'{f:04d}.png').convert('RGB').point(lambda v: int(6 + v * 249 / 255)).convert('RGBA')
        Image.alpha_composite(base, overlay((f - 1) / FPS)).convert('RGB').save(str(dst) + '.tmp.jpg', 'JPEG', quality=96, subsampling=0)
        Path(str(dst) + '.tmp.jpg').replace(dst)

if __name__ == '__main__' and len(sys.argv) > 2 and sys.argv[2] == 'frames':
    a, b = (int(x) for x in sys.argv[3].split(','))
    frames_mode(a, b); print('frames', a, b)
elif __name__ == '__main__':
    ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(ROOT / 'out' / 'video-silent.mp4')], stdin=subprocess.PIPE)
    only = [int(x) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else None
    for f in (only or range(1, N + 1)):
        base = Image.open(FR / f'{f:04d}.png').convert('RGB').point(lambda v: int(6 + v * 249 / 255)).convert('RGBA')
        out = Image.alpha_composite(base, overlay((f - 1) / FPS)).convert('RGB')
        if only: out.save(ROOT / 'out' / f'ov_{f:04d}.jpg', quality=88)
        else: ff.stdin.write(out.tobytes())
    ff.stdin.close(); ff.wait()
    print('done')
