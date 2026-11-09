from pathlib import Path
import json,subprocess,hashlib,zipfile,re,shutil,os
P=Path(__file__).resolve().parent
tl=json.loads((P/'assets/timeline.json').read_text(encoding='utf-8'))
def run(args):return subprocess.run(args,check=True,capture_output=True,text=True,encoding='utf-8',errors='replace')
silent=P/'out/final-silent.mp4';voiced=P/'out/sample-with-audio.mp4'
def probe(path):return json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(path)]).stdout)
if probe(silent)['streams'][0]['pix_fmt']=='yuvj420p':
    master=P/'qa/render-full-range.mp4';shutil.copy2(silent,master)
    run(['ffmpeg','-v','error','-y','-i',str(master),'-vf','scale=in_range=pc:out_range=tv','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-color_range','tv','-an','-movflags','+faststart',str(silent)])
run(['ffmpeg','-v','error','-y','-i',str(silent),'-i',str(P/'assets/mix.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-af','apad','-t',str(tl['seconds']),'-movflags','+faststart',str(voiced)])
a=probe(silent);b=probe(voiced);v=a['streams'][0]
assert v['width']==1080 and v['height']==1920 and v['r_frame_rate']=='30/1' and int(v['nb_frames'])==tl['frames']
assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p'
assert len(a['streams'])==1 and not any(x['codec_type']=='audio' for x in a['streams'])
assert len([s for s in b['streams'] if s['codec_type']=='audio'])==1
assert abs(float(a['format']['duration'])-tl['seconds'])<.05
for file in [silent,voiced]:run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'])
cues=tl['cues'];assert all(0<=c['start']<c['end']<=tl['seconds'] for c in cues)
assert all(cues[i]['end']<=cues[i+1]['start'] for i in range(len(cues)-1))
orig=(P/'source/原始粘贴全文.txt').read_bytes();manifest=json.loads((P/'source/source-manifest.json').read_text(encoding='utf-8'))
assert hashlib.sha256(orig).hexdigest()==manifest['sha256']
checks={'status':'technical_pass','width':1080,'height':1920,'fps':30,'duration':float(a['format']['duration']),'frames':int(v['nb_frames']),'videoCodec':v['codec_name'],'pixelFormat':v['pix_fmt'],'silentAudioTracks':0,'audioEditionTracks':1,'decode':'Both MP4 files fully decoded without FFmpeg errors','subtitleCues':len(cues),'subtitleTiming':'Real WordBoundary, ordered and within video','sourceChecksum':'Verified unchanged original','typecheck':'Passed tsc --noUnusedLocals before final render','speakerPlayback':False,'manualListening':False,'userAcceptance':'pending','fullFilm':'not_rendered','generalPipeline':'not_validated_on_multiple_articles','fontFailurePolicy':'cancelRender on any local font failure','bytes':{'silent':silent.stat().st_size,'withAudio':voiced.stat().st_size}}
(P/'qa/final-checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
stages={'article':{'status':'complete','outputs':['source/原文逐行编号.txt','source/正文工作本.txt','source/source-manifest.json'],'limitation':'原图、文章URL缺失；所选题不依赖原图'},'distillation':{'status':'complete','candidates':5,'selected':'降息，为什么不等于放水？','editorialReview':'human-user acceptance pending'},'script':{'status':'complete','claimsReviewed':12,'voiceScript':'source/完整口播稿.txt','fullVoice':'not_synthesized'},'storyboard':{'status':'complete','planDuration':65,'actualSampleDuration':tl['seconds'],'originalModel':'E1: two controls'},'continuousSample':{'status':'rendered_and_technically_checked','video':'out/final-silent.mp4','userAcceptance':'pending','manualListening':False}}
(P/'pipeline-status.json').write_text(json.dumps(stages,ensure_ascii=False,indent=2),encoding='utf-8')
run(['python',str(P/'make_report.py')])
entries=[]
for root,dirs,files in os.walk(P):
    dirs[:]=[d for d in dirs if d not in ['node_modules','.remotion','__pycache__']]
    for name in files:
        f=Path(root)/name
        if f.suffix=='.zip' or f.name.startswith('draft-') or f.name=='render-full-range.mp4':continue
        if f.name=='package-lock.json' or f.suffix in ['.tsx','.ts','.json','.txt','.html','.py','.ps1','.mjs','.srt','.mp4','.wav','.mp3','.woff','.jpg','.png','.md'] or f.name=='WEILANX-LICENSE':entries.append(f)
with zipfile.ZipFile(P/'五步执行包.zip','w',zipfile.ZIP_DEFLATED,compresslevel=4) as z:
    for f in entries:z.write(f,f.relative_to(P).as_posix())
print(json.dumps(checks,ensure_ascii=False));print('packaged',len(entries),'files')
