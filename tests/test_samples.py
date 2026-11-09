"""样片目录和配乐记录的确定性回归：路径有效、评价不走样、认可不被说大。不判断片子好不好。"""
from pathlib import Path
import importlib.util
import json
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('samples', ROOT / 'scripts/samples.py')
samples = importlib.util.module_from_spec(spec)
spec.loader.exec_module(samples)


def tracked():
    return set(subprocess.check_output(['git', '-c', 'core.quotepath=off', 'ls-files', '-z'], cwd=ROOT).decode('utf-8').split('\0'))


def exists(path, files):
    return (ROOT / path).exists() or path in files or any(f.startswith(path.rstrip('/') + '/') for f in files)


class Catalog(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = samples.load()
        cls.by_id = {s['id']: s for s in cls.data['samples']}
        cls.files = tracked()

    def test_ids_are_unique(self):
        ids = [s['id'] for s in self.data['samples']]
        self.assertEqual(len(ids), len(set(ids)))

    def test_every_sample_has_an_evaluation_and_a_video(self):
        for s in self.data['samples']:
            with self.subTest(s['id']):
                self.assertIn(s['evaluation']['status'], samples.STATUS)
                self.assertTrue(s['evaluation']['text'])
                self.assertTrue(s['media'])

    def test_videos_and_project_paths_exist(self):
        for s in self.data['samples']:
            for m in s['media']:
                self.assertTrue(exists(m['video'], self.files), m['video'])
                self.assertIn(m['tone'], samples.TONES)
            if s['engineering'].get('repo'):
                self.assertTrue(exists(s['engineering']['repo'], self.files), s['engineering']['repo'])

    def test_local_projects_do_not_leak_machine_paths(self):
        text = samples.CATALOG.read_text('utf-8')
        for leak in ('C:/', 'C:\\', 'Users/', 'OneDrive'):
            self.assertNotIn(leak, text)

    def test_light_note_does_not_turn_into_film_level_approval(self):
        self.assertIn('没有点名', self.data['light_style_note'])
        light = [s for s in self.data['samples'] if any(m['tone'] == 'light' for m in s['media'])]
        self.assertGreater(len(light), 3)
        self.assertEqual(self.by_id['binance-1029']['evaluation']['status'], 'user-approved')
        self.assertEqual(self.by_id['r06-fund-paper']['evaluation']['status'], 'user-rejected')
        self.assertEqual(self.by_id['pareto-diorama']['evaluation']['status'], 'producer-only')

    def test_half_dark_film_is_not_called_light(self):
        self.assertEqual(samples.tone_of(83.7, .44, .56), 'mixed')
        self.assertEqual(samples.tone_of(90, 0, 1), 'light')
        self.assertEqual(samples.tone_of(10, 1, 0), 'dark')
        self.assertEqual(self.by_id['r04-queue-poisson']['media'][0]['tone'], 'mixed')

    def test_failed_samples_stay_labelled(self):
        for sid in ('pixel-scene-map', 'r03-pareto-first', 'r04-queue-poisson', 'r05-kelly-test', 'r06-fund-paper', 'anchor-art'):
            self.assertEqual(self.by_id[sid]['evaluation']['status'], 'user-rejected', sid)

    def test_caesar_approval_is_limited_to_the_music(self):
        e = self.by_id['caesar-ai-bubble']['evaluation']
        self.assertEqual(e['status'], 'user-approved-partial')
        self.assertIn('配乐', e['scope'])
        self.assertIn('不含画面', e['scope'])

    def test_generated_doc_is_current(self):
        doc = (ROOT / 'docs/sample-catalog.md').read_text('utf-8')
        for s in self.data['samples']:
            self.assertIn(f"`{s['id']}`", doc)

    def test_readme_tables_match_the_catalog(self):
        readme = (ROOT / 'README.md').read_text('utf-8')
        for name, table in samples.readme_tables(self.data).items():
            self.assertIn(f'<!-- BEGIN SAMPLES: {name} -->\n{table}\n<!-- END SAMPLES: {name} -->', readme)

    def test_readme_keeps_its_showcase(self):
        readme = (ROOT / 'README.md').read_text('utf-8')
        for piece in ('docs/media/storyboard-binance.jpg', 'docs/media/atlas-binance.jpg', 'docs/media/hero-binance.gif', 'docs/media/components.jpg', 'docs/media/history-wall.jpg',
                      'docs/media/storyboard-caesar.jpg', 'docs/media/gif-caesar-tower.gif', 'docs/media/music-ducking.png', 'docs/media/light-samples.jpg', 'docs/media/failed-samples.jpg',
                      'BEGIN GENERATED: architecture', 'BEGIN GENERATED: production-flow', 'examples/caesar-ai-bubble/'):
            self.assertIn(piece, readme)

    def test_imported_projects_carry_their_label_and_no_article_text(self):
        for s in self.data['samples']:
            repo = s['engineering'].get('repo', '')
            if not repo.startswith(('examples/light-projects/', 'examples/failed-cases/')) or not (ROOT / repo).is_dir():
                continue
            self.assertIn('评价：', (ROOT / repo / 'README.md').read_text('utf-8')[:300], repo)
            names = [p.name for p in (ROOT / repo).rglob('*') if p.is_file()]
            for name in names:
                self.assertNotRegex(name, r'原文|粘贴全文|三篇正文|正文工作本|链接总表', f'{repo}/{name}')


class Reflections(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cases = {c['id']: c for c in json.loads((ROOT / 'references/experience/reflections.json').read_text('utf-8'))['cases']}
        cls.files = tracked()

    def test_r09_scope_is_only_the_music(self):
        r09 = self.cases['R09']
        self.assertEqual(r09['status'], 'user-approved')
        self.assertIn('认可范围是这次配乐效果', r09['feedback'])
        self.assertIn('不含画面', r09['observation_scope'])
        self.assertIn('画面未评价', r09['title'])
        self.assertNotIn('diorama-3d', r09['routes'])

    def test_rejected_projects_are_archived_and_still_rejected(self):
        for rid in ('R03', 'R04', 'R05', 'R06'):
            case = self.cases[rid]
            self.assertEqual(case['status'], 'user-rejected')
            for key in ('project', 'readme', 'preview', 'poster'):
                self.assertTrue(exists(case['archive'][key], self.files), case['archive'][key])
            readme = (ROOT / case['archive']['readme'])
            if readme.is_file():
                self.assertIn('用户否决', readme.read_text('utf-8')[:400])


class Music(unittest.TestCase):
    def test_catalog_tracks_carry_license_credit_and_hash(self):
        tracks = json.loads((ROOT / 'assets/music/catalog.json').read_text('utf-8'))['tracks']
        for t in tracks:
            with self.subTest(t['id']):
                self.assertEqual(len(t['sha256']), 64)
                self.assertEqual(t['license'], 'CC BY 4.0')
                self.assertIn(t['title'], t['credit'])
                self.assertIn('creativecommons.org', t['credit'])
        by_id = {t['id']: t for t in tracks}
        self.assertEqual(by_id['crypto-kevin-macleod']['user_status'], 'user-approved')
        self.assertEqual(by_id['crypto-kevin-macleod']['mix'], {'music_lufs': -29, 'fade_in': 0.25, 'fade_out': 1.2})
        self.assertNotEqual(by_id['cipher-kevin-macleod']['user_status'], 'user-approved')

    def test_no_audio_files_in_the_music_catalog(self):
        self.assertEqual([p.name for p in (ROOT / 'assets/music').iterdir() if p.suffix.lower() in ('.mp3', '.wav', '.flac', '.m4a')], [])

    def test_recipe_doc_matches_the_catalog_and_warns_about_credit(self):
        doc = (ROOT / 'references/audio-and-materials.md').read_text('utf-8')
        for piece in ('−29 LUFS', '0.25 秒', '1.2 秒', '0.035', '15 ms', '350 ms', '−16 LUFS', 'CC BY 4.0', '发布前必须', '认可范围是这次配乐效果'):
            self.assertIn(piece, doc)


if __name__ == '__main__':
    unittest.main()
