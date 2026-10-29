# 《泊松过程》风格：可执行镜头分支

> **跨文章复测未通过：** 队列片被用户批评动画质量。参数化曾削弱透视、尺度、轨迹和跨镜状态；先执行 `python scripts/experience.py select --stage plan --route poisson-cinema` 读取R04/E21。原版风格认可与该分支成熟度分开。

用户要求的是让另一个 Agent 独立复用已有效果。这个入口迁移原片的环境图、透明人物、字体、绘图函数和解释动作。它不是把三个 kit 换个名字，也不自动生成新的论点。

**已实现的范围：1920×1080、30fps，黑金空间与浅纸推导交替，Canvas 确定性逐帧渲染。** 不是原片逐帧复刻，也未证明任意文章、竖屏或长视频的审美稳定。原片过去存在小字、留白过多、部分镜头推进不足；不能原样当作质量保证。

## 另一个 Agent 只需读取这些

先读本页，再打开一个 `assets/poisson-cinema/fixtures/*-film.json` 看字段。需要数学/论证时读取当前文章的证据。无需通读历史工程或全部上游库。遇到超出配方的镜头，读取对应函数，明确补适配器；禁止静默退化成标题卡。

```sh
python scripts/start_episode.py --source poisson-cinema --episode ./episodes/new-film
cd episodes/new-film
# 原片九镜的实际画面可先离线重渲核对（无需新文章、配音或图像服务）：
# cd 工程 && npm ci && node render.mjs baseline
# 编写本片 source/script.json、draft.txt、evidence/ 和 source/film.json
python -m pip install -r requirements.txt
python voice.py
python tools/cinema.py compile --episode .
cd 工程
npm ci
node render.mjs probe
node render.mjs proof 12 24
# 检查 probes 中动作前/中/后，以及交接点的连续帧；修数据或时间后重新 compile/probe
node render.mjs full
cd ..
python tools/film_delivery.py mux --episode .
python tools/film_delivery.py inspect --episode .
# 静音审完整片，填写实际观察，未解决问题不能写成通过
python tools/film_delivery.py check --episode .
python /path/to/skill/scripts/audit_episode.py --episode . --profile chapter-proof --output qa/audit.json
```

`voice.py` 沿用完整章节的实测词界流程。`source/script.json` 格式见[输入协议](episode-contract.md)，其中 `chapters[].cues/p` 与审核的 `draft.txt` 一致。没有本片稿件审核和服务授权就不能发起外部 TTS；已有授权不重复索要。也可导入兼容的真实时间线和音轨。`reference/timeline.json` 是**合成测试数据**，不能当实测旁白，正式渲染会拒绝它。

环境：Python 3.10+、Node 20+、FFmpeg/ffprobe、Chrome/Chromium。可设置 `PYTHON`、`CHROME_PATH`；渲染器自动在本机回环地址开临时服务，把 TEMP/TMP 放进工程 `.tmp`，全程不播放声音。字体和两张美术资产在初始化时复制进工程，无需图像生成服务、原作者机器路径或额外视频模型。

## 真正可调用的镜头

| recipe | 输入 | 已实现的解释动作 |
|---|---|---|
| `spatial` | 2–5 个短窗口标签 | 原片空间框、人物和纵深拉开；适合引入观察尺度 |
| `events` | 3–24 个归一化位置，前后标签 | 同一批点由规则间隔移到指定位置，不随机编造数据 |
| `histogram` | 类别标签，每个样本所属类别，单位 | 样本逐个飞入类别；柱高、数量由同一份样本计数生成 |
| `windows` | 两个同单位数值、标签 | 按共同尺度画窗口，移动重叠比较，再返回；不等值不会画成等宽 |
| `formula` | 前后带 ID 的符号项、解释 | 同一项移动保留；删除项划线退出，新增项进入；不能用旧 ID 偷换值 |
| `curve` | 有序坐标点、纵轴上限、单位 | 按真实点位逐段展开曲线与读数；不自动把任意数据拟合成指数 |
| `filters` | 1–3 个条件，每个对象实际通过的门数 | 同一批点逐门通过或停下；不靠随机数伪造筛选结果 |

原版完整九镜源码也复制到 `工程/original/`，`node render.mjs baseline` 可重渲九个关键时点。保留原版场景、构图、公式与动作时序，仅移除声音及旧机器路径；无需用简化配方猜原片。七种参数化镜头可按论证选择和重排，并非每片固定七镜。`spatial` 不是填充时长的装饰片头；没有信息任务就不使用。具体新闻、文献证据和人物故事不能全部强塞进这些机制图。

## 数据与时间接口

`source/film.json` 的镜头字段：`id / recipe / object / surface / label / headline / fromCue / toCue / action / explains / transition / data`。

- `fromCue/toCue` 是本片真实时间线中从 0 开始的 cue 下标，必须不重不漏覆盖口播。`action.fromCue/toCue` 决定动作的真实起止，不按均分时长估计。
- `surface` 明确选择 `dark` 或 `paper`。原片视觉资产固定，内容不固定；不能每次重新生图或换色。
- `object` 是语义身份。`events / histogram / filters` 之间可用 `transition.mode: carry`；同对象、同数量才允许。上一镜最后的位置被下一镜首帧实际继承，再移动到新布局。
- 其它衔接用 `cut` 并写明论证关系，不假称所有镜头都无缝变形。`carry` 的 `seconds` 为 0.2–1.5 秒，按实际内容选择。
- 原片公式复杂排版源码保存在 `reference-source/` 供扩展。现成 `formula` 是短符号项的保留/消去，不冒充通用 LaTeX 引擎。

字幕从实测 `timeline.subtitles` 烧入浅字深底板；完整渲染输出逐帧轨迹和有/无字幕对照图，接入既有编码后像素检查。不可只交 SRT。

本分支的 `source/film.json` 就是实际执行的分镜契约，验收器直接校验它，不再要求另抄一份脱离渲染的 `storyboard.json`。原文来源、稿件审核、整片观察和原生编辑器授权边界仍使用共用交付协议；不会因为选了新分支就自动通过。

## 代码验证与审美判断分开

`probe` 对每镜渲染动作前、中、后五个时点，并在移除背景、页眉与字幕后比较主体像素和实际绘制对象状态，防止粒子背景或换字幕冒充解释动作。`carry` 还核对切点两侧同 ID 对象的位置。失败不会退成静态卡片，也不会自动批准。

这只能证明已有机制被执行，不能证明动作讲清了道理。全片 `inspect/check` 仍需看真实连续画面，检查信息推进和可读性。给近静止区间写理由不等于消除 PPT 感；发现这一问题就回到该段解释动作。不得将技术通过宣传为用户满意。

## 独立复测提示词

> 使用这个仓库的 script-to-video Skill，选 poisson-cinema 分支。用我提供的完整文章做一条 90–120 秒横屏有声视频，保留原片视觉语言，复用已有镜头动作；不要重画整套引擎，不外放。自行完成证据核查、实测配音、烧入字幕和整片审看。交付成片、工程，并如实列出复用的 recipe、仍不满意的区间和人工求助次数。只凭仓库独立完成，不使用此前聊天上下文。

独立测试应记录模型/宿主/工具版本，保留同文对照。这个分支的本地集成测试不等于已完成 DeepSeek 独立盲测；内容厚度、镜头选择和整片节奏仍须由实际作品证明。

软件回归可在空目录运行 `python tests/run_cinema_browser.py --workdir /empty/test-folder`：两个内容数据集、七镜动作与交接、样本数量/窗口比例、短片编码字幕、移除字幕失败样本、测试时间线禁止正式交付，以及原版九镜重渲。此命令联网安装锁定 npm 依赖，不调用 TTS、播放声音或上传素材。
