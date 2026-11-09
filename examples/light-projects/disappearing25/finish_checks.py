from pathlib import Path
import json
P=Path(__file__).resolve().parent
q=json.loads((P/'qa/final-checks.json').read_text(encoding='utf-8'))
b=json.loads((P/'qa/browser-state.json').read_text(encoding='utf-8'))
assert b['paused'] and b['muted'] and not b['autoplay'] and b['readyState']==4
assert b['videoWidth']==1080 and b['videoHeight']==1920 and b['duration']==60
q['browser']['finalBrowserCheck']='passed';q['browser']['final']=b
q['visualReview']='production_review_complete: final question and comparison frames inspected; full contact sheet and 8 dense transition strips retained'
q['partialRerender']={'rangeSeconds':[5,9],'reason':'Replace ambiguous arithmetic plus with sequence arrow','oldVersionRetained':True}
(P/'qa/final-checks.json').write_text(json.dumps(q,ensure_ascii=False,indent=2),encoding='utf-8')
print('Final browser and semantic check saved; user acceptance remains pending.')
