# 验收输入协议

验收器消费已生成的文件和记录，不负责渲染或合成。生产根目录由 `--episode` 指定：

```text
episode/
  out/final-with-audio.mp4
  out/subtitles.srt
  assets/timeline.json
  source/draft.txt
  source/script.json
  source/storyboard.json
  evidence/source-manifest.json
  evidence/script-review.json
  qa/render-full.json
  qa/production-review.json
  qa/editor-import.json
  工程/src/*.tsx
```

`out/*.srt` 文件名不限。当前源码静态检查采用 `工程/src/*.tsx` 约定；使用其他引擎或目录布局时需适配脚本。

## 配音时间线

`assets/timeline.json` 至少包含：

```json
{
  "seconds": 75,
  "wordBoundarySource": "real edge-tts WordBoundary",
  "cues": [{"text": "示例", "start": 1, "end": 2}],
  "subtitles": [{"text": "示例", "start": 1, "end": 2}]
}
```

所有区间须在总时长内，字幕不重叠；每组字幕的首尾对应实际 cue 边界。当前脚本明确检查 Edge TTS 的来源字符串；适配其他语音服务时应修改验证规则，并保持真实时间戳要求，不能改标签假装兼容。该脚本尚未比较 SRT 正文或验证实际烧录字幕像素。

## 稿件与证据

`source/draft.txt` 使用 UTF-8，每章以 `【章节标识｜标题】` 单独起行，下一行写正文。`source/script.json` 的 `chapters` 中，每章用等长的 `cues` 和 `p` 分别表示语句与标点；按顺序拼接须与所有章节正文一致。

`evidence/script-review.json` 示例结构：

```json
{
  "ttsAllowed": true,
  "reviewedFiles": [{"path": "source/draft.txt", "sha256": "实际稿件文件的SHA256"}]
}
```

审稿完成后再填真实哈希。`evidence/source-manifest.json` 保存来源 URL、正文取得范围、事实与假设边界。当前验收器只检查此来源文件存在，不核验内容真实性。

`source/storyboard.json` 是镜头数组，每镜至少含 `objectId`、`before`、`after`、`cue`、`entry`、`exit`、`numericInvariant`、`verificationTime`。当前只检查字段存在与短片镜头数；状态、数学及解释正确性仍由制作方审查。

## 成片记录

`qa/render-full.json` 保存真实渲染记录；当前脚本仅检查存在。

`qa/production-review.json` 须包含 `status: "reviewed_with_fixes"`、`reviewedFinalSha256`（与最终有声 MP4 完整文件一致），以及非空 `framesReviewed`。记录实际时间码、问题和修复，不把示例文案复制成审查完成声明。该检查只验证记录及哈希一致，不验证人的行为。

`task-short`默认要求`qa/editor-import.json`含真实工程路径、`openedSuccessfully: true`及编辑器名称，实际导入后才填写。`extended`和`chapter-proof`将此项单独记录，不阻断该模式。

尚未验证时可以诚实写`"project": null`、省略该字段或写空字符串；这些都记录为`native_editor_project.passed: false`，不抛路径拼接异常，也不算成功验证。非空字符串路径仍须指向真实文件，并满足编辑器及实际打开记录条件。用户明确免除重复验证的既有逻辑不变。

用户明确已手动验证并要求不再复验时，用以下记录表达，不能把`openedSuccessfully`伪造为true。验收器分别报告“未由Agent验证新文件”和“用户免除重复验证”，不会再把启动编辑器列为前置阻塞：

```json
{
  "status": "user_reported_already_verified",
  "validationOwner": "user",
  "repeatValidationWaived": true,
  "userInstruction": "填写真实用户要求，不复制示例冒充授权",
  "verifiedScope": "用户所说的工作流或具体文件范围",
  "openedSuccessfully": null,
  "agentRepeated": false
}
```

`chapter-proof`规格为90–150秒、1920×1080、30fps、H.264/YUV420p、单AAC音轨，采用CRF质量控制。只要求可读的正码率记录，不设8Mbps硬下限；画面质量仍需实际检查。其他模式的8Mbps条件保持。完整案例见`examples/chapter-01`，目录遵循本协议；原始稿件哈希大小写不影响比较。

报告中 `technical_and_producer_checks_passed` 仅表示代码列出的技术和记录门槛通过；`userAestheticAcceptance` 与 `universalPipelineValidated` 不会因此被设为通过。

## 可执行素材与动态证据门槛（新增）

除上述历史检查外，验收器现在调用 `production.py check`，要求 `plans/assets.json`、`source/content.json`、`plans/edit-plan.json` 及 `qa/motion-proof.json / motion-trace.json / motion-review.json`。字段与生成命令见[可执行生产入口](executable-production.md)。

新增6项独立检查：`visual_asset_imports`、`shared_content_bindings`、`edit_plan`、`encoded_motion_proof`、`rendered_motion_trace`、`continuous_motion_review`。旧的 `final_visual_review` 仍只代表成片抽帧记录，不能替代这些动态证据。旧项目缺项会如实显示，不因19/20项通过就推断画面合格。
