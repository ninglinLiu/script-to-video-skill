"""Behavior checks for routing and record omissions; no model/film quality assertions."""
from pathlib import Path
import copy
import importlib.util
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('experience', ROOT / 'scripts/experience.py')
experience = importlib.util.module_from_spec(spec)
spec.loader.exec_module(experience)


class ExperienceTests(unittest.TestCase):
    def test_realistic_symptoms_route_to_specific_cases(self):
        scenarios = [
            ('script', '语速很快，内容还是慢，AI味太重', 'E01'),
            ('repair', '字幕第一次修复后产生孤字行', 'E08'),
            ('storyboard', '镜头切换时对象没有衔接', 'E05'),
            ('review', '价格坐标上下反了，四舍五入后的等式不成立', 'E07'),
            ('plan', '新文章想换风格和内容形式', 'E16'),
            ('render', 'voice timing changed after editing script', 'E09'),
        ]
        for stage, query, expected in scenarios:
            with self.subTest(query=query):
                result = experience.select(stage, query)
                self.assertEqual(result['cases'][0]['id'], expected)

    def test_no_match_does_not_invent_evidence(self):
        self.assertEqual(experience.select('repair', 'unmapped-zzzz-topic')['cases'], [])

    def test_budget_defers_whole_cards(self):
        result = experience.select('repair', '字幕 配音 修复 重叠 字体', limit=5, max_chars=2000)
        self.assertLessEqual(len(experience.encode(result)) + 1, 2000)
        self.assertTrue(result['budget_omitted_ids'])
        for item in result['cases']:
            self.assertEqual(item['content'], (ROOT / item['path']).read_text('utf-8'))

    def test_catalog_and_bundled_evidence(self):
        self.assertEqual(experience.validate_library()['errors'], [])

    def test_windows_and_unix_line_endings_have_same_version(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'card.md'
            path.write_bytes('字幕\n保留条件\n'.encode('utf-8'))
            unix = experience.digest(path)
            path.write_bytes('字幕\r\n保留条件\r\n'.encode('utf-8'))
            self.assertEqual(unix, experience.digest(path))

    def fixture(self):
        # Synthetic decision data; this is not a production review.
        chosen = experience.select('repair', '字幕孤字')['cases']
        receipt = {'schema_version': 1, 'selected': [{'id': c['id'], 'sha256': c['sha256']} for c in chosen]}
        use = {'decisions': [{'case_id': c['id'], 'disposition': 'not-applicable',
                            'target': 'synthetic-test', 'reason': 'No caption layer in this test.',
                            'preserve': 'Existing image.', 'verification': 'Test fixture only.'} for c in chosen]}
        return receipt, use

    def test_explicit_non_applicability_is_allowed(self):
        receipt, use = self.fixture()
        self.assertEqual(experience.check_use(receipt, use)['status'], 'record-complete')

    def test_missing_response_is_detected(self):
        receipt, _ = self.fixture()
        self.assertEqual(experience.check_use(receipt, {'decisions': []})['status'], 'incomplete')

    def test_stale_version_and_unsupported_verdict_fail(self):
        receipt, use = self.fixture()
        changed = copy.deepcopy(receipt)
        changed['selected'][0]['sha256'] = 'stale'
        self.assertTrue(experience.check_use(changed, use)['errors'])
        use['decisions'][0]['disposition'] = 'perfect-video'
        self.assertTrue(experience.check_use(receipt, use)['errors'])

    def test_empty_verification_is_not_accepted(self):
        receipt, use = self.fixture()
        use['decisions'][0]['verification'] = ' '
        self.assertTrue(experience.check_use(receipt, use)['errors'])


if __name__ == '__main__':
    unittest.main()
