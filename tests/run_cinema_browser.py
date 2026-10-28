"""Opt-in real-browser regression: two inputs, original scenes, silent encode, caption pixels.

Run from a cloned skill: python tests/run_cinema_browser.py --workdir /empty/test-folder
Installs the pinned runtime dependencies via npm ci. No TTS, playback or upload.
"""
import argparse,importlib.util,json,os,shutil,subprocess,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
def module(name):
    s=importlib.util.spec_from_file_location(name,ROOT/'scripts'/f'{name}.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
cinema=module('cinema');delivery=module('film_delivery')
def run(args,cwd=None):
    r=subprocess.run(args,cwd=cwd,env={**os.environ,'PYTHON':sys.executable},capture_output=True,text=True,encoding='utf8')
    if r.returncode:raise RuntimeError(r.stdout+r.stderr)
    return r.stdout
def main(root):
    root=Path(root).resolve()
    if root.exists() and any(root.iterdir()):raise ValueError('Test directory must be empty; no existing work is overwritten')
    root.mkdir(parents=True,exist_ok=True);results=[]
    for name in ['sampling','queue']:
        ep=root/name;cinema.init(ep)
        for suffix,dest in [('film','source/film.json'),('timeline','assets/timeline.json')]:shutil.copy2(ROOT/f'assets/poisson-cinema/fixtures/{name}-{suffix}.json',ep/dest)
        cinema.compile_episode(ep)
        run([shutil.which('npm.cmd' if os.name=='nt' else 'npm'),'ci','--ignore-scripts','--no-audit','--no-fund'],ep/'工程')
        run(['node','render.mjs','probe'],ep/'工程')
        report=cinema.read(ep/'qa/cinema-motion.json')
        assert report['passed'] and len(report['shots'])==7 and len(report['seams'])==6
        film=cinema.read(ep/'source/film.json');bars=report['shots'][2]['samples'][-1]['objects']
        actual=[x['value'] for x in bars if x['kind']=='bar'];data=film['shots'][2]['data']
        assert actual==[data['samples'].count(i) for i in range(len(data['labels']))],(actual,data)
        windows=report['shots'][3]['samples'][-1]['objects'];widths=[x['value']['width'] for x in windows if x['kind']=='window']
        values=film['shots'][3]['data']['values'];assert abs(widths[0]/widths[1]-values[0]/values[1])<1e-6
        # A small silent encoding tests the actual subtitle pixels without pretending to make a film.
        run(['node','render.mjs','proof','0','3'],ep/'工程')
        stamp=report['shots'][0]['samples'][1]['time'];frame=round(stamp*30)
        # Rendered probe time need not lie exactly on a 30fps frame: use an exact-time capture below.
        # The caption is static across this interval; compare only its region.
        actual_png=ep/'qa/encoded-caption.png'
        run(['ffmpeg','-v','error','-y','-i',str(ep/'qa/proof.mp4'),'-vf',f'select=eq(n\\,{frame})','-frames:v','1',str(actual_png)])
        expected=Image.open(ep/report['shots'][0]['samples'][1]['frame']).convert('RGB')
        # Here "without" is an intentionally absent caption plate, used only as a negative test.
        # Production verification uses true render-on/off counterparts from full rendering.
        without=expected.copy();without.paste((0,0,0),(150,924,1770,1052))
        pixels=delivery.pixel_check(Image.open(actual_png),expected,without,[150,924,1620,128])
        assert pixels['passed'],pixels
        removed=Image.open(actual_png).convert('RGB');removed.paste((0,0,0),(150,924,1770,1052))
        assert not delivery.pixel_check(removed,expected,without,[150,924,1620,128])['passed']
        try:cinema.check(ep)
        except ValueError as e:assert 'Synthetic' in str(e)
        else:raise AssertionError('Fixture passed production gate')
        if name=='sampling':
            run(['node','render.mjs','baseline'],ep/'工程')
            assert len(cinema.read(ep/'qa/original-baseline.json')['frames'])==9
        results.append({'input':name,'shots':7,'seams':6,'pixelCaptionPassed':pixels['passed'],'missingCaptionRejected':True,
                        'countsMatchSamples':actual,'windowWidthRatio':widths[0]/widths[1],
                        'finalHistogramPixelSha256':report['shots'][2]['samples'][-1]['subjectSha256'],
                        'fixtureRejectedForProduction':True})
    assert results[0]['finalHistogramPixelSha256']!=results[1]['finalHistogramPixelSha256']
    record={'status':'passed','inputs':results,'originalScenesRendered':9,'speakerPlayback':False,'externalTTS':False,
            'independentModelTest':False,'aestheticAcceptance':False,'scope':'Two distinct data sets, seven live recipes, actual carry seam, bar data, scale ratio, encoded caption and negative controls; no finished content film'}
    cinema.write(root/'result.json',record);print(json.dumps(record,ensure_ascii=False,indent=2))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--workdir',required=True);main(p.parse_args().workdir)
