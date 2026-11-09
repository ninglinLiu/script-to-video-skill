"""打一个轻量安装包：只含 Skill 入口、路线、工具、组件库和一条基准案例，不含历史媒体。

python scripts/package_skill.py --out dist/script-to-video-core.zip
只收 Git 已跟踪文件。解压成名为 script-to-video 的目录即可使用默认路线；旧路线要用完整仓库。
"""
from pathlib import Path
import argparse
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
INCLUDE = ('SKILL.md', 'LICENSE', 'NOTICE.md', 'AGENTS.md', 'CONTRIBUTING.md', 'README.md',
           'references/', 'scripts/', 'tests/', 'evals/', 'docs/architecture.md', 'docs/architecture.mmd', 'docs/production-flow.mmd', 'docs/architecture-layout.json',
           'docs/sample-catalog.md', 'docs/removals.md',
           'assets/diorama-kit/', 'assets/sim-kit/', 'assets/music/', 'assets/style-lock.json', 'assets/chapter-style-lock.json',
           'examples/binance-1029/', 'examples/pareto-diorama/source/', 'examples/pareto-diorama/audio/', 'examples/pareto-diorama/web/', 'examples/pareto-diorama/README.md',
           'examples/caesar-ai-bubble/', 'examples/caesar-kelly/')
EXCLUDE = ('examples/binance-1029/media/final-1080p.mp4', 'examples/caesar-ai-bubble/media/final-tension-1080x1920.mp4', 'examples/caesar-ai-bubble/media/preview.mp4',
           'examples/caesar-kelly/media/final-1080x1920.mp4', 'examples/caesar-kelly/media/preview.mp4')


def wanted(path):
    return path not in EXCLUDE and any(path == p or (p.endswith('/') and path.startswith(p)) for p in INCLUDE)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out', default='dist/script-to-video-core.zip')
    ap.add_argument('--prefix', default='script-to-video/')
    a = ap.parse_args()
    files = subprocess.check_output(['git', '-c', 'core.quotepath=off', 'ls-files', '-z'], cwd=ROOT).decode('utf-8').split('\0')
    chosen = sorted(f for f in files if f and wanted(f))
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for name in chosen:
            data = subprocess.check_output(['git', 'cat-file', 'blob', ':' + name], cwd=ROOT)
            info = zipfile.ZipInfo(a.prefix + name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, data)
    print(f'{out}  {len(chosen)} 个文件  {out.stat().st_size / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
