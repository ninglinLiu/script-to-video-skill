# 经验怎样进入下一次决策

入口只保留共用约束。每次新片开始、收到新反馈或诊断修复时，按阶段和问题读取至多三张卡；相关证据或源码再按需打开。不要把全库、原始聊天或778个上游文件一起灌进上下文。

## 读取与应用

以下命令在Skill根目录运行，Python脚本只读本地目录；不请求模型、不联网、不播放媒体。输出已经包含选中卡的正文，不必再读同一文件。

```sh
python scripts/experience.py select --stage plan --query "三分钟 新文章 像素风格" --receipt /path/to/episode/plans/experience-plan.json
python scripts/experience.py select --stage repair --query "字幕孤字，修后更挤" --receipt /path/to/episode/plans/experience-repair.json
python scripts/experience.py read E08
```

阶段为`plan/script/storyboard/render/review/repair/delivery`。有问题关键词时只返回该阶段命中的条目；无关键词时返回该阶段的少量默认卡。中文与英文常见信号词已入索引，但这不是语义向量搜索；没匹配时明确返回空，可换词、换阶段或按ID读取。遇到新的问题应回到现有工程证据，不编造“经验支持”。

默认最多三张卡、输出上限6500个Unicode字符；可用`--limit`和`--max-chars`调整。字符数不冒充模型token数。超预算整卡延后并返回其ID，不从中间截掉例外和停止条件。收据只保存ID、卡片哈希和阶段，不保存正文或完整查询。

卡片版本哈希基于UTF-8文本及归一化LF换行，避免Windows/Linux换行差异被误报成经验变化；来源文件的原始SHA256另存于来源索引。

读完后，在项目的`plans/experience-use.json`记下每条如何用于本次任务：

```json
{
  "decisions": [
    {
      "case_id": "E08",
      "disposition": "apply",
      "target": "当前镜头的字幕段落及实际时间区间",
      "reason": "替换为本次观察到的具体问题与修复选择",
      "preserve": "替换为本次必须保留的文字、时间或对象",
      "verification": "替换为将检查的实际编码区间、读数或接点"
    }
  ]
}
```

这是字段示例，不是可原样交付的审查记录。与本次不适用的卡填`not-applicable`并说明原因；不要为了凑记录执行无关修复。先检查决策记录，再开始该阶段生产：

```sh
python scripts/experience.py check-use --receipt /path/to/episode/plans/experience-repair.json --use /path/to/episode/plans/experience-use.json
```

它会抓出漏回应条目、未知ID、版本变化和缺失字段，但不能证明模型理解了、照做了或审美正确。要在宿主层强制执行，harness还需把读取/记录检查设为阶段入口；本仓库没有假装接管任意harness。对不遵循Skill的模型，Markdown不能提供绝对保证。

## 防止修复越来越差

把本次问题写成一个可观察差异：时间区间、修前证据、候选修改、必须保留的条件。保留最好版本，不覆盖原片。先检查候选的目标区间及前后接点，再按依赖扩大范围；全局稿件/时间线变化需复查受影响下游。

候选记录至少含`baseline文件/哈希`、`candidate文件/哈希`、`问题及时间码`、`实际观察`、`保留条件是否仍满足`、`keep/reject/pending`。改善了目标问题却引入新事实错误、字幕缺字或对象跳变，拒绝候选；检查范围不足则待定。不能仅凭自评分升高就保留。

用户当前指令优先于历史经验；“认可样片方向”只在原范围有效。每张卡的历史参数是例子，不自动变成全项目常量。连续同类局部修复最多三轮，仍无改善则重新定位原因或如实报告待修；不要求用户逐镜审批。

## 经验如何更新

只有新的实际反馈或修复证据才更新卡；把观察、制作方建议和用户认可分开。失败反例保留，新增例外时不抹去旧范围。通用规则留在卡，具体项目参数留在工程。变更卡正文后更新索引哈希，运行`python scripts/experience.py validate`和检索回归检查。

来源索引仅在追溯时读取；包含未解决的问题，不把全部历史建议写成已证实的成功配方。主创模型采用用户选择的当前高能力模型；其他模型的可移植性测试不成为正常制作的前置阻塞。


## 路线关联的反思资产

`python scripts/experience.py select --stage plan --route pixel-scene-map`会同时返回用户评价摘要及对应经验卡；不依赖Agent恰好输入“背景图”等投诉词。路线名未知会报告，而不是默认为通过。已有路线包括pixel-scene-map、anchor-art、poisson-cinema、chapter-01、blackgold、component-kits、kelly-test、poisson-original。路线只用于找相关历史，不能代替当前选型。

`python scripts/experience.py reflection`只列简表；加R01等ID返回具体证据、观察范围、视频路径与区间。未捆绑原片的记录不会虚构播放链接。案例JSON是单一事实源，网页由build_reflections.py生成。新反馈优先修订相关案例/卡片，再更新索引哈希；不要把聊天逐条追加进入口。

路线摘要、经验记录与回归测试不构成硬性审美门禁；调用者可绕过工具，Markdown也不能保证理解。需要独立验证时使用evals/evals.json和实际工具轨迹，未执行不能称跨模型通过。
