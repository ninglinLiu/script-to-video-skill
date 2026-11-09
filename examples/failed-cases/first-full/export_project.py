from pathlib import Path
from xml.etree import ElementTree as ET
from urllib.parse import urlparse,unquote
import json,subprocess,csv
P=Path(__file__).resolve().parent;T=json.loads((P/'assets/timeline.json').read_text(encoding='utf-8'));frames=round(T['duration']*30)
# Adapted from the existing pipeline.premiere_project exporter: real motion clips and independent stereo stems.
root=ET.Element('xmeml',version='5');seq=ET.SubElement(root,'sequence',id='sequence-1')
def el(parent,k,v):ET.SubElement(parent,k).text=str(v)
def rate(parent):r=ET.SubElement(parent,'rate');el(r,'timebase',30);el(r,'ntsc','FALSE')
el(seq,'name',T['title']);el(seq,'duration',frames);rate(seq)
media=ET.SubElement(seq,'media');video=ET.SubElement(media,'video');fmt=ET.SubElement(video,'format');sc=ET.SubElement(fmt,'samplecharacteristics');rate(sc)
for k,v in [('width',1080),('height',1920),('anamorphic','FALSE'),('pixelaspectratio','square'),('fielddominance','none')]:el(sc,k,v)
track=ET.SubElement(video,'track');counter=0
def clip(track,name,path,start,end,is_video=False):
    global counter
    counter+=1;c=ET.SubElement(track,'clipitem',id=f'clip-{counter}');el(c,'name',name);el(c,'enabled','TRUE');el(c,'duration',end-start);rate(c)
    for k,v in [('start',start),('end',end),('in',0),('out',end-start)]:el(c,k,v)
    f=ET.SubElement(c,'file',id=f'file-{counter}');el(f,'name',path.name);el(f,'pathurl',path.resolve().as_uri());el(f,'duration',end-start);rate(f);fm=ET.SubElement(f,'media')
    if is_video:
        vm=ET.SubElement(fm,'video');s=ET.SubElement(vm,'samplecharacteristics');rate(s)
        for k,v in [('width',1080),('height',1920),('pixelaspectratio','square'),('fielddominance','none')]:el(s,k,v)
    else:
        am=ET.SubElement(fm,'audio');s=ET.SubElement(am,'samplecharacteristics');el(s,'depth',16);el(s,'samplerate',48000);el(am,'channelcount',2)
        st=ET.SubElement(c,'sourcetrack');el(st,'mediatype','audio');el(st,'trackindex',1)
    assert path.exists(),path
for i,ch in enumerate(T['chapters']):
    path=P/f'out/scene_{i+1:02}.mp4';a=round(ch['start']*30);b=round(ch['end']*30)
    meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=nb_frames','-of','json',str(path)],text=True));assert int(meta['streams'][0]['nb_frames'])==b-a
    clip(track,f"{i+1:02} / {ch['title']}",path,a,b,True)
audio=ET.SubElement(media,'audio');el(audio,'numOutputChannels',2)
for name,stem in [('旁白','voice-track'),('音乐','music-track'),('音效','sfx-track')]:
    at=ET.SubElement(audio,'track',premiereTrackType='Stereo');clip(at,name,P/f'assets/{stem}.wav',0,frames)
ET.indent(root);ET.ElementTree(root).write(P/'project/premiere.xml',encoding='utf-8',xml_declaration=True)
tree=ET.parse(P/'project/premiere.xml');assert len(tree.findall('.//pathurl'))==13
assert [int(c.findtext('start')) for c in tree.findall('./sequence/media/video/track/clipitem')]==[round(c['start']*30) for c in T['chapters']]
(P/'qa/project.json').write_text(json.dumps({'xml_parse':'passed','video_clips':10,'independent_stereo_stems':3,'subtitle_import':'out/subtitles.srt, separate','all_media_exist':True,'video_frame_counts_match':True,'editor_import':'not verified; no installed Premiere was found at the standard path'},ensure_ascii=False,indent=2),encoding='utf-8')
with (P/'source/sources.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.writer(f);w.writerow(['item','type','source','usage'])
    w.writerow(['文章','用户提供原文', 'https://mp.weixin.qq.com/s/ywlZ9BKrsn1yA8V6ugmgnA','第一、四、五节及DYOR；转述作者观点'])
    w.writerow(['环境/企业/屋顶/人物/镜框','既有生成素材','source/reused-image-prompts.json 和 source/reused-lens-prompt.txt','同一已确认视觉资产'])
    w.writerow(['研究笔记','本轮内置image_gen生成','source/notebook-prompt.json','独立透明道具；文字用Canvas绘制'])
    w.writerow(['Vastness / Andrew Ev','既有音乐素材','https://assets.mixkit.co/music/184/184.mp3','许可记录 https://mixkit.co/license/#musicFree'])
    w.writerow(['Noto Sans/Serif SC','既有本地字体','assets/*.ttf','延续已确认样片字体'])
    w.writerow(['旁白','Edge TTS','zh-CN-YunxiNeural +12%','整段合成，真实词界'])
    w.writerow(['音效/动画/标签','代码制作','film.js 与 mix_audio.py','确定性图形；流程和场景示意'])
with (P/'source/source-mapping.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.writer(f);w.writerow(['chapter','start','end','source','narration'])
    for ch in T['chapters']:w.writerow([ch['id'],ch['start'],ch['end'],ch['source'],''.join(ch['cues'])])
print('Editable XML: 10 motion clips + three stereo stems; SRT separate. Structural checks passed.')
