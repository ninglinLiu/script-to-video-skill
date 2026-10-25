"""Behavioral gates: real source trees and bindings; media processes mocked in unit fixtures.
Actual installation/render verification is separately recorded in examples/production-gates.
"""
import contextlib
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('production',ROOT/'scripts/production.py')
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)


class ProductionTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.ep=Path(self.tmp.name)/'episode'
        with contextlib.redirect_stdout(io.StringIO()):p.init(self.ep,'blackgold','portrait')

    def failed(self,checks):return {x['name'] for x in checks if not x['passed']}

    def fixture(self):
        """Fake media only for exercising gate branches; never used as rendering evidence."""
        (self.ep/'qa').mkdir(exist_ok=True)
        (self.ep/'qa/motion-proof.mp4').write_bytes(b'unit fixture; ffprobe is mocked')
        rows=[{'frame':i,'objects':[{'id':f'account-{j}','asset':'blackgold','shapes':2,'x':.2+j*.1,'y':.4,'visible':True} for j in range(5)],'claims':[{'key':'mean','text':'20'},{'key':'median','text':'10'}]} for i in range(360)]
        p.write(self.ep/'qa/motion-trace.json',rows)
        self.addCleanup(patch.stopall)
        patch.object(p,'probe',return_value={'streams':[{'codec_type':'video','width':540,'height':960,'r_frame_rate':'30/1'}],'format':{'duration':'12'}}).start()
        patch.object(p.subprocess,'run',return_value=SimpleNamespace(returncode=0)).start()
        r=p.capture(self.ep)
        p.write(self.ep/'qa/motion-review.json',{'status':'reviewed','method':'dense-sequence-review','proofSha256':r['mediaSha256'],
            'observations':[{'start':0,'end':12,'observed':'unit fixture observation','newInformation':'mean moves with outlier'}],
            'transitions':[{'id':i,'verdict':'keep','observed':'unit fixture handoff'} for i in ['group-to-outlier','outlier-to-comparison']], 'unresolved':[]})

    def edit_trace(self,fn):
        f=self.ep/'qa/motion-trace.json';rows=p.read(f);fn(rows);p.write(f,rows)
        r=p.read(self.ep/'qa/motion-proof.json');r['traceSha256']=p.sha(f);p.write(self.ep/'qa/motion-proof.json',r)

    def test_initialization_materializes_import_closure_and_licenses(self):
        self.assertFalse(self.failed(p.check(self.ep,'prepare')))
        m=p.read(self.ep/'plans/assets.json')
        self.assertTrue((self.ep/m['visualModule']).is_file())
        self.assertTrue((self.ep/'工程/src/vendor/LICENSE').is_file())

    def test_never_overwrites_existing_episode(self):
        sentinel=self.ep/'own.txt';sentinel.write_text('keep')
        with self.assertRaises(ValueError):p.init(self.ep,'gilded','landscape')
        self.assertEqual(sentinel.read_text(),'keep')

    def test_evidence_cut_initializer_materializes_selected_edit(self):
        ep=Path(self.tmp.name)/'cut-episode'
        with contextlib.redirect_stdout(io.StringIO()):p.init(ep,'pixel','portrait','evidence-cut')
        self.assertEqual(p.read(ep/'plans/edit-plan.json')['transitions'][1]['kind'],'evidence-cut')
        self.assertFalse(self.failed(p.check(ep,'prepare')))

    def test_copying_assets_without_import_does_not_pass(self):
        (self.ep/'工程/src/Asset.tsx').write_text("export const Asset=()=>null;",encoding='utf-8')
        self.assertIn('visual_asset_imports',self.failed(p.check(self.ep,'prepare')))

    def test_parameter_change_updates_both_spoken_and_visual_values(self):
        f=self.ep/'source/content.json';s=p.read(f);s['values']['accounts']=[10,10,10,10,110];p.write(f,s)
        self.assertIn('shared_content_bindings',self.failed(p.check(self.ep,'prepare')))
        p.compile_content(self.ep,True)
        self.assertEqual(p.read(self.ep/'工程/src/content.generated.json')['labels']['mean'],'30')
        self.assertIn('拉到了30',(self.ep/'source/draft.txt').read_text('utf-8'))
        self.assertNotIn('shared_content_bindings',self.failed(p.check(self.ep,'prepare')))

    def test_unbound_token_fails_instead_of_leaking_to_tts(self):
        f=self.ep/'source/content.json';s=p.read(f);s['chapters'][0]['cues'][0]='{{unknown}}';p.write(f,s)
        with self.assertRaisesRegex(ValueError,'Unbound'):p.compile_content(self.ep)

    def test_stills_and_old_review_do_not_satisfy_motion_gate(self):
        (self.ep/'qa').mkdir();(self.ep/'qa/still.jpg').write_bytes(b'image')
        p.write(self.ep/'qa/production-review.json',{'status':'reviewed_with_fixes','framesReviewed':[{'t':2}]})
        self.assertTrue({'encoded_motion_proof','rendered_motion_trace','continuous_motion_review'}<=self.failed(p.check(self.ep)))

    def test_complete_fixture_checks_prerequisites_only(self):
        self.fixture();self.assertFalse(self.failed(p.check(self.ep)))

    def test_source_change_invalidates_proof(self):
        self.fixture()
        with (self.ep/'工程/src/Film.tsx').open('a',encoding='utf-8') as f:f.write('\n// changed render input')
        self.assertIn('encoded_motion_proof',self.failed(p.check(self.ep)))

    def test_blank_asset_wrapper_does_not_count(self):
        self.fixture();self.edit_trace(lambda rows:[o.update(shapes=0) for r in rows for o in r['objects']])
        self.assertIn('rendered_motion_trace',self.failed(p.check(self.ep)))

    def test_missing_object_at_cut_is_detected(self):
        self.fixture();self.edit_trace(lambda rows:rows[120].update(objects=[]))
        self.assertIn('rendered_motion_trace',self.failed(p.check(self.ep)))

    def test_match_move_jump_is_detected(self):
        self.fixture();self.edit_trace(lambda rows:rows[120]['objects'][0].update(x=.95))
        self.assertIn('rendered_motion_trace',self.failed(p.check(self.ep)))

    def test_wrong_rendered_label_is_detected(self):
        self.fixture();self.edit_trace(lambda rows:rows[200]['claims'][0].update(text='999'))
        self.assertIn('rendered_motion_trace',self.failed(p.check(self.ep)))

    def test_sparse_frame_review_is_not_motion_review(self):
        self.fixture();f=self.ep/'qa/motion-review.json';v=p.read(f);v['method']='sparse-stills';p.write(f,v)
        self.assertIn('continuous_motion_review',self.failed(p.check(self.ep)))

    def test_new_capture_resets_old_review(self):
        self.fixture();p.capture(self.ep)
        self.assertEqual(p.read(self.ep/'qa/motion-review.json')['status'],'pending')
        self.assertIn('continuous_motion_review',self.failed(p.check(self.ep)))

    def test_evidence_cut_allows_deliberate_jump_with_persistent_anchor(self):
        f=self.ep/'plans/edit-plan.json';v=p.read(f);v['transitions'][0]['kind']='evidence-cut';p.write(f,v)
        self.fixture();self.edit_trace(lambda rows:rows[120]['objects'][0].update(x=.95))
        self.assertNotIn('rendered_motion_trace',self.failed(p.check(self.ep)))

    def test_align_requires_measured_cues_and_explicit_mapping(self):
        p.write(self.ep/'assets/timeline.json',{'wordBoundarySource':'real edge-tts WordBoundary','seconds':12,'fps':30,'cues':[{'start':4.2},{'start':8.1}]})
        with self.assertRaisesRegex(ValueError,'cueIndex'):p.align(self.ep)
        f=self.ep/'plans/edit-plan.json';v=p.read(f)
        for i,t in enumerate(v['transitions']):t['cueIndex']=i
        p.write(f,v);p.align(self.ep)
        self.assertEqual([t['at'] for t in p.read(f)['transitions']],[4.2,8.1])

if __name__=='__main__':unittest.main()
