# 视频 Skill 的架构：小入口，默认路线，组件库，按需取证

2026-11-01 更新。此文件回答库如何组织。质量基准是用户认可的[币安样片](../examples/binance-1029/README.md)。不新增 SQL 服务或向量数据库。

先看 [README完整架构图](../README.md#架构总览)。图的唯一源文件是 [architecture.mmd](architecture.mmd)，重要目录职责来自 [architecture-layout.json](architecture-layout.json)，README对应区块由现有inventory脚本同步；下文解释取舍与边界。

## 维护架构与实际实现的一致性

结构或职责改变时，先更新源图、目录职责及相关说明，再实现内容。每次提交前，从Git索引生成实际树并执行 `python scripts/repo_inventory.py --check`；push/PR由GitHub Actions再验证一次。新增顶层目录未登记、旧路径已消失、README图不同步、完整树与索引不符都会报告失败。具体步骤见 [CONTRIBUTING.md](../CONTRIBUTING.md)。

图使用GitHub原生Mermaid；文件清单与对象大小直接由Git提供；测试沿用Python unittest。这次没有新增架构平台、数据库或第二个Skill执行器。自动检查覆盖文件一致性，不能证明图中职责描述正确，也不能代替Agent或用户观看实际影片；未配置分支保护时，CI失败不等于禁止直接推送。

## 2026-11-01 这次改了什么

之前 7 次否决都是画面和动作问题，而每次修复都变成一条新禁令加一个新检查，Skill 越来越会证明自己没出错，做动画的能力却没涨。币安样片第一次获得用户认可，所以这次把重心换了：

| 层 | 之前 | 现在 |
|---|---|---|
| 入口 | `SKILL.md` 约 60 行极密集文字，大量"不能" | 不到 100 行，分清交付物、选路线、七步、质量底线。旧全文移到 `references/legacy-workflow.md`，内容未删 |
| 能力 | 每条片从零写画面 | `assets/diorama-kit` 组件库，14 个带动作的组件 |
| 手艺 | 几乎没有曲线、时长、错峰的说明 | `references/motion-craft.md` 给具体参数 |
| 观感 | 用户到最后才看 | 静帧加连续片，用户在场就先看一眼 |
| 经验 | 收据和 `check-use` 必走 | 工具保留，入口不再要求，查经验只为解决具体问题 |
| 评测 | 测有没有引用案例 | 新增要真的出片、由人看结果的用例 |
| README | 风格图和历史说明 | 分镜总览、动作图集、架构、流程、对照 |
| 打包 | 只能 clone 全部 | `package_skill.py` 轻量包和稀疏检出 |

## 2026-11-09 补充了什么

新增参考《临界点：渗流理论》的代码模拟暗金排版路线，与 3D 微缩并列；未指定风格时先提供选项，保留已有路线和展示内容。

| 层 | 补充 |
|---|---|
| 入口 | `SKILL.md` 加“先问风格”：没指定时先问，附两种风格的样片；用户说“你定”时按题材推荐。3D 微缩的基准地位和全部内容不变 |
| 路线 | 新增 `references/sim-typography.md`：参考片拆解、实测配色和版式、结构模板、质量底线 |
| 能力 | 新增 `assets/sim-kit/`（画面原语、逐帧渲染器、起手场景）和 `scripts/simfilm.py`（起工程、查环境、拼静帧）。`mix_music.py` 不传 `--voice` 时走纯音乐，带旁白的行为不变 |
| 案例 | 新增 `examples/caesar-kelly/`：数据脚本、场景、成片、两版配乐报告。样片只存场景和数据，engine 用 kit 那份；从仓库重渲的帧和原片逐像素一致 |
| 经验 | E25 和来源 `percolation-style-reference`：这是参考风格分析，不代表本库成片已获认可 |

架构图里加了“先问风格”一步；制作流程图在开头分成两条路。没有删减任何文件。

## 2026-11-02 补充了什么

用户认可了凯撒样片的配乐，并要求迭代以补充、修正和整理为主。这次只加不删：

| 层 | 补充 |
|---|---|
| 配乐 | `assets/music/catalog.json` 登记曲目、哈希和署名，`music_library.py` 下载校验，`mix_music.py --track` 套用预设；配方写进 `references/audio-and-materials.md`，经验卡 E24，案例 R09。不带 `--track` 时工具行为不变 |
| 找片 | `references/sample-catalog.json` 是唯一数据源，`samples.py` 按明暗、评价和关键词查，`docs/sample-catalog.md` 由它生成。明暗是抽帧测的，评价只记发生过的事 |
| 案例 | 新增 `examples/caesar-ai-bubble/`；用户否决和批评过的工程（R02–R06 等）补进 `examples/failed-cases/`，9 组浅色样片的工程补进 `examples/light-projects/`。只收源码和记录，文章全文按文件名排除并逐文件比对，依赖和字体不入库 |
| 治理 | `docs/removals.md` 记录删减；`AGENTS.md`、`CONTRIBUTING.md` 写明补充为主、必要删减说明原因和去向 |
| 路线 | Blender 不再是“没跑过”，成本和坑写进 `references/diorama-3d.md`；但用户认可的是配乐不是画面，默认路线仍是 three.js |

没有新增服务或数据库，曲目和样片目录都是 JSON 加现有脚本。

## 先看实际问题

2026-10-29 盘点时有约1.11 GB已跟踪文件（用户 2026-11-01 移除第三方参考媒体后约 480 MB，但 Git 历史仍含这些媒体），主要是样片、字体和资产。精确计数、重复对象及完整路径见[文件树与体积](repository-tree.md)。文件在磁盘上不等于已经进上下文；当前更严重的问题是**选择器不知道某条路线已失败、迁移了外观却丢了主体动作、技术检查被误用作审美放行**。

同样，把全部历史对话写成大文档不能解决问题。另一个Agent需要在选路时得到相关的短经验、能打开的具体画面和明确的适用边界。

## 对照现成方案后的取舍

| 现成规范/开源项目 | 它解决什么 | 本库采用什么 | 不替它宣称什么 |
|---|---|---|---|
| Agent Skills： https://github.com/agentskills/agentskills | 标准Skill目录、元数据和渐进加载 | 保留SKILL.md / scripts / references / assets；入口只放主线和直接路由 | 规范不保证Agent执行正确，更不保证片子好看 |
| Anthropic skill-creator： https://github.com/anthropics/skills/tree/main/skills/skill-creator | Skill迭代、评测输入和判定记录 | 直接采用其evals.json字段组织独立Agent任务，复用已有本地unittest做确定性回归 | run_eval.py测的是描述是否触发Skill，不是影片审美 |
| Vercel skills： https://github.com/vercel-labs/skills | Skill发现、安装和更新 | 保持标准可安装结构；部署时使用已有安装器，不写新包管理器 | 安装成功不等于依赖、素材、模型能力和视觉质量全部可用 |
| Promptfoo： https://github.com/promptfoo/promptfoo | 跨模型测试、变量、断言与结果比较 | 后续需要批量跨模型评测时可接；现在不额外安装/创建第二个测试执行器 | 文本断言或LLM自评不能代替实际视频对照 |
| Git： https://github.com/git/git | 版本、partial clone、sparse checkout | 文档给出官方稀疏检出路线；reference_study.py 的 fetch 已随第三方媒体移除而停用 | 浅克隆不等于没有历史大文件；本轮没有重写历史或迁移全部媒体 |

依据：[Agent Skills规范](https://agentskills.io/specification)规定元数据、正文和资源分层加载；[Anthropic评测字段](https://github.com/anthropics/skills/blob/main/skills/skill-creator/references/schemas.md)给出prompt、expected_output、files、expectations；[触发评测源码](https://github.com/anthropics/skills/blob/main/skills/skill-creator/scripts/run_eval.py)明确其测试范围。安装行为参考[Vercel官方README](https://github.com/vercel-labs/skills)；跨模型测试能力参考[Promptfoo配置文档](https://www.promptfoo.dev/docs/configuration/test-cases/)。本轮只采用结构和字段，不复制这些项目的运行器。

## 现有目录的职责

见 [README自动同步的目录职责树](../README.md#目录怎么找agent-会读多少) 与 [全部跟踪文件](repository-tree.txt)。这里只维护架构解释，不再保留第二份手写树。

保持目录与现有调用兼容。现在不把每种画风拆成一个全新Skill，也不移动所有资产：那会制造重复主线和失效路径。一个Skill提供统一交付约定，路线决定引擎、素材、镜头和审查重点。

## 一个新Agent实际怎么走

1. 读SKILL.md，先辨别是做片、改Skill还是研究，继承当前用户偏好与限制。
2. 确定候选路线。运行 `experience.py select --stage plan --route pixel-scene-map` 会直接返回该路线的**用户否决**摘要和E20等相关卡；无需先读全部历史。查询具体问题用 `--query`，没有已登记路线时不编造验收状态。
3. 需要证据才运行 `experience.py reflection R01`。它给出准确MP4、源码、时间段、观察范围及下次取舍。R04/R05/R06未捆绑原片，工具如实标明，不能凭记录声称重新看过；2026-11-02 起它们的工程和压缩静音预览在 `examples/failed-cases/`，记在 `archive` 字段。
4. 被否决路线允许研究、取材和复现旧版本，但不能以“已有素材”或“检查通过”为由推荐成已验证模板。原参考、原版成片、失败改编、修订候选四者分开。
5. 选定可用方向后才读取相应路线文档并取得资源。未指定风格时先问用户；选择 3D 微缩后用 `diorama.py new`，选择代码模拟暗金排版后用 `simfilm.py new` 起工程。第三方参考片不再随仓库提供，用户有本地文件时可用 `reference_study.py prepare`。
6. 复用实际镜头及字幕，先检查风险区间，再看整片。保存同稿同音对照；不同时换题、换风格、换引擎掩盖问题。工具状态、制作方观察、用户评价分别写。

默认入口返回少量卡片正文，**不再二次打开同样的卡**。路线摘要不会为了满足预算静默消失；卡片不足预算时完整延后并列出ID。6500是Unicode字符预算，不是跨模型token保证。图片与视频的视觉输入成本另计；按需要给连续片段和加密帧，不能为了省token只给一张漂亮封面。

## 反思资产怎样真正影响下一次

`reflections.json`是案例事实的唯一维护源；网页由脚本生成。经验卡提炼决策，不粘贴全部聊天。每个案例包含用户状态、观测来自哪里、失败策略、可以保留什么、如何重新验证和不能推广的范围。

- R01/R02：背景插画与贴纸位移不满足本次场景动画对标；保留美术，不将其再次推荐为成熟模板。
- R03：有SRT不等于字幕入画；局部样片不替代整片。
- R04/R06：参数化或工程迁移不能丢掉原镜头的尺度、材质、动作与联系。
- R05：复用依赖和字体不等于复用视觉；修Skill不等于当前Agent代做成片。
- R07：保留用户喜欢的原版方向，逐项修复实际动作落差，不能粗暴地给整个风格贴失败标签。
- R08：用户认可的初版基准。认可范围只到这一条横屏 60 秒，用户说约为参考效果五成。
- R09：用户认可凯撒样片的 A「低频悬疑」配乐。认可范围只到这次配乐，不含画面。

其余长期批评继续放在已有E01–E19：信息推进、跨镜关系、长片章节、声音来源、同文回退和用户认可边界。覆盖索引见[反思入口](../references/experience/reflections.md)。没有新增一个独立“记忆平台”。

## 质量与回归分层

| 检查层 | 可证明 | 不能证明 |
|---|---|---|
| unittest/CLI | 选路确实带出否决状态、资源路径有效、版本一致、预算不截断案例 | Agent理解、影片好看 |
| 实际编码与连续对照 | 特定时间区间的字幕、动作、遮挡、重置是否发生 | 任意新文章均能达到同样效果 |
| 新Agent独立执行 | 是否无需原会话即可找到素材并按边界完成指定任务 | 只运行一条就称所有模型稳定 |
| 用户观看反馈 | 此版本是否满足当前目标 | 自动推广到别的风格、时长、任务 |

本轮新增的独立用例采用Anthropic字段格式，未运行就保持未验证。它们要求给出文件和时间码，不接受单独的“已检查”“审美8分”。不增加万能审美分数，也不要求所有镜头持续运动。

## 库体积如何控制

先用Git现成功能做轻量检出，媒体仍在同一仓库，保留当前展示链接：

```sh
git clone --filter=blob:none --sparse https://github.com/ninglinLiu/script-to-video-skill.git
cd script-to-video-skill
git sparse-checkout set scripts references tests evals docs
# 选择chapter-01后再取这一支的运行输入；不是先拉所有展厅
git sparse-checkout add examples/chapter-01 assets/film-tools
# 需要组件目录时
git sparse-checkout add assets/production-kit assets/weilanx
# 默认路线（3D 微缩）：组件库、基准案例和 README 图
git sparse-checkout add assets/diorama-kit examples/binance-1029 examples/pareto-diorama docs/media
```

原理及兼容性以[git-clone](https://git-scm.com/docs/git-clone)与[sparse-checkout](https://git-scm.com/docs/git-sparse-checkout)官方文档为准。partial clone需要远端支持；稀疏工作区内使用反思CLI不要求所有媒体已在磁盘，观看时可打开现有展厅或取得相应目录。本轮只在隔离本地稀疏副本测试检索，不冒充已测试远端传输量。

中期可把大媒体放Release/对象存储，保留内容哈希、出处、稳定URL、缺资源错误和离线回填；必须先测试干净环境取回完整路线再切换。暂不迁移、删除或重写历史。重复字体暂保留以免破坏独立工程，未来由统一打包清单去重，而不是新Agent随意删文件。

现在25张经验卡、9个反思案例、31组样片，JSON加确定性筛选已足够。只有案例规模、检索召回或多人更新确实暴露瓶颈，再评估数据库/全文检索。若用户确实指SQL系统，应另定查询、并发和数据生命周期需求；不能把大视频仓库直接等同于需要数据库。

## 本轮已做与尚未做

已做：确认旧失败片；整理7个案例；接到现有experience.py的路线检索；补3张决策卡；静音反思页；实际文件树与体积统计；回归测试与独立任务输入。

尚未做：跨模型真实复测、竖屏成片、通用审美自动评分、全库媒体迁移、长片稳定性证明。保留旧工程和视频。


验证记录：2026-10-29，经验回归16项通过，Skill格式与22卡/20来源完整性通过。本地隔离稀疏副本未检出assets/examples，仍能返回R01否决状态、读取R02，并通过同样16项测试；这不等于远端下载量测量。反思页R01/R02静音播放已检查，10秒跳转与区间末尾暂停可用。预览复用本机现有Starlette静态服务的HTTP Range能力；未另造视频服务器。独立Agent评测尚未运行。

验证记录：2026-11-01，用仓库文件在空目录重建币安样片 10 个时间点，与用户认可成片 SSIM 0.973–0.996；组件目录和第二内容只用组件库实际渲染；单元测试见 `tests/`。独立 Agent 评测尚未运行。
