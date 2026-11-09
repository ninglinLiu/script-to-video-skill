# Sources, licenses and distribution

MIT applies to original workflow, scripts and original animation code. It does not replace third-party licenses or grant rights to referenced articles, music, voice services, videos or papers.

## Distributed materials

- `examples/batch-01/src/upstream/`: components adapted from Azure12355/weilanx-claude-videos; MIT notice retained in the batch's `licenses/` directory.
- `examples/batch-01/src/local/redshift/`: original local implementation inspired by motion references, not copied upstream code.
- Fonts in each example's `public/fonts/`: SIL OFL; license files accompany the fonts.
- `examples/chapter-01/工程/src/`: original chapter animation. `out/` and `native/` contain rendered original visuals, with the paper heading exception below.
- `examples/chapter-01/assets/voice.mp3` and `voice-track.wav`: synthetic narration of the authored script using Edge TTS. The voice model, runtime and service remain governed by their own terms; this repository does not license them.
- `examples/chapter-01/工程/public/paper-title.png`: limited title/author excerpt of Terrance Odean's 1998 paper *Are Investors Reluctant to Realize Their Losses?*, used to identify the evidence on screen. This third-party excerpt is not MIT. Source: https://faculty.haas.berkeley.edu/odean/papers%20current%20versions/areinvestorsreluctant.pdf . The complete paper is not distributed.
- `source/draft.txt`: independently authored adaptation using original hypothetical examples, informed by the user's supplied Caesar article. The full article is not distributed. See the example's source manifest and fact review.

## Reference sources and media scope

- https://github.com/Azure12355/weilanx-claude-videos — Remotion production, audio/font organization and the attributed batch-01 components.
- https://github.com/Kianzzz/xilo-opus-video — object state descriptions, continuous proofs and frame review.
- https://www.douyin.com/video/7697146047227694975 — rtiaho edit reference; selected silent study copies are in the dated catalog; original audio is not bundled.
- https://v.douyin.com/vX87XYIgSnc/ — user-selected VibeVerse《15亿次心跳》reference; a silent visual study copy is in the dated catalog; its music/audio is not bundled.

The dated visual study pack below is published at the user’s explicit request and contains third-party silent reference copies and stills. Their original authors retain all rights; publication here is not a claim of ownership or a grant of a production reuse license. Reference music/audio, sensitive references, credentials, original article caches and complete papers are excluded. Remotion and other runtime dependencies retain their respective licenses.

`examples/reference-study-20261029/` now provides 139 playable records: 35 reuse existing public video files and 104 add full-length silent study copies. `media-manifest.json` records provenance, source hashes, derivative hashes, sizes and dimensions. Eight selected excerpts preserve their source resolution and 30fps; consecutive frames and 28 illustrated observations are included. Full-length web derivatives may reduce resolution/bitrate and remove audio; they are not original downloads. Third-party reference copies/stills are outside the MIT license. `scripts/reference_study.py fetch` makes selected video/frame bundles available to another Agent without a manual local file picker. Observed reference behavior does not establish that a reproduction has been implemented or passed.

> 2026-11-01 更新：`examples/reference-study-20261029/` 已从当前版本移除（媒体仍存在于 Git 历史中）。上面对它的描述只作历史记录。

## 3D 微缩路线（2026-11-01）

`assets/diorama-kit/` 与 `examples/binance-1029/`、`examples/pareto-diorama/` 为原创代码和原创渲染，MIT。运行依赖 three.js（MIT）和 Playwright（Apache-2.0），不随仓库分发。旁白由 Edge TTS 合成。对标参考片（一页枝鸥、安迪的 AI 日记）只保存链接和文字观察，原片与截图不进仓库。币安样片的事实来源见其 `source/sources.md`。

## 配乐与凯撒样片（2026-11-02）

`examples/caesar-ai-bubble/media/` 的成片和预览混入了第三方音乐，音乐部分不适用 MIT，适用 CC BY 4.0，转发或发布时必须带这段署名：

```text
"Crypto" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0
https://creativecommons.org/licenses/by/4.0/
Music trimmed, loudness-normalized, faded and ducked beneath narration and sound effects.
```

授权依据是[作者站点 FAQ](https://incompetech.com/music/royalty-free/faq.html)，2026-11-02 核对。`assets/music/catalog.json` 只登记曲目信息和下载地址，音频文件不入库。这段署名说明的是音乐的来源和改动，不代表作者认可本片。

画面、场景代码和合成音效（`assets/diorama-kit/sfx.py`）为原创，MIT。旁白由 Edge TTS 合成。文稿的观点和结构改编自用户提供的【凯撒的复利实验室】文章《AI不是泡沫：OpenAI才是》，全文不入库，文字权属不因本仓库 MIT 改变。Blender 是运行工具，不随仓库分发。

`examples/failed-cases/` 和 `examples/light-projects/` 是本项目自己的历史工程，只收源码和记录（前者另有压缩静音预览）。文章全文没有入库；旁白稿和字幕是改编文字，观点和结构来自 CaesarX / 凯撒的复利实验室，文字权属不因本仓库 MIT 改变。部分工程复用了 Azure12355/weilanx-claude-videos（MIT，许可全文见 `assets/weilanx/upstream/`）的动画、主题和音频合成代码，各工程的记录写了具体文件。字体和第三方依赖没有入库，仍按各自许可。

## 代码模拟暗金排版与凯利样片（2026-11-09）

`assets/sim-kit/` 和 `examples/caesar-kelly/` 的代码、数据脚本和渲染画面为原创，MIT。字体用系统里的思源宋体 / Noto Serif SC 和 Cascadia Mono / Consolas，不随仓库分发。

版式、配色和节奏参照用户在本机提供的参考片《临界点：渗流理论》，只记录文字观察和测量值；参考片的原片、截图和音乐都不进仓库，作者权利不因本仓库 MIT 改变。

`examples/caesar-kelly/media/` 的成片混入了第三方音乐，音乐部分适用 CC BY 4.0，转发或发布时必须带署名：

```text
"Stay the Course" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0
https://creativecommons.org/licenses/by/4.0/
Music trimmed, loudness-normalized and faded.
```

观点改编自【凯撒的复利实验室】《两个同样勤奋的人，为何十年后差100倍？》，全文不入库；凯利公式的算例为制作方原创。真实实验数据引自 Haghani & Dewey (2016)，arXiv:1701.01427。

## 视觉资产扩展（2026-10-24）

`assets/weilanx/upstream/` 是 Azure12355/weilanx-claude-videos 固定提交的未改动已跟踪文件快照；MIT许可全文随包保留，字体仍适用各自OFL。包含13个制作展示、35个艺术场景、9类解说语法、预览与源码。详细版本和逐文件哈希见 `assets/weilanx/provenance.json`。这些上游预览不冒充本仓库作者的独立作品。

`assets/weilanx/canvas/` 的引擎库来自 alchaincyf/huashu-art-motion（MIT），字体OFL。35个场景来自上面的weilanx快照；`index.html`是本仓库的单场景选择适配。两级来源和许可均保留。

`examples/gallery/` 展示我们的历史渲染和整理后的旧HTML，网页副本无音轨。原文章内容、有限研究引文、品牌及第三方名称不因本仓库MIT而改换权属。公众号内容来源、原创算例和研究改编范围以各页说明为准；该归档不是投资建议或当前行情信息。第三方参考原视频、原音轨与未公开实拍不在本次素材包中。
