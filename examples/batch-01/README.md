# 第一批动画组件 / Batch 01

3 组组件，6 条 10 秒双内容测试。用户已认可第一批方向，仍不代表任意文章都能自动编排或成片审美必然通过。

## 看小样

[在线对照页](https://ninglinliu.github.io/script-to-video-skill/examples/batch-01/) · [六条 MP4](out/) · [来源与改动](provenance.json)

## 独立运行

需要 Node.js 22+、npm；技术验证另需 Python 3.11+、FFmpeg/ffprobe、Pillow。浏览页自检另需 Playwright。

```sh
cd examples/batch-01
npm ci
npm run check
npm run stills
npm run render
python validate.py
python -m http.server 8000 --bind 127.0.0.1
```

浏览器打开 http://127.0.0.1:8000/index.html。渲染器默认使用 Remotion 管理的 Chrome Headless Shell，可设置 `REMOTION_BROWSER` 指向自己的兼容浏览器。本仓库不包含 node_modules 或机器专用浏览器。

可只重渲一个示例：`node render.mjs videos tree-business`。
可选页面测试：安装 Playwright 与其 Chromium 后运行 `python check_viewer.py`，或使用 `REMOTION_BROWSER` 指定浏览器。

## 改内容

`src/catalog.ts` 保存六套输入；`src/Demo.tsx` 组织镜头。`src/upstream/` 来自 weilanx 的 MIT 代码，`src/local/redshift/` 来自制作方之前的 rtiaho 研究，不冒充 GitHub 上游。两套输入共享动画逻辑，但当前没有任意文章自动选择组件的完整调度器。

`out/` 是实际渲染的 1080×1920、30 fps、无音轨 MP4。`qa/` 包含最终编码抽帧、连续帧和检查记录。

## 授权与边界

上游代码保留 `licenses/weilanx-MIT.txt`。字体及其许可在 `public/fonts/`；第三方素材许可优先于仓库主许可证。Remotion 运行时采用其自身许可证，使用者应按适用条款使用。

四个原参考仅保留作者、链接与时间码，不分发原片、截图或配乐。
本批为组件方向测试，未提供配音与原生剪映工程。剪映分轨导入、修改、保存重开和原生导出仍未验证；动画内部可编辑源为 Remotion，不是剪映原生矢量层。
