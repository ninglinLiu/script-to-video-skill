# 给制作Agent的经验目录

这些条目从已有人工反馈、制作方修复和未解决问题提炼，不是新的成片验收。每条都有触发条件、动作、需保留的内容、例外、验证和来源。读相关条目，不必通读历史。

先读[使用方式](usage.md)。按问题检索：`python scripts/experience.py select --stage repair --query "字幕孤字"`。所有路径以Skill根目录为基准。

| 条目 | 决策问题 | 阶段 |
|---|---|---|
| [E01](cards/E01.md) | 语速快仍显慢：先查信息推进 | plan / script / review / repair |
| [E02](cards/E02.md) | 有内容但动作空转：压缩等待段 | storyboard / review / repair |
| [E03](cards/E03.md) | 文章改编先保住来源与论证边界 | plan / script / review |
| [E04](cards/E04.md) | 先复用资产，再补真正的视觉缺口 | plan / storyboard / render / repair |
| [E05](cards/E05.md) | 跨镜继承对象，同时继承问题 | storyboard / review / repair |
| [E06](cards/E06.md) | 转场文字与运动包围盒分开处理 | storyboard / review / repair |
| [E07](cards/E07.md) | 数字正确还要视觉语义正确 | script / storyboard / review / repair |
| [E08](cards/E08.md) | 字幕修复看最终字体和整行分配 | render / review / repair |
| [E09](cards/E09.md) | 改稿后重建真实时间线 | script / render / repair |
| [E10](cards/E10.md) | 局部重渲要按依赖传播 | render / repair |
| [E11](cards/E11.md) | 每次修复保留可回退基线 | review / repair |
| [E12](cards/E12.md) | 方向认可、制作方复核与整片认可分开 | plan / review / delivery |
| [E13](cards/E13.md) | 长片扩展先组织章节与素材功能 | plan / script / storyboard / review |
| [E14](cards/E14.md) | 配乐先认清完整音源，再混音 | plan / render / repair |
| [E15](cards/E15.md) | 以最终编码检查字体、颜色和语义 | render / review / repair |
| [E16](cards/E16.md) | 多样性按项目选择，不全局锁死画风 | plan / storyboard / repair |
| [E17](cards/E17.md) | Windows临时编码文件拒绝写入 | render / repair |
| [E18](cards/E18.md) | 流程齐全，画面仍像逐页演示 | plan / storyboard / render / review / repair |
| [E19](cards/E19.md) | 有SRT、局部通过，整片仍缺字幕且停滞 | plan / render / review / repair / delivery |
| [E20](cards/E20.md) | 精细背景加贴纸，仍不是场景动画 | plan / storyboard / review / repair |
| [E21](cards/E21.md) | 迁移没有保住原镜头的视觉质量 | plan / storyboard / review / repair |
| [E22](cards/E22.md) | 修Skill不等于当前Agent代做成片 | plan / review / repair / delivery |

[来源与观察范围](sources.json)只在需要追溯时加载。已公开历史片可在[展厅](../../examples/gallery/index.html)按项目名称查看；网页轻量副本与生产原片的哈希不同。



[7个反思案例及反馈覆盖](reflections.md)：只有需要证据时才读具体案例。
