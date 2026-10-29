# 视频 Skill 的架构：小入口，明确选路，按需取证与素材

2026-10-29。此文件回答库如何组织，不是成片质量已解决的声明。当前工作集中在 Skill 架构；不新增 SQL 服务或向量数据库。

## 先看实际问题

本次盘点的基线版本有约1.11 GB已跟踪文件，主要是样片、字体和资产。精确计数、重复对象及完整路径见[文件树与体积](repository-tree.md)。文件在磁盘上不等于已经进上下文；当前更严重的问题是**选择器不知道某条路线已失败、迁移了外观却丢了主体动作、技术检查被误用作审美放行**。

同样，把全部历史对话写成大文档不能解决问题。另一个Agent需要在选路时得到相关的短经验、能打开的具体画面和明确的适用边界。

## 对照现成方案后的取舍

| 现成规范/开源项目 | 它解决什么 | 本库采用什么 | 不替它宣称什么 |
|---|---|---|---|
| Agent Skills： https://github.com/agentskills/agentskills | 标准Skill目录、元数据和渐进加载 | 保留SKILL.md / scripts / references / assets；入口只放主线和直接路由 | 规范不保证Agent执行正确，更不保证片子好看 |
| Anthropic skill-creator： https://github.com/anthropics/skills/tree/main/skills/skill-creator | Skill迭代、评测输入和判定记录 | 直接采用其evals.json字段组织独立Agent任务，复用已有本地unittest做确定性回归 | run_eval.py测的是描述是否触发Skill，不是影片审美 |
| Vercel skills： https://github.com/vercel-labs/skills | Skill发现、安装和更新 | 保持标准可安装结构；部署时使用已有安装器，不写新包管理器 | 安装成功不等于依赖、素材、模型能力和视觉质量全部可用 |
| Promptfoo： https://github.com/promptfoo/promptfoo | 跨模型测试、变量、断言与结果比较 | 后续需要批量跨模型评测时可接；现在不额外安装/创建第二个测试执行器 | 文本断言或LLM自评不能代替实际视频对照 |
| Git： https://github.com/git/git | 版本、partial clone、sparse checkout | 文档给出官方稀疏检出路线；沿用现有reference_study.py按需取媒体并校验哈希 | 浅克隆不等于没有历史大文件；本轮没有重写历史或迁移全部媒体 |

依据：[Agent Skills规范](https://agentskills.io/specification)规定元数据、正文和资源分层加载；[Anthropic评测字段](https://github.com/anthropics/skills/blob/main/skills/skill-creator/references/schemas.md)给出prompt、expected_output、files、expectations；[触发评测源码](https://github.com/anthropics/skills/blob/main/skills/skill-creator/scripts/run_eval.py)明确其测试范围。安装行为参考[Vercel官方README](https://github.com/vercel-labs/skills)；跨模型测试能力参考[Promptfoo配置文档](https://www.promptfoo.dev/docs/configuration/test-cases/)。本轮只采用结构和字段，不复制这些项目的运行器。

## 现有目录的职责

```text
script-to-video-skill/
├── SKILL.md                    Agent入口：交付对象、制作主线、直接路由
├── scripts/                    现有CLI：经验检索、迁移、媒体获取、渲染/技术检查
├── references/
│   ├── experience/
│   │   ├── index.json          22张经验卡的阶段、关键词和版本
│   │   ├── cards/              每次最多读3张，默认输出≤6500字符
│   │   ├── reflections.json   7个反思案例；状态、观察范围、取舍、视频时间段
│   │   └── sources.json       追溯来源；需要时才读
│   ├── production-profiles.md 不同内容、风格、画幅、时长的项目选择
│   └── 各路线.md / 参考计划     仅在选中该路线时读
├── assets/                     引擎、字体、分层素材；复制/渲染用，不整包当提示词
├── examples/                   完整工程、参考媒体、用户展厅；不是默认启动上下文
│   └── reflections/           从同一份案例JSON生成的静音查看页
├── tests/                      工具回归：路径、数据、状态与遗漏；不是审美认证
├── evals/evals.json            按成熟Skill评测字段组织的独立Agent任务，尚待实际运行
└── docs/                       本架构、完整文件树；维护时读，做片无需通读
```

保持目录与现有调用兼容。现在不把每种画风拆成一个全新Skill，也不移动所有资产：那会制造重复主线和失效路径。一个Skill提供统一交付约定，路线决定引擎、素材、镜头和审查重点。

## 一个新Agent实际怎么走

1. 读SKILL.md，先辨别是做片、改Skill还是研究，继承当前用户偏好与限制。
2. 确定候选路线。运行 `experience.py select --stage plan --route pixel-scene-map` 会直接返回该路线的**用户否决**摘要和E20等相关卡；无需先读全部历史。查询具体问题用 `--query`，没有已登记路线时不编造验收状态。
3. 需要证据才运行 `experience.py reflection R01`。它给出准确MP4、源码、时间段、观察范围及下次取舍。R04/R05/R06未捆绑原片，工具如实标明，不能凭记录声称重新看过。
4. 被否决路线允许研究、取材和复现旧版本，但不能以“已有素材”或“检查通过”为由推荐成已验证模板。原参考、原版成片、失败改编、修订候选四者分开。
5. 选定可用方向后才读取相应路线文档并取得资源。`reference_study.py fetch --route ...`已经处理真实参考片、帧序列、阶段和哈希，不另写下载器。
6. 复用实际镜头及字幕，先检查风险区间，再看整片。保存同稿同音对照；不同时换题、换风格、换引擎掩盖问题。工具状态、制作方观察、用户评价分别写。

默认入口返回少量卡片正文，**不再二次打开同样的卡**。路线摘要不会为了满足预算静默消失；卡片不足预算时完整延后并列出ID。6500是Unicode字符预算，不是跨模型token保证。图片与视频的视觉输入成本另计；按需要给连续片段和加密帧，不能为了省token只给一张漂亮封面。

## 反思资产怎样真正影响下一次

`reflections.json`是案例事实的唯一维护源；网页由脚本生成。经验卡提炼决策，不粘贴全部聊天。每个案例包含用户状态、观测来自哪里、失败策略、可以保留什么、如何重新验证和不能推广的范围。

- R01/R02：背景插画与贴纸位移不满足本次场景动画对标；保留美术，不将其再次推荐为成熟模板。
- R03：有SRT不等于字幕入画；局部样片不替代整片。
- R04/R06：参数化或工程迁移不能丢掉原镜头的尺度、材质、动作与联系。
- R05：复用依赖和字体不等于复用视觉；修Skill不等于当前Agent代做成片。
- R07：保留用户喜欢的原版方向，逐项修复实际动作落差，不能粗暴地给整个风格贴失败标签。

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
```

原理及兼容性以[git-clone](https://git-scm.com/docs/git-clone)与[sparse-checkout](https://git-scm.com/docs/git-sparse-checkout)官方文档为准。partial clone需要远端支持；稀疏工作区内使用反思CLI不要求所有媒体已在磁盘，观看时可打开现有展厅或取得相应目录。本轮只在隔离本地稀疏副本测试检索，不冒充已测试远端传输量。

中期可把大媒体放Release/对象存储，保留内容哈希、出处、稳定URL、缺资源错误和离线回填；必须先测试干净环境取回完整路线再切换。暂不迁移、删除或重写历史。重复字体暂保留以免破坏独立工程，未来由统一打包清单去重，而不是新Agent随意删文件。

现在22张经验卡、7个反思案例，JSON加确定性筛选已足够。只有案例规模、检索召回或多人更新确实暴露瓶颈，再评估数据库/全文检索。若用户确实指SQL系统，应另定查询、并发和数据生命周期需求；不能把大视频仓库直接等同于需要数据库。

## 本轮已做与尚未做

已做：确认旧失败片；整理7个案例；接到现有experience.py的路线检索；补3张决策卡；静音反思页；实际文件树与体积统计；回归测试与独立任务输入。

尚未做：新片制作、跨模型真实复测、通用审美自动评分、全库媒体迁移、长片稳定性证明。保留旧工程和视频；这些架构改动不能被写成动画问题已经解决。


验证记录：2026-10-29，经验回归16项通过，Skill格式与22卡/20来源完整性通过。本地隔离稀疏副本未检出assets/examples，仍能返回R01否决状态、读取R02，并通过同样16项测试；这不等于远端下载量测量。反思页R01/R02静音播放已检查，10秒跳转与区间末尾暂停可用。预览复用本机现有Starlette静态服务的HTTP Range能力；未另造视频服务器。独立Agent评测尚未运行。
