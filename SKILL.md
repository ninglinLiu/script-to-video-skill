---
name: script-to-video
description: 把中文文章、研究选题或事件复盘改编成知识视频。两种主风格：用户已认可的代码 3D 微缩一镜到底（three.js 逐帧渲染 + 真实词界配音 + 动作组件库），以及新增可选的代码模拟暗金排版（临界点风格：纯音乐、逐字大字、实时模拟；样片待用户审片），开工前先问用户选哪种；也保留纸面章节、泊松空间等已有路线。交付 MP4、SRT、来源和工程。不处理旅行素材精剪。
---

# 文字转视频

做片的目标只有一个：**观众不看字幕，也能看懂画面里谁对谁做了什么。** 质量基准是用户认可的[币安样片](examples/binance-1029/README.md)，先看它的[分镜总览](docs/media/storyboard-binance.jpg)再动手。用户的原话是"符合初版要求"，并说它还没达到参考动画的效果，约五成，所以它是起点，不是上限。另一种并列风格是老板喜欢的《临界点》式代码模拟暗金排版，样片见[凯利公式](examples/caesar-kelly/README.md)（还没有评价）。

## 先分清要交付什么

- **做片**：先问风格（见下一节），再按对应路线走。用户一次给文章或主题，内部完成制作和修复，只在观感测试时请用户看一眼。
- **改 Skill**：交付工具、文档和回归测试，不要拿一条新片冒充流水线修好了。以补充、修正和整理为主；必要的删减说明原因和去向，记进[删减记录](docs/removals.md)，删 GitHub 上已有的东西先问用户。维护步骤看 [CONTRIBUTING](CONTRIBUTING.md)。
- **研究**：给选路和证据，不生成新片。

用户当前的要求优先于这里的默认值。

## 先问风格

用户没指定风格时，开工前先问一句，附样片让用户挑：① 3D 微缩一镜到底（[币安样片](examples/binance-1029/README.md)，用户认可的初版基准）；② 代码模拟暗金排版（[凯利样片](examples/caesar-kelly/README.md)，老板喜欢的临界点风格）；③ 下表其他路线。用户说“你定”时按题材推荐：事件经过、机制、资金流向选 ①，一个能算出来的阈值、概率、比例选 ②。

## 选路线

| 路线 | 什么时候用 | 状态 |
|---|---|---|
| [3D 微缩一镜到底](references/diorama-3d.md) | 机制、资金或数据流向、事件复盘、因果链；保留为已认可的基准路线 | R08 用户认可（币安这一条，横屏 60 秒） |
| [3D 微缩 · Blender 渲染](references/diorama-3d.md#blender-路线2026-11-02-实测) | 用户明确要更强的光影质感，能接受约 27 倍的渲染时间 | 只跑过凯撒一条竖屏；配乐获认可（R09），画面用户未单独评价 |
| [代码模拟 · 暗金排版](references/sim-typography.md) | 老板喜欢的临界点风格；题目核心是一个能算出来的数 | 凯利样片制作方自查，用户和老板还没看 |
| [泊松空间镜头](references/poisson-cinema.md) | 用户指定这种电影感风格 | 原片方向被喜欢（R07），参数化改编被否决（R04） |
| [纸面章节迁移](references/executable-production.md) | 用户指定纸面风格或要改这条旧片 | 工程可运行，改编被否决（R06） |
| [像素街区](references/pixel-scene-map.md) | 只研究或取材 | 用户否决（R01） |

选择其他路线，或拿不准时，先查历史评价：`python scripts/experience.py select --stage plan --route <路线>`。旧流程的完整约束在[旧路线工作流](references/legacy-workflow.md)。

## 3D 微缩路线七步

```sh
python scripts/diorama.py doctor                              # 查依赖
python scripts/diorama.py new --episode ./ep                  # 起工程；加 --source binance-1029 可从完整案例改
```

1. **证据和稿件**：写 `source/script.json`，每句有 `text`、字幕分行 `sub`、来源 `src`。事实核对到一手来源；第三方统计在画面上注明出处，没复算就写没复算。
2. **配音**：`python tts.py .` 得到真实词界时间线。所有动画时间都写成 `C.L4.start + .3`，改稿重配后画面自动跟上。
3. **站点表**：每句旁白对应一个站点，写清"主体、发起 → 接触 → 结果、结果改变了哪个数、镜头怎么走"。这张表比代码重要。
4. **搭场景**：在 `web/scene.js` 里用 [组件库](assets/diorama-kit/README.md)。缺组件就加进 `props.js`，别为这条片单写一次性代码。动作参数看[动效手艺](references/motion-craft.md)。
5. **观感测试**：`node render.mjs stills …` 出 8–12 张静帧修光照和可读性，`node render.mjs clip a b --mb 4` 渲 4–8 秒连续片，抽 10fps 帧看动作过程。**用户在场就把这一段给用户看，通过了再渲整片。**
6. **整片**：`node render.mjs full --mb 4`，再 `python srt.py .`。
7. **检查和交付**：`python scripts/diorama.py deliver --episode .`，`motion` 查长停留，`storyboard` 出分镜总览，从头看到尾。交付 `out/final.mp4`、SRT、来源、工程和分镜总览。

**要配乐时**（用户认可过一次，范围只到那次配乐，见 R09）：`python scripts/music_library.py list` 选曲，`fetch` 下载并校验；`python sfx.py .` 把旁白和音效混成 `audio/mix.wav`；`python scripts/mix_music.py --video out/final.mp4 --voice audio/mix.wav --music <曲目> --track <id> --output … --report … --credit-out …`。旁白和音效比例不动，音乐有声时自动让路。至少给用户两版听，**发布时把署名放进简介或片尾**。参数和验证见[声音与素材](references/audio-and-materials.md)。

**选了代码模拟暗金排版时**：`python scripts/simfilm.py new --episode ./ep`，先写 `data/build_data.py` 把上屏的数全算出来，再写 `web/scene.js`；静帧拼图、连续片、整片，`mix_music.py` 不传 `--voice` 就是纯音乐。版式、节奏和结构模板见 [sim-typography](references/sim-typography.md)。

## 质量底线

以下动作、镜头、明亮画面和词界字幕要求用于 3D 微缩路线；选择代码模拟暗金排版时，按其[路线说明](references/sim-typography.md#质量底线)检查数据驱动的动作、逐字文字和可读性。整片审看与证据分级适用于所有路线。

- 每个站点至少一个主体动作，有发起、接触和结果，结果改变画面上的某个量。
- 交接要画出来：东西从 A 飞到 B。凭空出现等于动作没发生。
- 尺寸由数据决定：柱高是价格，冰块高度是冻结比例，堆高是金额。
- 不同对象用不同曲线和时长，错峰启动；重物先蓄力再落下。
- 镜头走连续轨道，站点内也缓慢推绕，站点之间跟着飞行物走。
- 画面明亮、颜色饱和。用户否决过阴郁的画风，泛光过强也会把画面冲白。用户 2026-11-02 说之前几个偏白色的样片还行，没有点名具体哪几条，查 `samples.py list --tone light`。
- 字幕烧进画面，按真实词界分行。旁挂 SRT 不算有字幕。
- 只有局部通过不能交付，整片要从头看到尾。

## 经验与反馈

遇到具体问题先查经验，输出已包含卡片正文：

```sh
python scripts/experience.py select --stage repair --query "实际症状"
python scripts/experience.py reflection R08
```

**工具检查通过、制作方自查、独立 Agent 复测、用户认可是四种不同的证据**，分开记录，不互相替代。用户否决的案例保留，认可也要写清范围。认可或否决后更新 `references/experience/reflections.json`。

反馈修复默认同文对照：保留原片，说明改了什么、保留了什么。预览静音，不外放。敏感或仅本地的素材不进公共仓库或外部服务。第三方参考片只留链接和时间码。

模型要能读图才能做观感测试。宿主不能看图时如实说明，可以验证编码和数据，但不能说画面过关。看图、生成图、配音、渲染是不同能力，按宿主实际情况核实。

## 按需读取

| 情况 | 读取 |
|---|---|
| 曲线、时长、错峰、镜头参数 | [动效手艺](references/motion-craft.md) |
| 换题材怎么搭 | [第二内容示例](examples/pareto-diorama/README.md) |
| 长片、章节 | [章节组织](references/long-form.md)（8–10 分钟未验证） |
| 配乐、混音、署名 | [声音与素材](references/audio-and-materials.md)、[曲目目录](assets/music/catalog.json) |
| 找旧片、浅色样片、失败案例和它们的工程 | `python scripts/samples.py list --tone light`、`show <id>`，[样片目录](docs/sample-catalog.md) |
| 临界点风格的版式、配色、节奏 | [代码模拟暗金排版](references/sim-typography.md)、[sim-kit](assets/sim-kit/README.md) |
| 风格素材 | [视觉目录](references/visual-library.md)、[项目配置](references/production-profiles.md) |
| 旧路线、技术验收器、剪辑工程交付 | [旧路线工作流](references/legacy-workflow.md) |
| 换模型、迁移机器 | [运行环境与可移植性](references/runtime-and-portability.md) |
| 维护本仓库 | [CONTRIBUTING](CONTRIBUTING.md)、[架构](docs/architecture.md) |

已验证的范围：币安这一条经用户认可；凯撒样片的配乐经用户认可，画面没有单独评价；凯利样片（临界点风格）还没有评价；竖屏画面、长片、跨模型复现都还没有验证。
