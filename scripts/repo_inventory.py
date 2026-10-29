"""Inventory tracked working files using Git, without reading media into a model context."""
from collections import defaultdict
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
GENERATED = {'docs/repository-tree.md', 'docs/repository-tree.txt', 'docs/repository-inventory.json'}


def inventory():
    entries = subprocess.check_output(['git', 'ls-files', '-s', '-z'], cwd=ROOT).decode('utf-8').split('\0')
    rows = []
    groups = defaultdict(lambda: {'files': 0, 'bytes': 0})
    hashes = defaultdict(list)
    for entry in entries:
        if not entry:
            continue
        info, name = entry.split('\t', 1)
        mode, oid, stage = info.split()
        if stage != '0' or name in GENERATED:
            continue
        path = ROOT / name
        if not path.is_file():
            continue
        n = path.stat().st_size
        rows.append({'path': name, 'bytes': n})
        top = name.split('/')[0] if '/' in name else '[root files]'
        groups[top]['files'] += 1
        groups[top]['bytes'] += n
        hashes[oid].append((name, n))
    duplicates = [{'paths': [x[0] for x in files], 'bytes_each': files[0][1], 'extra_worktree_bytes': sum(x[1] for x in files[1:])}
                  for files in hashes.values() if len(files) > 1 and files[0][1] > 100000]
    text = (ROOT / 'SKILL.md').read_text('utf-8')
    result = {'scope': 'Tracked working files; excludes these three generated inventory outputs, ignored files, node_modules and Git history. Duplicate groups use staged Git blob identity, not a new media scan.',
              'base_commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
              'files': len(rows), 'bytes': sum(r['bytes'] for r in rows),
              'entry_chars': len(text), 'entry_lines': len(text.splitlines()), 'entry_utf8_bytes': len(text.encode()),
              'groups': dict(sorted(groups.items(), key=lambda x: -x[1]['bytes'])),
              'duplicates': sorted(duplicates, key=lambda x: -x['extra_worktree_bytes']), 'paths': rows}
    docs = ROOT / 'docs'
    docs.mkdir(exist_ok=True)
    (docs / 'repository-inventory.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    tree = {}
    for row in rows:
        node = tree
        for part in row['path'].split('/'):
            node = node.setdefault(part, {})
    lines = ['script-to-video-skill/']
    def walk(node, prefix=''):
        pairs = sorted(node.items(), key=lambda x: (not bool(x[1]), x[0]))
        for i, (key, children) in enumerate(pairs):
            last = i == len(pairs) - 1
            lines.append(prefix + ('└── ' if last else '├── ') + key + ('/' if children else ''))
            if children:
                walk(children, prefix + ('    ' if last else '│   '))
    walk(tree)
    (docs / 'repository-tree.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    table = '\n'.join(f'| {k} | {v["files"]} | {v["bytes"]/1024/1024:.2f} |' for k, v in result['groups'].items())
    duplicate_table = '\n'.join(f'| {len(d["paths"])}份 | {d["bytes_each"]/1024/1024:.2f} | {d["extra_worktree_bytes"]/1024/1024:.2f} | {"<br>".join(d["paths"])} |' for d in result['duplicates'][:8])
    md = f'''# 仓库文件树与体积

统计基线提交 `{result['base_commit'][:7]}`，包含已加入索引的本轮工作文件。只统计当前跟踪工作文件；不计Git历史、忽略文件、node_modules以及本统计生成的3个文件。重复项以Git暂存对象身份计算，暂存后运行才是最新结果。

**{result['files']}个文件，{result['bytes']:,}字节（{result['bytes']/1024**3:.3f} GiB）。** 这不是下载压缩包大小，也不是token数。

| 目录 | 文件数 | MiB |
|---|---:|---:|
{table}

SKILL.md正文及元数据合计：{result['entry_chars']}个Unicode字符、{result['entry_lines']}行、{result['entry_utf8_bytes']}个UTF-8字节。实际token取决于模型分词器。经验命令默认最多3卡、6500字符输出；媒体视觉读取另计。

[全部跟踪文件树](repository-tree.txt) · [机器可读统计](repository-inventory.json) · [目录职责与架构](architecture.md)。做片Agent无需读取这份完整树。

## 相同对象的工作区占用

| 份数 | 每份MiB | 额外工作区MiB | 路径 |
|---|---:|---:|---|
{duplicate_table}

相同Git对象在Git对象库内可以共享，但工作区仍分别占用；这不等于可以随意删去独立工程所需字体。此轮不移动原素材、不重写历史。

复查：先将要纳入统计的文件加入Git索引，再运行 `python scripts/repo_inventory.py`。该脚本只读Git目录、文件大小及入口文字，不加载全部媒体内容。
'''
    (docs / 'repository-tree.md').write_text(md, encoding='utf-8')
    print(json.dumps({k: result[k] for k in ('files', 'bytes', 'entry_chars', 'entry_lines')}, ensure_ascii=False))


if __name__ == '__main__':
    inventory()
