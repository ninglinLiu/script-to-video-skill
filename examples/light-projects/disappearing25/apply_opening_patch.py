from pathlib import Path
import shutil,subprocess
P=Path(__file__).resolve().parent
old=P/'qa/final-before-opening-patch.mp4'
if not old.exists():shutil.copy2(P/'out/final-silent.mp4',old)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(old),'-i',str(P/'qa/opening-patch.mp4'),'-filter_complex','[0:v]split=2[a][b];[a]trim=start_frame=0:end_frame=150,setpts=PTS-STARTPTS[a0];[1:v]setpts=PTS-STARTPTS[p];[b]trim=start_frame=270:end_frame=1800,setpts=PTS-STARTPTS[a1];[a0][p][a1]concat=n=3:v=1:a=0[out]','-map','[out]','-an','-c:v','libx264','-crf','18','-preset','medium','-threads','4','-pix_fmt','yuv420p','-r','30','-movflags','+faststart',str(P/'out/final-silent.mp4')],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(P/'out/final-silent.mp4'),'-i',str(P/'assets/mix.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-t','60','-movflags','+faststart',str(P/'out/消失的25元-60秒-带声音.mp4')],check=True)
print('Replaced frames 150–269; audio unchanged; original retained in qa.')
