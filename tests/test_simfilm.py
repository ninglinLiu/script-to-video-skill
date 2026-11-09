"""代码模拟暗金排版（临界点风格）的确定性回归：工程脚手架、场景引用、数据一致、入口先问风格。不判断片子好不好看。"""
from pathlib import Path
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'assets/sim-kit'
EXAMPLE = ROOT / 'examples/caesar-kelly'


def exports(path):
    text = path.read_text('utf-8')
    return set(re.findall(r'export (?:async )?function (\w+)', text)) | set(re.findall(r'export const (\w+)', text))


class Kit(unittest.TestCase):
    def test_scenes_import_real_engine_exports(self):
        have = exports(KIT / 'web/engine.js')
        for scene in (KIT / 'web/scene.js', EXAMPLE / 'web/scene.js'):
            for names, mod in re.findall(r"import \{([^}]+)\} from '\./([\w.]+)'", scene.read_text('utf-8')):
                self.assertEqual(mod, 'engine.js')
                for name in names.split(','):
                    self.assertIn(name.strip(), have, f'{scene.name} 用了 engine 没有的 {name.strip()}')

    def test_example_runs_on_the_same_engine(self):
        for rel in ('web/engine.js', 'web/index.html', 'render.mjs'):
            self.assertTrue((KIT / rel).is_file(), rel)
        self.assertFalse((EXAMPLE / 'web/engine.js').exists(), '样片应该用 kit 的 engine，不另存一份')

    def test_example_numbers_come_from_one_data_file(self):
        data = json.loads((EXAMPLE / 'web/data.json').read_text('utf-8'))
        summary = json.loads((EXAMPLE / 'qa/data-summary.json').read_text('utf-8'))
        for key in ('threshold', 'kelly', 'stats', 'finals60_40', 'sequence'):
            self.assertEqual(data[key], summary[key], key)
        self.assertAlmostEqual(data['threshold'], .3894, places=4)
        self.assertAlmostEqual(data['kelly'], .2, places=9)
        self.assertEqual(data['sequence'].count('H'), 60)
        self.assertEqual(len(data['runs20']), data['runs'])
        sources = (EXAMPLE / 'source/sources.md').read_text('utf-8')
        for piece in ('38.94%', '82.15%', '37.81%', '13,781', 'arXiv:1701.01427', '28%', '1956'):
            self.assertIn(piece, sources)


class Cli(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.dir, ignore_errors=True)

    def cli(self, *args, check=True):
        return subprocess.run([sys.executable, str(ROOT / 'scripts/simfilm.py'), *args], capture_output=True, text=True, encoding='utf-8', check=check)

    def test_new_copies_kit_and_starter_data_builds(self):
        ep = self.dir / 'ep'
        self.cli('new', '--episode', str(ep))
        for rel in ('render.mjs', 'web/engine.js', 'web/index.html', 'web/scene.js', 'data/build_data.py'):
            self.assertTrue((ep / rel).is_file(), rel)
        subprocess.run([sys.executable, str(ep / 'data/build_data.py')], check=True, capture_output=True)
        data = json.loads((ep / 'web/data.json').read_text('utf-8'))
        self.assertEqual(len(data['wealth']), data['n'] + 1)

    def test_new_from_example_brings_scene_and_data(self):
        ep = self.dir / 'ep'
        self.cli('new', '--episode', str(ep), '--source', 'caesar-kelly')
        same = lambda rel: (ep / rel).read_bytes().replace(b'\r\n', b'\n') == (EXAMPLE / rel).read_bytes().replace(b'\r\n', b'\n')
        self.assertTrue(same('web/scene.js'))
        self.assertTrue(same('data/build_data.py'))

    def test_new_refuses_nonempty_target(self):
        ep = self.dir / 'ep'
        ep.mkdir()
        (ep / 'keep.txt').write_text('x')
        self.assertNotEqual(self.cli('new', '--episode', str(ep), check=False).returncode, 0)
        self.assertFalse((ep / 'render.mjs').exists())


class Entry(unittest.TestCase):
    def test_skill_asks_for_a_style_and_keeps_both_routes(self):
        skill = (ROOT / 'SKILL.md').read_text('utf-8')
        self.assertIn('## 先问风格', skill)
        for piece in ('examples/binance-1029/README.md', 'examples/caesar-kelly/README.md', 'references/diorama-3d.md', 'references/sim-typography.md'):
            self.assertIn(piece, skill)

    def test_readme_shows_both_styles_without_dropping_the_3d_showcase(self):
        readme = (ROOT / 'README.md').read_text('utf-8')
        for piece in ('docs/media/hero-binance.gif', 'docs/media/storyboard-binance.jpg', 'docs/media/atlas-binance.jpg',
                      'docs/media/storyboard-kelly.jpg', '## 两种风格，开工前先选', 'examples/caesar-kelly/'):
            self.assertIn(piece, readme)

    def test_kelly_is_not_recorded_as_approved(self):
        catalog = json.loads((ROOT / 'references/sample-catalog.json').read_text('utf-8'))
        kelly = next(s for s in catalog['samples'] if s['id'] == 'caesar-kelly')
        self.assertEqual(kelly['evaluation']['status'], 'producer-only')


if __name__ == '__main__':
    unittest.main()
