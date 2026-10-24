"""Create a machine-local FCP7 exchange timeline; never launches an editor."""
from pathlib import Path
import json, subprocess, xml.etree.ElementTree as ET

P=Path(__file__).resolve().parent
T=json.loads((P/'assets/timeline.json').read_text(encoding='utf-8'))
def node(parent,tag,value=None,**attrs):
    e=ET.SubElement(parent,tag,attrs)
    if value is not None:e.text=str(value)
    return e
def rate(parent):
    r=node(parent,'rate');node(r,'timebase',30);node(r,'ntsc','FALSE')
def clip(track,name,path,start,end,audio=False,channel=1):
    c=node(track,'clipitem',id=name)
    node(c,'name',path.name);rate(c)
    for key,value in [('start',start),('end',end),('in',0),('out',end-start),('duration',end-start)]:node(c,key,value)
    f=node(c,'file',id=name+'-file');node(f,'name',path.name);node(f,'pathurl',path.resolve().as_uri());rate(f);node(f,'duration',end-start)
    media=node(f,'media')
    if audio:
        a=node(media,'audio');sc=node(a,'samplecharacteristics');node(sc,'samplerate',48000);node(sc,'depth',16);node(a,'channelcount',2)
    else:
        v=node(media,'video');sc=node(v,'samplecharacteristics');rate(sc);node(sc,'width',1920);node(sc,'height',1080);node(sc,'pixelaspectratio','square');node(sc,'fielddominance','none')
    src=node(c,'sourcetrack');node(src,'mediatype','audio' if audio else 'video');node(src,'trackindex',channel)
    return c

def main():
    required=[P/'assets/voice-track.wav',P/'out/subtitles.srt']+[P/f'native/segments/{ch["id"]}.mp4' for ch in T['chapters']]
    missing=[p.name for p in required if not p.exists()]
    if missing:raise FileNotFoundError(', '.join(missing))
    root=ET.Element('xmeml',version='5');seq=node(root,'sequence',id='chapter-01');node(seq,'name','回本以后 — 章节分轨');node(seq,'duration',T['frames']);rate(seq)
    media=node(seq,'media');video=node(media,'video');fmt=node(video,'format');sc=node(fmt,'samplecharacteristics');rate(sc)
    for k,v in [('width',1920),('height',1080),('pixelaspectratio','square'),('fielddominance','none')]:node(sc,k,v)
    vt=node(video,'track')
    for ch in T['chapters']:
        start,end=round(ch['start']*30),round(ch['end']*30)
        path=P/f'native/segments/{ch["id"]}.mp4'
        probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(path)],text=True))
        stream=next(s for s in probe['streams'] if s['codec_type']=='video')
        if int(stream.get('nb_frames',end-start)) != end-start:raise ValueError('Stale segment: '+ch['id'])
        clip(vt,ch['id'],path,start,end)
    audio=node(media,'audio')
    for channel in [1,2]:clip(node(audio,'track'),f'voice-{channel}',P/'assets/voice-track.wav',0,T['frames'],True,channel)
    markers=node(seq,'marker');node(markers,'name','SRT另行导入；此XML为交换时间线');node(markers,'in',0);node(markers,'out',-1)
    ET.indent(root)
    (P/'native/timeline.xml').write_bytes(b'<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n'+ET.tostring(root,encoding='utf-8'))
    print('Created native/timeline.xml with local media paths; no editor opened.')
if __name__=='__main__':main()
