# 更新这个 Skill

先看 [README 架构图](README.md#架构总览) 和 [目录职责](docs/architecture.md)。本库复用 Agent Skills 的渐进加载、Mermaid 的图形语法、Git 的文件索引和现有 Python 测试；不再增加一套架构服务。

## 先设计，再实现

| 本次变化 | 先更新什么 | 再做什么 |
|---|---|---|
| 新增入口、路线依赖、模块职责或顶层目录 | `docs/architecture.mmd`、`docs/architecture-layout.json` 和相关架构说明 | 改代码、素材和路线说明，补相关回归 |
| 增加一条已有类别的经验或反思 | 原有 JSON、经验卡及索引 | 重建展示页；不为凑改动重画架构 |
| 修文字或现有功能 | 对应文件；若职责变了仍按第一行处理 | 运行相应检查和文件树同步 |

`docs/architecture.mmd` 是总览图的唯一源文件，GitHub 原生渲染 Mermaid。`docs/architecture-layout.json` 只登记重要目录的职责；完整路径由 Git 索引生成。README 不维护第二份手写总图或手写目录树。

## 每次提交前

Python 3.11+ 和 Git 即可运行这些维护检查，不需要模型、TTS、浏览器或付费 API。先审查 `git status`，只暂存本次授权的文件，避免把其他工作的未提交内容一起发布。

```sh
# 先完成结构设计与实现，然后逐项暂存本次改动
git add <本次修改的明确路径>
# 若改了反思 JSON，先重建网页，并暂存生成页
python scripts/build_reflections.py
git add examples/reflections/index.html

# 从暂存版本生成 README 图、目录职责树及实际完整树
python scripts/repo_inventory.py
git add README.md docs/repository-tree.md docs/repository-tree.txt docs/repository-inventory.json

# 检查当前将要提交的版本；有未暂存的修改会拒绝认证
python scripts/repo_inventory.py --check
python scripts/experience.py validate
python -m unittest discover -s tests -p "test_repo_inventory.py"
python -m unittest discover -s tests -p "test_experience.py"
python -m unittest discover -s tests -p "test_diorama.py"
python -m unittest discover -s tests -p "test_samples.py"
python -m unittest discover -s tests -p "test_mix_music.py"    # 没有 ffmpeg 时自动跳过
python -m unittest discover -s tests -p "test_simfilm.py"
# 改了生产工具时，再运行对应生产测试；此处不代替它们
git diff --cached --diff-filter=D --name-only                  # 这次删了什么，应该为空，否则按下面“补充为主”处理
git diff --cached --stat
git commit -m "Describe the change"
```

生成器读取 Git 索引中的文件清单和对象大小，统计不受 Windows 换行符影响。三个 inventory 输出不计入体积，避免自我引用；完整树仍显示它们。统计不包含忽略文件、缓存或 Git 历史，也不会把媒体内容送给模型。

## 改 README 的图

`docs/media/` 的图和 GIF 由 `scripts/build_readme_media.py` 从实际成片生成，不手工修图，也不放第三方参考片的画面。`docs/production-flow.mmd` 和 `docs/architecture.mmd` 一样由 inventory 同步进 README。

## 加一条样片

在 `references/sample-catalog.json` 加一条记录，写清评价、工程位置和取用方式，然后：

```sh
python scripts/samples.py measure    # 抽帧测明暗
python scripts/samples.py doc        # 重新生成 docs/sample-catalog.md 和 README 里的两张样片表
```

评价只记发生过的事。用户没点名的片子不要加认可；效果差的也留着，标清楚。明暗是测量值，不代表好坏。README 的样片墙用 `samples.py wall` 重新生成。

## 删除要先问

删除仓库里已有的文件或目录前，先告诉用户要删什么、为什么删，等确认后再动。Git 历史也一样。

## 补充为主，删减要说明

用户 2026-11-02 的要求：“希望以后迭代以补充、修正和整理为主，尽量减少大段删除或整体覆盖；必要删减时说明原因、保留去向。”

- **改错**：直接修正，必要时写明日期，别让旧说法和新说法打架。
- **大段改写**：先把旧全文存档，比如 `docs/README-20261029.md`、`references/legacy-workflow.md`，再改。
- **必要删减**：提交前说明删了什么、为什么、去了哪，记进 [docs/removals.md](docs/removals.md)。提交说明里也写一句。
- **README**：样片图片、分镜、GIF、视频入口和架构图都保留，新内容往里加。放不下就折叠或挪到样片目录，不要直接删。

## GitHub 检查与边界

`.github/workflows/architecture.yml` 在每次 push 和 pull request 运行同样的同步检查与工具回归。图没有同步到 README、文件树过期、重要目录路径失效、出现未登记顶层目录时会失败。反思展示页也要能从记录重新生成而无差异。

检查器验证文件与结构的一致性，不能判断一条新业务关系是否画得准确；维护者仍需审查图中的含义。没有配置分支保护时，失败状态不会自动禁止直接 push。本次不更改仓库保护策略或其他工作区的 Git hooks。

采用的现成机制：[GitHub Mermaid](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)、[GitHub Actions checkout](https://github.com/actions/checkout)、[setup-python](https://github.com/actions/setup-python)。[其余 Skill 架构参考及采用范围](docs/architecture.md#对照现成方案后的取舍)。
