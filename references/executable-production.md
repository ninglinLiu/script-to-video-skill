# 从素材到成片：可执行入口

适用：新建视频或迁移到另一个 Agent。目的不是多填记录，而是直接得到**已引用上游画面组件、共享数据、跨镜对象与阻断检查的工程**。现有影片不要覆盖；可在空目录初始化后移植需要的模块。

## 1. 先取得能运行的素材

在 Skill 仓库根目录执行：

```sh
python scripts/select_visual.py --ready --query "群体 平均"
python scripts/production.py init --episode ./episodes/new-film --kit blackgold --aspect portrait
```

第二处交接默认 `--edit match-move`，同一对象从原位置移动到比较构图。选 `--edit evidence-cut` 时，已接好的 `EvidenceCut` 保留同一组对象，直接从柱形证据切到统计结果；不是换个文档标签。两者均有真实渲染样片。

| kit | 真正导入的上游组件 | 适合解释 |
|---|---|---|
| `blackgold` | `GlowPawnG`；同时带上 `SpotlightG` 等道具 | 群体、少数、个体差异、选择 |
| `gilded` | `GoldCoin`；同时带上 `Die3D`、`GoldTree` 等 | 本金、比例、概率、分支 |
| `pixel` | `PixelBuddy` | 角色行动、流程、反馈 |

`--aspect landscape` 切换横屏布局。三个入口会递归解析本地 imports、复制依赖和字体许可、生成 `Asset.tsx` 实际引用组件，并生成逐文件来源及哈希 `plans/assets.json`。它们是首批可直接装配的适配器；其余艺术场景仍在原目录，不声称全部已经自动适配。

安装产物里有：

- `工程/src/vendor/`：选中上游组件的最小静态依赖闭包及 MIT；不复制全部778个文件。
- `工程/src/Asset.tsx`：直接可用的视觉适配器。字体或配色不算画面组件复用。
- `工程/src/motion.tsx`：`PersistentObject` 保留对象身份，在归一化坐标间移动；`EvidenceCut` 保留证据锚点后硬切内容；`MotionProbe` 记录实际浏览器 DOM。
- `source/content.json`：事实值、派生运算、格式、口播模板与画面文案。
- `plans/edit-plan.json`：解释动作、两个交接、样片区间；此处初始的12秒是机制演示，不是文章成片。
- `tools/production.py`：可随工程独立运行，检查时不依赖原仓库的绝对路径。

## 2. 改内容，不拆掉现有视觉层

初始演示用五个账户说明极端值怎样影响均值。根据新文章更换主对象、解释动作和布局；不要原封不动扩成整片，不必为了复用而加入不相关人物或道具。

`source/content.json` 中的 `values` 是原始数据，`derived` 依序计算 `mean / median / sum / multiply / divide / power / subtract`。`labels` 定义数字精度和单位。画面用 `Claim` 或 `content.generated.json`；口播用 `{{字段名}}`：

```sh
cd episodes/new-film
python tools/production.py compile --episode .
```

此命令同时生成画面数据、`source/script.json`、`source/draft.txt`。未绑定变量直接报错。改参数后未重新编译、改了生成文件而没改源文件，都会被检查拦住。需要新运算时扩展生成器及测试，不手抄新结果。

审稿后在内容源设置真实的 `factsStatus`（`approved...`），重新编译，将审查绑定到最终稿件哈希，再按现有 `voice.py` 生成旁白。不要把字段改成 approved 当作完成事实核对。复制来的配音脚本仍要求 `evidence/script-review.json` 中的真实审稿记录。

实测时间线生成后，为 `edit-plan.json` 每个交接填写 `cueIndex`（从0开始，可加秒数 `offset`），再执行：

```sh
python tools/production.py align --episode .
```

该命令把交接绑定到真实语音 cue 并同步时长。随后选择包含解释动作和两处交接的8–13秒区间、更新 `beats`。初始样片的固定时间只用于验证运行环境。完整制作仍须补全文案、章节、字幕和片段；模板不会把12秒自动填充成60秒。

## 3. 先渲真实片段，再放行全片

```sh
cd 工程
npm ci
npm run check
node render.mjs proof
```

运行前可设置 `PYTHON` 和 `REMOTION_BROWSER` 指向已有解释器与 Chrome；否则用 PATH 的 Python 和 Remotion 浏览器策略。入口自动把该进程及子进程的 TEMP/TMP 指向工程 `.tmp`。如 npm 缓存无写权限，可用 `npm ci --cache .npm-cache`；缓存不提交。

得到无音轨的 `qa/motion-proof.mp4`、逐帧 DOM `motion-trace.json`、哈希记录及默认暂停的 `qa/watch.html`。`qa/motion-review.json` 始终从 `pending` 开始。新渲染会让旧观察失效，不自动写“已审看”。

静音连续播放或密集连续帧检查后填写：

- `status: reviewed`，`method: muted-playback` 或 `dense-sequence-review`。
- `observations`：`start / end / observed / newInformation`，写真实区间和解释变化。
- `transitions`：每个交接的 `id / observed / verdict`；通过写 `keep`，有问题留在 `unresolved` 并修复。
- 保留自动生成的 `proofSha256`，不能把别的片段观察套给当前片段。

```sh
python ../tools/production.py check --episode .. --stage render
node render.mjs final
```

全片渲染入口在下列任一情况退出，后续 `audit_episode.py` 也会报告缺项：

1. 组件只是复制到目录，没有从渲染入口实际引用。
2. 共享数据、画面数据、稿件发生漂移。
3. 缺少真实8–13秒 MP4、解码失败、输入改变后样片过期。
4. 缺少逐帧浏览器记录、片内没有可见图形素材、绑定数值显示不一致。
5. 声称 `match-move` 的交接处对象消失或位置跳变；有意硬切用 `evidence-cut`，保留锚点并说明因果。
6. 只有稀疏静帧记录、没有解释动作与两个接点的实际观察，或尚有未解决问题。

`stills` 模式仍可查排版，但不会生成通行记录。`check --stage prepare` 仅检查装配，不等于审片通过。

## 4. 这些检查的边界

- 数值自动检查覆盖绑定字段；没有标记的手写数字、公式解释与事实真实性仍需审查。
- DOM 检查能发现消失、跳位、空素材和绑定文字不符，不能判断绘画好坏、解释是否有趣、遮挡是否合理或观众能否看懂。逐帧日志不是 Agent 已观看的证明。
- 一段样片通过不代表全片完成审看。完整片仍按 `production.md` 检查内容、节奏、段落与声音；结论不由检查器背书。
- 原生导入豁免按用户明确范围保留，和新增画面检查分开。
- 老案例原样保留。用新验收器检查时若缺少这些证据，会显示缺项；不倒填历史审看。
- 任意 Agent 可以绕开入口另写渲染器；本工具不接管所有 harness。默认入口和交付验收会发现缺项，但不能防止伪造记录或保证“一次完美”。
- 素材依赖扫描针对这些适配器使用的静态相对 import，不是完整 JavaScript 编译器；新增别名或动态表达式加载须补适配和实际渲染测试。

验证样片和复现结果见 [production-gates](../examples/production-gates/index.html)。这是装配与检查的实测，不是新文章审美验收。
