黄金的三道传导 — 84.63秒完整成片 V2
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
