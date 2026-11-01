# 由 audio/timeline.json 生成 SRT；分行规则与 web/scene.js 字幕一致（按真实词界找每行起点）
import json, re, sys
from pathlib import Path

E = Path(sys.argv[1]); tl = json.loads((E / 'audio/timeline.json').read_text(encoding='utf-8'))
clean = lambda s: re.sub(r'[，。、,.!！?？\s]', '', s)
subs = []
for c in tl['cues']:
    wl = [len(clean(w['w'])) for w in c['words']]; starts = []; acc = wi = cum = 0
    for line in c['sub']:
        while wi < len(c['words']) and cum < acc:
            cum += wl[wi]; wi += 1
        starts.append(c['words'][wi]['t'] if wi < len(c['words']) else c['end']); acc += len(clean(line))
    for i, line in enumerate(c['sub']):
        subs.append((c['start'] if i == 0 else starts[i], c['end'] + .15 if i == len(c['sub']) - 1 else starts[i + 1], line))
ts = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round(x % 1 * 1000)) % 1000:03d}"
out = E / 'out' / 'subtitles.srt'; out.parent.mkdir(exist_ok=True)
out.write_text(''.join(f'{i}\n{ts(a)} --> {ts(b)}\n{t}\n\n' for i, (a, b, t) in enumerate(subs, 1)), encoding='utf-8')
print(out, len(subs), 'lines')
