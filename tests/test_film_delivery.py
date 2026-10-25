"""Regression tests for the reported subtitle and partial-proof delivery failures."""
import importlib.util,json,tempfile,unittest,subprocess,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
def module(name):
 s=importlib.util.spec_from_file_location(name,ROOT/'scripts'/f'{name}.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
film=module('film_delivery');migration=module('start_episode')

class EncodedCaptionTests(unittest.TestCase):
 def test_missing_captions_and_empty_plate_fail(self):
  clean=Image.new('RGB',(600,140),'#f5efde');plate=clean.copy();ImageDraw.Draw(plate).rectangle((10,10,590,130),fill='#112b37')
  expected=plate.copy();ImageDraw.Draw(expected).text((35,35),'Real spoken caption',font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',42) if Path('C:/Windows/Fonts/arial.ttf').exists() else ImageFont.load_default(size=42),fill='#fff9e9')
  self.assertTrue(film.pixel_check(expected,expected,clean,[0,0,600,140])['passed'])
  self.assertFalse(film.pixel_check(clean,expected,clean,[0,0,600,140])['passed'])
  self.assertFalse(film.pixel_check(plate,expected,clean,[0,0,600,140])['passed'])
 def test_identical_references_are_not_evidence(self):
  im=Image.new('RGB',(600,140),'black')
  with self.assertRaises(ValueError):film.pixel_check(im,im,im,[0,0,600,140])
 def test_srt_and_local_proof_do_not_pass_film(self):
  with tempfile.TemporaryDirectory() as folder:
   ep=Path(folder);(ep/'out').mkdir();(ep/'qa').mkdir()
   (ep/'out/subtitles.srt').write_text('1\n00:00:00,000 --> 00:00:02,000\nSpoken text')
   (ep/'qa/motion-review.json').write_text(json.dumps({'status':'reviewed','start':20,'end':32}))
   self.assertTrue(all(not c['passed'] for c in film.check(ep)))
 def test_whole_film_coverage_not_a_local_window(self):
  def section(a,b):return dict(start=a,end=b,observed='Actual image',newInformation='Specific explanation')
  self.assertFalse(film.cover([section(20,32)],68))
  self.assertFalse(film.cover([section(0,30),section(40,68)],68))
  self.assertTrue(film.cover([section(0,30),section(30,68)],68))
 def test_tail_hold_is_not_lost(self):
  self.assertEqual(film.intervals('freeze_start: 60',68)[0]['end'],68)

class MigrationTests(unittest.TestCase):
 def test_preserves_full_engine_but_not_approval(self):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder);src=root/'existing';dest=root/'new'
   files={'工程/src/entry.tsx':"import timing from './timing.json';\nconst Root=()=> <Composition component={Chapter}/>;",'工程/src/Chapter.tsx':'actual film with its captions','工程/src/timing.json':'{}','工程/package.json':'{}','工程/package-lock.json':'{}','assets/timeline.json':'{}','source/script.json':'{}','evidence/script-review.json':'{"ttsAllowed":true}','requirements.txt':'edge-tts==7.3.1\n','qa/approval.json':'old approval'}
   for name,body in files.items():p=src/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(body,encoding='utf8')
   migration.start(src,dest)
   self.assertEqual((dest/'工程/src/Chapter.tsx').read_text('utf8'),'actual film with its captions')
   self.assertIn('ObservedChapter',(dest/'工程/src/entry.tsx').read_text('utf8'))
   self.assertTrue((dest/'工程/src/CaptionProbe.tsx').is_file())
   self.assertTrue((dest/'tools/film_delivery.py').is_file())
   self.assertFalse((dest/'evidence/script-review.json').exists())
   self.assertTrue((dest/'reference/script-review.json').exists())
   self.assertFalse((dest/'qa/approval.json').exists())
   with self.assertRaises(ValueError):migration.start(src,dest)
 def test_obsolete_default_kit_command_rejected(self):
  r=subprocess.run([sys.executable,str(ROOT/'scripts/production.py'),'init','--episode','unused','--kit','blackgold'],capture_output=True)
  self.assertNotEqual(r.returncode,0)

if __name__=='__main__':unittest.main()
