from pathlib import Path
import json
P=Path(__file__).resolve().parent
tech=json.loads((P/'qa/technical-checks.json').read_text(encoding='utf-8'))
times=json.loads((P/'qa/still-times.json').read_text(encoding='utf-8'))
sha=next(v['sha256'] for v in tech['outputs'] if v['file']=='final-with-audio.mp4')
issues=[
 {'time':'17.04 / 32.35 / 142.62','observed':'Initial numeric list exceeded caption width; first repair produced isolated 1–2 character rows','fix':'Shared balanced layout: 6–18 characters per multiline row, max 3 rows; re-render only caption band','verified':'All 52 groups checked for text preservation and line limits, final frame review'},
 {'time':'25.89','observed':'Three-down label overlapped total-return label during handoff','fix':'Separated outgoing and incoming opacity windows','verified':'Final contact and 12-frame handoff strip'},
 {'time':'26.66–36.66','observed':'Chart held unchanged through explanation of evaluation window','fix':'Observation rectangle moves across same path then expands; account result remains +8%','verified':'13-second continuous proof and final contact'},
 {'time':'58.96','observed':'Adjacent dials/boxes touched; connection line crossed secondary label','fix':'Increase initial controller spacing, move connector start below label','verified':'Actual repaired still and final contact'},
 {'time':'106.56','observed':'Exponent separated too far from cost factor','fix':'Use one SVG text with true superscript tspan','verified':'Final 10000×0.998^20, 9607.51, fee392.49'},
 {'time':'169–171','observed':'Evidence originally crossed a static barrier','fix':'Gate opens before evidence moves and closes afterward','verified':'Final gate sequence'},
 {'time':'whole output','observed':'Previous workflow had no minimum video bitrate enforcement','fix':'8.5 Mbps CBR master; verify actual stream bitrate≥8Mbps','verified':'ffprobe and task-aware audit'}
]
review=dict(status='reviewed_with_fixes',reviewedFinalSha256=sha,reviewer='Production agent; independent fact review and assisted mechanism-layout review; not independent full-film aesthetic acceptance',framesReviewed=times,continuousProof='qa/proof-window.mp4,13 seconds',sequenceChecks=['result-handoff-12.jpg','cost-debit-12.jpg','world-transition-12.jpg','evidence-gate-12.jpg'],issues=issues,remainingLimits=['No speaker playback or manual listening','No verified native editing-app project','No verified full text of originating WeChat title; independent research content','No user aesthetic approval claimed'],userAestheticAcceptance='pending',universalPipelineValidated=False)
(P/'qa/production-review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2),encoding='utf-8')
print('Final review recorded with current MP4 hash')
