from pathlib import Path
import json, shutil, hashlib, re, html

P=Path(__file__).resolve().parent
for d in ['source','assets','out','qa','工程/src/library/vox','工程/src/library/redshift','工程/public/fonts/vox']:(P/d).mkdir(parents=True,exist_ok=True)
src=Path('<home>/.codex/attachments/31ddd883-51fd-42a7-aa6e-7d9fe94bb13a/已粘贴的文本.txt')
shutil.copy2(src,P/'source/原始粘贴全文.txt')
lines=src.read_text(encoding='utf-8-sig').splitlines()
(P/'source/原文逐行编号.txt').write_text('\n'.join(f'L{i+1:03}: {v}' for i,v in enumerate(lines)),encoding='utf-8')
clean=[]
for i,v in enumerate(lines[:418],1):
    s=v.strip()
    if s and (i==1 or i>=29):clean.append(f'[L{i:03}] '+ ('【原图缺失：不据此提取数据】' if s=='Image' else s))
(P/'source/正文工作本.txt').write_text('\n\n'.join(clean),encoding='utf-8')
meta={'title':lines[0],'publisher':'凯撒的复利实验室','source':'用户粘贴全文','article_url':None,'publication_time':'未提供；文中事件日期为2026-01-29至30，评论显示Jan 30','received':'2026-10-22','sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'original_lines':len(lines),'scope':'正文工作本保留原文1、29—418行；后部推荐目录与重复评论仅在原始全文保留。工作本保留正文中的推广插入，未改写作者观点。','completeness':'文字包含完整结尾；原图缺失、原文章URL和精确发布时间未知。选题不依赖缺失图片。','editorial_decision':'历史机制解读，不包装成当前人事或行情快讯。'}
(P/'source/source-manifest.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
sources=[
 {'id':'S1','title':'美联储2024-09-18政策声明','url':'https://www.federalreserve.gov/newsevents/pressreleases/monetary20240918a.htm','checked':'2026-10-22','finding':'目标区间下调50基点至4.75%—5%；同时继续减少国债、机构债及机构MBS持有量。'},
 {'id':'S2','title':'美联储2026-01-28政策声明','url':'https://www.federalreserve.gov/newsevents/pressreleases/monetary20260128a.htm','checked':'2026-10-22','finding':'维持3.50%—3.75%的政策目标区间；不能据此说当时已经降息。'},
 {'id':'S3','title':'美联储2026-01-28实施说明','url':'https://www.federalreserve.gov/newsevents/pressreleases/monetary20260128a1.htm','checked':'2026-10-22','finding':'通过购买短期国债、必要时购买剩余期限不超过3年的国债增加SOMA证券持有量，以维持充裕准备金；所有国债到期本金续作。不能画成2026年1月已在缩表，也不把准备金管理购买等同于刺激性的QE。'},
 {'id':'S4','title':'美联储政策正常化问答','url':'https://www.federalreserve.gov/monetarypolicy/policy-normalization-qa.htm','checked':'2026-10-22','finding':'历史缩表主要通过调整到期本金再投资额；2025年12月1日结束该轮缩表。政策利率工具和资产负债表工具可区分。'},
 {'id':'S5','title':'白宫2026-01-30提名公告','url':'https://www.whitehouse.gov/releases/2026/01/wide-acclaim-for-president-trumps-nomination-of-kevin-warsh-as-fed-chair/','checked':'2026-10-22','finding':'当日宣布提名Kevin Warsh。提名不等于已就任，不采用公告中的赞誉作事实证据。'},
 {'id':'S6','title':'世界黄金协会2026年1月市场评论','url':'https://www.gold.org/goldhub/research/gold-market-commentary-january-2026','checked':'2026-10-22','finding':'2月5日发布，证实月末剧烈波动；LBMA PM基准与盘中报价口径不同。只作事后交叉核验，不能用其月度分解证明某一分钟下跌的独占原因。'}
]
(P/'source/核查来源.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8')
claims=[
 ['C01','L41、L92、L204','5580/5570到5130/5150，跌超7%，反弹5450','报价时间、时区、市场和数据源缺失，内部数值不一','S6只支持月末波动；不同基准不能直接互相否定','删去精确分时价格与跌幅，不画伪造K线'],
 ['C02','L100—124','地缘、强美元、政策和流动性共同导致闪崩','作者解释；缺逐笔订单簿和事件归因证据','S6不足以证明每项因素的瞬时贡献','不把相关性说成已证实因果'],
 ['C03','L116','2026年1月利率维持3.5%—3.75%','已核实','S2','保留并标2026年1月；删极度鹰派等评价'],
 ['C04','L210','特朗普确认提名沃什','已核实当日提名，非当日就任','S5','身份按历史时点处理'],
 ['C05','L210','未来可能降息与缩表并行','未来设想，非既成政策；组合并非没有历史先例','S1、S3、S4','作为核心问题；用2024年已发生的并行说明可行性，不预测沃什决定'],
 ['C06','L188、L210','缩表像抽水机，直接造成所有资产下跌','过度简化：资产规模、准备金、广义货币与市场流动性不是同一物','S3、S4','画证券账本，不画抽干全市场的钱，不画必然暴跌'],
 ['C07','L234—264','先验70%，后验55/30/15%，期望5200','未提供数据集、似然、计算过程或情景内部价格分布','未验证','删除概率饼图和期望值；不能冠以贝叶斯已计算'],
 ['C08','L54、L62','3500万年、痛苦为快乐两倍以上','宽泛心理和演化断言，本轮不扩展核查','与选题无关','删去猴子比喻及数字，不判断其已被证伪'],
 ['C09','L157—176、L216—230','黄金长牛坚如磐石、健康消化期、AI使通胀消失','预测、观点或强因果推断','非本片可证事实','不采用确定性牛市、通胀消失等表述'],
 ['C10','L288—298','银行被迫抬升价格；4800—5100建仓、20%配置','机制论证不足或具体交易建议','本片只解释工具','不转录为投资指令'],
 ['C11','新增解释 E1','利率旋钮与证券账本，是两个控制对象','制作方原创可视化模型','S1、S4支持概念，不支持造型','固定标注机制示意；不代表实际证券数量或实际调息幅度'],
 ['C12','新增历史证据','2024年9月降息50基点同时继续减少证券持有','已核实','S1','写入完整稿；明确历史日期，不能当2026年1月画面']
]
(P/'source/论点证据表.json').write_text(json.dumps(claims,ensure_ascii=False,indent=2),encoding='utf-8')
candidates=[
 ['降息，为什么不等于放水？','降息与缩表能同时发生吗？','能；调整政策利率与调整证券持有规模是不同操作。','选用：原文L210提出具体矛盾，有S1历史实例，动作可直接呈现。'],
 ['谁按下黄金暴跌按钮？','哪一条消息造成了多少跌幅？','当前材料不足以分离贡献。','舍弃：缺行情源、逐笔买卖与严格事件研究，容易制造单因果。'],
 ['55%的牛市概率可信吗？','原文概率真是算出来的吗？','没有完整计算材料，不能复算。','保留后备：可教证据意识，但本次优先选有正面解释动作的机制。'],
 ['五年图让风险消失了吗？','拉长横轴会不会掩盖持有人的风险？','图形尺度不改变真实损益。','后备：需要统一行情序列和持仓假设，本轮不造数据。'],
 ['黄金还要涨到6000吗？','未来目标价是多少？','当前材料不能得出可靠单值预测。','舍弃：价值主要依赖预测，无法用动画验证。']
]
(P/'source/选题决策.json').write_text(json.dumps(candidates,ensure_ascii=False,indent=2),encoding='utf-8')
full=[
 '黄金突然大跌，你可能会想：如果未来会降息，金价为什么还可能承压？这篇复盘里，有个比猜涨跌更值得拆开的细节。',
 '降息和缩表，可以同时发生。一个调低短期资金的价格，一个减少央行持有的证券。两件事，别看成同一个按钮。',
 '比如债券到期后，部分本金不再投资，账本就变小了。但账本变小，不等于市场上每一块钱都被收走。',
 '这不是纸上假设。二零二四年九月，美联储下调政策利率半个百分点，同时继续减少证券持有。',
 '不过，别把这个例子当成二零二六年一月的实际操作。当时美联储维持利率不变，并安排购买短期国债，维持充裕准备金。原文谈到的未来组合，只是预期。',
 '再回到黄金。政策利率、实际利率和美元，并不是同一个变量。只听见降息，就接上黄金必涨，中间少了好几步。先看政策做了什么，再谈资产怎么反应。'
]
(P/'source/完整口播稿.txt').write_text('\n\n'.join(full),encoding='utf-8')
spec={'id':'two-controls','voice':'zh-CN-YunxiNeural','rate':'+0%','voice_delay':.35,'cues':['降息和缩表','可以同时发生','一个调低短期资金的价格','一个减少央行持有的证券','两件事','别看成同一个按钮'],'punctuation':['，','。','，','。','，','。']}
(P/'source/sample-script.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
boards=[
 ['00–09s','从黄金问题进入','一块金色铸块向右滑行，经过“降息→必涨”的错误直线；箭头在中途断开。','金属圆形压印放大，轮廓接住下一镜利率旋钮。','提问而非承诺；黄金不画预测价格。'],
 ['09–24s','解释两种工具（本轮连续小样，实际时长按配音）','同一台控制台：旋钮转低，标尺指针沿下降方向运动；镜头横移到证券账本，一张债券进入“到期/不再投资”托盘；拉回看到两者同处一台台面。','旋钮圆环与控制台边框始终保留；镜头跟随账页移动，不切走换模板。','数值用高/低、较多/较少，不假装真实金额或当日实际操作。'],
 ['24–33s','解释到期不再投资','到期证券与本金返还关系出现；“再投资”返回路径停止，账面少一张。','保留上一镜证券，推到其日期印章。','明确示意：券张数量不对应真实金额；不画钱被销毁。'],
 ['33–44s','历史证据','日期印章变为2024.09.18；同一张FOMC声明的降息与继续减持两处被同时框出。','两个框分别继承利率旋钮和证券账本的位置。','屏幕可写50基点；来源S1，不能将其用作2026年行情。'],
 ['44–61s','区分新闻与事实','同一份档案向前滑到2026.01.28；显示利率维持3.50%—3.75%，短债购买维持准备金；未来设想放入虚线区域。','日期轨道移动而非人物换装；实线=已发生，虚线=未来设想。','来源S2、S3；准备金管理购买不直接标QE。'],
 ['61–75s','回到黄金问题','金块返回；政策利率、实际利率、美元成为三个不同读数，单线箭头断开，留下“先看工具，再谈价格”。','闭环到首镜金块与压印。','仅说明变量不同，不赋予真实权重，不做买卖提示。']
]
for row,span in zip(boards,['00–09s','09–21.27s','21.27–29s','29–38s','38–52s','52–65s']):row[0]=span
(P/'source/完整分镜表.json').write_text(json.dumps(boards,ensure_ascii=False,indent=2),encoding='utf-8')
old=P.parent/'disappearing25-20261021/工程'
for f in ['package.json','package-lock.json','tsconfig.json','remotion.config.ts']:shutil.copy2(old/f,P/'工程'/f)
for f in ['anim.ts','redshift/theme.ts','vox/theme.ts']:
    shutil.copy2(old/'src/library'/f,P/'工程/src/library'/f)
for f in (old/'public/fonts/vox').iterdir():shutil.copy2(f,P/'工程/public/fonts/vox'/f.name)
shutil.copy2(P.parent/'vendor/weilanx-claude-videos/LICENSE',P/'工程/WEILANX-LICENSE')
print(json.dumps({'sourceLines':len(lines),'fullScriptCharacters':sum(len(re.findall(r'[\u4e00-\u9fff]',x)) for x in full),'claims':len(claims),'candidates':len(candidates),'boards':len(boards)},ensure_ascii=False))
