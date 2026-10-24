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

`task-short` 还要求 `qa/editor-import.json` 包含 `project`（相对 episode 的真实工程路径）、`openedSuccessfully: true`、`editor`（`Premiere Pro`、`Jianying` 或 `Final Cut Pro`）。必须实际导入成功后才填写；脚本不会启动编辑器验证。`extended` 将该项作为可选检查，未提供会记录失败，但不阻断扩展片模式。

报告中 `technical_and_producer_checks_passed` 仅表示代码列出的技术和记录门槛通过；`userAestheticAcceptance` 与 `universalPipelineValidated` 不会因此被设为通过。
