# Script to Video Skill

中文知识视频的 Agent 工作流 Skill：固定视觉规则，基于证据改编文稿，设计连续解释动画，由 Agent 在内部检查、修复，再交付配音 MP4、字幕和工程。

**当前提供工作流指令、风格配置和可执行验收器。完整视频生成引擎、TTS 服务、字体、媒体资产及现成动画组件库不包含在仓库中。** 需要与自己的制作工程配合使用；不承诺任意文章首遍完美，也不将技术检测当作审美认可。

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

实际生产中的动画组件提取、跨新文章回归，以及原生编辑器导入验证仍需在采用方自己的工程中完成。参考项目及使用边界见 [NOTICE.md](NOTICE.md)。本仓库原创部分使用 MIT 许可。
