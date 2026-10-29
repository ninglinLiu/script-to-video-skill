# 独立Agent验证输入

`evals.json`采用Anthropic skill-creator的字段结构： https://github.com/anthropics/skills/blob/main/skills/skill-creator/references/schemas.md 。这是一份待运行任务集，不是通过报告；不复制上游执行器，不默认调用付费模型。

交给一个没有原会话的Agent，用当前Skill与用例中列出的文件运行；保留模型/版本、仓库提交、完整工具轨迹、输出文件和未满足项。在干净工作区运行，避免上一轮缓存与原会话补充。使用者已有Anthropic skill-creator时可沿用其评测流程；需要批量跨模型比较时可接Promptfoo，先确认运行器实际执行了工具。

这些四条主要验证找案例、遵守任务边界和引用真实证据。它们**不证明生成质量**。后续真正做片要增加同稿同音、同一连续镜头和用户观看结果；不能以“输出出现E20”等字符串断言代替实际行为。上游run_eval.py的触发率也不是本任务的成片通过率。
