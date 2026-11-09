from pathlib import Path
import json,html
P=Path(__file__).resolve().parent
tl=json.loads((P/'assets/timeline.json').read_text(encoding='utf-8'))
spec=json.loads((P/'source/script.json').read_text(encoding='utf-8'))
names=['盈利结果与三个动作','同一路径改变评价窗口','104的两个参考点','两个独立旋钮','反馈和决策的实验矩阵','20笔费用累计','信息到行动的理由','观察与决策分层','证据穿过门槛']
actions=[
('price-tape','100 / 108与单一收益表','同一结果下，眼睛、评价、行动分开','环形读数器与价格纸带','同一纸带进入路径展示','100 to 108 is +8%'),
('price-tape','相邻七段涨跌','窗口移动再扩到整段，终值仍+8%','同一纸带','回看纸带上的104，不新增价格','7 intervals, 3 down, +8% total'),
('price-104','104单独存在','同时与100及106比较','价格点104','圆形比较器变为两个控制旋钮','+4%; -1.89%'),
('controllers','报价与决策并置','两个旋钮分开，报价更新与锁门权限独立','圆形控制器','两个变量进入实验矩阵','mechanism only'),
('factorial-design','两种频率','形成2x2四条件与两项研究结果','独立变量','决策权限进入交易装置','1810 recruited; no fabricated effect size'),
('capital','10000余额','20笔扣费移入费用槽，余额与费用同步','行动权限','交易成本要求行动理由','10000*.998^n; final9607.51; funds+fee=10000'),
('evidence','观察报价','按信息理由连接判断及风险边界','原先报价','信息进入决策闸门','price can contain information'),
('decision-gate','持续监测数据','计划复核或条件触发才启动决策','证据与门槛','收束为证据通过门槛','not blind holding'),
('evidence','门外证据','开门、证据通过、短期刺激停下','同一决策门槛','结尾停稳','no profitability guarantee')]
shots=[]
for ch,a in zip(tl['chapters'],actions):
    obj,before,after,entry,exit,invariant=a
    shots.append(dict(chapter=ch['id'],title=ch['title'],start=ch['start'],end=ch['end'],objectId=obj,before=before,after=after,cue=[ch['cueStart'],ch['cueEnd']],entry=entry,exit=exit,nextObject=actions[len(shots)+1][0] if len(shots)+1<len(actions) else None,numericInvariant=invariant,verificationTime=ch['start']+(ch['end']-ch['start'])*.55))
(P/'source/storyboard.json').write_text(json.dumps(shots,ensure_ascii=False,indent=2),encoding='utf-8')
nav=''.join(f'<button class="chapter" data-time="{c["start"]}"><span>{int(c["start"]//60):01}:{int(c["start"]%60):02}</span>{html.escape(n)}</button>' for c,n in zip(tl['chapters'],names))
script=''.join('<p>'+html.escape(''.join(a+b for a,b in zip(c['cues'],c['p'])))+'</p>' for c in spec['chapters'])
page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>看行情，还是重做决定？</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5efde;color:#112b37;font-family:system-ui,'Microsoft YaHei',sans-serif}main{max-width:1160px;margin:auto;padding:30px}header{border-bottom:2px solid;padding-bottom:25px;margin-bottom:28px}small{letter-spacing:.12em}h1{font-size:clamp(26px,4vw,48px);line-height:1.3;margin:16px 0}p{line-height:1.8}section{display:grid;grid-template-columns:minmax(280px,420px) minmax(0,1fr);gap:36px}.player{position:relative;background:#112b37;aspect-ratio:9/16;border-radius:12px;overflow:hidden;align-self:start}video{width:100%;height:100%;display:block}#cover{position:absolute;inset:0;border:0;cursor:pointer;background:transparent;color:white;display:grid;align-content:end;justify-content:center;padding:40px;background:linear-gradient(transparent 70%,#112b37)}#cover span{background:#174acc;padding:16px 25px;border-radius:30px;font-size:18px}.links{display:flex;gap:12px;flex-wrap:wrap}a{color:#174acc;overflow-wrap:anywhere}a.primary{background:#174acc;color:white;text-decoration:none;padding:13px 17px;border-radius:8px}.chapter{display:flex;gap:16px;text-align:left;width:100%;border:0;border-bottom:1px solid #b9c9c2;padding:15px 0;background:transparent;color:#112b37;font-size:16px;cursor:pointer}.chapter span{color:#ef643e;font-variant-numeric:tabular-nums}.note{font-size:14px;color:#66818a}.fact{background:#112b37;color:#fffdf4;border-radius:10px;padding:18px 22px;margin-bottom:16px}.fact b{font-size:28px;display:block}.sheets img{max-width:100%;height:auto}details{border-top:1px solid #b9c9c2;margin-top:24px;padding-top:18px}summary{cursor:pointer;font-weight:700}footer{padding:35px 0;font-size:13px;color:#66818a}@media(max-width:740px){main{padding:20px}section{grid-template-columns:1fr}.player{max-width:420px;width:100%;margin:auto}h1{font-size:30px}}
</style><main><header><small>凯撒选题研究 · 2026.10.23</small><h1>你在看行情，<br>还是反复重做决定？</h1><p>同一条价格路径，拆开观察、评价与行动。</p></header><section><div class="player"><video controls muted playsinline preload="none" poster="qa/poster.jpg"><source src="out/final-silent.mp4" type="video/mp4"></video><button id="cover"><span>播放静音预览</span></button></div><div><div class="fact"><b>2 分 53 秒 · 1080 × 1920</b><p>一条价格纸带 → 两个参照点 → 独立旋钮 → 交易费用 → 决策闸门</p></div><div class="links"><a class="primary" href="out/final-with-audio.mp4" download>下载配音版 MP4</a><a href="out/看行情还是重做决定.srt" download>SRT 字幕</a><a href="决策频率_完整交付.zip" download>工程与完整交付包</a></div><p class="note">页面预览没有音轨，默认暂停。配音版单独下载，不自动播放。</p>__NAV__</div></section><details><summary>完整口播稿</summary>__SCRIPT__<a href="source/完整字幕稿.txt">打开纯文本字幕稿</a></details><details><summary>来源与阅读范围</summary><p>选题线索来自凯撒的复利实验室公众号《行为投资学 | 为什么越努力盯盘，亏损概率越高？深度解析“损失厌恶”陷阱。》的目录。未取得该篇正文。本片根据原始研究与原创假设算例独立编写，不能称为该文的忠实改编。</p><p>主要新证据是 Schwaiger 等的在审工作论文；两项实验第一项不显著，第二项及合并分析更支持决策频率作用。实验测量风险投入，不直接预测实盘收益。</p><a href="https://www.netspar.nl/wp-content/uploads/AP_2026_006_Zeisberger.pdf">工作论文完整原址</a><p><a href="evidence/事实核查与原创算例.txt">六项第一方来源、完整链接与算例边界</a> · <a href="evidence/来源与改编边界.txt">公众号选题溯源</a></p></details><details class="sheets"><summary>实际成片分镜</summary><img src="qa/final-contact-1.jpg" alt="第一部分实际帧"><img src="qa/final-contact-2.jpg" alt="第二部分实际帧"><img src="qa/final-contact-3.jpg" alt="第三部分实际帧"></details><footer>Remotion 可编辑源码；不是剪映或 PR 原生工程。扩展版不替代60–90秒任务短片验收。已做技术与制作方画面检查，没有外放或人工听审。</footer></main><script>
const video=document.querySelector('video'),cover=document.getElementById('cover');video.muted=true;cover.onclick=()=>{cover.hidden=true;cover.style.display='none';video.muted=true;video.play()};document.querySelectorAll('.chapter').forEach(b=>b.onclick=()=>{cover.style.display='none';video.muted=true;video.currentTime=Number(b.dataset.time);video.play()});
</script></html>'''
(P/'watch.html').write_text(page.replace('__NAV__',nav).replace('__SCRIPT__',script),encoding='utf-8')
(P/'README.txt').write_text(f'''你在看行情，还是反复重做决定？
成片：{tl['seconds']:.3f}秒 / 1080×1920 / 30fps / {tl['frames']}帧
out/final-with-audio.mp4：配音、低音量原创合成音乐及动作音效；制作期间没有外放或人工听审。
out/final-silent.mp4：无音轨预览。
out/看行情还是重做决定.srt：真实Edge TTS WordBoundary对齐。
watch.html：默认暂停的静音观看页；网页可以按章节跳转。

来源：公众号目录仅为选题线索，没有取得正文。此片为原始研究与原创算例支持的独立改写，详见evidence。
假设价格路径和0.2%单边费用并非市场数据；工作论文还在审稿，风险配置实验不是实际收益预测。

源码：工程/src/Observations.tsx、Mechanisms.tsx 为内容动作；Film.tsx为连续世界镜头与字幕；design.tsx为视觉组件；timing.json为真实配音时序。
重现：Node + Python + FFmpeg；工程目录npm ci；Python依赖edge-tts、Pillow、playwright；设置REMOTION_BROWSER为本机Chrome Headless Shell路径；运行工程/render.ps1。已缓存语音及词边界，文稿不变无需新语音请求。
这是Remotion源码，不是剪映/PR/FCP原生时间线。可以导入MP4和SRT，细节动画需改源码。三分钟扩展版不冒充任务60–90秒验收。

复用工具：
https://github.com/Azure12355/weilanx-claude-videos — Remotion工作流、本地字体与合成音频模块。
https://github.com/Kianzzz/xilo-opus-video — 对象状态、连续小样、时间码审查方法。
许可证保留在工程/WEILANX-LICENSE及工程/public/fonts/vox/。
全片主体图形为原创代码；无第三方参考视频画面或音乐。
技术通过、制作方检查与用户审美认可分别记录，不声明“完美”。
''',encoding='utf-8-sig')
print('Viewer, shot contracts and delivery notes written')

