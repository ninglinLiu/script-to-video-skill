"""Regression checks for honest unverified editor records; no media playback."""
from pathlib import Path
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'scripts/audit_episode.py'
spec = importlib.util.spec_from_file_location('audit_episode', SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class EditorImportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.episode = Path(self.temp.name)
        (self.episode / 'qa').mkdir()

    def write_record(self, record):
        (self.episode / 'qa/editor-import.json').write_text(json.dumps(record), encoding='utf-8')

    def editor_check(self):
        report = module.audit(self.episode, 'task-short')
        check = next(c for c in report['checks'] if c['name'] == 'native_editor_project')
        return report, check

    def test_missing_null_and_empty_project_are_unverified(self):
        records = [{}, {'project': None}, {'project': ''}, {'project': ' '}]
        for record in records:
            with self.subTest(record=record):
                self.write_record(record)
                report, check = self.editor_check()
                self.assertEqual(report['status'], 'incomplete')
                self.assertFalse(check['passed'])
                self.assertTrue(check['required'])
                self.assertEqual(check['detail'], record)

    def test_null_never_uses_a_placeholder_file_as_project(self):
        (self.episode / '__missing__').write_text('not an editor project')
        self.write_record({'project': None, 'openedSuccessfully': True, 'editor': 'Premiere Pro'})
        self.assertFalse(self.editor_check()[1]['passed'])

    def test_existing_project_still_requires_open_record(self):
        (self.episode / 'native').mkdir()
        (self.episode / 'native/project.prproj').write_text('fixture')
        for opened, expected in [(None, False), (False, False), (True, True)]:
            with self.subTest(opened=opened):
                self.write_record({'project': 'native/project.prproj', 'openedSuccessfully': opened, 'editor': 'Premiere Pro'})
                self.assertEqual(self.editor_check()[1]['passed'], expected)

    def test_user_waiver_does_not_become_agent_validation(self):
        self.write_record({'project': None, 'status': 'user_reported_already_verified',
                           'validationOwner': 'user', 'repeatValidationWaived': True,
                           'userInstruction': 'Existing workflow was verified; do not repeat.'})
        report, check = self.editor_check()
        self.assertFalse(check['passed'])
        self.assertFalse(check['required'])
        waiver = next(c for c in report['checks'] if c['name'] == 'editor_repeat_validation_waived')
        self.assertTrue(waiver['passed'])
        self.assertFalse(waiver['detail']['agentImportVerified'])

    def test_cli_null_writes_incomplete_report_and_exits_two(self):
        self.write_record({'project': None, 'openedSuccessfully': None})
        output = self.episode / 'qa/result.json'
        run = subprocess.run([sys.executable, '-X', 'utf8', str(SCRIPT), '--episode', str(self.episode),
                              '--output', str(output)], capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(run.returncode, 2, run.stderr)
        self.assertNotIn('Traceback', run.stderr)
        self.assertEqual(json.loads(run.stdout)['status'], 'incomplete')
        checks = json.loads(output.read_text('utf-8'))['checks']
        self.assertFalse(next(c for c in checks if c['name'] == 'native_editor_project')['passed'])


if __name__ == '__main__':
    unittest.main()
