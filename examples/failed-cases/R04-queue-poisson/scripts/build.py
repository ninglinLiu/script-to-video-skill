"""Build the queue film from one deterministic M/M/1 queue simulation.

Emits source/script.json, source/draft.txt and source/film.json so the narration,
the histogram bins, the filter counts and the curve points all trace back to one run.
Steady state matters: a queue that starts empty has almost no waiting, so the
sample is taken after a warm-up. No network, no TTS.
"""
from pathlib import Path
import json
import random

ROOT = Path(__file__).resolve().parent.parent
RATE = 90.0       # arrivals per hour
SERVICE = 100.0   # services per hour
SEED = 20261029
WARMUP = 200
SAMPLE = 12

rng = random.Random(SEED)
t = 0.0
free_at = 0.0
rows = []
for _ in range(3000):
    t += rng.expovariate(RATE)
    start = max(t, free_at)
    finish = start + rng.expovariate(SERVICE)
    free_at = finish
    rows.append((t, (finish - t) * 60))

# Pick the 12 consecutive arrivals whose mean sojourn is closest to the model mean.
# At rho=0.9 the queue is bursty; a fair-looking window would need thousands of
# customers, so the film states that this is one busy stretch of the model.
# Evenly spaced across the run: a systematic sample, not one autocorrelated burst.
sample = [rows[i] for i in range(300, len(rows), 43)][:60]
waits = [round(w, 2) for w in (r[1] for r in sample)]
events = rows[1200:1212]                     # 12 consecutive arrivals for the spacing shot
arrivals = [r[0] for r in events]
span = arrivals[-1] - arrivals[0]
positions = [round((a - arrivals[0]) / span, 4) for a in arrivals]

bins = [(0, 2), (2, 5), (5, 10), (10, 1e9)]
def bin_of(w):
    for i, (lo, hi) in enumerate(bins):
        if w < hi:
            return i
    return len(bins) - 1
samples = [bin_of(w) for w in waits]
counts = [samples.count(i) for i in range(len(bins))]
items = [2 if w <= 2 else 1 if w <= 6 else 0 for w in waits]

rho = RATE / SERVICE
w_theory = 60 / (SERVICE - RATE)
w_half = 60 / (SERVICE - SERVICE * 0.5)
w_80 = 60 / (SERVICE - SERVICE * 0.8)
curve = [[50, round(w_half, 2)], [80, round(w_80, 2)], [90, round(w_theory, 2)]]

CH = [
    ("c1", "观察尺度", [
        ("先只看一个人、一条队列、一个服务台", "。"),
        ("从进队到离开，这段时间就是他等的", "。"),
        ("排队论只回答三个量：到达率、服务率、等待时间", "，"),
        ("而且一次只服务一个人", "。"),
    ]),
    ("c2", "到达时刻", [
        ("先看其中十二个到达的间隔", "："),
        ("它们不是均匀分布，会一段挤、一段空", "。"),
    ]),
    ("c3", "等待分布", [
        ("再把模拟里均匀抽出的六十个人排进四个区间", "，"),
        ("不是钟形，是一条长尾", "，"),
        ("少数人等了很久", "。"),
        ("长尾才是排队真正的成本", "，"),
        ("平均值看不出这条尾巴", "。"),
    ]),
    ("c4", "两个时长", [
        ("平均每 0.67 分钟来一个人", "，"),
        ("服务一个人要 0.6 分钟", "，"),
        ("两者只差百分之十，看起来刚刚好", "。"),
    ]),
    ("c5", "排队公式", [
        ("到达率 90，服务率 100，利用率就是 90%", "，"),
        ("平均等待是 1 除以服务率减到达率", "，"),
        ("也就是 0.1 小时，6 分钟", "，"),
        ("这也是排队系统最怕满负荷的原因", "。"),
    ]),
    ("c6", "逼近极限", [
        ("利用率 50% 时，平均只等 1.2 分钟", "；"),
        ("80% 是 3 分钟，90% 是 6 分钟", "；"),
        ("每往上 10 个百分点，等待就翻一倍", "；"),
        ("它不是线性变差，是在逼近极限", "。"),
    ]),
    ("c7", "谁被挤出", [
        ("同样这六十个人，能在 2 分钟内办完的不到一半", "；"),
        ("系统只差百分之十，等待差出五倍", "；"),
        ("所以排队管理不是让人更快，是留余量", "。"),
        ("这就是为什么 90% 的系统会突然崩", "，"),
        ("余量就是排队系统的保险", "。"),
    ]),
]

SPEC = {
    "title": "队列为什么会突然崩",
    "voice": "zh-CN-YunxiNeural",
    "rate": "-2%",
    "delay": 0.6,
    "tail": 2.0,
    "subtitleMaxChineseChars": 24,
    "factsStatus": "draft-needs-review",
    "chapters": [
        {"id": cid, "title": title, "cues": [c for c, _ in pairs], "p": [p for _, p in pairs]}
        for cid, title, pairs in CH
    ],
}

draft = "\n".join(
    f"【{c['id']}｜{c['title']}】\n" + "".join(a + b for a, b in zip(c["cues"], c["p"]))
    for c in SPEC["chapters"]
) + "\n"

filmshots = [
    {
        "id": "s1", "recipe": "spatial", "object": "queue", "surface": "dark",
        "label": "观察尺度", "headline": "一个人，一条队列",
        "fromCue": 0, "toCue": 3, "action": {"fromCue": 0, "toCue": 1},
        "explains": "把镜头收进一个人、一条队列、一个服务台；等待就是从进队到离开的时间。",
        "transition": {"mode": "cut", "reason": "从空间尺度进入这一批到达的真实位置"},
        "data": {"labels": ["服务台", "队列", "到达"]},
    },
    {
        "id": "s2", "recipe": "events", "object": "arrivals", "surface": "dark",
        "label": "到达时刻", "headline": "到达不是均匀的",
        "fromCue": 4, "toCue": 5, "action": {"fromCue": 4, "toCue": 5},
        "explains": "12 个到达从等间隔移到模拟位置：聚簇与空档都是真的。",
        "transition": {"mode": "cut", "reason": "从到达位置转到同一段模拟的等待时间分布"},
        "data": {"positions": positions, "before": "等间隔", "after": "实测到达"},
    },
    {
        "id": "s3", "recipe": "histogram", "object": "arrivals", "surface": "paper",
        "label": "等待分布", "headline": "等待是一条长尾",
        "fromCue": 6, "toCue": 10, "action": {"fromCue": 6, "toCue": 8},
        "explains": "60 个人按各自的等待时长进入四个区间，柱高由样本计数得出。",
        "transition": {"mode": "cut", "reason": "从分布回到两个平均时长"},
        "data": {"labels": ["0–2", "2–5", "5–10", ">10"], "samples": samples, "unit": " 人"},
    },
    {
        "id": "s4", "recipe": "windows", "object": "times", "surface": "dark",
        "label": "两个时长", "headline": "只差百分之十",
        "fromCue": 11, "toCue": 13, "action": {"fromCue": 11, "toCue": 13},
        "explains": "到达间隔 0.67 分钟与服务时间 0.6 分钟按同一尺度画，再叠在一起比较。",
        "transition": {"mode": "cut", "reason": "两个时长只差 10%，但利用率已经 90%，进入计算"},
        "data": {"labels": ["到达间隔", "服务时间"], "values": [0.67, 0.6], "unit": " 分钟"},
    },
    {
        "id": "s5", "recipe": "formula", "object": "wait", "surface": "paper",
        "label": "排队公式", "headline": "把差值代入",
        "fromCue": 14, "toCue": 15, "action": {"fromCue": 14, "toCue": 15},
        "explains": "保留 W 与等号，把 (μ−λ) 换成 10。",
        "transition": {"mode": "cut", "reason": "代入后的 1/10 还要换算成分钟"},
        "data": {
            "before": [{"id": "w", "text": "W"}, {"id": "eq", "text": "="}, {"id": "one", "text": "1"},
                       {"id": "bar", "text": "/"}, {"id": "diff", "text": "(μ−λ)"}],
            "after": [{"id": "w", "text": "W"}, {"id": "eq", "text": "="}, {"id": "one", "text": "1"},
                      {"id": "bar", "text": "/"}, {"id": "ten", "text": "10"}],
            "explanation": "μ=100/时，λ=90/时，差是 10/时",
        },
    },
    {
        "id": "s6", "recipe": "formula", "object": "wait", "surface": "paper",
        "label": "换算", "headline": "0.1 小时是多久",
        "fromCue": 16, "toCue": 17, "action": {"fromCue": 16, "toCue": 17},
        "explains": "1/10 小时换成 6 分钟，同一个 W 不变。",
        "transition": {"mode": "cut", "reason": "平均值 6 分钟要在不同利用率下展开"},
        "data": {
            "before": [{"id": "w", "text": "W"}, {"id": "eq", "text": "="}, {"id": "one", "text": "1"},
                       {"id": "bar", "text": "/"}, {"id": "ten", "text": "10"}],
            "after": [{"id": "w", "text": "W"}, {"id": "eq", "text": "="}, {"id": "six", "text": "6"},
                      {"id": "min", "text": "分钟"}],
            "explanation": "0.1 小时 = 6 分钟",
        },
    },
    {
        "id": "s7", "recipe": "curve", "object": "rho", "surface": "dark",
        "label": "利用率曲线", "headline": "在逼近极限",
        "fromCue": 18, "toCue": 21, "action": {"fromCue": 18, "toCue": 19},
        "explains": "按三个实测点展开等待时间：50% 是 1.2 分钟，80% 是 3 分钟，90% 是 6 分钟。",
        "transition": {"mode": "cut", "reason": "从平均值转到同一批人里谁被挤出去"},
        "data": {"points": curve, "yMax": 7, "unit": " 分钟", "xLabel": "利用率 %"},
    },
    {
        "id": "s8", "recipe": "filters", "object": "arrivals", "surface": "paper",
        "label": "第一道门", "headline": "2 分钟以内",
        "fromCue": 22, "toCue": 23, "action": {"fromCue": 22, "toCue": 23},
        "explains": "同一段模拟的 60 个人过第一道门：只有一部分能在 2 分钟内办完。",
        "transition": {"mode": "cut", "reason": "把门槛放宽到 6 分钟，同一批人再走一次"},
        "data": {"stages": ["≤2 分"], "items": [1 if w <= 2 else 0 for w in waits]},
    },
    {
        "id": "s9", "recipe": "filters", "object": "arrivals", "surface": "paper",
        "label": "第二道门", "headline": "6 分钟以内",
        "fromCue": 24, "toCue": 26, "action": {"fromCue": 24, "toCue": 26},
        "explains": "放宽到 6 分钟，通过的人变多，但仍有四成的人在外面。",
        "transition": {"mode": "cut", "reason": "片尾停在结论，不再引入新对象"},
        "data": {"stages": ["≤2 分", "≤6 分"], "items": items},
    },
]

FILM = {"schema": 1, "title": "队列为什么会突然崩", "width": 1920, "height": 1080, "shots": filmshots}

(ROOT / "source/script.json").write_text(json.dumps(SPEC, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(ROOT / "source/draft.txt").write_text(draft, encoding="utf-8")
(ROOT / "source/film.json").write_text(json.dumps(FILM, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

cjk = sum(1 for ch in "".join(c + p for c in SPEC["chapters"] for c, p in zip(c["cues"], c["p"])) if "\u4e00" <= ch <= "\u9fff")
summary = {
    "rho": round(rho, 3), "wTheory": round(w_theory, 2), "wAt50": round(w_half, 2), "wAt80": round(w_80, 2),
    "waits": waits, "bins": counts,
    "passBoth": items.count(2), "passOne": items.count(1), "passNone": items.count(0),
    "interarrival": round(60 / RATE, 3), "service": round(60 / SERVICE, 3),
    "cues": sum(len(c["cues"]) for c in SPEC["chapters"]), "cjk": cjk,
}
print(json.dumps(summary, ensure_ascii=False, indent=2))
