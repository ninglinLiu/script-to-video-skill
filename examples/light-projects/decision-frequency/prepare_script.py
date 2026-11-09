from pathlib import Path
import json,re
P=Path(__file__).resolve().parent
draft=(P/'source/draft.txt').read_text(encoding='utf-8')
parts=re.split(r'【([^｜]+)｜([^】]+)】\n',draft)
chapters=[]
for i in range(1,len(parts),3):
    ident,title,body=parts[i:i+3]
    tokens=re.findall(r'([^，。！？；：]+)([，。！？；：])',body.strip())
    assert ''.join(a+b for a,b in tokens)==body.strip(),body
    chapters.append(dict(id=ident,title=title,cues=[a for a,b in tokens],p=[b for a,b in tokens]))
spec=dict(title=parts[0].strip(),voice='zh-CN-YunxiNeural',rate='+25%',delay=.45,tail=1.1,subtitleMaxChineseChars=28,factsStatus='pending review',chapters=chapters)
(P/'source/script.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
print('Chinese chars',len(re.findall(r'[\u4e00-\u9fff]',''.join(''.join(c['cues']) for c in chapters))))
for c in chapters:print(c['id'],len(c['cues']),max(len(x) for x in c['cues']))
