# R05 · DeepSeek · Kelly独立测试

> **评价：用户否决。这里是失败记录和工程，不是可用模板。**
>
> **用户反馈：** 用户认为效果差，并要求把问题真正修进Skill，让其他Agent复用已有素材和剪辑。
>
> **观察范围：** 用户提供的制作方自述、历史视觉落地核查。未把自述中的审美判断当成事实；此库未捆绑原片。
>
> **失败做法：** 只迁移运行环境，把视觉问题重新交给每次从零写画面。
>
> **可以保留：** 证据重算；真实配音时间线；环境排障经验
>
> **重测条件：** 由另一Agent在干净工作区复现指定连续镜头，再做第二内容适配；当前Agent代做不能冒充独立验证。

[静音预览](media/preview-silent.mp4) · 完整案例：`python scripts/experience.py reflection R05`

**入库范围（2026-11-02 补入）：** 只收源码、稿件、证据和检查记录，加一条压缩的静音预览和字幕。字体、配音 WAV、逐帧图、参考目录和依赖没有入库，高码率原片和完整工程留在本机。检查记录里的通过项只说明当时的技术状态，不改变用户否决。

---

以下是工程当时的说明，原样保留。其中“通过”“完成”等字样都早于用户评价。

## 60 秒竖屏：期望 1.00，为什么大多数人还是亏？

用 `script-to-video` skill 的 `task-short` 规格做的一条 1 分钟样片，主题是「算术平均 vs 几何平均」。
本片不是文章改编：脚本是独立推导，每个口播数字都由本地脚本重算。

## 成片

| 项目 | 结果 |
|---|---|
| 时长 | 63.10 秒（`task-short` 允收区间 60–90 秒） |
| 画幅 | 1080×1920 / 30fps / H.264 / yuv420p |
| 声音 | 单条 AAC 音轨，edge-tts 真实 WordBoundary 对齐 |
| 镜头 | 6 个（硬币 → 期望 → 乘法 → 一百轮 → 平均值 → 几何平均） |
| 字幕 | 17 条，全部起止于实测语音 cue 边界 |

文件：
- `out/final-with-audio.mp4` 配音成片（烧入字幕）
- `out/final-silent.mp4` 静音画面（同一编码，供预览/二次剪辑）
- `out/subtitles.srt` 字幕
- `assets/voice-track.wav` 独立旁白（48kHz 立体声，−16 LUFS / −2 dBTP）
- `assets/timeline.json` 真实语音时间线（cue + subtitle + chapter）
- `assets/word-boundaries.json` edge-tts 原始 WordBoundary 事件
- `工程/` Remotion 源码与渲染入口（画面可编辑层）

## 复现

```sh
python scripts/simulate.py        # 生成画面数字与样本路径（固定种子）
python scripts/verify_claims.py   # 用精确组合数复算口播里每个数字
python scripts/build_script.py    # 生成 source/draft.txt 与 source/script.json
python scripts/bind_review.py     # 把审稿记录绑定到稿件 SHA256
python voice.py                   # edge-tts 合成 + 真实 WordBoundary 时间线 + SRT

cd 工程
npm ci
npx tsc -p .                     # 类型检查
node render.mjs stills           # 抽样静帧
mkdir -p .tmp && export TEMP=$PWD/.tmp TMP=$PWD/.tmp   # Windows: New-Item -ItemType Directory .tmp
node render.mjs final            # 全片静音渲染

cd ..
ffmpeg -i out/final-silent.mp4 -i assets/voice-track.wav -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/final-with-audio.mp4
python ../../tmp/script-to-video-skill/scripts/audit_episode.py --episode . --profile task-short --output qa/audit.json
```

Windows 上如果 Remotion 的 ffmpeg 在 `%TEMP%` 报 `Permission denied`，把 `TEMP`/`TMP` 指到 `工程/.tmp` 再渲染（本片即如此）。

## 验收结果（`qa/audit.json`）

20 项检查中 19 项通过，唯一未通过的是 `native_editor_project`：

```
{"profile": "task-short", "status": "incomplete", "failed": ["native_editor_project"]}
```

时长 63.1s、1080×1920/30fps、H.264/yuv420p、9.97 Mbps、单条 AAC、全片解码、真实 WordBoundary、
17 条字幕区间与语音 cue 对齐、稿件哈希未变、6 个镜头状态字段齐全、交付记录哈希一致 —— 均通过。

未通过项不是脚本误报：本机确实没有把任何工程导入剪映/Premiere，`qa/editor-import.json` 如实写为
`not_verified`。按 `references/episode-contract.md`，这一项只能由真实导入或用户明确免除来清零。

顺带发现 skill 的一个脚本缺陷：`audit_episode.py` 第 57 行用 `ep / j.get('project', '__missing__')`，
当 `editor-import.json` 里显式写 `"project": null` 时会抛 `TypeError` 而不是报告失败；
本片改为省略该字段后脚本正常输出报告。

## 数值证据

| 口播说法 | 公式 | 结果 |
|---|---|---|
| 期望乘数 1.00 | (1.5+0.5)/2 | 1.00（精确） |
| 一涨一跌剩 3/4 | 1.5×0.5 | 0.75 |
| 一百轮中位数 | 0.75^50 | 5.66×10⁻⁷ |
| 高于起点的人 | P(k>100·ln2/ln3), k~Bin(100,.5) | 0.33% |
| 每轮几何收益 | √(1.5×0.5) | 0.866（−13.40%） |

`evidence/fact-review.json` 保存 11 项重算记录；`scripts/simulate.py` 的 10,000 条路径用于画面上的扇形与中位数曲线。

## 检查过什么

- 技术：时长、画幅、fps、像素格式、码率、AAC、全片解码、字幕区间、字幕与语音 cue 对齐、稿件哈希、镜头状态字段（见 `qa/audit.json`）。
- 画面：32 个时间点的实际编码帧抽样；发现并修掉的问题写在 `qa/production-review.json`（字幕孤字、第 5 镜数字与标签相撞、第 1 镜问题块压住硬币、第 3 镜标注压线、第 4 镜路径越界）。
- 声音：只做了响度/峰值与时间戳检查。Agent 不能播放声音，**没有真人审听**。

## 没做什么

- 没有做剪映 / Premiere 导入验证（`qa/editor-import.json` 如实记录为未验证）。
- 没有配乐与混音（默认只保留旁白）。
- 没有用 image 模型出图：本片全部画面由代码绘制。
