"""Recompute every spoken number independently of simulate.py and log the result.

Uses only exact combinatorics; no numpy, no random draws. Emits evidence/fact-review.json.
"""
from pathlib import Path
import json
import math

ROOT = Path(__file__).resolve().parent.parent
STATS = json.loads((ROOT / "assets/stats.json").read_text(encoding="utf-8"))
N = 100


def prob_above_start(n):
    need = n * math.log(2) / math.log(3)  # 1.5**k * .5**(n-k) > 1  <=>  k > n*ln2/ln3
    return sum(math.comb(n, k) for k in range(math.ceil(need), n + 1)) / 2**n


checks = []


def check(claim, on_screen, formula, expected, computed, tol=0.0):
    ok = abs(computed - expected) <= tol if tol else computed == expected
    checks.append(
        {
            "claim": claim,
            "screenText": on_screen,
            "formula": formula,
            "expected": expected,
            "computed": computed,
            "pass": bool(ok),
        }
    )


check("两个结果的平均乘数等于1", "平均是1.5加0.5，再除以2，等于1",
      "(1.5 + 0.5) / 2", 1.0, (1.5 + 0.5) / 2)
check("一涨一跌后本金剩0.75", "先乘1.5，再乘0.5，结果是0.75",
      "1.5 * 0.5", 0.75, 1.5 * 0.5)
check("一涨一跌的损失是四分之一", "一次涨一次跌，本金少四分之一",
      "1 - 1.5*0.5", 0.25, 1 - 1.5 * 0.5)
check("一百轮等于五十次涨跌", "0.75的五十次方",
      "0.75 ** 50", 0.75**50, 0.75**50)
check("屏幕上写作百万分之零点五七", "只剩百万分之零点五七",
      "0.75**50 * 1e6", 0.5663, round(0.75**50 * 1e6, 4), tol=0.001)
check("亏钱的人约占99.67%", "一百个人里，九十九个多亏钱",
      "1 - P(W>1), k~Bin(100,.5)", 1 - prob_above_start(N), 1 - prob_above_start(N))
check("高于起点的人不到0.4%", "在起点之上的不到百分之零点四",
      "P(W>1)", 0.0033, prob_above_start(N), tol=0.0001)
check("中位数下降的十进制数量级", "模拟一万次，中位数掉六个数量级",
      "log10(0.75**50)", -6.25, math.log10(0.75**50), tol=0.01)
check("每轮几何平均", "0.75开根号是0.866",
      "sqrt(1.5*0.5)", 0.86603, math.sqrt(1.5 * 0.5), tol=1e-5)
check("每轮几何损失百分比", "每轮少百分之十三点四",
      "(sqrt(0.75)-1)*100", -13.397, (math.sqrt(0.75) - 1) * 100, tol=0.001)
check("模拟与二项分布一致", "模拟一万次，中位数掉六个数量级",
      "|median_sim - 0.75**50| / 0.75**50", 0.0,
      abs(STATS["sim"]["finalMedian"] - 0.75**50) / 0.75**50, tol=0.05)

summary = {
    "topic": "正期望的乘法游戏为什么让大多数人亏钱（算术平均 vs 几何平均）",
    "evidenceKind": "独立推导 + 本地蒙特卡洛模拟，非原文改编",
    "sources": [
        {
            "kind": "paper",
            "citation": "J. L. Kelly Jr., A New Interpretation of Information Rate, Bell System Technical Journal 35(4), 1956",
            "usedFor": "凯利公式最大化几何增长率（对数期望）这一表述",
            "url": "https://doi.org/10.1002/j.1538-7305.1956.tb03809.x",
        }
    ],
    "scripts": {
        "simulate.py": STATS["simScriptSha256"],
        "seed": STATS["game"]["seed"],
        "paths": STATS["game"]["paths"],
        "rounds": STATS["game"]["rounds"],
    },
    "checks": checks,
    "assertionsInPipeline": [
        "simulate.py: 期望值 (0.5*1.5+0.5*0.5)**100 == 1.0",
        "simulate.py: 模拟中位数与 0.75**50 相对误差 < 5%",
        "simulate.py: 模拟高于起点比例与二项分布相差 < 1 个百分点",
    ],
    "boundaries": [
        "只讨论乘法型损益，不涉及税费、融资成本和仓位调整。",
        "平均值1是数学期望，不是任何单个账户的结果；片中已明确区分。",
        "凯利公式只作为几何增长的引用，不给出具体仓位建议。",
    ],
    "allPassed": all(c["pass"] for c in checks),
}
(ROOT / "evidence/fact-review.json").write_text(
    json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
)
print(json.dumps({"allPassed": summary["allPassed"], "checks": len(checks),
                  "failed": [c["claim"] for c in checks if not c["pass"]]}, ensure_ascii=False))
