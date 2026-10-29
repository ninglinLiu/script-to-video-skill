import importlib.util,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('pixel_scene',ROOT/'scripts/pixel_scene.py');p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
class PixelContract(unittest.TestCase):
    def config(self):return json.loads((ROOT/'assets/pixel-scene-map/configs/second-content.json').read_text(encoding='utf-8'))
    def test_both_content_inputs(self):
        f=self.config();p.validate(f)
        g=json.loads((ROOT/'assets/pixel-scene-map/configs/caesar.json').read_text(encoding='utf-8'));g['timeline']=p.read(ROOT/'examples/chapter-01/assets/timeline.json');p.validate(g)
        self.assertNotEqual([x['text'] for x in f['timeline']['cues']],[x['text'] for x in g['timeline']['cues']])
    def test_reject_duration_drift(self):
        f=self.config();f['shots'][0]['dur']+=1
        with self.assertRaises(AssertionError):p.validate(f)
    def test_reject_fabricated_voice_timing(self):
        f=self.config();f['audio']='voice.wav'
        with self.assertRaises(AssertionError):p.validate(f)
    def test_reject_missing_reflow(self):
        f=self.config();del f['shots'][0]['cameraPortrait']
        with self.assertRaises(AssertionError):p.validate(f)
    def test_local_edit_only_invalidates_intersecting_segment(self):
        f=self.config();first=p.segment_signature(f,0,360,'original');second=p.segment_signature(f,360,720,'original')
        f['shots'][-1]['label']='changed ending only'
        self.assertEqual(first,p.segment_signature(f,0,360,'original'))
        self.assertNotEqual(second,p.segment_signature(f,360,720,'original'))
    def test_local_render_cannot_overwrite_master(self):
        ep=Path('episode')
        self.assertNotEqual(p.output_path(ep,'caesar','portrait'),p.output_path(ep,'caesar','portrait',60,72))
if __name__=='__main__':unittest.main()
