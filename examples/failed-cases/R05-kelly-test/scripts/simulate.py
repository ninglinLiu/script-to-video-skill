"""Evidence generator for the 60s piece: every number on screen comes from here.

Game: each round wealth is multiplied by 1.5 (heads, p=.5) or 0.5 (tails, p=.5).
Deterministic seed so the chart, the spoken numbers and the audit record agree.
No network, no audio.
"""
from pathlib import Path
import hashlib
import json
import math

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
ROUNDS = 100
PATHS = 10000
SEED = 20261025
UP, DOWN = 1.5, 0.5
P = 0.5

rng = np.random.default_rng(SEED)
draws = rng.random((PATHS, ROUNDS)) < P
steps = np.where(draws, UP, DOWN)
wealth = np.cumprod(steps, axis=1)
wealth = np.hstack([np.ones((PATHS, 1)), wealth])  # round 0 = 1.0

final = wealth[:, -1]
# Binomial ground truth for the same question (no simulation error).
# W(n) = 1.5**k * .5**(n-k);  W>1 pairs with k above the closed-form threshold.
def prob_w_gt_one(n):
    """P(1.5**k * .5**(n-k) > 1) for k ~ Bin(n,.5)."""
    need = n * math.log(2) / math.log(3)  # k > n*ln2/ln3
    return sum(math.comb(n, k) for k in range(math.ceil(need + 1e-12), n + 1)) / 2 ** n

p_win = prob_w_gt_one(ROUNDS)
geo = math.sqrt(UP * DOWN)
per_round = geo - 1.0
w50 = 0.75 ** 50
n_for_one = 1.0 / w50

stats = {
    "game": {"up": UP, "down": DOWN, "p": P, "rounds": ROUNDS, "paths": PATHS, "seed": SEED},
    "arithmeticMean": (UP + DOWN) / 2,
    "arithmeticMeanAfterRounds": ((UP + DOWN) / 2) ** ROUNDS,
    "geometricMeanPerRound": geo,
    "geometricPerRoundPct": per_round * 100,
    "onePair": UP * DOWN,
    "onePairDrawdownPct": (1 - UP * DOWN) * 100,
    "after100": w50,
    "after100Label": f"{w50:.2e}",
    "unitsForOneYuan": n_for_one,
    "probAboveStart": p_win,
    "probBelowStart": 1 - p_win,
    "sim": {
        "finalMedian": float(np.median(final)),
        "finalMean": float(final.mean()),
        "shareAboveStart": float((final > 1).mean()),
        "shareBelowStart": float((final < 1).mean()),
        "maxFinal": float(final.max()),
    },
}
assert abs(((UP + DOWN) / 2) ** ROUNDS - 1.0) < 1e-12, "the expectation is exactly 1 by arithmetic"
assert abs(stats["sim"]["finalMedian"] - w50) / w50 < 0.05, "median must match 0.75**50"
assert abs(stats["sim"]["shareAboveStart"] - p_win) < 0.01, "sim and binomial must agree"

# Curve data for the chart: log10 wealth over time.
log10 = np.log10(wealth)
q = {k: np.percentile(log10, v, axis=0) for k, v in {"p10": 10, "p25": 25, "p50": 50, "p75": 75, "p90": 90}.items()}
curve = {
    "rounds": list(range(ROUNDS + 1)),
    "median": [round(float(x), 4) for x in q["p50"]],
    "medianTheory": [round(n * (math.log10(UP) + math.log10(DOWN)) / 2, 4) for n in range(ROUNDS + 1)],
    "p10": [round(float(x), 4) for x in q["p10"]],
    "p25": [round(float(x), 4) for x in q["p25"]],
    "p75": [round(float(x), 4) for x in q["p75"]],
    "p90": [round(float(x), 4) for x in q["p90"]],
    "mean": [round(float(x), 4) for x in np.log10(np.maximum(wealth.mean(axis=0), 1e-12))],
    "samples": [
        [round(float(x), 3) for x in log10[i][::2]]
        for i in rng.choice(PATHS, 40, replace=False).tolist()
    ],
    "sampleStep": 2,
}
hist, edges = np.histogram(log10[:, -1], bins=48, range=(-7.5, 7.5))
histogram = {"counts": [int(x) for x in hist], "edges": [round(float(x), 3) for x in edges]}

stats["curve"] = curve
stats["histogram"] = histogram
stats["simScriptSha256"] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()

for dest in [ROOT / "assets/stats.json", ROOT / "工程/public/data/stats.json"]:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")

print(json.dumps({k: v for k, v in stats.items() if k not in ("curve", "histogram")}, ensure_ascii=False, indent=2))
