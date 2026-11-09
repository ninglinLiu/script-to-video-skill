# R04 · 《队列为什么会突然崩》· 泊松分支独立复测

> **评价：用户否决。这里是失败记录和工程，不是可用模板。**
>
> **用户反馈：** 用户明确把优先级纠正为动画视觉质量；内容写得更好不能弥补动画不达标。
>
> **观察范围：** 2026-10-29历史核查：90.8秒2fps编码序列、77.9–79.1秒10fps连续帧、46秒全尺寸帧及recipes源码。本轮只整理已有结论；此库没有捆绑该原片。
>
> **失败做法：** 把能换数据的recipe误当作保留了原片美术与动作的完整镜头。
>
> **可以保留：** 原版泊松完整镜头；数据与证据；原配音便于同文同音比较
>
> **重测条件：** 先保住原镜头的尺度、透视、材质和动作时序，再替换数据；相同输入和相同时间区间对照，重点检查对象遮挡、重置和转场状态。

[静音预览](media/preview-silent.mp4) · 完整案例：`python scripts/experience.py reflection R04`

**入库范围（2026-11-02 补入）：** 只收源码、稿件、证据和检查记录，加一条压缩的静音预览和字幕。字体、配音 WAV、逐帧图、参考目录和依赖没有入库，高码率原片和完整工程留在本机。检查记录里的通过项只说明当时的技术状态，不改变用户否决。

---

以下是工程当时的说明，原样保留。其中“通过”“完成”等字样都早于用户评价。

## 90.8 秒横屏：队列为什么会突然崩

用 Skill 最新 main（`c30100d`，新增 `references/poisson-cinema.md` 与 `scripts/cinema.py`）的 **poisson-cinema 分支**做的独立验收片。

```sh
python scripts/start_episode.py --source poisson-cinema --episode ./productions/queue-poisson-100s
python tools/cinema.py compile --episode .
```

这一支只支持 1920×1080 / 30fps，因此按 `chapter-proof` 规格交付（90–150 秒横屏），不是竖屏短片。

## 成片

| 项目 | 结果 |
|---|---|
| 时长 | 90.80 秒 |
| 画幅 | 1920×1080 / 30fps / H.264 / yuv420p / 10 Mbps / 单条 AAC |
| 镜头 | 9 镜（7 个 recipe，formula 与 filters 各拆两镜）：spatial → events → histogram → windows → formula → formula → curve → filters → filters |
| 字幕 | 21 条，实测词界生成，烧进画面；`film_delivery inspect` 逐条做编码后像素比对 |
| 内容 | M/M/1 排队：ρ 从 50% 到 90%，平均停留时间从 1.2 分钟到 6 分钟 |

## 复用了什么

**镜头动作**（`工程/recipes.js` + `core.js` + `runtime.js`，由 `start_episode.py --source poisson-cinema` 复制）：

| recipe | 本片用途 | 数据 |
|---|---|---|
| `spatial` | 把尺度收进「服务台 / 队列 / 到达」 | 3 个标签 |
| `events` | 12 个到达从等间隔移到模拟位置 | 12 个归一化位置 |
| `histogram` | 60 个模拟样本落入四个等待区间 | 样本 → 柱高由计数得出（17/15/21/7） |
| `windows` | 0.67 分钟 vs 0.6 分钟同尺度比较 | 两个同单位值 |
| `formula` | W = 1/(μ−λ) → W = 1/10 | 保留 W、=、1、/；消去 (μ−λ)，新增 10 |
| `curve` | 50%→1.2、80%→3、90%→6 分钟 | 三个点 |
| `filters` | 同一批 60 人过「≤2 分」「≤6 分」两道门 | 每人实际通过门数 |

**美术与工程**：`assets/environment.png`（黑金空间）、`assets/observer.png`（人物）、Noto Sans/Serif SC 与 OFL 许可、Canvas 确定性逐帧渲染器、`film_delivery.py` 的整片检查。

**没有沿用**：原片九镜的内容与配音；`reference/` 里的合成时间线只作字段示例，正式渲染会拒绝 fixture。

## 数据与证据

`scripts/build.py` 一次生成口播、`source/film.json` 与全部画面数据：固定种子 20261029，M/M/1 单服务台，λ=90/时、μ=100/时，3000 个到达、跳过前 200 个预热，按等间隔抽 60 个样本。所以：

- 柱状图的四个区间计数 = 这 60 个样本的实际计数（17/15/21/7）；
- 两道时间门的通过人数 = 同一批样本（17 人过两门，19 人过一门，24 人没过）；
- 曲线三点由 W = 1/(μ(1−ρ)) 算出：1.2 / 3 / 6 分钟；
- 0.67 与 0.6 分钟是 1/λ 与 1/μ。

## 已知问题

1. **改了一处 recipe**：`windows` 在两行收敛比较时，两个数值标签会叠印成一团。我在本工程的 `recipes.js` 里把两个标签分别放到盒子上方与下方（4 行改动），没有改仓库。
2. 第一版模拟从空队列开始，等待几乎为 0；改成先跑 200 个预热再抽样，否则会得到与结论相反的样本。
3. 抽样没有用「一段连续繁忙期」——那段自相关极强，会把 6 分钟的平均值演成一条递减曲线；改成跨全程等间隔抽样。
4. 首版 60 秒左右，低于 `chapter-proof` 的 90 秒下限；补了两条 cue 到 90.8 秒。
5. 没有真人审听；没有做剪映/PR 导入（该 profile 不要求）。

## 最后两处返工（都在工程里，没有改仓库）

- **画幅合规**：Canvas 的 MJPEG 输入带 full-range 标记，渲染出来是 `yuvj420p/pc`，验收器要求 `yuv420p`。
  在 `工程/render.mjs` 的 ffmpeg 参数里加了 `scale=in_range=full:out_range=limited` 与 bt709/tv 标记后重渲。
- **镜头拆分**：首版 7 镜里公式镜 14.4 秒、筛选镜 19.5 秒几乎静止；拆成 9 镜并把曲线动作缩到 6 秒后，
  最长近静止从 19.5 秒降到 13.6 秒（曲线）与 19.5 秒（筛选，仍偏长，已写进 `qa/full-review.json` 的 knownWeaknesses）。

## 验收结果（`qa/audit.json`）

`chapter-proof` 23 项 required 全过；`native_editor_project` 为 optional，如实记为未验证（本机没有导入剪映/PR）。
`film_delivery check` 三项全过：字幕编码后像素 42 个样本、0 trace 错误、整片 0–90.8 秒无缺段、`cinema_shots_and_current_inputs` 通过。
