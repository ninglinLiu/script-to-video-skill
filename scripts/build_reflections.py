"""Build a silent, local static viewer from the existing reflection records. No media copies."""
from pathlib import Path
import html
import json

ROOT = Path(__file__).resolve().parents[1]


def build():
    records = json.loads((ROOT / 'references/experience/reflections.json').read_text('utf-8'))['cases']
    esc = html.escape
    sections = []
    for case in records:
        links = ' · '.join(f'<a href="../../{esc(p)}">{esc(Path(p).name)}</a>' for p in case['evidence'])
        media = ''
        if case.get('media'):
            poster = f' poster="../../{esc(case["poster"])}"' if case.get('poster') else ''
            media = f'<video controls muted playsinline preload="none"{poster} src="../../{esc(case["media"])}" aria-label="{esc(case["title"])}：静音"></video>'
            media += '<div class="spans">' + ''.join(f'<button data-start="{s["start"]}" data-end="{s["end"]}">静音看 {s["start"]:g}–{s["end"]:g}s</button>' for s in case['spans']) + '</div>'
        else:
            media = '<p class="absent">本库未捆绑本例原片。下列是标明来源范围的历史记录，不是本轮新观片结论。</p>'
        strip = ROOT / 'examples/reflections' / f'{case["id"]}-sequence.jpg'
        if strip.exists():
            media += f'<a href="{strip.name}"><img class="sequence" loading="lazy" src="{strip.name}" alt="{esc(case["title"])}局部编码帧序列，完整运动请播放视频"></a>'
        observations = ''.join(f'<li>{esc(x)}</li>' for x in case['observations'])
        spans = ''.join(f'<li><b>{s["start"]:g}–{s["end"]:g}s：</b>{esc(s["look_for"])}</li>' for s in case['spans'])
        status = '用户否决' if case['status'] == 'user-rejected' else '方向保留 · 局部不足'
        sections.append(f'''<section id="{case['id']}"><div class="eyebrow">{case['id']} · {status}</div><h2>{esc(case['title'])}</h2>
<p class="feedback">{esc(case['feedback'])}</p><div class="case-grid"><div>{media}</div><div>
<h3>具体问题</h3><ul>{observations}</ul><p class="scope">观察范围：{esc(case['observation_scope'])}</p>
<h3>为什么会失败</h3><p>{esc(case['failed_strategy'])}</p><h3>下一次如何取舍</h3><p>{esc(case['decision'])}</p>
<p><b>保留：</b>{esc('；'.join(case['preserve']))}</p><p><b>重测：</b>{esc(case['retest'])}</p>
<details><summary>时间段、来源与Agent入口</summary><ul>{spans}</ul><p>{links}</p><code>python scripts/experience.py reflection {case['id']}</code></details>
</div></div></section>''')
    nav = ''.join(f'<a href="#{x["id"]}">{x["id"]} {esc(x["title"])}</a>' for x in records)
    page = '''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>反思资产 · 从失败里保留判断</title><style>
*{box-sizing:border-box}body{margin:0;background:#eeeae1;color:#192d35;font:16px/1.8 system-ui,'Microsoft Yahei',sans-serif}main{max-width:1240px;margin:auto;padding:40px 28px}h1{font-size:clamp(30px,5vw,64px);line-height:1.15;letter-spacing:-.04em}h2{font-size:28px;line-height:1.3}h3{font-size:17px;margin-bottom:6px}a{color:#126873;text-underline-offset:4px}header{border-bottom:3px solid #192d35;padding-bottom:26px}header p{max-width:850px}.eyebrow{font-size:13px;letter-spacing:.09em;color:#a14429;font-weight:700}nav{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}nav a{background:#fff9;padding:6px 12px;text-decoration:none;font-size:13px}section{padding:44px 0;border-bottom:1px solid #bec4c0;scroll-margin-top:12px}.case-grid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:32px}video{display:block;width:100%;max-height:590px;background:#172025;border-radius:4px}button{padding:8px 12px;border:1px solid #718683;background:transparent;color:inherit;cursor:pointer}.spans{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.feedback{font-size:18px;border-left:4px solid #b75531;padding-left:16px;max-width:1000px}.scope,.absent{font-size:14px;color:#5f7071}ul{padding-left:22px}code{font-size:13px;overflow-wrap:anywhere}details{border-top:1px solid #bbb;padding-top:12px}.sequence{width:100%;margin-top:18px}footer{font-size:14px;margin:30px 0;color:#637271}@media(max-width:760px){main{padding:24px 16px}.case-grid{grid-template-columns:1fr}h2{font-size:24px}}
</style></head><body><main><header><div class="eyebrow">SCRIPT TO VIDEO / REFLECTIONS / 2026.10.29</div><h1>保留失败，<br>让下一次少走错路。</h1><p>两条主体动画失败案例，以及五条相关复测与复盘。这里记录哪些做法不够、哪些素材还能用、下一次要看什么证据。技术通过与用户认可分别保留。</p><p><a href="../../docs/architecture.md">架构与开源方案对照</a> · <a href="../../docs/repository-tree.md">文件树与体积</a> · <a href="../../references/experience/reflections.md">Agent读取入口</a> · <a href="../gallery/index.html">已有展厅</a></p><nav>''' + nav + '</nav></header>' + ''.join(sections) + '''<footer>视频复用既有文件，默认暂停且静音。帧序列只用于定位，不能替代连续运动。没有上传任何仅本地参考，也没有制作新影片。</footer></main><script>
for(const section of document.querySelectorAll('section')){
 const video=section.querySelector('video');if(!video)continue;
 video.muted=true;video.volume=0;let stop=null;
 video.addEventListener('volumechange',()=>{if(!video.muted)video.muted=true;if(video.volume!==0)video.volume=0});
 video.addEventListener('timeupdate',()=>{if(stop!==null&&video.currentTime>=stop){video.pause();stop=null}});
 for(const b of section.querySelectorAll('button[data-start]'))b.addEventListener('click',()=>{
  for(const other of document.querySelectorAll('video'))if(other!==video)other.pause();
  const play=()=>{stop=Number(b.dataset.end);video.currentTime=Number(b.dataset.start);video.muted=true;video.play().catch(()=>{})};
  if(video.readyState>=1)play();else{video.addEventListener('loadedmetadata',play,{once:true});video.load()}
 });
}
</script></body></html>'''
    dest = ROOT / 'examples/reflections/index.html'
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(page, encoding='utf-8')
    print(dest)


if __name__ == '__main__':
    build()
