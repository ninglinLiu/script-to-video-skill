"""配乐工具的确定性回归：用合成素材，不放声音，不联网。只查信号和报告，不判断听感。"""
from pathlib import Path
import importlib.util
import json
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('mix_music', ROOT / 'scripts/mix_music.py')
mix_music = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mix_music)
HAS_FFMPEG = bool(shutil.which('ffmpeg') and shutil.which('ffprobe'))


def ff(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True, capture_output=True)


@unittest.skipUnless(HAS_FFMPEG, '需要 ffmpeg')
class Mix(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dir = Path(tempfile.mkdtemp())
        cls.video = cls.dir / 'video.mp4'
        cls.voice = cls.dir / 'voice.wav'
        cls.music = cls.dir / 'music.wav'
        cls.short = cls.dir / 'short.wav'
        ff('-f', 'lavfi', '-i', 'color=c=white:s=64x64:r=10:d=8', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', str(cls.video))
        # 旁白：前 4 秒有声，后 4 秒安静。sine 默认振幅 0.125，RMS 约 0.088，高于避让阈值 0.035
        ff('-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=8', '-af', "volume='if(lt(t,4),1,0)':eval=frame", '-ac', '2', str(cls.voice))
        ff('-f', 'lavfi', '-i', 'anoisesrc=color=pink:sample_rate=48000:duration=20:seed=7:amplitude=0.2', '-ac', '2', str(cls.music))
        ff('-f', 'lavfi', '-i', 'anoisesrc=color=pink:sample_rate=48000:duration=3:seed=7:amplitude=0.2', '-ac', '2', str(cls.short))
        cls.result = mix_music.mix(cls.video, cls.voice, cls.music, cls.dir / 'out.mp4', cls.dir / 'report.json', music_lufs=-29)
        cls.levels = json.loads((cls.dir / 'report.json.levels.json').read_text('utf-8'))

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.dir, ignore_errors=True)

    def test_picture_is_untouched_and_report_says_nothing_about_listening(self):
        self.assertTrue(self.result['originalVideoStreamPreserved'])
        self.assertFalse(self.result['speakerPlayback'])
        self.assertFalse(self.result['manualListening'])

    def test_report_records_the_recipe(self):
        r = self.result
        self.assertEqual(r['musicTargetLUFS'], -29)
        self.assertEqual((r['fadeInSeconds'], r['fadeOutSeconds']), (.25, 1.2))
        self.assertEqual((r['masterTargetLUFS'], r['masterTruePeakCeilingDBTP']), (-16, -1.5))
        self.assertEqual(r['ducking'], dict(threshold=.035, ratio=8, attackMs=15, releaseMs=350, sidechainSource='--voice 整轨（旁白 + 音效）'))

    def test_music_ducks_only_while_voice_is_active(self):
        m = self.result['duckingMeasured']
        self.assertGreater(m['reductionWhileVoiceDB'], 2)
        self.assertLess(abs(m['reductionWhileQuietDB']), 1)

    def test_music_fades_in_and_out(self):
        bed = self.levels['bed']
        self.assertLess(bed[0], bed[10] - 3)
        self.assertLess(bed[-1], bed[-20] - 3)

    def test_music_only_film_reaches_master_loudness_and_keeps_picture(self):
        r = mix_music.mix(self.video, None, self.music, self.dir / 'only.mp4', self.dir / 'only.json')
        self.assertTrue(r['musicOnly'])
        self.assertIsNone(r['ducking'])
        self.assertTrue(r['originalVideoStreamPreserved'])
        self.assertEqual((r['masterTargetLUFS'], r['fadeInSeconds'], r['fadeOutSeconds']), (-14, .5, 3.0))
        self.assertLess(abs(r['measuredIntegratedLUFS'] + 14), 2.5)
        self.assertLess(r['measuredTruePeakDBTP'], -1)

    def test_short_music_is_refused_unless_looping_was_accepted(self):
        with self.assertRaisesRegex(ValueError, 'shorter than the video'):
            mix_music.mix(self.video, self.voice, self.short, self.dir / 'short.mp4', self.dir / 'short.json')

    def test_catalog_track_needs_the_matching_file(self):
        with self.assertRaisesRegex(ValueError, 'does not match the catalog hash'):
            mix_music.mix(self.video, self.voice, self.music, self.dir / 'wrong.mp4', self.dir / 'wrong.json', track='crypto-kevin-macleod')
        with self.assertRaisesRegex(ValueError, 'Unknown track'):
            mix_music.mix(self.video, self.voice, self.music, self.dir / 'wrong.mp4', self.dir / 'wrong.json', track='no-such-track')


if __name__ == '__main__':
    unittest.main()
