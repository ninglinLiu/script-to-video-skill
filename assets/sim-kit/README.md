# sim-kit

代码模拟 · 暗金排版（临界点风格）的画面原语和渲染器。路线说明见 [sim-typography](../../references/sim-typography.md)，完整成片写法见[凯利公式样片](../../examples/caesar-kelly/README.md)。

| 文件 | 作用 |
|---|---|
| `web/engine.js` | 画面原语，所有绘制只依赖时间 t |
| `web/scene.js` | 起手场景，21 秒，每个原语用一遍 |
| `web/index.html` | 加载字体、数据和场景，暴露 `renderFrame(t)` |
| `data/build_data.py` | 算出片中所有数字 → `web/data.json`、`qa/data-summary.json` |
| `render.mjs` | 无头 Chromium 逐帧截图交给 ffmpeg：`stills`、`clip`、`full`、`cards` |

## 原语

| 函数 | 画什么 |
|---|---|
| `head(L, 第一行, 第二行, {t0, out})` | 居中两行标题，逐字淡入；`{重点}` 用金色 |
| `type(L, 文字, {y, t0, size, color, font})` | 任意一行逐字打出 |
| `bigNumber(L, '38.9%', {y, t0, size})` | 大数字：淡描边，光条从左扫到右点亮 |
| `label(L, 'Kelly Criterion', {y})` | 字距拉开的大写小标签 |
| `readout(L, 'Balance', '×7.49', {x, y})` | 小标签 + 等宽金色读数 |
| `cells(L, {x, y, w, cols, n, state})` | 格子：`state(i)` 返回颜色、透明度、发光、缩放 |
| `axes(L, {...})`、`line(L, pts, {prog})` | 坐标轴；按进度生长的折线，笔尖带亮点 |
| `rule(L, x, y, w)`、`dot(L, x, y)` | 金色细线、亮点 |
| `check(L, 文字, {x, y, t0})` | 勾选清单的一条 |

段落用 `add(t0, t1, draw)` 组织，段与段之间整屏淡入淡出。`frame()` 负责背景、发光层和暗角。

## 起一个新工程

```sh
python scripts/simfilm.py doctor
python scripts/simfilm.py new --episode ./ep      # 或 --source caesar-kelly
cd ep
python data/build_data.py
node render.mjs stills 2,8,14,19 --dir s1
node render.mjs full
node render.mjs cards                              # 分段表，给分镜总览分色
```

依赖：Node 18+、ffmpeg、Python 3.11+（凯利样片的数据脚本另需 numpy、scipy）、playwright 包和 Chrome/Edge/Chromium。字体用系统里的思源宋体 / Noto Serif SC（中文衬线）和 Cascadia Mono / Consolas（等宽），不随仓库分发；不在常见位置时设 `SERIF_FONT`、`MONO_FONT`。
