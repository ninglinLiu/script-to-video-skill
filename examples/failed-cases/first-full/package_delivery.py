from pathlib import Path
from datetime import datetime,timezone
import json,csv,zipfile
P=Path(__file__).resolve().parent
r=json.loads((P/'qa/run-start.json').read_text(encoding='utf-8'))
finish=datetime.now(timezone.utc);start=datetime.fromisoformat(r['started_utc']);seconds=round((finish-start).total_seconds())
with (P/'成本与效率.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.writer(f);w.writerow(['项目','实际记录','说明'])
    w.writerow(['制作开始UTC',r['started_utc'],'从本次完整短片授权后的制作开始计'])
    w.writerow(['打包时间UTC',finish.isoformat(),'不含之前构思和样片制作耗时'])
    w.writerow(['本轮历时秒',seconds,'含编排、生成、修正、渲染、检查和工程整理'])
    w.writerow(['图像生成成功请求',1,'研究笔记；其余五件图像复用已确认素材'])
    w.writerow(['整段配音成功请求',1,'Yunxi +12%；后续重复运行命中缓存'])
    w.writerow(['外部视频模型调用',0,'沿用本地Canvas/Puppeteer/FFmpeg渲染'])
    w.writerow(['API费用','未知','图像工具与配音服务没有返回单次账单，不记为0'])
    w.writerow(['新增素材购买','无','复用已有音乐与字体，没有新增购买操作'])
    w.writerow(['人工费用','未知','没有人工计费信息'])
    w.writerow(['用户人工介入次数',0,'本次完整制作期间没有追加选择或审批；初始授权不计为返工'])
    w.writerow(['制作方修正',len(r['agent_corrections']),'；'.join(r['agent_corrections'])])
    w.writerow(['主动停止重渲',1,r['render_restart']['reason']])
    w.writerow(['低清完整预览渲染秒',61.1,'540×960，单时间样本'])
    w.writerow(['高清渲染记录','见 qa/render-log.txt','1080×1920，每帧三个时间样本；10个动画片段'])
    w.writerow(['应用内实时播放与独立人工听音','未验证','已做完整解码、音频测量和画面连续帧检查'])
files=[]
for folder in ['source','project']:
    files.extend(p for p in (P/folder).rglob('*') if p.is_file())
for n in ['BRIEF.txt','打开与修改说明.txt','成本与效率.csv','index.html','film.js','timeline.js','prepare_audio.py','mix_audio.py','render.mjs','run.ps1','export_project.py','qa_video.py','review_frames.py','package_delivery.py']:
    files.append(P/n)
files.extend(p for p in (P/'assets').iterdir() if p.suffix in ['.png','.ttf','.mp3','.json'] or p.name.endswith('-track.wav'))
files.extend(p for p in (P/'out').iterdir() if p.name.startswith('scene_') and p.suffix in ['.mp4','.json'] or p.name in ['subtitles.srt','subtitles.ass'])
files.extend(p for p in (P/'qa').iterdir() if p.name in ['final.json','project.json','review.txt','audio-master.json','voice-production.json','run-start.json','render-log.txt','final-sheet.jpg'])
archive=P/'out/完整工程与素材.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=3) as z:
    for p in files:
        assert p.exists(),p
        z.write(p,Path(P.name)/p.relative_to(P))
with zipfile.ZipFile(archive) as z:
    bad=z.testzip();assert bad is None,bad
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'files':len(files),'elapsed_seconds':seconds},ensure_ascii=False))
