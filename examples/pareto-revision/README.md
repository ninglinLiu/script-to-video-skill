# 同文修改对照：二八法则

[打开完整对照页](https://ninglinliu.github.io/script-to-video-skill/examples/pareto-revision/)。两版均为完整时长的网页副本，默认暂停、无音轨；配音分享版可单独下载。

原片68.83秒，改编68.43秒。原片由独立Agent从三个kit之一扩写，用户否决。改编从已有《回本以后》完整工程迁移字幕层、纸面构图、账单与证据布局，保留原主题、主要数字、Yunxi音色、-2%语速、Remotion版本及无BGM设定。

不是纯视觉实验：删除“任何80/20分布都必须是帕累托”的错误必要条件，补上64/4的重复比例条件，明确历史例子来自原文。原文是前次测试使用的维基《二八定律》，这次没有另选公众号文章来掩盖差异。

## 已包含

- 完整Remotion源码、字体及许可、源稿、源参数与独立公式复算脚本。
- 真实WordBoundary、声音、SRT、时间线、同文保持项与变化项。
- 原片/新片网页视频，实际字幕像素检查及整片连续序列、修复记录。
- 本机1080p生产成片的检查记录和哈希。网页轻量副本不是该哈希对应的生产文件。

`qa/` 中的记录是本次生产观察，不能拿去批准新文章；`start_episode.py` 不复制旧QA批准。新片仍待用户评价，不能标为“用户已认可”或“一次完美”。

## 从本例改编新文章

在仓库根目录：

```sh
python scripts/start_episode.py --source examples/pareto-revision --episode ./episodes/new-film
```

保留真实字幕层、构图与解释对象，修改论证、数据和镜头。重新审稿、配音和整片观察。新片也可选择其他已认可完整工程，不要求都用纸面风格。

## 复现这一条影片

要求：Node.js22+、Python3.11+、FFmpeg/ffprobe，以及可用Chrome。所有渲染静音。

```sh
cd examples/pareto-revision
python -m pip install -r requirements.txt
python scripts/verify_claims.py
cd 工程
npm ci
npx tsc --noEmit
node render.mjs full
cd ..
python tools/film_delivery.py mux --episode .
python tools/film_delivery.py inspect --episode .
```

公开包保存实际声音与时间线，所以复现原片不用重新请求TTS。改稿后才按 `source/content.json` 重新compile、审稿并运行voice.py。可用环境变量 `PYTHON`、`REMOTION_BROWSER` 指定程序路径；`RENDER_CONCURRENCY` 默认2，Windows临时目录固定到工程 `.tmp`。

`inspect` 在真实编码后逐条检查字幕像素，生成整片2fps连续接触表和主体近静止区间，同时把 `full-review.json` 重置为pending。需观察整片、对快动作加密，逐段填写实际信息变化与停留理由，再运行：

```sh
python tools/film_delivery.py check --episode .
python ../../scripts/audit_episode.py --episode . --profile task-short --output qa/audit.json
```

不能用旁挂SRT或中间12秒proof代替这一步。重渲的文件哈希可能受编码器版本影响，不能直接沿用旧审看记录。原生编辑器复验只按本项目用户明确豁免，不自动适用于其他用户。

## 四处实际动态修复

1. 土地到豌豆保留同一格阵的80格，不清空后重新入场。
2. 模型先读出底部80%人口的份额，再显示顶部20%的补集。
3. 改alpha时曲线不再重复播放入场绘制，保持同一曲线。
4. 64%不提前贴在尚未到位的条形上：先取80%，再取其中80%，结果落稳才出字。

检查只能证实这些实现和交付条件，不能自动评价是否好看、是否愿意看完。详见 `qa/full-review.json` 中的保留理由及边界。
