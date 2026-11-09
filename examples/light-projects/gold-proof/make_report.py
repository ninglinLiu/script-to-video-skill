from pathlib import Path
import json,html,subprocess
P=Path(__file__).resolve().parent
load=lambda f:json.loads((P/f).read_text(encoding='utf-8'))
esc=html.escape
meta=load('source/source-manifest.json'); sources=load('source/核查来源.json'); claims=load('source/论点证据表.json'); candidates=load('source/选题决策.json'); board=load('source/完整分镜表.json');tl=load('assets/timeline.json')
full=(P/'source/完整口播稿.txt').read_text(encoding='utf-8').split('\n\n')
def table(head,rows):return '<div class="tablewrap"><table><thead><tr>'+''.join('<th>'+esc(h)+'</th>' for h in head)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+esc(str(v))+'</td>' for v in row)+'</tr>' for row in rows)+'</tbody></table></div>'
refs=''.join(f'<li id="{s["id"]}"><b>{s["id"]} · {esc(s["title"])}</b><a class="url" href="{s["url"]}">{s["url"]}</a><p>{esc(s["finding"])}</p></li>' for s in sources)
paragraph_sources=[('问题引入','原文L210；编辑提出问题，非行情因果结论'),('机制解释＋原创模型E1','S1、S4；价格工具/规模工具是本片组织方式'),('机制解释','S4；省略具体会计分录，不将证券规模等同全市场资金'),('已核实历史事实','S1；2024-09-18，降息50基点，同时继续减持'),('已核实历史事实＋作者预测标签','S2、S3；区分2026-01实际操作与未来设想'),('推理边界／编辑结论','政策利率≠实际利率≠美元；不从单一变量推必涨，不承诺预测能力')]
script_html=''.join(f'<div class="script"><span class="tag">{i+1:02} / {esc(paragraph_sources[i][0])}</span><p>{esc(s)}</p><small>{esc(paragraph_sources[i][1])}</small></div>' for i,s in enumerate(full))
r=tl['cues'][2]['start']-.2;b=tl['cues'][3]['start']-.2;e=tl['cues'][4]['start']-.15
sample_rows=[['0.00–1.00','控制台由倾斜近景退到全貌','旋钮、账页均已存在，无模板换页'],['1.00–3.24','两个工具同场，先读标题','用造型与位置区分价格/规模；无预测数值'],[f'{r:.2f}–{b+1.5:.2f}','指针持续向低位转动；镜头先靠近旋钮','指针在镜头转向账页后继续运动'],[f'{b+.35:.2f}–{b+1.85:.2f}','一张证券滑入到期托盘；留四张在持有区','同一账页保持身份；托盘标到期/不再投资'],[f'{e:.2f}–{e+.65:.2f}','镜头拉回同一台控制台','价格已调低、证券持有已减少，两种状态可比较'],[f'{e+.65:.2f}–{tl["seconds"]:.2f}','结论落稳，保留尾韵','没有黄金上涨箭头或真实金额；模型边界常驻']]
sample_rows[1][0]='1.00–2.79'
sample_rows.insert(2,['2.79–3.29','镜头推近利率旋钮','同一台面；指针从3.24秒开始转低'])
qa_path=P/'qa/visual-review.json';qa=load('qa/visual-review.json') if qa_path.exists() else {'status':'待渲染审看','findings':[]}
findings=''.join(f'<li><b>{esc(v["time"])} · {esc(v["issue"])}</b><p>{esc(v["change"])}</p></li>' for v in qa.get('findings',[]))
tech=load('qa/final-checks.json') if (P/'qa/final-checks.json').exists() else {'status':'待完成编码检查'}
raw='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>降息，为什么不等于放水？｜五步执行报告</title><style>
@font-face{font-family:heavy;src:url('工程/public/fonts/vox/NotoSansSC-900.woff')}*{box-sizing:border-box}body{margin:0;background:#f2efe4;color:#153b3b;font:16px/1.85 'Microsoft YaHei',sans-serif}a{color:#1d6d69;text-underline-offset:4px}header{background:#143e3d;color:#f6efd9;padding:64px max(6vw,24px) 46px}.eyebrow{font-size:13px;letter-spacing:3px;color:#d7c789}h1{font:clamp(32px,4.6vw,65px)/1.3 heavy,sans-serif;max-width:980px;margin:22px 0}header p{max-width:850px;color:#d6e2d4;font-size:18px}.badge{display:inline-block;border:1px solid #65877c;padding:7px 14px;font-size:12px;border-radius:40px;margin:3px}main{max-width:1200px;margin:auto;padding:0 32px 60px}nav{display:flex;gap:14px;flex-wrap:wrap;padding:24px 0;border-bottom:1px solid #bdcabc}section{padding:44px 0;border-bottom:1px solid #bdcabc}h2{font:32px/1.4 heavy;margin:0 0 22px}h2 span{font:italic 35px Georgia;color:#bd693d;margin-right:15px}h3{font:22px heavy;margin:30px 0 14px}p{margin:12px 0}small{color:#5c766f}.lede{font-size:23px;line-height:1.7;max-width:950px}.grid{display:grid;grid-template-columns:1fr 1.1fr;gap:38px}.video{display:block;width:100%;max-width:390px;max-height:700px;background:#e2e9da;border-radius:5px;box-shadow:12px 16px 0 #d1d9c6}.notice{padding:22px 26px;border-left:5px solid #df733d;background:#e4e8d9;margin:22px 0}.script{padding:22px 26px;background:#fbf8ee;border-left:3px solid #718f7d;margin:16px 0}.script p{font-size:20px}.tag{font-size:12px;color:#ac6235;letter-spacing:1px}table{border-collapse:collapse;width:100%;font-size:14px;background:#fbf9f0}th,td{padding:16px;text-align:left;vertical-align:top;border-bottom:1px solid #d9dfcf}th{background:#d6e1ce;font-weight:700}td:first-child{min-width:86px}.tablewrap{overflow:auto}.thumb{display:block;width:100%;margin:25px 0;border:1px solid #bfccbb}.button{display:inline-block;background:#153e3d;color:#fff3d7;padding:9px 16px;margin:7px 8px 7px 0;border-radius:3px;text-decoration:none}.secondary{background:#dbe5d4;color:#153e3d}.url{display:block;overflow-wrap:anywhere;font:13px/1.7 Consolas,monospace;margin-top:8px}.sources li{padding:15px 0}.sources p{font-size:14px}pre{white-space:pre-wrap;word-break:break-word;font-size:12px;background:#e6eadc;padding:20px}details{padding:15px 0}summary{cursor:pointer;font-weight:700}.meta{font-size:13px;color:#53756a}.filmstrip{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.filmstrip img{width:100%}.pipeline{font:20px/2.2 heavy;color:#c66c3c}@media(max-width:750px){main{padding:0 20px 40px}.grid{grid-template-columns:1fr}.video{margin:auto}h2{font-size:26px}td,th{padding:12px;min-width:170px}.filmstrip{grid-template-columns:repeat(2,1fr)}}@media print{nav,video,.button{display:none}body{background:white}section{break-inside:avoid}header{padding:25px;color:#153b3b;background:#e2ebd6}header p{color:#153b3b}.tablewrap{overflow:visible}h1{font-size:36px}table{font-size:10px}.grid{display:block}img{max-height:650px;object-fit:contain}}
</style><header><div class="eyebrow">CAESAR'S COMPOUND LAB / ARTICLE TO MOTION / 2026.10.22</div><h1>降息，为什么<br>不等于放水？</h1><p>从一篇黄金暴跌复盘中，提炼一个能被画面解释的问题。原文、核查、改编、分镜与连续小样，在这里逐一对照。</p><span class="badge">历史机制解读</span><span class="badge">不是金价预测</span><span class="badge">静音预览 · 默认暂停</span></header><main>
<nav><a href="#one">01 原文整理</a><a href="#two">02 内容蒸馏</a><a href="#three">03 脚本改编</a><a href="#four">04 分镜设计</a><a href="#five">05 连续小样</a><a href="#refs">来源与复用</a></nav>
<section><div class="grid"><div><div class="eyebrow" style="color:#a76535">CONTINUITY PROOF</div><p class="lede">一个旋钮，<br>一份证券账本。<br>同一台控制台，两个独立动作。</p><p>本轮交付完整改编稿与分镜方案，以及 <b>__SECONDS__ 秒</b>实际渲染片段。它是完整稿第二段的连续小样，验证解释动作、材质、字号和镜头衔接。</p><p>65 秒分镜是排演计划；完整长片尚未制作。一个样本的完成，也不等于通用流水线已经稳定。</p><a class="button" href="out/final-silent.mp4" download>下载无音轨 MP4</a><a class="button secondary" href="out/sample-with-audio.mp4" download>下载带配音版</a><a class="button secondary" href="out/两种工具_样片.srt" download>SRT 字幕</a><a class="button secondary" href="五步执行包.zip" download>完整工程与报告包</a><p class="meta">未外放，未人工听音；浏览页只有无音轨版本。带声音文件独立保存。</p></div><video class="video" controls muted playsinline preload="metadata" poster="qa/poster.jpg" src="out/final-silent.mp4"></video></div></section>
<section id="one"><h2><span>01</span>原文整理</h2><p><b>原文：</b>__TITLE__<br><b>来源：</b>凯撒的复利实验室；用户提供的粘贴全文。<br><b>时点：</b>文中复盘 2026 年 1 月 29–30 日事件，不是 2026 年 10 月实时快讯。</p><div class="notice">文字含结尾，原图缺失；原文章链接和精确发布时间未提供。所选问题不依赖缺失图片，可以继续改编。不能把缺失的K线图或作者概率模型补画成真实数据。</div><a href="source/原文逐行编号.txt">原文逐行编号（含附录与评论）</a> · <a href="source/正文工作本.txt">正文工作本</a> · <a href="source/source-manifest.json">文件指纹与阅读范围</a><p>下面是与选题及淘汰决策有关的 12 条核查记录；不宣称整篇所有金融观点均已验证。</p>__CLAIMS__</section>
<section id="two"><h2><span>02</span>内容蒸馏</h2><p class="lede">核心问题：降息与缩表，能同时发生吗？<br>一句话答案：可以。它们分别调整政策利率与证券持有规模。</p>__CANDIDATES__<div class="notice"><b>选题的价值：</b>观众看完能区分“调利率”和“调证券持有规模”，读新闻时不会把一个动作自动替换成另一个。黄金只是进入问题的背景，本片不回答今天该不该买黄金。</div><p>原文 L210 是切入点。编辑增加的 2024 年历史案例来自官方声明，并非作者原文。删除精确目标价、未经展示计算的概率、进化故事和具体建仓建议，让一条短片只证明一件事。</p></section>
<section id="three"><h2><span>03</span>脚本改编</h2><p>完整稿约 290 个汉字；预计约 60–75 秒，尚未生成全稿旁白。以下是可直接朗读的六段，注释不进入口播。</p>__SCRIPT__<a href="source/完整口播稿.txt">下载纯口播稿</a><h3>原创例子与事实边界</h3><p><b>E1：</b>双控制台、旋钮、五张证券卡及到期托盘均为制作方原创模型，不是金融机构实物，也不是实际持仓数量。样片不出现虚构的利率数值；完整片出现的 50 基点、3.50%—3.75%均须连同日期呈现。</p><p>减少证券持有只展示一种常见执行方式：部分到期本金不再投资。不是所有缩表都只能如此，也不等于央行主动抛售全部证券、收走所有人的现金。原文的未来政策设想与当时已实施政策分别处理。</p></section>
<section id="four"><h2><span>04</span>分镜设计</h2><p>全片暂排 65 秒，时间待全稿配音后回填。主角先是金块上的压印，再成为旋钮；档案日期负责区分政策发生时间。不是每一句换一张标题卡。</p>__BOARD__<h3>本轮样片的真实时间线</h3>__SAMPLE__<img class="thumb" src="qa/contact-sheet.jpg" alt="实际渲染的连续镜头与时间码"><p class="meta">上图来自本轮 MP4 实际抽帧；不是生成效果图，也不是未实现的概念分镜。</p></section>
<section id="five"><h2><span>05</span>连续小样与验收</h2><p>最终素材：本地 OFL 中文字体、立体旋钮、证券卡、控制台材质、已生成的云希旁白、weilanx 音效和配乐组件。动画由帧号确定，旁白来自一次整段合成，字幕来自实际 WordBoundary。</p><h3>看到了什么，改了什么</h3><ul>__FINDINGS__</ul><details><summary>查看技术检查记录</summary><pre>__TECH__</pre></details><p>制作方审看关注动作和阅读，不用自评分代替用户认可。静音版技术与画面检查完成；听感未人工验收，用户审美验收仍待反馈。</p><div class="notice"><b>这轮证明的范围：</b>从指定文章提炼问题、核查、写稿、设计动作和渲染样片这五个环节已形成可追溯交付。选题判断与镜头设计仍由制作方完成；尚未证明任意新文章都能自动生成满意成片。</div><p>完整片的黄金开头、到期本金细解、官方声明档案和最终回到黄金的段落只有分镜，没有冒称已经渲染。</p></section>
<section id="refs"><h2>来源与工程复用</h2><h3>一手核查来源</h3><ol class="sources">__SOURCES__</ol><h3>本轮实际使用的工具与参考</h3><ul class="sources"><li><b>weilanx-claude-videos</b><a class="url" href="https://github.com/Azure12355/weilanx-claude-videos">https://github.com/Azure12355/weilanx-claude-videos</a><p>实际复用已有项目的 Remotion 依赖、anim.ts 缓动、redshift 旋转投影、Vox 字体加载、synth.mjs 与 bgm.mjs。参考 Vox Skill 的一手资料与旁白组织规则；没有机械照搬横屏、黑卡硬切、私人豆包工具。</p></li><li><b>xilo-opus-video</b><a class="url" href="https://github.com/Kianzzz/xilo-opus-video">https://github.com/Kianzzz/xilo-opus-video</a><p>实际读制作规则及预览要求，采用对象状态、连续片段、手机尺度和密集抽帧；本轮没有运行它的 render.py，渲染器沿用 Remotion。</p></li><li><b>已有本地工程《消失的25元》</b><p>复用整段云希配音和真实词时间戳、FFmpeg混音、Remotion构建方式。新内容与画面保存在独立目录，旧片未覆盖。源码可编辑，但不是剪映原生草稿。</p></li><li><b>已有抖音参考拉片</b><p>借鉴“对象持续存在”和“形状/方向承接”，没有将原片画面、配乐或作者文案放入新视频。本轮未新下载参考片，未新增用户提供链接。</p></li></ul><h3>素材、成本与复现</h3><p>视觉道具和纹理由代码绘制；中文与英文字体从已有工程复制，许可随包。没有新文生图、视频生成模型或付费API调用。配音网络请求一次成功，另一次在受限网络环境连接失败；本地渲染与用电未折算费用。没有克隆任何真人声音。</p><a href="打开与修改说明.txt">打开与修改说明、文件清单、重渲命令</a><p class="meta">审核日期 2026-10-22 · 原文 SHA256：__HASH__</p></section></main></html>'''
mapping={'__SECONDS__':f'{tl["seconds"]:.2f}','__TITLE__':esc(meta['title']),'__CLAIMS__':table(['编号','原文位置','原主张','核查判断','证据','改编处理'],claims),'__CANDIDATES__':table(['候选题','核心问题','答案','取舍'],candidates),'__SCRIPT__':script_html,'__BOARD__':table(['暂排时间','理解目标','对象与状态变化','继承与转场','约束'],board),'__SAMPLE__':table(['实际秒数','对象/动作','验收点'],sample_rows),'__SOURCES__':refs,'__HASH__':meta['sha256'],'__FINDINGS__':findings or '<li>实际渲染检查进行中。</li>','__TECH__':esc(json.dumps(tech,ensure_ascii=False,indent=2))}
for a,v in mapping.items():raw=raw.replace(a,v)
raw=raw.replace('</style>', '.meta{overflow-wrap:anywhere}.grid>*{min-width:0}@media(max-width:750px){.grid>.video{grid-row:1}}\n</style>')
raw=raw.replace('preload="metadata"','preload="none"')
raw=raw.replace('1.00–3.24','1.00–2.79').replace('指针持续向低位转动；镜头先靠近旋钮','2.79秒开始推近；3.24秒起指针持续向低位转动')
(P/'五步执行报告.html').write_text(raw,encoding='utf-8')
(P/'watch.html').write_text('<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=五步执行报告.html"><a href="五步执行报告.html">打开五步执行报告</a>',encoding='utf-8')
(P/'source/实际样片动作表.json').write_text(json.dumps(sample_rows,ensure_ascii=False,indent=2),encoding='utf-8')
readme=f'''《降息，为什么不等于放水？》五步执行包 / 2026-10-22

入口：双击 五步执行报告.html，含完整原文整理、候选决策、口播稿、分镜、实际样片及来源。
静音样片：out/final-silent.mp4。{tl['seconds']:.2f}秒，9:16，1080×1920，30fps。
带声音文件：out/sample-with-audio.mp4。需用户自行播放；本轮未外放、未人工听音。
字幕：out/两种工具_样片.srt。来自云希的真实 WordBoundary，不是逐字平均分配。
原文和核查：source/。原始全文未改动，所有原文位置按 source/原文逐行编号.txt。
实际渲染分镜与连续帧：qa/。
工程：工程/src/TwoControls.tsx（物件与镜头）、工程/src/timing.json（配音时间线）。

环境：Node.js、Remotion、React、FFmpeg、Python3 + edge-tts。已有电脑通过node_modules目录联接复用weilanx安装；ZIP不包含node_modules。新电脑进入工程目录运行 npm ci，再运行 render.ps1 -Mode final（Windows需在脚本中指定本机Chrome无头浏览器路径）。
重新生成配音：在外层目录运行 python prepare_audio.py。需网络；现有MP3与词时间戳已随包，无需重复请求。
重新配乐：进入工程目录运行 node music.mjs，再回到外层运行 python mix_audio.py。
重新报告：python make_report.py。最终复查：python finalize.py。
更换文案后须重新核对配音缓存、时间线与分镜，不能只换字幕。

本轮不是60–90秒全片：完整口播稿约290个汉字，六段分镜暂排65秒；只导出其中的连续解释小样。
全片其他段落没有渲染。技术通过不等于审美通过，不宣称任意文章的自动化质量已稳定。

实际使用的GitHub项目：
https://github.com/Azure12355/weilanx-claude-videos
复用Remotion工程、缓动/投影、字体与合成声音组件；许可证见工程/WEILANX-LICENSE。
https://github.com/Kianzzz/xilo-opus-video
读取并采用对象状态和实际连续小样验收方法；没有运行其渲染器。

独立新目录，未覆盖旧片；本轮没有向飞书上传，也没有发布到公众号。
'''
(P/'打开与修改说明.txt').write_text(readme,encoding='utf-8-sig')
print('Report updated')
