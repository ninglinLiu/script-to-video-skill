from pathlib import Path
import json,shutil,re
P=Path(__file__).resolve().parent;OLD=P.parent
for d in ['source','assets','out','qa','工程/src','工程/public','工程/audio']:(P/d).mkdir(parents=True,exist_ok=True)
for f in ['package.json','package-lock.json','tsconfig.json','remotion.config.ts','WEILANX-LICENSE']:shutil.copy2(OLD/'工程'/f,P/'工程'/f)
shutil.copytree(OLD/'工程/src/library',P/'工程/src/library',dirs_exist_ok=True)
shutil.copytree(OLD/'工程/public/fonts',P/'工程/public/fonts',dirs_exist_ok=True)
shutil.copytree(OLD/'工程/audio',P/'工程/audio',dirs_exist_ok=True)
shutil.copy2(OLD/'mix_audio.py',P/'mix_audio.py')
shutil.copy2(OLD/'source/原始粘贴全文.txt',P/'source/原始粘贴全文.txt')
shutil.copy2(OLD/'source/source-manifest.json',P/'source/source-manifest.json')
shutil.copy2(OLD/'工程/src/timing.json',P/'工程/src/proof-timing.json')
s=(OLD/'工程/src/TwoControls.tsx').read_text(encoding='utf-8').replace("from './timing.json'","from './proof-timing.json'")
s=s.replace('const Dial:', 'export const Dial:').replace('const Ledger:', 'export const Ledger:')
(P/'工程/src/Mechanism.tsx').write_text(s,encoding='utf-8')
# Full paragraphs are synthesized together, with subtitle chunks mapped to actual WordBoundary events.
chapters=[
 {'id':'hook','title':'降息，黄金就该涨？','cues':['降息了','黄金就该涨','你少看了三道传导'],'p':['，','？','。'],'source':['editorial']},
 {'id':'tools','title':'先拆开两种工具','cues':['原文谈到沃什可能降息又缩表','这是当时的政策设想','降息调低短期政策利率','缩表减少央行持有的证券','比如债券到期','部分本金不再投资','借钱的价格和央行的账本','是两回事'],'p':['。','。','；','，','，','。','，','。'],'source':['article-L210','S3','S4']},
 {'id':'opportunity','title':'第一道 · 实际利率','cues':['黄金本身不付利息','持有它','就放弃了其他资产可能带来的利息','这里更值得看的是实际利率'],'p':['。','，','。','。'],'source':['S7','S9']},
 {'id':'example','title':'利率降了，实际利率却升了','cues':['举个假设','一年期名义收益率','从百分之五降到四','未来一年预期通胀','从百分之三降到一','实际利率近似等于两者相减','反而从百分之二升到三','名义利率降了','持有黄金的机会成本','却升了'],'p':['：','，','；','，','。','，','。','，','，','。'],'source':['S8','E2-original']},
 {'id':'curve','title':'短端，不等于整条曲线','cues':['而短期政策利率下降','也不保证长期债券收益率同步下降','市场还在交易未来利率','通胀和期限风险'],'p':['，','。','、','。'],'source':['S10']},
 {'id':'dollar','title':'第二道 · 美元','cues':['第二道是美元','同样一盎司黄金','如果美元报价不变','美元升值','用其他货币购买就更贵'],'p':['。','，','、','，','。'],'source':['S9','E3-arithmetic']},
 {'id':'expectation','title':'第三道 · 预期差','cues':['第三道是预期差','假设原本押注降息五十个基点','最后只降二十五','虽然降息','宽松却不及预期','市场比较的是预期和现实的差'],'p':['。','，','，','，','。','。'],'source':['S10','E4-original']},
 {'id':'end','title':'读懂传导，再谈涨跌','cues':['所以看黄金','别只盯降不降息','实际利率','美元','预期差','还要放进央行购金和避险需求一起看','这些是影响方向','不是保证涨跌的公式'],'p':['，','。','、','、','，','。','，','。'],'source':['S7','S9','editorial']}
]
spec={'voice':'zh-CN-YunxiNeural','rate':'+12%','chapters':chapters,'delay':.25,'tail':1.15}
(P/'source/script.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
paras=[''.join(a+b for a,b in zip(c['cues'],c['p'])) for c in chapters]
(P/'source/完整字幕稿.txt').write_text('\n\n'.join(paras),encoding='utf-8')
refs=json.loads((OLD/'source/核查来源.json').read_text(encoding='utf-8'))
refs += [
 {'id':'S7','title':'Chicago Fed: What Drives Gold Prices? (2021)','url':'https://www.chicagofed.org/publications/chicago-fed-letter/2021/464','finding':'黄金与长期实际利率的机会成本关系有理论和实证支持，但其他条件需限定，不是逐日必涨必跌规律。'},
 {'id':'S8','title':'St. Louis Fed: Adjusting for Inflation (2023)','url':'https://www.stlouisfed.org/publications/page-one-economics/2023/01/03/adjusting-for-inflation','finding':'用名义利率减去同期限预期通胀近似实际利率；示例5-3和4-1均为原创假设，不是行情数据。'},
 {'id':'S9','title':'World Gold Council: Rates pose risks but also unlock opportunities for gold (2021)','url':'https://www.gold.org/goldhub/research/investment-update-rates-pose-risks-also-unlock-opportunities-gold','finding':'机会成本、利率与货币价值是影响黄金的因素；利率上升不保证黄金表现差。美元示例只说明固定美元价格下的换算成本。'},
 {'id':'S10','title':'Bank of England: How monetary policy transmits (2024)','url':'https://www.bankofengland.co.uk/quarterly-bulletin/2024/2024/about-a-rate-of-general-interest-how-monetary-policy-transmits','finding':'政策通过金融条件和预期传导；长端不与单次政策利率机械同步。50/25基点是原创预期差示例，不是某次真实会议。'}
]
(P/'source/核查来源.json').write_text(json.dumps(refs,ensure_ascii=False,indent=2),encoding='utf-8')
mapping=[{'chapter':c['id'],'claimSources':c['source'],'text':p} for c,p in zip(chapters,paras)]
(P/'source/脚本证据映射.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2),encoding='utf-8')
print('Chinese characters:',len(re.findall('[\u4e00-\u9fff]',''.join(paras))))
