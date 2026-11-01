"""3D 微缩路线的确定性回归：工具行为、组件引用、动效函数和文档链接。不判断影片好不好看。"""
from pathlib import Path
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'assets/diorama-kit'
sys.path.insert(0, str(ROOT / 'scripts'))


def tracked():
    return set(subprocess.check_output(['git', '-c', 'core.quotepath=off', 'ls-files', '-z'], cwd=ROOT).decode('utf-8').split('\0'))


class KitIntegrity(unittest.TestCase):
    def exports(self, path):
        text = path.read_text('utf-8')
        names = set(re.findall(r'export (?:async )?function (\w+)', text)) | set(re.findall(r'export const (\w+)', text))
        for block in re.findall(r'export \{([^}]+)\}', text):
            names |= {x.strip() for x in block.split(',') if x.strip()}
        return names

    def check_imports(self, scene, web):
        for names, mod in re.findall(r'import \{([^}]+)\} from \'\./([\w.]+)\'', scene.read_text('utf-8')):
            have = self.exports(web / mod)
            for name in names.split(','):
                self.assertIn(name.strip(), have, f'{scene}: {mod} 没有导出 {name.strip()}')

    def test_kit_scenes_import_real_exports(self):
        for name in ('scene.js', 'catalog.js', 'props.js', 'overlay.js'):
            self.check_imports(KIT / 'web' / name, KIT / 'web')

    def test_examples_only_use_kit_exports(self):
        self.check_imports(ROOT / 'examples/pareto-diorama/web/scene.js', KIT / 'web')
        self.check_imports(ROOT / 'examples/binance-1029/web/scene.js', KIT / 'web')

    def test_timelines_cover_every_cue_id_used(self):
        for ex in ('binance-1029', 'pareto-diorama'):
            ids = {c['id'] for c in json.loads((ROOT / 'examples' / ex / 'audio/timeline.json').read_text('utf-8'))['cues']}
            used = set(re.findall(r'\bC\.(L\d+)\b', (ROOT / 'examples' / ex / 'web/scene.js').read_text('utf-8')))
            self.assertLessEqual(used, ids, ex)

    def test_every_narration_line_has_a_source(self):
        for ex in ('binance-1029', 'pareto-diorama'):
            for line in json.loads((ROOT / 'examples' / ex / 'source/script.json').read_text('utf-8'))['lines']:
                self.assertTrue(line.get('src'), f"{ex} {line['id']}")


@unittest.skipUnless(shutil.which('node'), '需要 node')
class MotionFunctions(unittest.TestCase):
    def node(self, body):
        url = (KIT / 'web/motion.js').resolve().as_uri()
        code = f"import * as m from '{url}'; {body}"
        return json.loads(subprocess.check_output(['node', '--input-type=module', '-e', code], text=True))

    def test_spring_overshoots_then_settles(self):
        r = self.node("const a=[...Array(400).keys()].map(i=>m.spring(i/100,2,.4));console.log(JSON.stringify({start:m.spring(0),max:Math.max(...a),end:a[399]}))")
        self.assertEqual(r['start'], 0)
        self.assertGreater(r['max'], 1.02)
        self.assertAlmostEqual(r['end'], 1, places=2)

    def test_track_keeps_velocity_through_keys(self):
        r = self.node("const f=m.track([{t:0,v:[0]},{t:1,v:[1]},{t:2,v:[2]}]);const e=.001;console.log(JSON.stringify({a:(f(1)[0]-f(1-e)[0])/e,b:(f(1+e)[0]-f(1)[0])/e}))")
        self.assertGreater(r['a'], .5)
        self.assertAlmostEqual(r['a'], r['b'], places=1)

    def test_rng_is_reproducible(self):
        r = self.node("const a=m.rng(7),b=m.rng(7);console.log(JSON.stringify([a(),a()].concat([b(),b()])))")
        self.assertEqual(r[:2], r[2:])


class Cli(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.dir, ignore_errors=True)

    def cli(self, *args, check=True):
        return subprocess.run([sys.executable, str(ROOT / 'scripts/diorama.py'), *args], capture_output=True, text=True, encoding='utf-8', check=check)

    def test_new_copies_kit_and_template(self):
        ep = self.dir / 'ep'
        self.cli('new', '--episode', str(ep))
        for name in ('tts.py', 'srt.py', 'render.mjs', 'package.json', 'web/stage.js', 'web/props.js', 'web/scene.js', 'source/script.json'):
            self.assertTrue((ep / name).is_file(), name)

    def test_new_from_example_brings_script_timeline_and_scene(self):
        ep = self.dir / 'ep'
        self.cli('new', '--episode', str(ep), '--source', 'pareto-diorama')
        self.assertEqual((ep / 'web/scene.js').read_bytes().replace(b'\r\n', b'\n'), (ROOT / 'examples/pareto-diorama/web/scene.js').read_bytes().replace(b'\r\n', b'\n'))
        self.assertTrue((ep / 'audio/timeline.json').is_file())

    def test_new_refuses_nonempty_target(self):
        ep = self.dir / 'ep'
        ep.mkdir()
        (ep / 'keep.txt').write_text('x')
        done = self.cli('new', '--episode', str(ep), check=False)
        self.assertNotEqual(done.returncode, 0)
        self.assertTrue((ep / 'keep.txt').is_file())
        self.assertFalse((ep / 'render.mjs').exists())


class Docs(unittest.TestCase):
    LINK = re.compile(r'(?:!?\[[^\]]*\]\(|src=")([^)"#\s]+)')

    def test_relative_links_point_to_tracked_files(self):
        files = tracked()
        dirs = {str(Path(f).parent).replace('\\', '/') for f in files}
        for doc in ('README.md', 'SKILL.md', 'references/diorama-3d.md', 'references/motion-craft.md', 'assets/diorama-kit/README.md', 'examples/binance-1029/README.md', 'examples/pareto-diorama/README.md', 'evals/README.md'):
            base = Path(doc).parent
            for link in self.LINK.findall((ROOT / doc).read_text('utf-8')):
                if re.match(r'[a-z]+:', link):
                    continue
                target = str((base / link)).replace('\\', '/')
                parts = []
                for p in target.split('/'):
                    if p == '..':
                        parts.pop()
                    elif p != '.':
                        parts.append(p)
                target = '/'.join(parts).rstrip('/')
                self.assertTrue(target in files or target in dirs or any(d.startswith(target + '/') for d in dirs), f'{doc} → {link}')

    def test_public_docs_do_not_point_to_removed_reference_media(self):
        for doc in ('README.md', 'SKILL.md'):
            self.assertNotIn('examples/reference-study-20261029', (ROOT / doc).read_text('utf-8'), doc)

    def test_skill_entry_stays_short(self):
        self.assertLess(len((ROOT / 'SKILL.md').read_text('utf-8').splitlines()), 100)

    def test_baseline_status_is_recorded_with_its_limit(self):
        cases = json.loads((ROOT / 'references/experience/reflections.json').read_text('utf-8'))['cases']
        r08 = next(c for c in cases if c['id'] == 'R08')
        self.assertEqual(r08['status'], 'user-approved')
        self.assertIn('五成', r08['feedback'])
        self.assertIn('这一条', r08['observation_scope'])


if __name__ == '__main__':
    unittest.main()
