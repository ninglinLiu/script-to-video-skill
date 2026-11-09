指数工场｜三分钟完整交付
标题：指数会换人，为什么还会亏钱？
时长：179.400 秒；1080×1920；30 fps；5382 帧

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
