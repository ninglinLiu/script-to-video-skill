"""Single source of truth for the spoken script: emits source/draft.txt and source/script.json.

Every cue carries its own sentence punctuation in `p`, so the TTS text, the SRT and
the audited draft stay byte-identical.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent.parent

CHAPTERS = [
    ("c1", "抛一枚硬币", [
        ("抛一枚硬币", "："),
        ("正面钱乘1.5", "；"),
        ("反面乘0.5", "。"),
        ("这不是不赚不亏吗", "？"),
    ]),
    ("c2", "期望值", [
        ("各有一半机会", "，"),
        ("平均是1.5加0.5，再除以2", "，"),
        ("等于1", "。"),
        ("所以期望上不赚不亏", "。"),
    ]),
    ("c3", "乘法路径", [
        ("但钱是一轮一轮乘出来的", "。"),
        ("先乘1.5，再乘0.5", "，"),
        ("结果是0.75", "。"),
        ("一次涨一次跌，本金少四分之一", "。"),
    ]),
    ("c4", "一百轮", [
        ("走一百轮", "，"),
        ("0.75的五十次方", "，"),
        ("只剩百万分之零点五七", "。"),
        ("一百个人里，九十九个多亏钱", "，"),
        ("在起点之上的不到百分之零点四", "。"),
    ]),
    ("c5", "平均值", [
        ("可平均值仍然是1", "。"),
        ("它靠极少数人的天文数字撑着", "。"),
        ("模拟一万次，中位数掉六个数量级", "。"),
        ("平均值讲群体，不讲你", "。"),
    ]),
    ("c6", "几何平均", [
        ("要算自己的速度，得用几何平均", "。"),
        ("0.75开根号是0.866", "，"),
        ("每轮少百分之十三点四", "。"),
        ("先算几何平均，再决定押多少", "。"),
    ]),
]

SPEC = {
    "episode": "video-60s-kelly",
    "voice": "zh-CN-YunxiNeural",
    "rate": "-2%",
    "delay": 0.6,
    "tail": 2.0,
    "subtitleMaxChineseChars": 24,
    "factsStatus": "approved-independent-derivation",
    "chapters": [
        {"id": cid, "title": title, "cues": [c for c, _ in pairs], "p": [p for _, p in pairs]}
        for cid, title, pairs in CHAPTERS
    ],
}

draft_lines = []
for chapter in SPEC["chapters"]:
    body = "".join(c + p for c, p in zip(chapter["cues"], chapter["p"]))
    draft_lines.append(f"【{chapter['id']}｜{chapter['title']}】\n{body}")
draft = "\n".join(draft_lines) + "\n"

(ROOT / "source").mkdir(exist_ok=True)
(ROOT / "source/draft.txt").write_text(draft, encoding="utf-8")
(ROOT / "source/script.json").write_text(json.dumps(SPEC, ensure_ascii=False, indent=2), encoding="utf-8")

spoken = "".join(c + p for ch in SPEC["chapters"] for c, p in zip(ch["cues"], ch["p"]))
chinese = sum(1 for ch in spoken if "\u4e00" <= ch <= "\u9fff")
print(f"cues={sum(len(c['cues']) for c in SPEC['chapters'])} chinese_chars={chinese} est_seconds={chinese / 3.5:.1f}")
print(spoken)
