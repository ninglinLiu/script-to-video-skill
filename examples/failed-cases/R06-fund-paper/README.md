# R06 · DeepSeek · 基金清仓61.93秒纸面版

> **评价：用户否决。这里是失败记录和工程，不是可用模板。**
>
> **用户反馈：** 用户认为仍像PPT、缺动画，要求结合下载的抖音样片与Claude参考重新处理。
>
> **观察范围：** 用户反馈及制作方交付自述。此库没有本片MP4，未新增连续观片结论。
>
> **失败做法：** 把版式、字体和装饰符号迁移误当成完整镜头与剪辑迁移。
>
> **可以保留：** 字幕修复；纸面视觉体系；迁移文件哈希与数据证据
>
> **重测条件：** 同稿同音比较主体如何从一个状态到下一状态；同时检查第2、3镜重复大数字的视觉功能。不能只再增加字幕像素检查。

[静音预览](media/preview-silent.mp4) · 完整案例：`python scripts/experience.py reflection R06`

**入库范围（2026-11-02 补入）：** 只收源码、稿件、证据和检查记录，加一条压缩的静音预览和字幕。字体、配音 WAV、逐帧图、参考目录和依赖没有入库，高码率原片和完整工程留在本机。检查记录里的通过项只说明当时的技术状态，不改变用户否决。

---

以下是工程当时的说明，原样保留。其中“通过”“完成”等字样都早于用户评价。

## 61.9 秒竖屏：看对了时代，倒在了黎明前五分钟

用 Skill 最新 main（`d7af12f`）的**完整工程迁移入口**做的独立验收片。原文由用户在对话中提供：
凯撒的复利实验室《传奇AI基金“情景意识”清盘：看对了时代，却倒在了黎明前五分钟》（2026-07-31）。

```sh
python scripts/start_episode.py --source chapter-01 --episode ./productions/kaisa-next-60s
```

## 成片

| 项目 | 结果 |
|---|---|
| 时长 | 61.93 秒（`task-short` 60–90 秒） |
| 画幅 | 1080×1920 / 30fps / H.264 / yuv420p / 10 Mbps CBR / 单条 AAC |
| 镜头 | 6 段：成交单 → 三行读数 → 两条腿 → 36 小时时间线 → 黎明反转 → 结论 |
| 字幕 | 15 条，全部由实测词界生成，烧进画面；`film_delivery inspect` 逐条比对编码后像素 |
| 声音 | edge-tts `zh-CN-YunxiNeural`，−2%，单条旁白 |

文件：`out/final-with-audio.mp4`、`out/final-silent.mp4`、`out/subtitles.srt`、
`assets/timeline.json`、`assets/voice-track.wav`、`工程/`（Remotion 源码）。

## 从 chapter-01 真正迁移了什么

`plans/migration.json` 记录了 27 个文件与哈希。实际进入画面的：

| 迁移项 | 用法 |
|---|---|
| 纸面底色 `#F5EFDE` / 墨色 `#112B37` / 蓝红强调色 | 全片 |
| `Serif`（Noto Serif SC）+ `Anton` 数字 + `Sans` 正文的层级 | 每镜标题与大数字 |
| `.receipt` 账单卡、`.stamp` 印章、`.barcode` 条码 | 第 1 镜的清仓成交单 |
| `kicker` / `Rule` / 进度条 / 页码 / 页脚免责声明 | 全片 |
| `.subtitle` 字幕底板（浅字深底） | 字幕层，按竖屏重排到 y=1492，宽 960 |
| `CaptionProbe` + `render.mjs`（stills / proof / full + 字幕对照组） | 整片渲染与字幕证据 |
| `voice.py`、`requirements.txt`、字体与许可 | 配音与构建 |

**没有沿用的**：chapter-01 的 A/B 双账单内容、`Price` 圆盘、`Recovery` 双柱、`Evidence` 论文页场景；
原稿与旧 SRT 只在 `reference/` 里保留作参考。三个 kit（gilded/blackgold/pixel）本次**一帧都没有用**。

## 竖屏重排了什么

- 画幅 1920×1080 → 1080×1920，`entry.tsx` 两个 composition 同步改；
- 字幕区从 `top:915 left/right:120` 改到 `top:1492 left/right:60`，字号 35 → 40（`vertical.css`，不改 `style.css`）；
- 账单卡从 420×540 改为 936×640，行距与字号重排；
- 时间线改为竖排三节点；纳指与 AI 股改为两行独立读数，不用同轴双柱（避免暗示错误倍数）。

## 已知问题

见 `qa/full-review.json` 与 `qa/delivery.json`：字幕可见性依靠显式画布尺寸才稳定（`AbsoluteFill` 未设宽高时，
探测读到的父容器是 0×0，字幕被逐字换行 → 探测报告不可见）；第二次全片渲染因我在渲染期间写入
`source/storyboard.json`（在 `source_digest` 里）被拒绝认证，重渲后才拿到 `qa/render-full.json`。
