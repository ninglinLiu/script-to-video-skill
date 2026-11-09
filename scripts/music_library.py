"""配乐曲目目录：查看、下载并校验、输出署名。音频不入库；只用标准库，不播放声音。

python scripts/music_library.py list
python scripts/music_library.py fetch crypto-kevin-macleod --out ./audio/music
python scripts/music_library.py credit crypto-kevin-macleod
"""
from pathlib import Path
import argparse
import hashlib
import json
import sys
import urllib.parse
import urllib.request

CATALOG = Path(__file__).resolve().parents[1] / 'assets/music/catalog.json'
MODIFIED = 'Music trimmed, loudness-normalized, faded and ducked beneath narration and sound effects.'
MODIFIED_ONLY = 'Music trimmed, loudness-normalized and faded.'


def tracks():
    return json.loads(CATALOG.read_text('utf-8'))['tracks']


def track(track_id):
    item = next((t for t in tracks() if t['id'] == track_id), None)
    if item is None:
        raise SystemExit('未知曲目：' + track_id + '。可用：' + ', '.join(t['id'] for t in tracks()))
    return item


def sha256(path):
    with Path(path).open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def credit_text(item, music_only=False):
    """发布时放进简介或片尾。CC BY 要求署名并说明改动；纯音乐片没有避让。"""
    return item['credit'] + '\n' + (MODIFIED_ONLY if music_only else MODIFIED)


def cmd_list(_):
    for t in tracks():
        print(f"{t['id']} | {t['mood']} | {t['title']} · {t['artist']} | {t['license']} | {t['user_status']}\n  适合：{t['use_for']}\n  状态：{t['user_scope']}")


def cmd_fetch(a):
    item = track(a.id)
    dest = Path(a.out) / urllib.parse.unquote(item['download'].rsplit('/', 1)[-1])
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and sha256(dest) == item['sha256']:
        print('已存在且哈希一致：', dest)
        return
    part = dest.with_suffix(dest.suffix + '.part')
    request = urllib.request.Request(item['download'], headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=120) as r, part.open('wb') as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
    if sha256(part) != item['sha256']:
        part.unlink()
        raise SystemExit('下载文件的哈希和目录不符，已丢弃。作者可能更新了文件：先核对授权和听感，再改目录。')
    part.replace(dest)
    print('已下载并校验：', dest)


def cmd_credit(a):
    print(credit_text(track(a.id), a.music_only))


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('list').set_defaults(fn=cmd_list)
    f = sub.add_parser('fetch')
    f.add_argument('id')
    f.add_argument('--out', default='audio/music')
    f.set_defaults(fn=cmd_fetch)
    c = sub.add_parser('credit')
    c.add_argument('id')
    c.add_argument('--music-only', action='store_true', help='纯音乐片（没有旁白避让）的署名')
    c.set_defaults(fn=cmd_credit)
    a = ap.parse_args()
    a.fn(a)


if __name__ == '__main__':
    main()
