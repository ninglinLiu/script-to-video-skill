from pathlib import Path
import json,shutil
P=Path(__file__).resolve().parent;old=P.parent/'article-studies-20261020'
for d in ['assets','vendor','source','qa','out']:(P/d).mkdir(exist_ok=True)
for d in ['assets','vendor']:
 for f in (old/d).rglob('*'):
  if not f.is_file() or f.name.startswith(('voice-','timeline-','mix-','sfx-')):continue
  dest=P/d/f.relative_to(old/d);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,dest)
for name in ['render.mjs','common.mjs','index.html','prepare_audio.py']:shutil.copy2(old/name,P/name)
s=(P/'prepare_audio.py').read_text(encoding='utf-8').replace('>10.25','>29.5').replace("'end':10.5","'end':30")
(P/'prepare_audio.py').write_text(s,encoding='utf-8')
data=[
 {'id':'editorial','short':'划掉499，199就便宜吗？','title':'一招破解:锚定效应 | 为什么你总是死扛亏损、等回本就卖与过早卖出大牛股？','rate':'+3%',
 'cues':['同一件衣服','标价四百九十九','现在只要一百九十九','你是不是先觉得','赚了三百','但你省下的钱','是和谁比出来的','那个先出现的数字','可能已经成了判断的锚','把原价拿掉','如果从没见过四百九十九','你还愿意付一百九十九吗','只看质量、同类价格','和你是否真的需要','折扣很大','不等于值得买'],
 'punctuation':['，','，','。','，','？','，','？','，','。','。','，','？','，','。','，','。'],
 'mapping':['在进行决策时，人类的大脑会过度依赖接收到的第一碎片信息（即“锚”）。','产品定价的“遮阳伞策略”'],
 'angle':'原创衣服售价情境演示初始价格作为参照；499/199是教学假设，不是文章数据或真实售价；不把锚定与诱饵效应混为一谈。'},
 {'id':'spatial','short':'100元没少，购买力去哪了？','title':'两个同样勤奋的人，为何十年后差100倍？','rate':'+8%',
 'cues':['账户里的一百元','一分没少','可同一个购物篮','越来越装不满','假设物价每年上涨百分之三','这笔钱既不花，也不赚利息','三十年后','它能买到的东西','大约只相当于今天的四十一元','钱的数量没变','能换到的东西变了','这只是一个假设','实际涨价并不会每年一样','看财富','别只看余额','也要看购买力'],
 'punctuation':['，','。','，','。','，','。','，','，','。','，','。','，','。','，','，','。'],
 'mapping':['钱不是财富本身，钱是购买力的载体。','每年2%-3%的CPI看起来不多，但30年后，你手里的100块只相当于今天的40-50块。'],
 'angle':'只取购买力段落。修正为固定3%且无利息的假设，100/(1.03)^30=41.19867595；购物篮以商品总量示意，不预测实际CPI，不推荐投资。'},
 {'id':'pixel','short':'忙了一天，为什么又从零开始？','title':'两个同样勤奋的人，为何十年后差100倍？','rate':'+6%',
 'cues':['今天做完十件事','明天又从零开始','你的努力','有没有留下能重复使用的东西','同样是整理资料','一次次复制粘贴','只能交付这一次','把步骤做成模板','下次就不用重新搭一遍','工具也要维护','把常做的事','变成可重复的步骤','但重复工作可以少一点','今天不只问','我完成了多少','再问一句','我留下了什么'],
 'punctuation':['，','。','，','？','，','，','。','，','。','，','，','。','。','，','？','，','？'],
 'mapping':['他们的“劳动成果”——一项投资、一个系统、一份资产——不需要他们亲自在线，也能持续产出。','你不需要辞职创业，不需要梭哈股市，不需要冒任何你无法承受的风险。'],
 'angle':'将文中的系统复用改编成资料整理工坊。计数十件只是原创故事设定，不是效率统计；没有自动赚钱、百倍财富或突破物理规律的暗示。'}
]
idx=json.loads((P.parent.parent/'vibe-knowledge-test/references/wechat/article_index.json').read_text(encoding='utf-8'))
for a in data:
 a.update(voice='zh-CN-YunxiNeural',voice_delay=.25,duration=30,source='用户提供的完整公众号正文；从不同段落重新选题，不声称取得新的文章全文',author='CaesarX / 凯撒的复利实验室')
 a['source_url']=next((x['url'] for x in idx['items'] if x['title']==a['title']),None)
(P/'source/scripts.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
shutil.copy2(old/'source/用户提供的三篇正文.txt',P/'source/用户提供的三篇正文.txt')
for ext in ['txt','json','csv']:shutil.copy2(P.parent/f'references/用户链接总表.{ext}',P/'source'/f'用户链接总表.{ext}')
print(json.dumps([{'id':a['id'],'characters':sum(map(len,a['cues'])),'title':a['short']} for a in data],ensure_ascii=False))
