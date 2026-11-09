你在看行情，还是反复重做决定？
成片：173.467秒 / 1080×1920 / 30fps / 5204帧
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
