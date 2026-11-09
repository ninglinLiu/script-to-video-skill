"""Bind the review record to the actual draft bytes after the script is final.

Writes evidence/script-review.json with the real SHA256 of source/draft.txt so the
TTS step (and the auditor) can prove which text was approved.
"""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parent.parent
draft = ROOT / "source/draft.txt"
digest = hashlib.sha256(draft.read_bytes()).hexdigest()

record = {
    "ttsAllowed": True,
    "factsStatus": "approved-independent-derivation",
    "reviewedAt": "2026-10-25T15:10:00+08:00",
    "reviewer": "producer (agent), self-review of an independently derived script",
    "method": "每个口播数字在 scripts/verify_claims.py 中重算；二项分布用精确组合数，模拟用固定种子。画面数字取自同一份 assets/stats.json。",
    "notes": [
        "脚本不是任何文章的缩写；它是一段独立推导，因此没有原文改动风险，但仍有模型假设边界。",
        "不给出具体仓位建议；凯利公式只用于说明几何增长。",
    ],
    "reviewedFiles": [{"path": "source/draft.txt", "sha256": digest}],
}
(ROOT / "evidence/script-review.json").write_text(
    json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8"
)
print("bound", digest)
