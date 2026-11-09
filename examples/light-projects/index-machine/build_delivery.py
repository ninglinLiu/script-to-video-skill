from pathlib import Path
import json,html
P=Path(__file__).resolve().parent
tl=json.loads((P/'assets/timeline.json').read_text(encoding='utf-8'));sc=json.loads((P/'source/script.json').read_text(encoding='utf-8'))
ledger=json.loads((P/'evidence/claim-ledger.json').read_text(encoding='utf-8'))
def esc(s):return html.escape(str(s))
def stamp(t):return f'{int(t)//60}:{int(t)%60:02d}'
chap=''.join(f'<button class="chapter" data-time="{c["start"]}"><b>{stamp(c["start"])}</b><span>{esc(c["title"])}</span></button>' for c in tl['chapters'])
script=''.join('<article><small>'+stamp(c['start'])+'</small><h3>'+esc(c['title'])+'</h3><p>'+esc(''.join(a+b for a,b in zip(s['cues'],s['p'])))+'</p></article>' for c,s in zip(tl['chapters'],sc['chapters']))
links=''.join(f'<li><a href="{esc(s["url"])}" target="_blank" rel="noreferrer">{esc(s["publisher"])} · {esc(s["title"])}</a><p>{esc(s["note"])}</p></li>' for s in ledger['sources'])
doc='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>指数工场 · 三分钟机制研究</title><style>
:root{color-scheme:dark;--paper:#f3eedf;--ink:#111d25;--muted:#9faeaf;--lime:#d9f05b;--blue:#174fe8}*{box-sizing:border-box}body{margin:0;background:var(--ink);color:var(--paper);font-family:Arial,'Microsoft YaHei',sans-serif}a{color:var(--lime);text-underline-offset:5px;overflow-wrap:anywhere}button{font:inherit;cursor:pointer}main{max-width:1220px;margin:auto;padding:38px 30px 70px}.eyebrow{font-size:11px;letter-spacing:4px;color:var(--lime)}header{border-bottom:1px solid #43505a;padding-bottom:28px}h1{font-size:clamp(34px,4.7vw,64px);line-height:1.18;letter-spacing:-2px;margin:18px 0}header p{color:#bbc6c4;max-width:800px;line-height:1.9}.lead{display:grid;grid-template-columns:minmax(280px,380px) 1fr;gap:58px;margin:38px 0}.media{aspect-ratio:9/16;position:relative;background:#000;border:1px solid #4a5c5f;overflow:hidden;border-radius:9px}.media video{width:100%;height:100%;display:block;visibility:hidden}.media.started video{visibility:visible}.cover{position:absolute;inset:0;border:0;padding:0;background:#000}.cover img{width:100%;height:100%;object-fit:cover}.cover span{position:absolute;left:16px;right:16px;bottom:15px;padding:15px;background:#d9f05b;color:#111d25;font-weight:bold;border-radius:3px}.meta{color:var(--lime);font-size:12px;letter-spacing:2px}.right h2{font-size:34px;line-height:1.4;margin:15px 0}.right p{line-height:1.9;color:#b5c2bf}.chapter{display:flex;gap:20px;text-align:left;width:100%;border:0;border-bottom:1px solid #35434b;background:none;color:var(--paper);padding:13px 0;font-size:14px}.chapter b{color:var(--lime);font-variant-numeric:tabular-nums}.chapter:hover{color:var(--lime)}.downloads{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}.downloads a{display:block;border:1px solid #677679;text-decoration:none;padding:12px 14px;font-size:13px}.downloads a:first-child{color:var(--ink);background:var(--lime);border-color:var(--lime)}.sheet-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.sheet-grid img{width:100%;border-radius:5px}.label{margin:38px 0 20px;border-top:1px solid #43505a;padding-top:24px;font-size:15px;letter-spacing:2px}.notice{background:#1e2d35;border-left:3px solid var(--lime);padding:18px 23px;font-size:14px;line-height:1.9;color:#c6cfcb}details{border-top:1px solid #43505a;padding:22px 0;line-height:1.9}summary{cursor:pointer;font-size:19px}article{padding:15px 0;border-bottom:1px solid #35434b}article small{color:var(--lime)}article h3{margin:4px 0 9px}article p{margin:0;color:#c6cfcb}li p{font-size:13px;color:#aab8b5}footer{margin-top:40px;color:#849694;font-size:12px;line-height:1.9}@media(max-width:750px){main{padding:24px 18px}.lead{display:block;margin:24px 0}.media{max-width:390px;margin:auto}.right{margin-top:28px}.right h2{font-size:28px}.sheet-grid{grid-template-columns:1fr}.sheet-grid img{max-width:540px}.downloads a{padding:10px}h1{letter-spacing:-1px}}
</style><main><header><div class="eyebrow">CAESAR LAB / INDEX WORKSHOP</div><h1>指数会换人，<br>为什么还会亏钱？</h1><p>从一份会更新的名单，走进权重、股本和定价的内部。三分钟，看懂企业的进化与投资回报之间的距离。</p></header><section class="lead"><div><div class="media"><video id="film" controls playsinline muted preload="none" poster="qa/poster.jpg"><source src="out/final-silent.mp4" type="video/mp4"></video><button class="cover" id="cover" aria-label="播放无音轨视频"><img src="qa/poster.jpg" alt="成片实际帧"><span>▶ 播放无音轨版 · 不会外放</span></button></div><p class="meta">__DURATION__ · 1080 × 1920 · 30 FPS</p></div><div class="right"><div class="eyebrow">THE FILM / 机制与反例</div><h2>名单会更新。<br>收益没有保底。</h2><p>五家公司不等于五份平均风险；每股收益增长不等于经营改善；盈利变好，也可能被估值收缩抵消。</p>__CHAPTERS__<div class="downloads"><a href="out/final-silent.mp4" download>下载静音成片</a><a href="out/final-with-audio.mp4" download>下载含配音成片</a><a href="out/指数不是永动机.srt" download>SRT 字幕</a><a href="指数工场_三分钟完整交付.zip" download>工程与完整交付包</a></div></div></section><div class="notice">来源说明：选题来自「凯撒的复利实验室」同名作者的<a href="https://xueqiu.com/9435177215/364950243" target="_blank">《美股长期牛市的底层逻辑》雪球公开文章</a>。该篇微信原址尚未核实；取得的是索引正文，图片缺失。片中的算例为原创假设，金融机制另据 S&amp;P、SEC 等一手资料核对。没有使用实时持仓或预测收益。</div><h2 class="label">ACTUAL FRAMES / 最终成片画面</h2><div class="sheet-grid"><a href="qa/final-contact-1.jpg"><img src="qa/final-contact-1.jpg" alt="成分与权重连续画面"></a><a href="qa/final-contact-2.jpg"><img src="qa/final-contact-2.jpg" alt="回购与估值连续画面"></a><a href="qa/final-contact-3.jpg"><img src="qa/final-contact-3.jpg" alt="共同风险与结论画面"></a></div><details><summary>完整口播稿 · 按真实配音时间排列</summary>__SCRIPT__</details><details><summary>事实、出处与可复现工程</summary><p>画面、数字和中文排版由可编辑 Remotion 工程逐帧生成。继承 weilanx 的确定性渲染、世界坐标镜头和音频合成工具，重新设计本片工场。字体随工程附许可证；未使用生成式图片或视频片段。</p><p><a href="https://github.com/Azure12355/weilanx-claude-videos">https://github.com/Azure12355/weilanx-claude-videos</a> — 本片直接复用的开源工具链。</p><p><a href="https://github.com/Kianzzz/xilo-opus-video">https://github.com/Kianzzz/xilo-opus-video</a> — 对象状态、连续小样与逐帧检查方法参考。</p><ol>__SOURCES__</ol><p><a href="evidence/claim-ledger.json">完整论点与证据清单</a> · <a href="source/完整字幕稿.txt">文字稿</a> · <a href="qa/technical-checks.json">技术检测记录</a> · <a href="README.txt">工程使用说明</a></p></details><footer>本页初始暂停。预览源没有音轨；有声版仅提供独立下载。技术检测不代表审美已获用户认可。<br>原创机制教学，不构成个别证券买卖建议。© 本片制作记录 / 2026-10-22</footer></main><script>const film=document.querySelector('#film'),cover=document.querySelector('#cover'),media=document.querySelector('.media');async function start(at){film.muted=true;if(Number.isFinite(at)){film.preload='auto';film.currentTime=at}cover.hidden=true;media.classList.add('started');try{await film.play()}catch(e){cover.hidden=false;media.classList.remove('started');cover.querySelector('span').textContent='请下载静音 MP4 观看'}}cover.addEventListener('click',()=>start());document.querySelectorAll('.chapter').forEach(b=>b.addEventListener('click',()=>start(Number(b.dataset.time))));</script></html>'''
doc=doc.replace('__DURATION__',stamp(tl['seconds'])).replace('__CHAPTERS__',chap).replace('__SCRIPT__',script).replace('__SOURCES__',links)
(P/'watch.html').write_text(doc,encoding='utf-8')
readme=f'''指数工场｜三分钟完整交付
标题：指数会换人，为什么还会亏钱？
时长：{tl['seconds']:.3f} 秒；1080×1920；30 fps；{tl['frames']} 帧

直接观看：watch.html。默认暂停，预览仅使用没有音轨的 final-silent.mp4。
含声成片：out/final-with-audio.mp4；有配音、原创合成配乐与音效，但制作期间没有外放或人工听审。
字幕：out/指数不是永动机.srt；由真实 TTS WordBoundary 对齐，非估算字速。

来源：同名作者公开雪球文章，不能当作已核实的公众号同篇原址。
https://xueqiu.com/9435177215/364950243
来源边界和官方资料：evidence/。原文缓存不在交付包内。
所有算例均为假设，金融规则与文字来源见 claim-ledger.json。

可编辑工程：工程/src/Film.tsx 管连续世界镜头，Stations.tsx/Weights.tsx/Capital.tsx 管画面，design.tsx 管视觉系统，timing.json 是真实语音时序。source/script.json 管文稿。
这是 Remotion/React 源码工程，不是剪映、PR 或 FCP 原生时间线。可将成片及 SRT 导入这些软件；细节动画在源码中编辑。

重现：安装 Node/Python/FFmpeg；在工程目录 npm ci。Python 安装 edge-tts、Pillow、playwright。设置 REMOTION_BROWSER 为本机 Chrome Headless Shell 路径，随后运行工程/render.ps1。
脚本会使用已缓存的 voice.mp3 和真实词边界；改稿后需要联网重新合成。不要启用自动有声播放。
工程/WEILANX-LICENSE 和 public/fonts/vox/LICENSES.md、OFL.txt 保留原许可证。

开源来源（完整链接）：
https://github.com/Azure12355/weilanx-claude-videos — 复用 Remotion 工程规范、世界镜头思路与 synth/bgm 音频模块。
https://github.com/Kianzzz/xilo-opus-video — 制作方法参考，对象状态、连续小样、实际渲染验收。

技术检测只证明文件与算例可用；审美与专业传播效果仍需实际观众反馈。没有宣称“完美”或自动化已通用于任意文章。
'''
(P/'README.txt').write_text(readme,encoding='utf-8')
print('Delivery page and README written')
