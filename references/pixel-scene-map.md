# 完整像素街区：可执行分支

> **2026-10-29：用户已否决本版：动画不流畅，主要仍是背景图推拉、字幕/纸卡叠加和人物贴纸位移；不作为已验证的成片路线。**

用户明确选 LifeOS 的完整场景与地图剪辑时使用。入口携带六个街区场景、人物/前景/钟表/账本透明层、成熟 Canvas 时间引擎和真实旁白；不再从小像素人物 kit 起片。当前是固定街区的叙事语法，换成别的城市、室外活动或大幅改变人物，仍需补相应资产。

## 直接复现

在 Skill 仓库根运行（Python 3.11+、Node 20+、Chrome 或 Chromium、FFmpeg/ffprobe）：

```sh
python scripts/pixel_scene.py prepare --episode episodes/my-pixel
python -m pip install -r episodes/my-pixel/requirements.txt
cd episodes/my-pixel/工程
npm ci --ignore-scripts
cd ../../..
python scripts/pixel_scene.py render --episode episodes/my-pixel --film caesar --format original --master
python scripts/pixel_scene.py render --episode episodes/my-pixel --film caesar --format portrait
python scripts/pixel_inspect.py --episode episodes/my-pixel --film caesar --format original
python scripts/pixel_inspect.py --episode episodes/my-pixel --film caesar --format portrait
```

Windows 可用 `py -3.11` 替代 `python`；找不到 Chrome 时设置 `CHROME_PATH` 为本机可执行文件。`FFMPEG` 可覆盖 Node 编码器路径；Python 命令要求 ffmpeg/ffprobe 在 PATH。不要依赖制作者的绝对路径或外部 node_modules。浏览器配置和临时文件放在工程 `.tmp`；预览无声音，渲染不播放配音。

默认每 12 秒独立渲染，保存帧数及内容哈希，再合并。重复命令复用经过哈希检查的成功段；只改某镜配置时，其他段按其实际镜头/字幕依赖复用。`--start 60 --end 72` 输出带 clip 后缀的独立片段，不覆盖整片；不能拿片段检查宣布整片通过。`--master` 的 3:4 文件输出2160×2880，内部画布1080×1440，像素场景按540宽的美术网格采样；不宣传成原生4K细节。9:16是1080×1920，另用竖屏相机、人物位置、双账单上下布局与字幕区域。

工程离开本仓库后，`tools/pixel_scene.py render --episode . ...` 仍可调用同一生产入口；`工程/` 内的 npm 锁文件、字体与资产全在本地。`prepare` 仅在完整 Skill 安装中使用。

## 新内容从哪里改

`source/caesar.json` 和 `source/second-content.json` 是实际执行配置。已固定的凯撒比较稿不自动改动。新文章复制一个配置并选择现有场景与动作：

- `timelineFile` 指向真实配音时间线；也可内嵌 `timeline.cues` 做明确标为静音的编辑样片。没有真实语音词界就不填写旁白字段。`audio` 是独立音轨的项目相对路径。
- `shots` 每项有稳定 `id`、`dur`、`type`；场景项指定 `plate`、`camera` 与 `cameraPortrait`。相机是起/终两个 `[焦点x,焦点y,缩放]`，焦点为图像归一化坐标。
- 现有 `action` 包括双账单、推开过去、单人历史价签、回本基数、研究档案、翻面、证据、钟表期限、风险堆叠、账本用途、差异选择。`lines/label/value/owner/note` 是实际上屏数据，不是提示文字。专用回本动作当前对应100→60算例，改数值须同时改算式绑定和证据，不能把任意标签当正确计算。
- `actors` 指定人物身份、地面落点、高度和走动起止；`portrait` 覆盖其竖屏布局。透明人物图并不提供完整骨骼绑定，当前使用独立姿态、位置和轻微呼吸动作。
- 地图的 `map/mapPortrait` 指定相机 `[世界x,世界y,缩放,旋转弧度]` 起终值。`nodes`、`route` 同在世界坐标；路线按 `routeStart/routeEnd` 生长。地图是有标识的原创概念街区，不冒充真实地理。
- 字幕从当前 cue 直接绘制。`pixel_inspect.py` 比较编码帧与同帧“开/关字幕”参考，并检查每帧字幕trace；SRT存在不是替代。

第二内容配置以“朋友没回复”解释多种可能，复用同一资产和运行时。它是制作者完成的配置迁移测试，不能记作 DeepSeek 或其他 Agent 的独立验收。

```sh
python scripts/pixel_scene.py render --episode episodes/my-pixel --film second-content --format original
python scripts/pixel_scene.py render --episode episodes/my-pixel --film second-content --format portrait
python scripts/pixel_inspect.py --episode episodes/my-pixel --film second-content --format original
```

第二配置24秒、6镜，是明确标为静音的编辑验证。若扩成配音新片，必须新建真实旁白时间线并重新调整时长，不能把此配置的编辑时间冒充语音测量。

## 先对照，再扩展

三个独立配置 `proof-l1/l2/l3` 对应8秒、6.5秒、5秒。原参考切点分别为0.433/6.667、5.333、0.167/4.333秒；配置采用相应时间结构。原片与截帧只放 `local-only`，不在公开资产包；复现片是原创场景。

先比较主体尺度、暖光/冷影、地图焦点和连续切点。整片需要检查开头、中段、结尾，尤其纸卡是否重新遮住场景、角色是否落在水面、地图标记是否跑出画面、竖屏字幕是否挡动作。检查通过仅说明未发现对应技术缺陷，不等于与参考达到1:1或用户认可。

## 资产边界

`assets/pixel-scene-map/provenance.json` 给出逐文件哈希和生成来源。六张建筑背景是完整平面插画；人物、前景枝叶/灯柱、钟表/账本是独立透明图层；地图/水面遮罩/纸张/字层为代码图层。没有把背景伪称为每栋楼均可拆开的PSD。生成图使用内置图像工具，外部参考视频及截帧没有发送给该工具。

引擎来自仓库已整理的 `assets/weilanx/canvas`，其上游是 `alchaincyf/huashu-art-motion`，MIT全文在 `runtime/vendor/LICENSE-huashu.txt`；中文字体OFL随包。参考原片的权利不随本分支转移。
