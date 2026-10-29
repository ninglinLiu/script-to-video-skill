"""Check stale-document failures against real staged Git trees, without any video runtime."""
from pathlib import Path
import importlib.util
import json
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('repo_inventory', ROOT / 'scripts/repo_inventory.py')
inventory = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inventory)


class InventoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git('init', '-q')
        self.git('config', 'core.autocrlf', 'false')
        self.git('config', 'user.name', 'Inventory test')
        self.git('config', 'user.email', 'test@example.invalid')
        self.write('README.md', '# Example\n<!-- BEGIN GENERATED: architecture -->\n<!-- END GENERATED: architecture -->\n<!-- BEGIN GENERATED: architecture-tree -->\n<!-- END GENERATED: architecture-tree -->\n')
        self.write('SKILL.md', '入口\n')
        self.write('docs/architecture.mmd', 'flowchart TB\n A[输入] --> B[执行]\n')
        self.write('docs/architecture-layout.json', json.dumps({'docs/': '维护', 'known/': '素材'}, ensure_ascii=False))
        self.write('known/data.txt', 'first\n')
        self.git('add', '.')
        self.refresh()
        self.git('commit', '-qm', 'fixture')

    def git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.root, stderr=subprocess.PIPE)

    def write(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(text.encode('utf-8'))

    def refresh(self):
        inventory.run(self.root)
        self.git('add', '.')
        inventory.run(self.root, check=True)

    def test_generation_converges_and_has_no_commit_self_reference(self):
        self.assertEqual(inventory.run(self.root, check=True), list(inventory.outputs(self.root)))
        before = (self.root / 'README.md').read_bytes()
        self.refresh()
        self.assertEqual(before, (self.root / 'README.md').read_bytes())
        self.assertEqual(self.git('diff', '--cached', '--name-only'), b'')
        self.assertIn('repository-tree.txt', (self.root / 'docs/repository-tree.txt').read_text('utf-8'))

    def test_adding_file_requires_tree_refresh(self):
        self.write('known/new-file.txt', 'new')
        self.git('add', '.')
        with self.assertRaisesRegex(ValueError, 'stale'):
            inventory.run(self.root, check=True)
        self.refresh()

    def test_rename_requires_tree_refresh(self):
        self.git('mv', 'known/data.txt', 'known/renamed.txt')
        with self.assertRaisesRegex(ValueError, 'stale'):
            inventory.run(self.root, check=True)
        self.refresh()

    def test_new_module_needs_responsibility_before_generation(self):
        self.write('mystery/file.txt', 'new module')
        self.git('add', '.')
        with self.assertRaisesRegex(ValueError, 'top-level directories'):
            inventory.run(self.root)

    def test_deleted_registered_path_is_not_silently_kept_in_tree(self):
        self.git('rm', 'known/data.txt')
        with self.assertRaisesRegex(ValueError, 'Missing path'):
            inventory.run(self.root)

    def test_diagram_change_requires_readme_sync(self):
        self.write('docs/architecture.mmd', 'flowchart TB\n A[输入] --> C[新职责]\n')
        self.git('add', '.')
        with self.assertRaisesRegex(ValueError, 'stale: README.md'):
            inventory.run(self.root, check=True)
        self.refresh()
        self.assertIn('新职责', (self.root / 'README.md').read_text('utf-8'))

    def test_same_path_new_size_requires_stats_refresh(self):
        self.write('known/data.txt', 'a different amount of data\n')
        self.git('add', '.')
        with self.assertRaisesRegex(ValueError, 'stale'):
            inventory.run(self.root, check=True)
        self.refresh()

    def test_unstaged_readme_is_preserved_not_overwritten(self):
        self.write('README.md', 'important unsaved edits\n')
        with self.assertRaisesRegex(ValueError, 'Stage or preserve'):
            inventory.run(self.root)
        self.assertEqual((self.root / 'README.md').read_text('utf-8'), 'important unsaved edits\n')

    def test_cross_platform_checkout_line_endings_do_not_invalidate_inventory(self):
        self.git('config', 'core.autocrlf', 'true')
        self.git('checkout-index', '--all', '--force')
        inventory.run(self.root, check=True)


if __name__ == '__main__':
    unittest.main()
