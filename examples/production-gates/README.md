# 素材装配与剪辑门槛实测

[在线查看三条静音样片](https://ninglinliu.github.io/script-to-video-skill/examples/production-gates/)。三条均为12秒真实编码，覆盖两种画幅和两种剪辑方式；不是文章成片的审美基准。

## 复现

在仓库根目录，任选一个空目录：

```sh
python scripts/production.py init --episode ./episodes/blackgold --kit blackgold --aspect portrait
python scripts/production.py init --episode ./episodes/gilded --kit gilded --aspect landscape
python scripts/production.py init --episode ./episodes/pixel --kit pixel --aspect portrait --edit evidence-cut
```

进入任一工程的 `工程/`：

```sh
npm ci
npm run check
node render.mjs proof
```

需要 Python 3.11+、Node.js、Chrome/Remotion浏览器、FFmpeg/ffprobe。可用 `PYTHON`、`REMOTION_BROWSER` 指定已有解释器和浏览器。初次依赖安装需要网络；初始化与检查使用仓库已有素材。参考运行环境见[操作指南](../../references/executable-production.md)。

实际查看 `qa/motion-proof.mp4`，填写 `qa/motion-review.json`，随后：

```sh
python ../tools/production.py check --episode .. --stage render
node render.mjs final
```

未填写真实动态观察时，第二条命令在开始全片渲染前退出。不能复制本目录的观察记录为新文章背书。

## 检查证据

- [validation.json](validation.json)：尺寸、时长、媒体哈希、逐帧采样数、检查状态及验证范围。
- `evidence/`：三套编码片的采样记录、动态观察与检查结果。没有把动态观察自动判成用户认可。
- 单元回归：在仓库根目录运行 `python -m unittest discover -s tests -v`。媒体进程在单元夹具中被模拟；这里的三条MP4另做真实编码、解码和画面检查，两种证据不混用。

实际安装和渲染发现并修复了两个问题：像素组件的间接依赖需要锁定 `@remotion/google-fonts`；DOM采样必须等到真实画布完成布局，不能记录首帧的空尺寸。Windows临时编码文件使用工程内 `.tmp`。

这轮覆盖素材引用、共享数值、局部运动和检查阻断；没有完成新文章、真实配音重测、整片观感或跨模型稳定性验证。DeepSeek的新片属于下一次独立测试。
