---
name: script-to-video
description: 将中文文章或研究选题改编为知识视频。按项目选择风格、内容形式、时长与剪辑，复用素材和历史修复经验，完成证据核对、真实配音时间线、跨镜动画、分段渲染与自检，交付MP4、SRT、素材和工程。不处理旅行素材精剪。
---

# 文字转视频工作流

以用户选定项目为生产根目录，先读适用项目说明和用户长期反馈。沿用已确认的工程、资产及主创模型；仅补本次内容的缺口，不从零搭引擎或重新画整套图。用户一次给原文或主题，Agent内部完成制作和修复，不把每镜审批推回用户。

## 开始与收到反馈时

先识别交付对象。用户要求“修好 Skill，让另一个 Agent 独立产出”时，交付是可执行入口、素材适配、失败测试和独立复测说明；不要代做一条成片来冒充流水线修复。只有渲染软件测试所需的帧/片段，不能宣称完成了另一个模型的独立验证。

1. 盘点已有正文、工程、字体、音轨、素材和工具能力。用户的当前选择优先于历史偏好。
2. 按[项目配置](references/production-profiles.md)选内容组织、主视觉、时长画幅和剪辑方法；已有brief直接继承。共用生产接口，不把所有片锁成一种风格。
3. **读取相关经验后再改。** 在Skill根目录执行下列命令，用实际症状替换查询。输出包含正文，不再重复打开同一批卡；无匹配时换词或按ID读取，不能编造经验。

```sh
python scripts/experience.py select --stage plan --receipt /path/to/episode/plans/experience-plan.json
python scripts/experience.py select --stage repair --query "字幕孤字，修后更挤" --receipt /path/to/episode/plans/experience-repair.json
```

默认最多三张卡，按需追溯来源。首次使用看[经验应用方法](references/experience/usage.md)，为每个返回条目记录具体应用或不适用理由、保留条件和验证区间，运行`check-use`。不要通读整个经验库、展厅或上游工程。记录检查不证明模型理解或作品质量；实际画面仍须验证。

## 制作主线

新项目先走[完整工程迁移入口](references/executable-production.md)。明确选择一个已确认方向的完整案例，带着字幕、构图、解释镜头一起改编；不按关键词自动选最容易运行的 kit。

**用户选《泊松过程》的黑金空间＋浅纸推导风格时，读取[可执行镜头分支](references/poisson-cinema.md)，使用 `--source poisson-cinema`。** 该分支把原图、人物、字体与七类实际解释动作复制进独立工程；新 Agent 主要填写本片数据与 cue 绑定，无需从空画布重写。它明确限于横屏，不能拿测试样例充当文章内容或真实旁白。其它文章/风格仍按实际需求选源，不统一套用这个分支。

```sh
python scripts/start_episode.py --source chapter-01 --episode /path/to/new-episode
```

这是迁移已有完整影片的生产输入，不是给任何文章自动套同一模板。`chapter-01` 是可复现示例，也可显式指定兼容完整工程目录。新主题需改编对象、证据、动作及构图；画幅变化要实际重排。**gilded / blackgold / pixel 已降为组件测试和取材入口**，用 `production.py component-test` 在独立目录取模块，不能再据此初始化默认成片。旧 `init` 命令已撤下。

1. **原文与证据**：保存来源范围、事实、限定语和原创假设。只有标题不得冒充全文改编；缺证据就补证、改写或明确缺口。
2. **内容与分镜**：先形成问题及有效论证，再设计解释动作。对象ID、起止状态、数值口径、旁白cue及下一镜承接写清。按所选形式组织，不强套固定九镜或三点论。
3. **声音与时间**：事实稿审过后生成/复用真实配音和词界。缓存绑定稿件、音色、语速与服务版本；改稿后重建受影响时间线，不等比缩旧字幕。
4. **资产与渲染**：从选定完整工程迁移实际入画的字幕、构图与解释镜头；[视觉目录](references/visual-library.md)用于补缺口。数字和稿件可用 `production.py compile` 同源生成。以真实词界驱动动画，先用 `node render.mjs proof 起秒 终秒` 检查高风险交接，再渲完整片；局部小样通过不授权交付整片。
5. **内部修复**：基于实际编码片段、连续帧和目标观看尺寸定位。保留最好版本；每个候选记录问题、影响范围、必须保留条件和同区间对照。候选变差则不替换原版。最多三轮同类局部修复，无进展就重新诊断或标明待修。
6. **整片审查与交付**：先运行 `film_delivery.py inspect` 检查真实MP4字幕像素并生成整片2fps序列和主体近静止区间。逐段核查到片尾，快动作加密检查；填入真实观察后运行 `film_delivery.py check`。旁挂SRT、DOM记录或12秒样片均不能代替整片字幕与节奏检查。运行[技术验收器](scripts/audit_episode.py)，协议见[输入与记录](references/episode-contract.md)。交齐配音MP4、SRT、源码/工程、分段画面、独立声音、来源、耗时成本与介入记录。技术通过、制作方审查、用户认可分别记录。

## 共用约束与模式

- 反馈修复默认同文对照：保留原片，明确保持项和变化项；必要的事实修正另列，避免同时换题掩盖问题。
- 不外放；预览优先无音轨、默认暂停。敏感或仅本地素材不进入公共包或外部分析服务。
- 读图、生成图、TTS和渲染是不同工具能力。正式制作使用用户选定的高能力主创模型；其他模型移植测试不阻塞正常制作，不假定每个模型自带图像生成。
- 默认`task-short`：60–90秒、1080×1920/30fps、H.264≥8Mbps、AAC、真实对齐字幕；默认5–8镜，用户另有明确形式时调整并记录。
- `extended`：约三分钟；`chapter-proof`：90–150秒横屏1920×1080/30fps。自定义时长和画幅写入任务配置，不能冒充原任务规格已通过。
- 剪映/PR/FCP可编辑交付与Remotion源码分别标明。用户已手动确认既有编辑器流程并免除复验时继续制作，不重复启动编辑器；不将该确认套给其他用户或虚构Agent打开了新工程。XML标为交换时间线。

## 仅在相关时读取

**LifeOS完整像素场景的可执行分支：** 读[像素街区生产入口](references/pixel-scene-map.md)，运行 `scripts/pixel_scene.py prepare/render`。它带完整环境、独立人物/前景/道具、地图与相机配置、两种画幅及第二内容示例；`scripts/pixel_inspect.py`检查编码字幕与整片序列。该分支限于已提供的街区资产与镜头语法，不把跨配置运行等同于稳定审美或独立模型通过。

用户明确选择爽哥说的粒子字/实体解释或 LifeOS 的像素场景/地图剪辑时，先执行 `python scripts/reference_study.py show --route particle-document` 或 `--route pixel-scene-map`。它只读取对应[观察与制作计划](references/reference-study-20261029/plan.json)及重点时间段，不是已验证的成片模板。按计划准备本地原片、复现连续镜头后再改编；不能回退到只换配色的组件测试。详见[制作路径](references/reference-study-20261029/production-route.txt)。

| 情况 | 读取 |
|---|---|
| 具体审看、数字与布局规则 | [生产规范](references/production.md) |
| 长章节或长片 | [章节与素材组织](references/long-form.md) |
| 选配乐、混音、音源不完整 | [声音与素材](references/audio-and-materials.md)，检索E14 |
| 经验未匹配或需人工浏览目录 | [19条经验目录](references/experience/casebook.md) |
| 安装、换模型、迁移机器、原任务完成度 | [运行环境与可移植性](references/runtime-and-portability.md) |

这是Agent编排Skill。两篇开发、一篇独立验收及同文短长片、旁白修改、失败处理仍需完整验证；8–10分钟长片和跨模型稳定质量尚未证明。案例成功不推广为任意风格、文章或时长一次完美。
