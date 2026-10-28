import copy,importlib.util,json,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('cinema',ROOT/'scripts/cinema.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class CinemaContractTests(unittest.TestCase):
    def setUp(self):
        self.f=m.read(ROOT/'assets/poisson-cinema/fixtures/sampling-film.json')
        self.t=m.read(ROOT/'assets/poisson-cinema/fixtures/sampling-timeline.json')
    def test_two_contents_reuse_same_recipes(self):
        a=m.compile_spec(self.f,self.t)
        b=m.compile_spec(m.read(ROOT/'assets/poisson-cinema/fixtures/queue-film.json'),m.read(ROOT/'assets/poisson-cinema/fixtures/queue-timeline.json'))
        self.assertEqual([x['recipe'] for x in a['shots']],[x['recipe'] for x in b['shots']])
        self.assertNotEqual(a['shots'][2]['data']['samples'],b['shots'][2]['data']['samples'])
        self.assertEqual(a['shots'][-1]['end'],42)
    def test_rejects_portrait_not_squeezed_landscape(self):
        self.f['width'],self.f['height']=1080,1920
        with self.assertRaisesRegex(ValueError,'1920'):m.compile_spec(self.f,self.t)
    def test_missing_subtitle_cannot_compile(self):
        self.t['subtitles']=self.t['subtitles'][:-1]
        with self.assertRaisesRegex(ValueError,'Subtitles omit'):m.compile_spec(self.f,self.t)
    def test_uncovered_narration_cannot_compile(self):
        self.f['shots'][1]['fromCue']=3
        with self.assertRaisesRegex(ValueError,'every cue'):m.compile_spec(self.f,self.t)
    def test_action_outside_narration_cannot_compile(self):
        self.f['shots'][0]['action']['toCue']=4
        with self.assertRaisesRegex(ValueError,'inside'):m.compile_spec(self.f,self.t)
    def test_false_continuity_rejected(self):
        self.f['shots'][2]['object']='different-sample'
        with self.assertRaisesRegex(ValueError,'same object'):m.compile_spec(self.f,self.t)
    def test_missing_carried_sample_rejected(self):
        self.f['shots'][2]['data']['samples'].pop()
        with self.assertRaisesRegex(ValueError,'identities'):m.compile_spec(self.f,self.t)
    def test_same_formula_id_cannot_change_value(self):
        self.f['shots'][4]['data']['after'][0]['text']='3'
        with self.assertRaisesRegex(ValueError,'mathematical value'):m.compile_spec(self.f,self.t)
    def test_unknown_recipe_fails_instead_of_title_card(self):
        self.f['shots'][0]['recipe']='card-fallback'
        with self.assertRaisesRegex(ValueError,'Unsupported recipe'):m.compile_spec(self.f,self.t)
    def test_missing_units_rejected(self):
        del self.f['shots'][3]['data']['unit']
        with self.assertRaisesRegex(ValueError,'unit'):m.compile_spec(self.f,self.t)
    def test_init_does_not_copy_old_narration_or_approvals(self):
        with tempfile.TemporaryDirectory() as tmp:
            ep=Path(tmp)/'episode';m.init(ep)
            self.assertTrue((ep/'工程/assets/environment.png').is_file())
            self.assertTrue((ep/'工程/assets/fonts/Noto-OFL.txt').is_file())
            self.assertTrue((ep/'工程/original/scenes-b.js').is_file())
            self.assertFalse((ep/'assets/timeline.json').exists())
            self.assertFalse((ep/'evidence/script-review.json').exists())
            self.assertEqual(m.read(ep/'source/film.json')['shots'],[])
            with self.assertRaisesRegex(ValueError,'empty'):m.init(ep)
    def test_canvas_adapter_reaches_common_delivery_audit(self):
        spec=importlib.util.spec_from_file_location('audit',ROOT/'scripts/audit_episode.py');audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)
        with tempfile.TemporaryDirectory() as tmp:
            ep=Path(tmp)/'episode';m.init(ep);m.write(ep/'source/film.json',self.f);m.write(ep/'assets/timeline.json',self.t);m.compile_episode(ep)
            checks={v['name']:v for v in audit.audit(ep,'chapter-proof')['checks']}
            self.assertTrue(checks['film_workflow']['passed'])
            self.assertTrue(checks['deterministic_source']['passed'])
            self.assertTrue(checks['shot_state_contracts']['passed'])
            self.assertFalse(checks['cinema_shots_and_current_inputs']['passed'])
            self.assertFalse(checks['narrated_mp4']['passed'])
    def test_fixture_cannot_pass_production_gate_and_changes_invalidate(self):
        with tempfile.TemporaryDirectory() as tmp:
            ep=Path(tmp)/'episode';m.init(ep);m.write(ep/'source/film.json',self.f);m.write(ep/'assets/timeline.json',self.t);m.compile_episode(ep)
            with self.assertRaisesRegex(ValueError,'Synthetic'):m.check(ep)
            (ep/'工程/recipes.js').write_text('// changed render logic',encoding='utf8')
            with self.assertRaisesRegex(ValueError,'Source changed'):m.check(ep)
if __name__=='__main__':unittest.main()
