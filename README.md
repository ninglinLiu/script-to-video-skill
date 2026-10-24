# Script to Video Skill · 从文章到完整章节

**一个入口、固定风格、内部检查与修复。现有完整章节工程与第一批组件库。**

## 新增：106秒完整章节及素材

**[打开《回本以后，什么会改变？》静音预览 →](https://ninglinliu.github.io/script-to-video-skill/examples/chapter-01/)**

![同一对象贯穿章节](examples/chapter-01/qa/final-frames/00.jpg)

从凯撒文章的“成本价陷阱”蒸馏出一个具体问题。两张账单、同一现价依次进入未来路径、回本基数、研究证据与现实反例。**105.57秒，1920×1080，30fps，7段；完整长片质量仍待验证。**

[完整源码与运行说明](examples/chapter-01/README.md) · [配音MP4](examples/chapter-01/out/final-with-audio.mp4) · [静音MP4](examples/chapter-01/out/final-silent.mp4) · [SRT](examples/chapter-01/out/subtitles.srt)

- **可编辑生产素材**：七段干净画面、全片干净画面、独立配音WAV/MP3、真实WordBoundary时间线、OFL字体及许可、有限论文题头引用。
- **五步流程实录**：原文整理、内容蒸馏、脚本核对、跨镜分镜、连续小样与完整章节。附事实证据、对象状态及具体修复记录。
- **长片补充**：章节论证、信息推进、素材分工、对象接力、全局时码、局部重渲；不是把组件串起来就叫长视频。
- **声音工具**：本地混音、旁白避让、响度与峰值检查、视频码流不变核对。用户指定的第三方BGM只在本地版使用，仓库记录来源并支持自行导入；公开有声版保留旁白。

用户已手动验证既有剪映／PR导入、编辑和导出，并要求不重复验证。新文件的实际Agent验证另记；不把XML称作原生工程。素材范围见[来源与许可](NOTICE.md)。

---

## 先看具体动作，再定组件库

**[打开在线可播放对照页 →](https://ninglinliu.github.io/script-to-video-skill/examples/batch-01/)**

页面完整保留双内容对照、来源说明、组件参数与本地选择记录。所有自制小样无音轨、默认暂停。

![第一批六条真实渲染](examples/batch-01/qa/encoded-contact.jpg)

| 组件 | 示例 A（10 秒 MP4） | 示例 B（10 秒 MP4） | 来源 |
|---|---|---|---|
| 分支生长与路径追踪 | [利润下降](examples/batch-01/out/tree-business.mp4) | [学习受阻](examples/batch-01/out/tree-learning.mp4) | weilanx GoldTree，MIT |
| 收益比较与选择箭头 | [降价竞争](examples/batch-01/out/matrix-price.mp4) | [团队共享](examples/batch-01/out/matrix-sharing.mp4) | weilanx PayoffMatrix，MIT |
| 空间字带与主词落稳 | [信号与噪声](examples/batch-01/out/orbit-signal.mp4) | [价格与价值](examples/batch-01/out/orbit-value.mp4) | 既有 rtiaho 研究版原创代码 |

每组两套内容共用同一动画逻辑。分支树展开原因再沿证据追踪；矩阵先比较收益再显示选择方向；空间字带穿出后停稳主词，用于短促重音。

**[第一批源码与运行说明](examples/batch-01/README.md)** · [六套输入配置](examples/batch-01/src/catalog.ts) · [来源及代码哈希](examples/batch-01/provenance.json) · [技术验证](examples/batch-01/qa/validation.json) · [制作方画面检查](examples/batch-01/qa/producer-review.json)

### 参考的是哪几秒

| 原作 | 时间码 | 借鉴动作 |
|---|---|---|
| [Iwanau · 运气的形状](https://www.douyin.com/video/7690344836800913785) | 3.80–7.20s | 同一实体保留轮廓，变成解释模型；待实现 |
| [Nico · 人生容错率](https://www.douyin.com/video/7697240924837748134) | 8.00–11.20s | 同一节点长出多条路径 |
| [Iwanau · 为什么中杯卖得最好](https://www.douyin.com/video/7692118707825294713) | 1.80–7.20s | 加入选项后改变比较关系；待实现 |
| [rtiaho · memories](https://www.douyin.com/video/7695456829056455158) | 1.70–3.50s | 字带、透视和前后遮挡 |

参考作品仅链接引用。原作视频、截图、配乐不随仓库分发；生成小样不宣称与参考同等质量。

### 当前完成到哪里

- 已完成：3 个组件候选、6 条 1080×1920 / 30 fps / 10 秒渲染、双内容参数配置、来源与许可、技术和局部连续帧检查。
- 已获认可：第一批组件方向；不等于之后所有文章或成片自动通过审美验收。
- 待验证：跨新文章的稳定质量、更多素材类型和8–10分钟长片观看体验。编辑器工作流已有用户手动确认，不再重复验收。
- 程序动画内部在 Remotion 源码中编辑；渲染 MP4 不等于剪映原生动画图层。

---

## Skill 工作流

中文知识视频的 Agent 工作流 Skill：固定视觉规则，基于证据改编文稿，设计连续解释动画，由 Agent 在内部检查、修复，再交付配音 MP4、字幕和工程。

**提供工作流指令、风格配置、验收器、第一批3组组件与6条小样，以及完整章节的渲染工程、真实配音素材、TTS适配脚本和局部重渲入口。** 外部TTS与渲染运行时按各自条件使用；这不是任意文章自动生成好镜头的确定性程序。 需要与自己的制作工程配合使用；不承诺任意文章首遍完美，也不将技术检测当作审美认可。

## 使用 Skill

将本仓库克隆到 Codex 的 Skill 目录，文件夹命名为 `script-to-video`，例如：

```sh
git clone https://github.com/ninglinLiu/script-to-video-skill.git ~/.codex/skills/script-to-video
```

Windows PowerShell 可将目标目录写成 `$env:USERPROFILE/.codex/skills/script-to-video`。已有同名 Skill 时先比较或备份，不要直接覆盖。其他兼容 Agent 可按自身规则加载根目录 `SKILL.md`。

调用示例：

> 使用 $script-to-video，将这篇文章制作成 60–90 秒竖屏视频。使用我的现有渲染工程，保持固定风格，内部检查并修复字幕与动画衔接，交付 MP4、SRT 和工程。预览静音。

制作方依次完成：原文与证据 → 核心问题与脚本 → 真实配音时间线 → 对象状态与镜头 → 连续小样 → 内部修复 → 成片与验收。

## 默认交付规格

| 模式 | 时长 | 画面 | 其他要求 |
|---|---|---|---|
| `task-short` | 60–90 秒 | 1080×1920，30 fps | 5–8 分镜；H.264 ≥8 Mbps；AAC；SRT；已验证的剪辑工程 |
| `extended` | 165–195 秒 | 1080×1920，30 fps | H.264 ≥8 Mbps；AAC；SRT；剪辑工程单独记录 |
| `chapter-proof` | 90–150秒 | 1920×1080，30fps | CRF质量控制；AAC；SRT；独立分段素材与配音 |

这些是此 Skill 的默认验收配置，不是通用行业标准。用户另有规格时应修改配置及验收器，不能把三分钟扩展版称作短片任务通过。

## 独立使用验收脚本

依赖 Python 3.11+，以及 PATH 中的 FFmpeg / ffprobe；脚本只使用 Python 标准库。无需 API 密钥，不上传文件、不播放声音。

```sh
python scripts/audit_episode.py --episode /path/to/episode --profile task-short --output /path/to/audit.json
```

退出码 `0` 表示脚本所列的技术及记录检查通过，`2` 表示交付不完整。输入损坏、依赖缺失或其他执行错误也可能产生非零退出码。目录、JSON、审稿哈希和记录字段见 [输入协议](references/episode-contract.md)。

验收器检查视频规格、码率、解码、音轨、语音时间戳、字幕区间、稿件与审查哈希、镜头状态及交付记录。它读取已有制作方审查记录，不能独立证明观众满意、实际做过审美审查或编辑器真实导入成功；也不重新判断金融论点或科学事实。

## 仓库内容

- `SKILL.md`：Agent 编排入口与停止条件。
- `references/production.md`：固定风格、解释动作和内部审查规则。
- `references/episode-contract.md`：验收器所需的目录和数据协议。
- `assets/style-lock.json`：示例视觉配置；不包含字体文件。
- `scripts/audit_episode.py`：可独立运行的交付验收器。
- `references/long-form.md`：章节论证、跨镜继承、分段生产与尚未验证的范围。
- `references/audio-and-materials.md`：完整音乐辨认、静音混音与素材分发。
- `scripts/mix_music.py`：音乐、配音和已渲染画面的本地混合。
- `examples/chapter-01/`：完整章节、可运行源码、独立素材及审查记录。

第一批组件已完成双内容参数化测试；完整章节经过制作方抽样修复。大规模跨新文章回归及8–10分钟长片质量尚未完成验证，不能由技术通过推出审美通过。参考项目及使用边界见 [NOTICE.md](NOTICE.md)。本仓库原创部分使用 MIT 许可。
