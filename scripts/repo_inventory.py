"""Sync architecture and inventory from the staged Git tree; no media decoding or model calls."""
from collections import defaultdict
from pathlib import Path, PurePosixPath
import argparse
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
GENERATED = {'docs/repository-tree.md', 'docs/repository-tree.txt', 'docs/repository-inventory.json'}
FENCE = chr(96) * 3


def git(root, *args, data=None):
    return subprocess.check_output(['git', *args], cwd=root, input=data)


def staged_text(root, name):
    return git(root, 'show', ':' + name).decode('utf-8').replace('\r\n', '\n')


def entries(root):
    rows = []
    for entry in git(root, 'ls-files', '-s', '-z').decode('utf-8').split('\0'):
        if not entry:
            continue
        info, name = entry.split('\t', 1)
        mode, oid, stage = info.split()
        if stage != '0':
            raise ValueError('Resolve merge conflicts before inventory: ' + name)
        if mode not in ('100644', '100755'):
            raise ValueError('Review non-regular tracked path before inventory: ' + name)
        rows.append({'path': name, 'oid': oid})
    ids = sorted({r['oid'] for r in rows if r['path'] not in GENERATED})
    metadata = git(root, 'cat-file', '--batch-check=%(objectname) %(objectsize)',
                   data=('\n'.join(ids) + '\n').encode()).decode().splitlines()
    sizes = {oid: int(size) for oid, size in (line.split() for line in metadata)}
    return rows, sizes


def tree_lines(names, roles=None):
    tree = {}
    for name in names:
        node = tree
        for part in name.rstrip('/').split('/'):
            node = node.setdefault(part, {})
    lines = ['script-to-video-skill/']
    def walk(node, prefix='', parent=''):
        pairs = sorted(node.items(), key=lambda x: (not (x[1] or parent + x[0] + '/' in (roles or {})), x[0]))
        for i, (key, children) in enumerate(pairs):
            last = i == len(pairs) - 1
            path = parent + key
            is_dir = bool(children) or path + '/' in (roles or {})
            label = key + ('/' if is_dir else '')
            role = (roles or {}).get(path + ('/' if is_dir else ''), '')
            lines.append(prefix + ('└── ' if last else '├── ') + label + ('  # ' + role if role else ''))
            if children:
                walk(children, prefix + ('    ' if last else '│   '), path + '/')
    walk(tree)
    return '\n'.join(lines) + '\n'


def replace_block(text, name, content):
    begin, end = '<!-- BEGIN GENERATED: ' + name + ' -->', '<!-- END GENERATED: ' + name + ' -->'
    if text.count(begin) != 1 or text.count(end) != 1:
        raise ValueError('README needs exactly one marker pair: ' + name)
    if text.index(begin) >= text.index(end):
        raise ValueError('README markers out of order: ' + name)
    return re.sub(re.escape(begin) + r'.*?' + re.escape(end),
                  lambda _: begin + '\n' + content.rstrip() + '\n' + end, text, flags=re.S)


def outputs(root):
    source_rows, sizes = entries(root)
    all_paths = {r['path'] for r in source_rows} | GENERATED
    roles = json.loads(staged_text(root, 'docs/architecture-layout.json'))
    for name, role in roles.items():
        clean = name.rstrip('/')
        if not clean or PurePosixPath(clean).is_absolute() or '..' in PurePosixPath(clean).parts or '\\' in clean:
            raise ValueError('Unsafe architecture path: ' + name)
        present = any(p.startswith(name) for p in all_paths) if name.endswith('/') else name in all_paths
        if not present or not isinstance(role, str) or not role.strip():
            raise ValueError('Missing path or empty architecture responsibility: ' + name)
    tops = {p.split('/')[0] + '/' for p in all_paths if '/' in p}
    missing = sorted(tops - roles.keys())
    if missing:
        raise ValueError('New top-level directories need architecture responsibilities first: ' + ', '.join(missing))
    diagram = staged_text(root, 'docs/architecture.mmd').strip()
    if not re.match(r'^(flowchart|graph)\s', diagram) or FENCE in diagram:
        raise ValueError('architecture.mmd must contain native Mermaid source, without Markdown fences')
    readme = staged_text(root, 'README.md')
    readme = replace_block(readme, 'architecture', FENCE + 'mermaid\n' + diagram + '\n' + FENCE)
    readme = replace_block(readme, 'architecture-tree', FENCE + 'text\n' + tree_lines(roles, roles) + FENCE)

    # Compute the generated README blob size now so one generation converges.
    readme_bytes = readme.encode('utf-8')
    readme_oid = git(root, 'hash-object', '--stdin', data=readme_bytes).decode().strip()
    sizes[readme_oid] = len(readme_bytes)
    groups = defaultdict(lambda: {'files': 0, 'bytes': 0})
    hashes = defaultdict(list)
    rows = []
    for row in source_rows:
        name = row['path']
        if name in GENERATED:
            continue
        oid = readme_oid if name == 'README.md' else row['oid']
        n = sizes[oid]
        rows.append({'path': name, 'bytes': n})
        top = name.split('/')[0] if '/' in name else '[root files]'
        groups[top]['files'] += 1
        groups[top]['bytes'] += n
        hashes[oid].append((name, n))
    duplicates = [{'paths': [x[0] for x in files], 'bytes_each': files[0][1],
                   'extra_worktree_bytes': sum(x[1] for x in files[1:])}
                  for files in hashes.values() if len(files) > 1 and files[0][1] > 100000]
    entry = staged_text(root, 'SKILL.md')
    result = {
        'scope': 'Staged Git blobs; excludes three generated inventory outputs, ignored files and Git history. '
                 'Tree includes all tracked paths plus generated outputs. Byte counts use canonical Git blobs, not OS working-copy line endings.',
        'files': len(rows), 'bytes': sum(r['bytes'] for r in rows),
        'entry_chars': len(entry), 'entry_lines': len(entry.splitlines()), 'entry_utf8_bytes': len(entry.encode()),
        'groups': dict(sorted(groups.items(), key=lambda x: (-x[1]['bytes'], x[0]))),
        'duplicates': sorted(duplicates, key=lambda x: (-x['extra_worktree_bytes'], x['paths'])), 'paths': rows}
    table = '\n'.join(f'| {k} | {v["files"]} | {v["bytes"]/1024/1024:.2f} |' for k, v in result['groups'].items())
    duplicate_table = '\n'.join(f'| {len(d["paths"])}份 | {d["bytes_each"]/1024/1024:.2f} | {d["extra_worktree_bytes"]/1024/1024:.2f} | {"<br>".join(d["paths"])} |' for d in result['duplicates'][:8])
    md = f'''# 仓库文件树与体积

从本次Git索引生成，体积按Git对象字节计算，避免Windows/Linux换行差异。体积不计Git历史、忽略文件、缓存和本统计生成的3个文件；完整树仍列出这3个文件。已跟踪依赖也会计入，不静默排除。

**{result['files']}个统计文件，{result['bytes']:,}字节（{result['bytes']/1024**3:.3f} GiB）。** 这不是下载压缩包大小，也不是token数。

| 目录 | 文件数 | MiB |
|---|---:|---:|
{table}

SKILL.md正文及元数据合计：{result['entry_chars']}个Unicode字符、{result['entry_lines']}行、{result['entry_utf8_bytes']}个UTF-8字节。实际token取决于模型分词器。经验命令默认最多3卡、6500字符输出；媒体视觉读取另计。

[全部跟踪文件树](repository-tree.txt) · [机器可读统计](repository-inventory.json) · [目录职责与架构](architecture.md)。做片Agent无需读取这份完整树。

## 相同对象的工作区占用

| 份数 | 每份MiB | 额外工作区MiB | 路径 |
|---|---:|---:|---|
{duplicate_table}

相同Git对象在Git对象库内可以共享，但检出时仍分别占用（实际大小可能受换行转换影响）；不能据此随意删去独立工程所需字体。

复查：按[维护步骤](../CONTRIBUTING.md)暂存本次文件，运行 python scripts/repo_inventory.py，再暂存生成结果并运行 python scripts/repo_inventory.py --check。脚本读取Git对象元数据与小型文档，不解码媒体、不调用模型。
'''
    return {'README.md': readme,
            'docs/repository-inventory.json': json.dumps(result, ensure_ascii=False, indent=2) + '\n',
            'docs/repository-tree.txt': tree_lines(all_paths), 'docs/repository-tree.md': md}


def run(root, check=False):
    # Do not overwrite unstaged edits or certify a different source than the one tested.
    dirty = git(root, 'diff', '--name-only', '-z').decode('utf-8').split('\0')
    blocking = [p for p in dirty if p and (check or p not in GENERATED)]
    if blocking:
        raise ValueError('Stage or preserve tracked edits before ' + ('check' if check else 'generation') + ': ' + ', '.join(blocking))
    result = outputs(root)
    stale = []
    for name, expected in result.items():
        if check:
            try:
                actual = staged_text(root, name)
            except subprocess.CalledProcessError:
                actual = None
            if actual != expected:
                stale.append(name)
        else:
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            with path.open('w', encoding='utf-8', newline='\n') as stream:
                stream.write(expected)
    if stale:
        raise ValueError('Architecture/inventory is stale: ' + ', '.join(stale) + '. Stage changes, generate, then stage outputs; see CONTRIBUTING.md.')
    return list(result)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Check staged outputs without writing files')
    args = parser.parse_args()
    try:
        names = run(ROOT, args.check)
    except (ValueError, subprocess.CalledProcessError, json.JSONDecodeError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    print(('Verified' if args.check else 'Generated; stage before check:') + ' ' + ', '.join(names))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
