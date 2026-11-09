from pathlib import Path
import shutil,json
P=Path(__file__).resolve().parent
old=P.parent/'content-lab-20261021'
repo=P.parent/'vendor/weilanx-claude-videos'
for d in ['assets','source','out','qa','vendor']: (P/d).mkdir(exist_ok=True)
for f in ['NotoSansSC-VF.ttf','NotoSerifSC-VF.ttf','notosanssc-OFL.txt','notoserifsc-OFL.txt','vastness.mp3']:shutil.copy2(old/'assets'/f,P/'assets'/f)
gen=Path('<home>/.codex/generated_images/01a14828-8254-76a3-a39e-70ee8b196a66')
for a,b in [('exec-5047d2d9-a7d7-4907-9f8f-c8e5a7e0f9c2.png','shop.png'),('exec-0d572902-0f87-4e7e-94b3-6e731a607ae9.png','shopper.png')]:shutil.copy2(gen/a,P/'assets'/b)
for f in ['common.mjs','index.html','render.mjs','prepare_audio.py']:shutil.copy2(old/f,P/f)
s=(P/'prepare_audio.py').read_text(encoding='utf-8').replace('>29.5','>58.8').replace("'end':30","'end':60")
(P/'prepare_audio.py').write_text(s,encoding='utf-8')
s=(P/'render.mjs').read_text(encoding='utf-8').replace("||'editorial'","||'anchor'")
(P/'render.mjs').write_text(s,encoding='utf-8')
for f in ['用户提供的三篇正文.txt','事实核对.md']:shutil.copy2(old/'source'/f,P/'source'/f)
for f in ['用户链接总表.json','用户链接总表.csv','用户链接总表.txt']:shutil.copy2(P.parent/'references'/f,P/'source'/f)
nv=repo/'styles/艺术风格/04_现代主义/10_nouveau_慕夏新艺术'
shutil.copy2(nv/'场景代码.js',P/'vendor/nouveau-original.js')
shutil.copy2(nv/'配方卡.md',P/'vendor/nouveau-recipe.md')
shutil.copy2(repo/'styles/LICENSE-huashu-art-motion',P/'vendor/LICENSE-huashu-art-motion')
shutil.copy2(repo/'LICENSE',P/'vendor/LICENSE-weilanx')
lines=[
('走进一家商店','，'),('一件外套，原价四百九十九','，'),('现在只要一百九十九','。'),
('你还没摸过布料','，'),('心里已经响起一个声音','：'),('赚了三百','。'),
('那个先出现的数字','，'),('悄悄变成了衡量一切的尺子','。'),('这就是锚定效应','。'),
('判断围着第一个参照转','，'),('却没有调整得足够远','。'),
('你想的可能不再是','，'),('它值不值一百九十九','，'),('而是比原来便宜了多少','。'),
('这不代表原价一定是假的','，'),('也不代表打折一定有问题','。'),
('关键是，别让一个数字','，'),('替你决定东西的价值','。'),
('试着把旧价签拿走','。'),('假如从没见过四百九十九','，'),('你还愿意买下它吗','？'),
('看看布料和做工','，'),('比较同类商品的价格','，'),('再想想，你真的需要吗','？'),
('折扣能告诉你价格变了','。'),('但是否值得','，'),('还要由你判断','。'),('先看东西，再看数字','。')]
spec=json.loads((old/'source/scripts.json').read_text(encoding='utf-8'))[0]
spec.update(id='anchor',short='价签之外',rate='+8%',cues=[x[0] for x in lines],punctuation=[x[1] for x in lines],duration=60,voice_delay=.4,angle='一家新艺术运动风格的商店：旧价签成为空间压力与判断支点，撤掉后回到商品本身。原创视觉隐喻与499/199售价情境。')
(P/'source/scripts.json').write_text(json.dumps([spec],ensure_ascii=False,indent=2),encoding='utf-8')
print('narration chars',sum(len(x[0]) for x in lines))
