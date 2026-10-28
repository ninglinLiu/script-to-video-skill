# Poisson cinema — executable adaptation branch

Start with [the production guide](../../references/poisson-cinema.md). The seven parameterized recipes use the existing film's drawing system, environmental plate and observer. They do not generate a new illustration set on each run.

- `runtime/`: portable Canvas renderer and actual animated shot recipes; requires the fonts copied by `scripts/cinema.py init`.
- `fixtures/`: two distinct data configurations with deliberately synthetic timing, for software tests only. Not real narration, factual research, or aesthetic approval.
- `reference-source/`: all nine original scenes, shared drawing library, original visual timing and a silent frame entrypoint. Copied into the episode as `工程/original/`; `node render.mjs baseline` renders nine reference frames using the bundled assets. Audio, source-machine paths and playback UI are removed.
- `provenance.json`: origin and excluded material. Original soundtrack and supplied reference MP4s are not included.

Code is covered by the repository MIT license. The two bitmap assets were generated for the original production and are supplied as reusable project assets. Noto fonts retain their OFL license and are copied from the existing chapter font bundle during initialization. No proprietary system font is redistributed.

The selected historical film is already available in the [silent gallery](../../examples/gallery/original-poisson-full.html). A working engine is not proof of stable cross-article quality; independent model testing remains necessary.
