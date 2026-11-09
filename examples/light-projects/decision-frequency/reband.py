from pathlib import Path
import subprocess,json
P=Path(__file__).resolve().parent
band=P/'qa/subtitle-band.mp4';base=P/'out/final-silent.mp4';dest=P/'out/caption-repaired.mp4'
probe=lambda p:json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(p)]))
b=probe(band)['streams'][0]
vf='scale=in_range=pc:out_range=tv,format=yuv420p' if b.get('color_range')=='pc' else 'format=yuv420p'
subprocess.run(['ffmpeg','-v','error','-y','-i',str(base),'-i',str(band),'-filter_complex',f'[1:v]{vf}[b];[0:v][b]overlay=0:1564:shortest=1[v]','-map','[v]','-an','-c:v','libx264','-preset','fast','-b:v','8500k','-minrate','8500k','-maxrate','8500k','-bufsize','17000k','-x264-params','nal-hrd=cbr:filler=1','-pix_fmt','yuv420p','-color_range','tv','-movflags','+faststart',str(dest)],check=True)
a=probe(dest)['streams'][0];assert a['width']==1080 and a['height']==1920 and a['nb_frames']=='5204'
dest.replace(base)
(P/'qa/subtitle-layer-repair.json').write_text(json.dumps(dict(method='Re-render 1080x356 caption band and composite at y1564; main animation and voice reused',frames=5204,source='工程/src/Captions.tsx',newWholeFilmRenderRequired=False),ensure_ascii=False,indent=2),encoding='utf-8')
print('Subtitle layer replaced; original body animation reused')
