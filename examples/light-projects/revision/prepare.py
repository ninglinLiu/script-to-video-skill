from pathlib import Path
import json, shutil, subprocess

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT.parent
HERE=Path(__file__).resolve().parent
OLD=ROOT/'runs/20261017_125223_3e1da7'
for part in ('assets','previews','out','qa'):(HERE/part).mkdir(exist_ok=True)
for n in ('NotoSansSC-VF.ttf','NotoSerifSC-VF.ttf'):
    shutil.copy2(BASE/'vibe-knowledge-test/productions/opus_poisson_30s/assets/fonts'/n,HERE/'assets'/n)
for n in ('narration.wav','subtitles.srt','timeline.json','source_mapping.csv'):
    if (OLD/n).exists():shutil.copy2(OLD/n,HERE/'assets'/n)
shutil.copy2(BASE/'travel-content-test/assets/music/vastness.mp3',HERE/'assets/vastness.mp3')
data=json.loads((OLD/'timeline.json').read_text(encoding='utf-8-sig'))
(HERE/'timeline.js').write_text('window.FILM='+json.dumps(data,ensure_ascii=False)+';',encoding='utf-8')
for p in [ROOT/'docs/第一周交付报告.txt',ROOT/'delivery/video-week1/docs/第一周交付报告.txt']:
    if p.exists():
        text=p.read_text(encoding='utf-8-sig')
        if not text.startswith('【状态更正'):
            p.write_text('【状态更正 / 2026-10-17】用户已否决本版视觉效果。以下为历史技术交付记录，不代表第一周内容和审美验收完成。返工见 video-week1/revision。\n\n'+text,encoding='utf-8')
req=ROOT/'docs/任务要求.txt'
s=req.read_text(encoding='utf-8-sig')
s=s.replace('未找到已安装的script-to-video SKILL.md；因此新建可复用技能与独立流水线，不声称修改了未发现的旧Skill。','纠错：只检查全局 Skill 列表不足以判断没有旧流程。既有 HyperFrames 工程、泊松逐帧渲染与 xilo 复盘都可复用。首轮另建静态卡片模板的判断错误。')
req.write_text(s,encoding='utf-8')
commit=subprocess.check_output(['git','-C',str(ROOT/'vendor/xilo-opus-video'),'rev-parse','HEAD'],text=True).strip()
(HERE/'sources.json').write_text(json.dumps({'renderer':{'repository':'https://github.com/Kianzzz/xilo-opus-video','commit':commit,'file':'skills/xilo-opus-video/scripts/render.py','modified':False},'fonts':'../vibe-knowledge-test/productions/opus_poisson_30s/assets/fonts','music':{'title':'Vastness','artist':'Andrew Ev','source':'https://assets.mixkit.co/music/184/184.mp3','license':'https://mixkit.co/license/#musicFree'},'narration':'reused from first render; not newly synthesized','article':'https://mp.weixin.qq.com/s/ywlZ9BKrsn1yA8V6ugmgnA','visuals':'new authored composition; structural method from xilo and existing Poisson project'},ensure_ascii=False,indent=2),encoding='utf-8')
print('Prepared reused assets and corrected rejected status.')
