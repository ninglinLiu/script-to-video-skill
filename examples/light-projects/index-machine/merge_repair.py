from pathlib import Path
import json,subprocess,shutil
P=Path(__file__).resolve().parent
r=json.loads((P/'qa/valuation-repair.json').read_text(encoding='utf-8'));tl=json.loads((P/'assets/timeline.json').read_text(encoding='utf-8'))
raw=P/'qa/render-full-range.mp4';repair=P/'qa/valuation-repair.mp4';new=P/'qa/render-repaired.mp4'
flt=f"[0:v]trim=start_frame=0:end_frame={r['from']},setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[0:v]trim=start_frame={r['to']+1}:end_frame={tl['frames']},setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0,setpts=N/(30*TB),format=yuvj420p[v]"
subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw),'-i',str(repair),'-filter_complex',flt,'-map','[v]','-an','-r','30','-c:v','libx264','-preset','fast','-crf','0','-pix_fmt','yuvj420p','-color_range','pc',str(new)],check=True)
n=int(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-count_frames','-show_entries','stream=nb_read_frames','-of','default=nw=1:nk=1',str(new)],text=True))
assert n==tl['frames'],n
shutil.copy2(raw,P/'qa/pre-rounding-fix.mp4');new.replace(raw)
(P/'qa/partial-repair.json').write_text(json.dumps({'range':r,'framesAfterMerge':n,'method':'frame-accurate trim + lossless H264 concat; final master re-encoded once','originalRawPreserved':True},indent=2),encoding='utf-8')
print('Merged repaired segment with exact frame count',n,flush=True)
