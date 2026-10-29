# 仓库文件树与体积

统计基线提交 `3e72d9f`，包含已加入索引的本轮工作文件。只统计当前跟踪工作文件；不计Git历史、忽略文件、node_modules以及本统计生成的3个文件。重复项以Git暂存对象身份计算，暂存后运行才是最新结果。

**2011个文件，1,110,486,266字节（1.034 GiB）。** 这不是下载压缩包大小，也不是token数。

| 目录 | 文件数 | MiB |
|---|---:|---:|
| examples | 967 | 984.25 |
| assets | 956 | 74.42 |
| references | 55 | 0.17 |
| scripts | 15 | 0.12 |
| [root files] | 8 | 0.04 |
| tests | 7 | 0.03 |
| docs | 1 | 0.01 |
| evals | 2 | 0.00 |

SKILL.md正文及元数据合计：4117个Unicode字符、72行、8447个UTF-8字节。实际token取决于模型分词器。经验命令默认最多3卡、6500字符输出；媒体视觉读取另计。

[全部跟踪文件树](repository-tree.txt) · [机器可读统计](repository-inventory.json) · [目录职责与架构](architecture.md)。做片Agent无需读取这份完整树。

## 相同对象的工作区占用

| 份数 | 每份MiB | 额外工作区MiB | 路径 |
|---|---:|---:|---|
| 3份 | 23.97 | 47.93 | examples/batch-01/public/fonts/ep52/NotoSerifSC-VF.ttf<br>examples/chapter-01/工程/public/fonts/NotoSerifSC-VF.ttf<br>examples/pareto-revision/工程/public/fonts/NotoSerifSC-VF.ttf |
| 3份 | 16.95 | 33.90 | assets/pixel-scene-map/fonts/NotoSansSC-VF.ttf<br>examples/chapter-01/工程/public/fonts/NotoSansSC-VF.ttf<br>examples/pareto-revision/工程/public/fonts/NotoSansSC-VF.ttf |
| 3份 | 1.33 | 2.66 | assets/weilanx/canvas/lib/fonts/NotoSansSC-900.woff<br>assets/weilanx/upstream/public/fonts/vox/NotoSansSC-900.woff<br>examples/batch-01/public/fonts/vox/NotoSansSC-900.woff |
| 3份 | 0.17 | 0.34 | assets/weilanx/canvas/lib/fonts/EBGaramond-600.woff<br>assets/weilanx/upstream/public/fonts/vox/EBGaramond-600.woff<br>examples/batch-01/public/fonts/vox/EBGaramond-600.woff |
| 3份 | 0.16 | 0.31 | assets/weilanx/canvas/lib/fonts/EBGaramond-400.woff<br>assets/weilanx/upstream/public/fonts/vox/EBGaramond-400.woff<br>examples/batch-01/public/fonts/vox/EBGaramond-400.woff |
| 3份 | 0.13 | 0.25 | assets/weilanx/canvas/lib/fonts/Caveat-600.woff<br>assets/weilanx/upstream/public/fonts/vox/Caveat-600.woff<br>examples/batch-01/public/fonts/vox/Caveat-600.woff |
| 2份 | 0.22 | 0.22 | examples/pareto-revision/qa/caption-reference/06-end-without.png<br>examples/pareto-revision/qa/caption-reference/07-start-without.png |
| 2份 | 0.20 | 0.20 | examples/pareto-revision/qa/caption-reference/09-end-without.png<br>examples/pareto-revision/qa/caption-reference/10-start-without.png |

相同Git对象在Git对象库内可以共享，但工作区仍分别占用；这不等于可以随意删去独立工程所需字体。此轮不移动原素材、不重写历史。

复查：先将要纳入统计的文件加入Git索引，再运行 `python scripts/repo_inventory.py`。该脚本只读Git目录、文件大小及入口文字，不加载全部媒体内容。
