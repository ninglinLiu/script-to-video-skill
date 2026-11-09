from pathlib import Path
import json,html,os,hashlib,zipfile,subprocess
P=Path(__file__).resolve().parent
tl=json.loads((P/'assets/timeline.json').read_text(encoding='utf-8'))
script=json.loads((P/'source/script.json').read_text(encoding='utf-8'))
sources=json.loads((P/'source/核查来源.json').read_text(encoding='utf-8'))
actions=[
('把“降息必涨”的直线推理拆开','金条停留，箭头退出，三个因素接替；金条缩成同一个观察标记。','1.8 / 3.7 / 4.1–4.84'),
('政策利率与央行证券持有量不是一件事','镜头推向旋钮，指针下调；沿控制台下移，证券到期离开持有堆栈；镜头回到整体。','9.46–10.31 / 13.36–15.36 / 16.48–17.08'),
('不付息带来机会成本，价格涨跌另论','同一金条与付息资产并列；债券吐出票息券，金条下明确“不付利息，但金价会波动”。','19.83–27.53'),
('名义下降不保证实际利率下降','同标尺对比两个一年期柱体。右柱5→4；通胀3→1；剩余区染金，揭示近似实际利率2→3。','30.08–31.03 / 33.16–34.11 / 34.97–38.33'),
('短期政策利率不机械控制长端','短端点下移；长端保留多方向虚线；未来利率、通胀、期限风险沿同一横向基线出现。','43.58–52.42'),
('固定美元报价时的汇率换算','同一金条保留1oz与不变报价标签；美元币抬升，右侧本币支出代币增多。代币仅示意，不量化汇率。','54.02–59.71'),
('实际宽松可能少于预期','两条同基线标尺先后下降50bp与25bp；括号测出25bp落差。','61.91–67.31'),
('三个传导因素仍不覆盖全部需求','同一金条接收三条因素连线，补入购金与避险；收束到“影响方向≠保证涨跌”。','73.98–82.69')]
board=[]
for ch,(goal,action,check) in zip(tl['chapters'],actions):board.append({**ch,'understanding':goal,'action':action,'inspectionSeconds':check})
(P/'source/分镜动作与时间码.json').write_text(json.dumps(board,ensure_ascii=False,indent=2),encoding='utf-8')
review={'edition':'full-v2','durationSeconds':tl['seconds'],'frames':tl['frames'],'productionVisualReview':'关键静帧、手机缩图和连续帧检查；用户审美验收待反馈','speakerPlayback':False,'manualListening':False,'fixes':[{'at':'3.7s','issue':'金条开始向下一镜移动过早，遮挡“三道传导”','fix':'停留到4.10秒，再向下一镜的右上观察点移动'},{'at':'35–43s','issue':'算式的前两个量未显示百分号','fix':'完整显示5%−3%≈2%和4%−1%≈3%'},{'at':'66–70s','issue':'预期差的括线穿过25bp标签','fix':'括线右移，数字与线分开'},{'at':'字幕全片','issue':'自动合并的短句跨了章节和句号','fix':'按32组语义单元重分，保留疑问与句末标点，时间仍来自实际WordBoundary'}],'scope':'原文机制的改编延伸，不是全篇历史行情复盘；未补造原文图表或实际报价。','limits':['静音和配音版均可交付；未通过扬声器试听。','机理因素有条件成立，不能当作金价方向的确定公式。','本次证明这一篇的人工审校工作流，不宣称任意新文章已可全自动稳定成片。']}
(P/'qa/制作检查记录.json').write_text(json.dumps(review,ensure_ascii=False,indent=2),encoding='utf-8')
def esc(s):return html.escape(str(s))
paragraphs=''.join(f'<article><div class="time">{c["start"]:05.1f}–{c["end"]:05.1f}s</div><h3>{esc(c["title"])}</h3><p>{esc("".join(a+b for a,b in zip(s["cues"],s["p"])))}</p></article>' for c,s in zip(tl['chapters'],script['chapters']))
ref=''.join(f'<li><a href="{esc(s["url"])}">{esc(s["title"])}</a><p>{esc(s["finding"])}</p><small>{esc(s["url"])}</small></li>' for s in sources)
rows=''.join(f'<tr><td>{c["start"]:.1f}–{c["end"]:.1f}s</td><td>{esc(c["understanding"])}</td><td>{esc(c["action"])}</td></tr>' for c in board)
page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>黄金的三道传导 · 完整成片</title><style>
*{box-sizing:border-box}body{margin:0;background:#0a2829;color:#f2eddf;font-family:"Microsoft YaHei",sans-serif;line-height:1.75}main{max-width:1280px;margin:auto;padding:45px 34px}h1,h2,h3{line-height:1.2}h1{font-size:clamp(34px,4.5vw,65px);letter-spacing:-2px;margin:18px 0 22px}h2{font-size:29px;margin-top:56px}.eyebrow{color:#d6b36c;letter-spacing:3px;font-size:13px}.lead{font-size:19px;color:#c7d8cd;max-width:690px}.hero{display:grid;grid-template-columns:1fr 360px;gap:55px;align-items:start}.hero>*{min-width:0}.video{position:relative;background:#052122;border:1px solid #4c6557;padding:9px;border-radius:14px;box-shadow:0 24px 70px #0004}video{width:100%;display:block;aspect-ratio:9/16;border-radius:7px;background:#e9e6d6}.badge{font-size:12px;color:#ced6c6;margin:7px 3px 1px}a{color:#e5bd70;text-decoration-thickness:1px;text-underline-offset:4px}a:hover{color:#fff}.buttons{display:flex;gap:12px;flex-wrap:wrap;margin:26px 0}.button{display:inline-block;background:#e3b769;color:#133d39;border-radius:5px;padding:12px 18px;text-decoration:none;font-size:15px;font-weight:bold}.button.secondary{background:#214942;color:#eee9d8;border:1px solid #4a6a5e}.chip{display:inline-block;border:1px solid #50665a;padding:5px 12px;margin:0 6px 8px 0;font-size:12px;border-radius:30px}.changes{padding:0;list-style:none}.changes li{margin:15px 0;padding-left:22px;border-left:3px solid #e96d45}.changes strong{display:block;color:#f3e4ba}.changes span{font-size:14px;color:#b5c8ba}.panel{border-top:1px solid #406057;padding-top:25px;margin-top:36px}details{border:1px solid #426057;border-radius:8px;padding:17px 22px;margin:20px 0}summary{cursor:pointer;font-weight:bold}.script{display:grid;grid-template-columns:1fr 1fr;gap:25px}.script article{border-top:1px solid #4e6558;padding-top:13px}.time{color:#d9b675;font-size:13px}.script h3{font-size:19px}.script p{font-size:16px;color:#e5e6d5}.table{overflow:auto}table{border-collapse:collapse;min-width:680px;width:100%;font-size:14px}td,th{text-align:left;padding:15px;border-bottom:1px solid #3b5c54;vertical-align:top}td:first-child{white-space:nowrap;color:#ddba79}.boards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.boards img{width:100%;border-radius:7px}.sources li{margin:25px 0}.sources p,small,.meta{font-size:13px;color:#b5c8ba;overflow-wrap:anywhere}.sources small{display:block}.note{border-left:3px solid #d5a45d;padding-left:16px;color:#d5d7c6;font-size:14px}.foot{margin-top:55px;padding-top:25px;border-top:1px solid #3e5d53;font-size:13px;color:#9eb7ac}@media(max-width:760px){main{padding:24px 18px}.hero{grid-template-columns:1fr;gap:26px}.hero>.video{grid-row:1;max-width:360px;justify-self:center;width:100%}.script{grid-template-columns:1fr}.boards{grid-template-columns:1fr}.boards img{max-width:600px}h1{letter-spacing:-1px}.button{padding:10px 13px}}
</style><main><div class="hero"><section><div class="eyebrow">CAESAR LAB / GOLD / V2</div><h1>降息之后，<br>黄金经过哪三道传导？</h1><p class="lead">完整 84.6 秒机制篇。把“实际利率、美元、预期差”逐层展开，用同一块金条连接每一步解释。</p><span class="chip">1080 × 1920</span><span class="chip">30 fps</span><span class="chip">32 组字幕</span><span class="chip">默认无音轨</span><ul class="changes"><li><strong>概念讲到“为什么”</strong><span>先说明机会成本，再用同期限的数字算出实际利率为何可能上升。</span></li><li><strong>节奏落在解释动作上</strong><span>旋钮、证券、分层柱体、汇率与预期标尺接续推进；口播以 +12% 语速生成。</span></li><li><strong>事实、假设和边界分开</strong><span>原文政策设想注明 2026 年 1 月；两个数值算例均标记为原创假设。</span></li></ul><div class="buttons"><a class="button" href="out/final-silent.mp4" download>下载静音完整 MP4</a><a class="button secondary" href="out/final-with-audio.mp4" download>下载配音完整 MP4</a></div><div class="buttons"><a href="out/黄金三道传导.srt" download>SRT 字幕</a><a href="source/完整字幕稿.txt" download>完整口播文本</a><a href="黄金三道传导_完整交付包.zip" download>工程与成片 ZIP</a></div><p class="note">右侧播放器没有音轨，默认暂停。配音版含云希旁白、配乐与动作音效，只提供下载；本轮全程未外放声音。</p></section><div class="video"><video id="film" controls muted playsinline preload="none" poster="qa/poster.jpg"><source src="out/final-silent.mp4" type="video/mp4"></video><div class="badge">完整成片 / 无音轨预览 / 01:24.63</div></div></div>
<div class="panel"><h2>从名词，走到可以算、可以比较</h2><p class="lead">5% − 3% ≈ 2%，4% − 1% ≈ 3%。名义收益率下降，实际利率仍可能上升。再看美元报价不变时的换算成本，以及“降了、却没有预期降得多”的区别。</p><div class="boards"><a href="qa/final-contact-1.jpg"><img src="qa/final-contact-1.jpg" alt="开头与政策工具、机会成本的实际成片帧"></a><a href="qa/final-contact-2.jpg"><img src="qa/final-contact-2.jpg" alt="实际利率算例与期限传导的实际成片帧"></a><a href="qa/final-contact-3.jpg"><img src="qa/final-contact-3.jpg" alt="美元、预期差与结尾的实际成片帧"></a></div></div>
<details><summary>展开完整字幕稿 · 按真实口播时间分段</summary><div class="script">PARAGRAPHS</div></details>
<details><summary>分镜动作与连续性</summary><div class="table"><table><thead><tr><th>时间</th><th>要理解什么</th><th>画面实际发生什么</th></tr></thead><tbody>ROWS</tbody></table></div><p class="meta">金条为跨镜头的同一主体。控制台镜头跟随操作位置移动。章节采用构图切换配合主体移动，不把所有转场描述为无缝形变。</p></details>
<details><summary>制作与检查记录</summary><p>复用 weilanx 的 Remotion 工程、逐帧时间函数、本地字体、投影工具与声音合成；延续前版原创控制台模型。先渲染 15.5 秒的实际利率段，再渲染全片。声音采用真实 WordBoundary 对齐，按语义分成 32 组字幕。</p><p>已修正金条遮住开头标题、算式缺百分号、预期差括线穿过数字、字幕跨章拼接四个问题。检查技术规格、手机尺寸静帧和关键连续帧；未外放试听，审美满意度留给实际观看反馈。</p><p>本片使用代码绘制的金条、控制台、证券和图解；没有把生成静帧冒充成片截图，也没有使用虚构的历史价格走势。成片是机制改编，未覆盖原文全部行情复盘。</p><p><a href="qa/technical-checks.json">技术检查 JSON</a> · <a href="qa/制作检查记录.json">制作检查记录</a> · <a href="source/脚本证据映射.json">脚本证据映射</a> · <a href="source/分镜动作与时间码.json">分镜时间码</a></p></details>
<details><summary>文章来源、核查资料与原文取舍</summary><p>用户提供：《再见鲍威尔，你好沃什：黄金暴跌复盘&amp;美联储新主席沃什冲击深度研究》，公众号「凯撒的复利实验室」。提供的是粘贴正文，原文链接、精确发布日期与原图未取得。本片只改编其中政策传导主题，并增加原创数字例子。2026 年 1 月的政策设想与当时联储实际操作分开处理；不直接沿用原文的盘中涨跌数字和单一归因。</p><ol class="sources">SOURCES</ol></details>
<details><summary>开源工具与可编辑工程</summary><p>本轮实际复用：<br><a href="https://github.com/Azure12355/weilanx-claude-videos">https://github.com/Azure12355/weilanx-claude-videos</a> — Remotion 逐帧渲染、动画函数、本地字体和声音合成基础。<br><a href="https://github.com/Kianzzz/xilo-opus-video">https://github.com/Kianzzz/xilo-opus-video</a> — 参考对象状态、连续小样和实渲验收方法；未把其渲染器冒充本片执行引擎。</p><p>工程包含 TypeScript 源码、素材、音轨、真实字幕时间线、事实核查及构建脚本。node_modules 与缓存未打包，打开方式见包内 README.txt。它是可编辑代码工程，不是剪映原生草稿。</p></details>
<div class="foot">2026-10-22 · 84.63 秒完整版 · 旧版 12.27 秒样片保留。<br>这次完成的是一篇文章的可复核成片，通用自动流水线仍需通过更多文章检验。</div></main></html>'''
page=page.replace('PARAGRAPHS',paragraphs).replace('ROWS',rows).replace('SOURCES',ref)
page=page.replace('</style>','.media{position:relative}.media video{visibility:hidden}.media.started video{visibility:visible}.playCover{position:absolute;inset:0;width:100%;height:100%;padding:0;border:0;border-radius:7px;overflow:hidden;background:#eee9da;cursor:pointer}.playCover img{display:block;width:100%;height:100%;object-fit:cover}.playCover span{position:absolute;left:50%;bottom:8%;transform:translateX(-50%);background:#123c3bf2;color:#f4e4bd;border:1px solid #d5aa58;padding:11px 21px;border-radius:30px;white-space:nowrap;font:700 15px "Microsoft YaHei",sans-serif;box-shadow:0 5px 20px #0004}.playCover:focus-visible{outline:3px solid #ef7346;outline-offset:4px}.playCover[hidden]{display:none}</style>')
page=page.replace('<video id="film"','<div class="media"><video id="film"')
page=page.replace('</video><div class="badge">','</video><button class="playCover" type="button" aria-label="播放无音轨完整成片"><img src="qa/poster.jpg" alt="黄金三道传导封面"><span>▶ 静音播放完整成片</span></button></div><div class="badge">')
page=page.replace('</main></html>','''</main><script>const cover=document.querySelector('.playCover'),film=document.getElementById('film');cover.addEventListener('click',async()=>{film.muted=true;cover.hidden=true;film.parentElement.classList.add('started');try{await film.play()}catch(e){film.parentElement.classList.remove('started');cover.hidden=false;cover.querySelector('span').textContent='请下载静音 MP4 观看'}});</script></html>''')
(P/'watch.html').write_text(page,encoding='utf-8')
(P/'README.txt').write_text('''黄金的三道传导 — 84.63秒完整成片 V2
2026-10-22

交付
out/final-silent.mp4       无音轨完整MP4，优先预览
out/final-with-audio.mp4   云希配音、配乐、动作音效的完整MP4
out/黄金三道传导.srt        实际WordBoundary对齐字幕
source/完整字幕稿.txt        完整口播
watch.html                本地预览与来源说明，默认暂停和无音轨
工程/src/FullFilm.tsx      主要视觉和动画实现
工程/src/Mechanism.tsx     复用的旋钮与证券模型
工程/src/timing.json       2539帧时间线、48个口播动作片段、32组字幕

打开预览
在本目录运行：python -m http.server 54723 --bind 127.0.0.1
访问 http://127.0.0.1:54723/watch.html
本机现有服务亦可访问 http://127.0.0.1:54722/full-v2/watch.html
不要启动带声播放；静音版从文件层面没有音轨。

可编辑工程
安装 Node.js、Python 3.11+、FFmpeg（含ffprobe）并加入PATH。
Python依赖：python -m pip install pillow playwright edge-tts
进入 工程 目录，执行 npm ci。
设置环境变量 REMOTION_BROWSER 为专用 Chrome Headless Shell 可执行文件绝对路径。
Windows PowerShell 中运行 ./render.ps1。
该脚本先编译检查，再渲染1080×1920全片，再合成音轨和最终版本。
若只改画面，无需重新生成旁白。
voice.py 默认复用已有MP3和WordBoundary。只有脚本或配音参数变化才调用Edge TTS网络服务。
时间线与字幕均来自真实语音边界，不按字数匀分。
字幕保留32个语义单元，不把跨章短句拼在一起。
代码工程可重新渲染和修改，并非剪映原生草稿。

来源与许可
原文由用户粘贴提供；保留来源文本供核对，不附原文图片或未经取得的文章URL。
视频图形为本工程代码绘制；旁白为Edge TTS云希；音乐、动作音效由weilanx声音合成代码生成。
weilanx仓库：https://github.com/Azure12355/weilanx-claude-videos
参考的对象状态/实渲方法：https://github.com/Kianzzz/xilo-opus-video
保留工程/WEILANX-LICENSE及字体OFL许可。事实核查完整URL在source/核查来源.json。

内容边界
2026年1月原文中的“可能降息又缩表”是设想，不说成当时已执行。
5%→4%、3%→1%及50bp/25bp均为原创假设，不是历史行情。
一年期名义收益率与一年期预期通胀相减，是实际利率的近似。
短端与长端、汇率换算与美元金价、影响因素与必然结果分开处理。
本片是传导机制篇，不是原文全部历史事件的纪录片。

检查状态
全片技术检测、关键实际帧、手机缩图、连续帧检查见qa。
整个制作过程没有外放音频；混音响度做数字测量，未声称完成主观听感验收。
此前版本不覆盖、不删除；本版不宣称达到所有用户的审美验收。
''',encoding='utf-8')
print('viewer, storyboard, README and review saved')
