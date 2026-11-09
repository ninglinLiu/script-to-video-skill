# R03 · DeepSeek · 帕累托68.83秒初版

> **评价：用户否决。这里是失败记录和工程，不是可用模板。**
>
> **用户反馈：** 用户指出没字幕、节奏差、画风阴郁。
>
> **观察范围：** 历史本地成片/源码核查和用户反馈；本轮不重新宣称已连续看完整片。
>
> **失败做法：** 把组件装配测试的五个人物和两处交接撑成完整短片。
>
> **可以保留：** 可复算的数据；配音与字幕时间戳；原片及同文修订对照
>
> **重测条件：** 检查最终编码字幕，连续审看全片；保持同一文章，复用实际完整镜头并验证视觉推进。

[静音预览](media/preview-silent.mp4) · 完整案例：`python scripts/experience.py reflection R03`

**入库范围（2026-11-02 补入）：** 只收源码、稿件、证据和检查记录，加一条压缩的静音预览和字幕。字体、配音 WAV、逐帧图、参考目录和依赖没有入库，高码率原片和完整工程留在本机。检查记录里的通过项只说明当时的技术状态，不改变用户否决。

---

以下是工程当时的说明，原样保留。其中“通过”“完成”等字样都早于用户评价。

## 68.9 秒竖屏：二八法则不是定律，是一个参数

用 skill 最新 main 的**可执行生产入口**做的第一条片子：`production.py init --kit blackgold --aspect portrait` 生成工程，
改 `source/content.json` 绑定数字，`compile` 生成口播与画面数据，真实配音后 `align` 把两个交接绑到语音 cue，
先渲 12.3 秒连续样片并逐帧审看，再放行全片。

## 成片

| 项目 | 结果 |
|---|---|
| 时长 | 68.87 秒（`task-short` 60–90 秒） |
| 画幅 | 1080×1920 / 30fps / H.264 / yuv420p |
| 声音 | 单条 AAC，edge-tts 真实 WordBoundary 对齐 |
| 镜头 | 6 段（说法 → 出处 → 条件 → 换指数 → 误用 → 结论） |
| 交接 | 2 个：`match-move`（人站上柱形）、`evidence-cut`（柱形证据 → 三张指数卡片） |
| 字幕 | 12 条，起止全部落在实测 cue 边界 |

文件：
- `out/final-with-audio.mp4` 配音成片
- `out/final-silent.mp4` 静音母版（CRF19）
- `out/subtitles.srt` 字幕
- `assets/voice-track.wav` 独立旁白
- `assets/timeline.json` + `assets/word-boundaries.json` 真实时间线
- `工程/` Remotion 源码（`Asset.tsx` 引用上游组件）
- `qa/motion-proof.mp4` + `qa/motion-trace.json` + `qa/motion-review.json` 连续样片与审看
- `qa/production-review.json`、`qa/audit.json` 成片审查与验收

## 这条片子真正用到的素材

**进入画面的上游组件**（`assets/weilanx/upstream`，MIT，随 kit 复制到 `工程/src/vendor/`）：

| 组件 | 来源文件 | 用途 |
|---|---|---|
| `GlowPawnG` | `src/library/blackgold/props.tsx` | 五组人口小人（每个 `PersistentObject` 内一个，`shapes=2`：圆头 + 肩） |
| `SpotlightG` | 同上 | 打在 80% 那一组上的聚光灯（21.0–22.2 秒亮起） |
| `B` / `glowText` | `src/library/blackgold/theme.ts` | 配色、发光字（`#060e13` 底、青色 accent、金色数字） |
| `blurIn` / `clamp01` | `src/library/anim.ts` | 组件的淡入与缓动 |

**剪辑组件**（`工程/src/motion.tsx`，由 init 生成）：

| 组件 | 用途 |
|---|---|
| `PersistentObject` | 五个 `quintile-i` 跨交接保持身份，按归一化坐标插值 |
| `EvidenceCut` | 29.57 秒硬切：保留人物锚点，替换柱形证据为指数卡片 |
| `MotionProbe` | 逐帧 DOM 记录（对象位置、可见性、绑定数字），生成 `qa/motion-trace.json` |

**字体**：`NotoSansSC-VF.ttf`（`ProductionSans`，全片中文）；kit 另带了 `vox/` 下的 Anton / EB Garamond / Playfair 等字体文件，本片**没有**用它们。

**没有进入画面的**：`Booth`、`TheaterStage`、`Silhouettes`、`GlowCard`、`Awning` 这些同文件里的道具没有使用；
`assets/weilanx` 其余 700+ 文件、展厅页面、其它 34 种艺术场景、`batch-01` 六条小样、`chapter-01` 成片均未使用。

## 数值怎么来的

`source/content.json` 只存原始参数（`alpha161 = ln5/ln4 ≈ 1.160964`、`p20 = 0.2`、三个 α），
份额由 `production.py compile` 依序计算：`1−1/α` → `p^(1−1/α)` → 五组 Lorenz 分位差。
`scripts/verify_claims.py` 用精确公式独立重算 15 项，全部通过（`evidence/fact-review.json`）。

| 口播说法 | 公式 | 结果 |
|---|---|---|
| 20% 占 80% | 0.2^(1−1/1.160964) | 0.8000 |
| α=1.5 时 20% 的份额 | 0.2^(1−1/1.5) | 0.5848 → 58% |
| α=2.0 时 20% 的份额 | 0.2^(1−1/2) | 0.4472 → 45% |
| 五组份额 | Lorenz 分位差 | 3% / 4% / 5% / 8% / 80% |
| 64/4 | 0.8×0.8 / 0.2×0.2 | 0.64 / 0.04 |

## 制作门槛

`python tools/production.py check --episode . --stage render` 六项全过：

1. `visual_asset_imports` — 16 个素材哈希一致，`props.tsx` 确实在 `entry.tsx` 的 import 图里；
2. `shared_content_bindings` — `content.generated.json` / `script.json` / `draft.txt` 与 `content.json` 同步；
3. `edit_plan` — 12.3 秒样片含两个内部交接和一条解释 beat；
4. `encoded_motion_proof` — 静音、30fps、12.30 秒、哈希一致；
5. `rendered_motion_trace` — 369 帧逐帧 DOM，可见资产有图形，11 个绑定数字与共享数据逐帧相同；
6. `continuous_motion_review` — 审看记录绑定到当前样片哈希，两个交接均 `keep`。

## 已知缺口

- 没有真人审听（Agent 不能播放声音），只检查时间戳与响度；
- 没有做剪映 / Premiere 导入验证；
- 没有配乐；
- 第一次全片渲染因为我在渲染期间写了 `source/storyboard.json`（进入 `source_digest`）被门槛拒绝认证，重渲一次才拿到 `qa/render-full.json` —— 门槛确实拦住了"输入变了却还想认证"的情况。
