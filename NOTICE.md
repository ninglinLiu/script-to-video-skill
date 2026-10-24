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

## References, not bundled media

- https://github.com/Azure12355/weilanx-claude-videos — Remotion production, audio/font organization and the attributed batch-01 components.
- https://github.com/Kianzzz/xilo-opus-video — object state descriptions, continuous proofs and frame review.
- https://www.douyin.com/video/7697146047227694975 — rtiaho edit reference; original reference audio/video not bundled.
- https://v.douyin.com/vX87XYIgSnc/ — user-selected VibeVerse《15亿次心跳》music reference; original audio/video not bundled.

Reference media and music without an established redistribution license remain local. Public examples include links, provenance and an import/mix command. Sensitive references, credentials, original article caches and complete papers are excluded. Remotion and other runtime dependencies retain their respective licenses.

## 视觉资产扩展（2026-10-24）

`assets/weilanx/upstream/` 是 Azure12355/weilanx-claude-videos 固定提交的未改动已跟踪文件快照；MIT许可全文随包保留，字体仍适用各自OFL。包含13个制作展示、35个艺术场景、9类解说语法、预览与源码。详细版本和逐文件哈希见 `assets/weilanx/provenance.json`。这些上游预览不冒充本仓库作者的独立作品。

`assets/weilanx/canvas/` 的引擎库来自 alchaincyf/huashu-art-motion（MIT），字体OFL。35个场景来自上面的weilanx快照；`index.html`是本仓库的单场景选择适配。两级来源和许可均保留。

`examples/gallery/` 展示我们的历史渲染和整理后的旧HTML，网页副本无音轨。原文章内容、有限研究引文、品牌及第三方名称不因本仓库MIT而改换权属。公众号内容来源、原创算例和研究改编范围以各页说明为准；该归档不是投资建议或当前行情信息。第三方参考原视频、原音轨与未公开实拍不在本次素材包中。
