"""样片总目录：按明暗、评价和关键词找片，看视频和工程在哪、别人怎么评价、怎么取用。

python scripts/samples.py list --tone light
python scripts/samples.py list --status user-rejected
python scripts/samples.py show binance-1029
python scripts/samples.py measure            # 重新抽帧测明暗（维护时用）
python scripts/samples.py doc                # 重新生成 docs/sample-catalog.md 和 README 里的两张样片表
python scripts/samples.py wall --tone light --out docs/media/light-samples.jpg

唯一数据源是 references/sample-catalog.json。加新片：加一条记录，再跑 measure 和 doc。
评价只记录发生过的事，不替用户下结论；明暗是测量值，不代表好坏。
"""
from pathlib import Path
import argparse
import array
import json
import statistics
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'references/sample-catalog.json'
PAGES = 'https://ninglinliu.github.io/script-to-video-skill/'
STATUS = {
    'user-approved': '用户认可',
    'user-approved-partial': '用户认可（部分）',
    'user-approved-direction': '用户认可方向',
    'mixed-feedback': '方向保留，局部不足',
    'user-critical': '用户提过批评',
    'user-rejected': '用户否决',
    'producer-only': '制作方自查，用户未评价',
    'no-verdict': '没有记录用户对整片的评价',
    'experiment': '实验',
    'component-test': '组件测试',
}
TONES = {'light': '浅色', 'mid': '中间调', 'mixed': '明暗交替', 'dark': '深色'}
LIGHT_L, DARK_L = 62, 30
MIXED_SHARE = .25


def load():
    return json.loads(CATALOG.read_text('utf-8'))


def save(data):
    with CATALOG.open('w', encoding='utf-8', newline='\n') as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=1) + '\n')


def materialize(path, tmp):
    """工作区没有（稀疏检出）时从 Git 对象取。"""
    p = ROOT / path
    if p.is_file():
        return p
    q = Path(tmp) / Path(path).name
    q.write_bytes(subprocess.check_output(['git', 'cat-file', 'blob', 'HEAD:' + path], cwd=ROOT))
    return q


def srgb_to_l(c):
    y = c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4
    return y


def measure_video(path, frames=9):
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)], text=True).strip())
    values = []
    for i in range(frames):
        t = dur * (i + .5) / frames
        raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', str(path), '-frames:v', '1', '-vf', 'scale=64:36', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])
        data = array.array('B', raw)
        ys = [.2126 * srgb_to_l(data[j] / 255) + .7152 * srgb_to_l(data[j + 1] / 255) + .0722 * srgb_to_l(data[j + 2] / 255) for j in range(0, len(data) - 2, 3)]
        y = statistics.mean(ys)
        values.append(116 * y ** (1 / 3) - 16 if y > .008856 else 903.3 * y)
    return round(statistics.median(values), 1), round(sum(v < DARK_L for v in values) / frames, 2), round(sum(v >= LIGHT_L for v in values) / frames, 2)


def tone_of(value, dark_share=0, light_share=0):
    """中位数会把深浅对半的片子算成某一边，两边都占到四分之一就单独标出来。"""
    if dark_share >= MIXED_SHARE and light_share >= MIXED_SHARE:
        return 'mixed'
    return 'light' if value >= LIGHT_L else 'dark' if value < DARK_L else 'mid'


def cmd_measure(_):
    data = load()
    with tempfile.TemporaryDirectory() as tmp:
        for s in data['samples']:
            for m in s['media']:
                m['L'], m['darkShare'], m['lightShare'] = measure_video(materialize(m['video'], tmp))
                m['tone'] = tone_of(m['L'], m['darkShare'], m['lightShare'])
            print(s['id'], [m['L'] for m in s['media']], flush=True)
    save(data)


def matches(s, a):
    if a.status and s['evaluation']['status'] != a.status:
        return False
    if a.tone and not any(m.get('tone') == a.tone for m in s['media']):
        return False
    if a.query and a.query.casefold() not in json.dumps(s, ensure_ascii=False).casefold():
        return False
    return True


def line(s, tone=None):
    media = [m for m in s['media'] if not tone or m.get('tone') == tone]
    ls = '/'.join(str(m.get('L')) for m in media[:4])
    return f"{s['id']} | {s['title']} | {STATUS[s['evaluation']['status']]} | L*={ls}"


def cmd_list(a):
    data = load()
    found = [s for s in data['samples'] if matches(s, a)]
    if a.json:
        print(json.dumps(found, ensure_ascii=False, indent=1))
        return
    if a.tone == 'light':
        print(data['light_style_note'] + '\n')
    for s in found:
        print(line(s, a.tone))
    print(f'\n共 {len(found)} 条。看详情：python scripts/samples.py show <id>')


def cmd_show(a):
    s = next((x for x in load()['samples'] if x['id'] == a.id), None)
    if s is None:
        raise SystemExit('没有这条：' + a.id)
    e = s['evaluation']
    print(f"{s['title']}\n评价：{STATUS[e['status']]}（{e['by']}，{e.get('date', '日期未记录')}）\n  {e['text']}")
    if e.get('scope'):
        print('范围：' + e['scope'])
    for m in s['media']:
        print(f"视频：{m['video']}  {m.get('seconds', '?')}秒 {m.get('width', '?')}×{m.get('height', '?')} {TONES.get(m.get('tone'), '?')} L*={m.get('L')}")
    if s.get('page'):
        print('在线：' + PAGES + s['page'])
    eng = s.get('engineering', {})
    if eng.get('repo'):
        print('工程（仓库内）：' + eng['repo'])
    if eng.get('local'):
        print(('完整工程（含依赖和原片，只在制作者本机）：' if eng.get('repo') else '工程（只在制作者本机）：') + eng['local'])
    if s.get('reflection'):
        print(f"失败或认可记录：python scripts/experience.py reflection {s['reflection']}")
    if s.get('reuse'):
        print('取用：' + s['reuse'])


def watch_link(s, prefix=''):
    if s.get('page'):
        return f"[在线]({PAGES}{s['page']})"
    return f"[视频]({prefix}{s['media'][0]['video']})"


def project_link(s, prefix=''):
    eng = s.get('engineering', {})
    if eng.get('repo'):
        return f"[仓库]({prefix}{eng['repo']})"
    return '只在本机' if eng.get('local') else '—'


def readme_tables(data):
    """README 里那两张表也从目录生成，免得和目录说法不一致。"""
    light = ['| 片子 | 评价 | L\\* | 看片 | 工程 |', '|---|---|---|---|---|']
    for s in data['samples']:
        media = [m for m in s['media'] if m.get('tone') == 'light']
        if media:
            light.append(f"| {s['title']} | {STATUS[s['evaluation']['status']]} | {media[0]['L']} | {watch_link(s)} | {project_link(s)} |")
    failed = ['| 片子 | 评价 | 记录 | 看片 | 工程 | 案例 |', '|---|---|---|---|---|---|']
    for s in data['samples']:
        if s['evaluation']['status'] in ('user-rejected', 'user-critical'):
            failed.append(f"| {s['title']} | {STATUS[s['evaluation']['status']]} | {s['evaluation']['text']} | {watch_link(s)} | {project_link(s)} | {s.get('reflection') or '—'} |")
    return {'light': '\n'.join(light), 'failed': '\n'.join(failed)}


def sync_readme(data):
    path = ROOT / 'README.md'
    text = path.read_text('utf-8')
    for name, table in readme_tables(data).items():
        begin, end = f'<!-- BEGIN SAMPLES: {name} -->', f'<!-- END SAMPLES: {name} -->'
        head, rest = text.split(begin)
        _, tail = rest.split(end)
        text = f'{head}{begin}\n{table}\n{end}{tail}'
    with path.open('w', encoding='utf-8', newline='\n') as f:
        f.write(text)


def cmd_doc(_):
    data = load()
    sync_readme(data)
    rows = []
    for s in data['samples']:
        tones = '、'.join(sorted({TONES[m['tone']] for m in s['media'] if m.get('tone')}, key=list(TONES.values()).index))
        video = s['media'][0]['video']
        link = f"[在线]({PAGES}{s['page']})" if s.get('page') else f'[视频](../{video})'
        eng = s.get('engineering', {})
        where = f"[仓库](../{eng['repo']})" if eng.get('repo') else ('本机：`' + eng['local'] + '`' if eng.get('local') else '—')
        ref = s.get('reflection') or '—'
        rows.append(f"| `{s['id']}` | {s['title']} | {tones} | {STATUS[s['evaluation']['status']]} | {s['evaluation']['text']} | {link} | {where} | {ref} |")
    counts = {}
    for s in data['samples']:
        counts[s['evaluation']['status']] = counts.get(s['evaluation']['status'], 0) + 1
    summary = ' · '.join(f'{STATUS[k]} {v}' for k, v in counts.items())
    md = ('# 样片总目录\n\n由 `python scripts/samples.py doc` 从 [sample-catalog.json](../references/sample-catalog.json) 生成，不要手改。'
          f'共 {len(data["samples"])} 组：{summary}。\n\n{data["light_style_note"]}\n\n'
          f'明暗是对实际视频抽 9 帧测的 L*（中位数 ≥{LIGHT_L} 浅色，<{DARK_L} 深色；深帧和浅帧都占到 {MIXED_SHARE:.0%} 以上算明暗交替），不代表好坏。评价只记录发生过的事；“本机”表示工程只在制作者的电脑上，没有入库。\n\n'
          '![浅色样片](media/light-samples.jpg)\n\n![失败和被批评的样片](media/failed-samples.jpg)\n\n'
          '| ID | 片名 | 明暗 | 评价 | 记录 | 看片 | 工程 | 案例 |\n|---|---|---|---|---|---|---|---|\n' + '\n'.join(rows) + '\n')
    with (ROOT / 'docs/sample-catalog.md').open('w', encoding='utf-8', newline='\n') as f:
        f.write(md)
    print('docs/sample-catalog.md', len(rows))


def cmd_wall(a):
    from PIL import Image, ImageDraw, ImageFont
    import io
    fontfile = next((p for p in ('C:/Windows/Fonts/msyhbd.ttc', '/System/Library/Fonts/PingFang.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc') if Path(p).exists()), None)
    font = lambda n: ImageFont.truetype(fontfile, n) if fontfile else ImageFont.load_default()
    data = load()
    cards = []
    statuses = set(a.status.split(',')) if a.status else None
    for s in data['samples']:
        if statuses and s['evaluation']['status'] not in statuses:
            continue
        chosen = [m for m in s['media'] if not a.tone or m.get('tone') == a.tone]
        for m in chosen[:a.per]:
            cards.append((s, m))
    cols, tw, th, gap, margin, band, head = a.cols, 400, 225, 8, 28, 74, 110
    rows = (len(cards) + cols - 1) // cols
    W, H = margin * 2 + cols * tw + (cols - 1) * gap, margin * 2 + head + rows * (th + band) + max(0, rows - 1) * gap
    canvas = Image.new('RGB', (W, H), '#14161c')
    d = ImageDraw.Draw(canvas)
    d.text((margin, margin - 4), a.title, font=font(52), fill='#ffffff')
    d.text((margin, margin + 62), a.subtitle or f'{len(cards)} 条，取自实际视频', font=font(26), fill='#a8adb8')
    warm = {'user-rejected', 'user-critical'}
    good = {'user-approved', 'user-approved-partial', 'user-approved-direction'}
    with tempfile.TemporaryDirectory() as tmp:
        for i, (s, m) in enumerate(cards):
            x, y = margin + (i % cols) * (tw + gap), margin + head + (i // cols) * (th + band + gap)
            src = materialize(m['video'], tmp)
            dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(src)], text=True).strip())
            raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-ss', f'{dur * .45:.2f}', '-i', str(src), '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', '-'])
            im = Image.open(io.BytesIO(raw)).convert('RGB')
            r = min(tw / im.width, th / im.height)
            fg = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
            canvas.paste(Image.new('RGB', (tw, th), '#000000'), (x, y))
            canvas.paste(fg, (x + (tw - fg.width) // 2, y + (th - fg.height) // 2))
            st = s['evaluation']['status']
            d.text((x + 4, y + th + 4), s['title'][:20], font=font(21), fill='#ffffff')
            d.text((x + 4, y + th + 36), STATUS[st][:16], font=font(19), fill='#f0806e' if st in warm else '#7fd08a' if st in good else '#a8adb8')
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    canvas.save(a.out, quality=84, optimize=True)
    print(a.out, len(cards), Path(a.out).stat().st_size)


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    li = sub.add_parser('list')
    li.add_argument('--tone', choices=sorted(TONES))
    li.add_argument('--status', choices=sorted(STATUS))
    li.add_argument('--query')
    li.add_argument('--json', action='store_true')
    li.set_defaults(fn=cmd_list)
    sh = sub.add_parser('show')
    sh.add_argument('id')
    sh.set_defaults(fn=cmd_show)
    sub.add_parser('measure').set_defaults(fn=cmd_measure)
    sub.add_parser('doc').set_defaults(fn=cmd_doc)
    wa = sub.add_parser('wall')
    wa.add_argument('--tone', choices=sorted(TONES))
    wa.add_argument('--status', help='逗号分隔')
    wa.add_argument('--out', required=True)
    wa.add_argument('--title', default='样片墙')
    wa.add_argument('--subtitle')
    wa.add_argument('--cols', type=int, default=6)
    wa.add_argument('--per', type=int, default=1)
    wa.set_defaults(fn=cmd_wall)
    a = ap.parse_args()
    a.fn(a)


if __name__ == '__main__':
    main()
