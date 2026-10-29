# 完整工程迁移、同文改编与整片审看

> 迁移完整工程仍可能只保住字体和装饰、丢掉实际解释动作。chapter-01的后续纸面改编失败见 `experience.py reflection R06`；只复制文件不能视为质量验收。先用 `experience.py select --stage plan --route chapter-01` 带出相关经验。

## 1. 先选完整影片，再迁移

先看用户已认可方向的完整案例，而非按关键词选容易运行的组件。仓库内 `examples/chapter-01` 提供完整纸面章节；`examples/pareto-revision` 保存同文修改对照。两者是可复现案例，不代表所有文章应使用纸面风格。

选择《泊松过程》风格时用 `--source poisson-cinema`，详见[已有画面与动作的参数化分支](poisson-cinema.md)。这是独立 Canvas 适配器，不走本页下面的 Remotion 命令；它复用环境图、人物和实际解释动作，提供配音时间线与字幕检查的共用接口。不要以只拷贝纸面 CSS 替代指定风格。

```sh
python scripts/start_episode.py --source chapter-01 --episode ./episodes/new-film
```

也可传兼容完整工程目录。当前适配器支持 `Chapter` / `ObservedChapter`、`timing.json` 与 `chapter` composition，缺少适配时明确报错。目标必须为空，不覆盖旧影片。

实际迁移：完整 `src` 和 `public`、字体许可、配音脚本与锁文件、原稿和证据、实测时间线。自动接入字幕探针及全片渲染器；原审稿批准移到 `reference/`，旧 QA 不复制。`plans/migration.json` 记录迁移源与逐文件哈希，**不把旧片认可转移给新片**。

先把旧来源和语音看作参考，改编后重做本片事实审查、TTS、时间线、分镜及实际镜头。字号、字幕区、图表与运动包围盒要随画幅重排，不能把横屏缩进竖屏。

## 2. 保留真实视觉系统，修改解释动作

在已有字幕层、画面空间与镜头之上改稿和改对象。每镜写明：对象变化、增加的理解、与上一镜的关系。无需所有镜头都变形；有明确推理关系的硬切也可保留。

数值内容可放进 `source/content.json`，执行以下命令同时生成口播模板与画面数据；公式真伪另行核对。

```sh
python tools/production.py compile --episode .
python -m pip install -r requirements.txt
python voice.py
cd 工程
npm ci
node render.mjs stills
node render.mjs proof 20 32
```

`voice.py` 仍要求本片真实审稿记录及稿件哈希，不能沿用参考稿的 approved。实测词界生成 `assets/timeline.json`、`src/timing.json`、SRT 与声音。先审查静帧排版，再静音检查高风险连续区间。**局部样片不等于整片节奏验收。**

可设置 `PYTHON`、`REMOTION_BROWSER` 指向已有 Python/Chrome；渲染器自动把 TEMP/TMP 指向工程 `.tmp`，不改系统变量。Pillow 与 FFmpeg/ffprobe 用于编码后检查。服务 TTS 需要联网，图像生成并非这些案例的必需步骤。

## 3. 字幕必须进入最终 MP4

```sh
node render.mjs full
cd ..
python tools/film_delivery.py mux --episode .
python tools/film_delivery.py inspect --episode .
```

自动产物及实际含义：

- `caption-trace.json`：逐帧读取真实字幕DOM文本和可见性，不从SRT伪造轨迹。
- `caption-reference.json`：每条字幕开始/结束附近各一帧，分别渲染有字幕、无字幕对照。
- `caption-verification.json`：从**编码后的有声MP4**抽取对应帧，在 `plans/captions.json` 指定区域比较像素，并单独检查亮色文字像素；只有底板、旁挂SRT或不可见字幕不能通过。
- 检查绑定MP4、工程、对照图清单与字幕区域的哈希；改片后重新生成。

当前像素方法针对迁移案例的浅字深底字幕；若改成其他字幕呈现，须适配检查并用“故意移除字幕/只留底板”的失败样本验证，不能为了过审放宽阈值。像素比较不检查语言正确或字幕阅读体验，仍需手机尺寸看实际帧。

## 4. 节奏检查覆盖整片

`inspect` 还会裁掉字幕和页脚，在主体画面运行 `freezedetect`，给出持续4秒以上的近静止**候选**；同时输出整片2fps连续接触表。它不会自动把停顿判错，也不会把一直运动判好。

`qa/full-review.json` 初始为 pending。制作方必须检查开头至片尾，快动作和交接另外加密/静音播放。逐段填写 `start/end/observed/newInformation`；每个候选静止区间写保留理由或修复后重检。长画面有真实资料、阅读或论证任务可以保留；字幕换句不能掩盖主体毫无推进。

```sh
python tools/film_delivery.py check --episode .
python /path/to/skill/scripts/audit_episode.py --episode . --profile task-short --output qa/audit.json
```

交付要求：整片观察覆盖无缺段、没有未解决项、字幕实测通过，且记录对应当前MP4。全片可以先渲出来用于检查，**禁止用局部小样记录将它标为可交付**。编辑器免复验按用户原授权保留。

同文修复填写 `plans/comparison.json`：原版文件哈希、保持项、变化项、需要保留的优点。新片和旧片并排看相同论证段，必要事实修正明确列出；时码变化时按内容对齐，不能谎称纯视觉控制实验。

## 5. 三个 kit 只做组件测试/取材

```sh
python scripts/select_visual.py --ready --query "群体 平均"
python scripts/production.py component-test --episode ./scratch/components --kit blackgold --aspect portrait
```

`gilded / blackgold / pixel` 保留递归依赖、真实 import、字体许可、数据绑定、`PersistentObject`、`EvidenceCut` 及局部动态检查，供按需移植。此目录标记 `workflow: component-test`，不能通过整片交付检查。旧 `production.py init` 已移除，避免另一Agent默认做成一套三段演示。

[历史组件测试](../examples/production-gates/index.html)与[新同文整片对照](../examples/pareto-revision/index.html)各自保留；前者不作为审美基准。

## 边界

这些工具减少漏字幕、旧记录放行、只看局部等可观测错误。它们不证明论证有价值、素材有美感、剪辑成熟，也不能约束绕过工具的Agent或阻止伪造人工记录。统一的是交付与验证接口，风格、题材、时长和剪辑仍由本片内容决定。
