from pathlib import Path
import json,subprocess,hashlib,shutil,sys,zipfile
from xml.etree import ElementTree as E

P=Path(__file__).resolve().parent;R=P.parent;B=R.parent
def call(args):
 r=subprocess.run([str(a) for a in args],capture_output=True,encoding='utf-8',errors='replace',timeout=600)
 if r.returncode:raise RuntimeError(r.stderr[-5000:])
 return r
def probe(p):return json.loads(call(['ffprobe','-v','error','-show_streams','-show_format','-of','json',p]).stdout)
v=P/'out/revision_full.mp4';t=json.loads((P/'assets/timeline.json').read_text(encoding='utf-8-sig'))
j=probe(v);vs=next(s for s in j['streams'] if s['codec_type']=='video');a=next(s for s in j['streams'] if s['codec_type']=='audio')
checks={'size':(vs['width'],vs['height'])==(1080,1920),'duration':abs(float(j['format']['duration'])-66.2)<.1,'fps':vs['r_frame_rate']=='30/1','bitrate':int(vs.get('bit_rate',0))>=8000000,'audio':a['codec_name']=='aac','av_end':abs(float(vs['duration'])-float(a['duration']))<.1}
q=call(['ffmpeg','-v','info','-i',v,'-vf','blackdetect=d=0.25:pix_th=0.03:pic_th=0.98','-af','silencedetect=n=-50dB:d=1.3','-f','null','-']);(P/'qa/full-decode.log').write_text(q.stderr,encoding='utf-8')
checks.update({'full_decode':True,'no_black_250ms':'black_start:' not in q.stderr,'no_silence_1300ms':'silence_start:' not in q.stderr})
report={'status':'revision_candidate','technical_passed':all(checks.values()),'checks':checks,'duration':j['format']['duration'],'video_bitrate':vs['bit_rate'],'sha256':hashlib.sha256(v.read_bytes()).hexdigest(),'aesthetic_acceptance':'not claimed; prior version rejected','audio_review':'-16.1 LUFS, -1.0 dBTP measured; no human listening certification','editor_import':'XML structure only; Premiere not opened'}
(P/'qa/final.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
if not report['technical_passed']:raise RuntimeError(str(checks))
call(['ffmpeg','-v','error','-y','-i',v,'-vf','fps=12/66.2,scale=270:480,tile=4x3','-frames:v','1',P/'qa/final-contact.png'])
call(['ffmpeg','-v','error','-y','-ss','6','-i',v,'-vf','scale=360:640','-frames:v','1',P/'qa/phone.png'])
# Editable scene cuts reference the real animation, rather than rejected still cards.
root=E.Element('xmeml',version='5');seq=E.SubElement(root,'sequence',id='revision-1')
def el(p,k,v):E.SubElement(p,k).text=str(v)
def rate(p):r=E.SubElement(p,'rate');el(r,'timebase',30);el(r,'ntsc','FALSE')
el(seq,'name',t['title']+' / 返工版');el(seq,'duration',1986);rate(seq)
media=E.SubElement(seq,'media');video=E.SubElement(media,'video');fmt=E.SubElement(E.SubElement(video,'format'),'samplecharacteristics');rate(fmt)
for k,val in [('width',1080),('height',1920),('pixelaspectratio','square'),('fielddominance','none')]:el(fmt,k,val)
track=E.SubElement(video,'track')
for i,s in enumerate(t['scenes']):
 c=E.SubElement(track,'clipitem',id=f'scene-{i+1}');el(c,'name',s['kind']);rate(c);el(c,'enabled','TRUE');el(c,'duration',1986)
 for k,val in [('start',round(s['start']*30)),('end',round(s['end']*30)),('in',round(s['start']*30)),('out',round(s['end']*30))]:el(c,k,val)
 f=E.SubElement(c,'file',id='animation-master');el(f,'name',v.name);el(f,'pathurl',v.as_uri());rate(f);el(f,'duration',1986)
 sm=E.SubElement(E.SubElement(E.SubElement(f,'media'),'video'),'samplecharacteristics');rate(sm);el(sm,'width',1080);el(sm,'height',1920)
aud=E.SubElement(media,'audio');el(aud,'numOutputChannels',2);at=E.SubElement(aud,'track');c=E.SubElement(at,'clipitem',id='master-audio');el(c,'name','已混合音轨（独立旁白与音乐另附）');rate(c)
for k,val in [('start',0),('end',1986),('in',0),('out',1986),('duration',1986)]:el(c,k,val)
f=E.SubElement(c,'file',id='audio-master');el(f,'name','mix.wav');el(f,'pathurl',(P/'assets/mix.wav').as_uri());rate(f);el(f,'duration',1986)
am=E.SubElement(E.SubElement(f,'media'),'audio');sc=E.SubElement(am,'samplecharacteristics');el(sc,'depth',16);el(sc,'samplerate',48000);el(am,'channelcount',1);src=E.SubElement(c,'sourcetrack');el(src,'mediatype','audio');el(src,'trackindex',1)
E.indent(root);E.ElementTree(root).write(P/'premiere.xml',encoding='utf-8',xml_declaration=True)
E.parse(P/'premiere.xml')
old=R/'runs/20261017_125223_3e1da7'
for n in ('original.txt','script.txt','content_check.json','input.json'):shutil.copy2(old/n,P/n)
source=json.loads((P/'sources.json').read_text(encoding='utf-8'));source['final_renderer']={'file':'render_existing.mjs','derived_from':'vibe-knowledge-test/productions/poisson_90s/render.mjs','changes':['portrait dimensions','local composition URL','duration','output paths','9Mbps target','exit timeout']};(P/'sources.json').write_text(json.dumps(source,ensure_ascii=False,indent=2),encoding='utf-8')
(P/'README.txt').write_text('视频类第一周 / 返工候选版\n\n旧卡片版已被用户否决。此版技术检查通过，不代表用户审美验收。\n\n观看 out/revision_full.mp4；两个12秒方向在previews。\n可编辑画面源文件：index.html、film.js、timeline.js。\n素材：assets；原文与旁白稿附在根目录。\nPremiere XML切分为7个真实动画片段并带混合音轨，可改镜头次序、时长和替换素材。它不是逐个矢量对象的Premiere原生工程。改画面文字或图形请编辑HTML/JS重渲；字幕已烧录，另附SRT。没有实际打开Premiere验证导入。XML路径指向本机工程，移动目录后需重新链接。\n\n本片复渲：powershell -File run.ps1\n该入口复渲当前稿件，非任意新文章自动编排服务。修改旁白需先生成对应时间线并重新编排，不得只更换WAV。\n\n完整复用审计见REUSE_AUDIT.txt；制作与审看见BRIEF.txt、qa/review.txt。\n',encoding='utf-8')
(R/'latest.json').write_text(json.dumps({'status':'revision_candidate','run':str(P),'video':str(v),'qa':str(P/'qa/final.json'),'prior_version':'rejected by user'},ensure_ascii=False,indent=2),encoding='utf-8')
(R/'delivery/视频类第一周_旧版已否决.txt').write_text('此前的 视频类第一周交付.zip 为被用户否决的历史卡片版，不再作为通过验收的交付。修订版见 视频类第一周_返工候选版.zip。',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
