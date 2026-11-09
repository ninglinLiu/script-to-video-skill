from pathlib import Path
import subprocess,json,re
P=Path(__file__).resolve().parent
cmd=['ffmpeg','-hide_banner','-y','-i',str(P/'assets/voice-track.wav'),'-i',str(P/'assets/music-track.wav'),'-i',str(P/'assets/sfx-track.wav'),'-filter_complex','[0:a]loudnorm=I=-17:TP=-3:LRA=7[v];[v][1:a][2:a]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.891:level=0[out]','-map','[out]','-ar','48000','-ac','2',str(P/'assets/premix.wav')]
subprocess.run(cmd,check=True,capture_output=True)
probe=subprocess.run(['ffmpeg','-hide_banner','-i',str(P/'assets/premix.wav'),'-af','loudnorm=I=-14:TP=-1:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
measure=json.loads(re.findall(r'\{\s*"input_i".*?\}',probe.stderr,re.S)[-1])
af='loudnorm=I=-14:TP=-1:LRA=9:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=true:print_format=json'.format(**measure)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(P/'assets/premix.wav'),'-af',af,'-ar','48000','-ac','2',str(P/'assets/mix.wav')],check=True)
r=subprocess.run(['ffmpeg','-hide_banner','-i',str(P/'assets/mix.wav'),'-af','loudnorm=I=-14:TP=-1:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
m=json.loads(re.findall(r'\{\s*"input_i".*?\}',r.stderr,re.S)[-1]);(P/'qa/audio-master.json').write_text(json.dumps({'measurement':m,'speakerPlayback':False,'listeningReview':'not_performed','source':'weilanx synth.mjs and bgm.mjs; Yunxi whole paragraph'},indent=2),encoding='utf-8');print(json.dumps(m))
