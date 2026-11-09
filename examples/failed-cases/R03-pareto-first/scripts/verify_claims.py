"""Recompute every spoken number from the article's own formula, independent of compile_content.

Writes evidence/fact-review.json. Standard library only.
"""
from pathlib import Path
import json
import math

ROOT = Path(__file__).resolve().parent.parent
spec = json.loads((ROOT / "source/content.json").read_text(encoding="utf-8"))
built = json.loads((ROOT / "工程/src/content.generated.json").read_text(encoding="utf-8"))
checks = []


def check(claim, formula, expected, computed, tol):
    ok = abs(computed - expected) <= tol
    checks.append({"claim": claim, "formula": formula, "expected": expected, "computed": computed, "pass": bool(ok)})


alpha = math.log(5) / math.log(4)
check("文章给出的 α 对应 80/20", "ln5/ln4", 1.16, alpha, 0.005)
check("顶部分位份额公式在 α=ln5/ln4 给回 80%", "0.2**(1-1/alpha)", 0.8, 0.2 ** (1 - 1 / alpha), 1e-9)
check("α=1.5 时 20% 的份额", "0.2**(1-1/1.5)", 0.5848, 0.2 ** (1 - 1 / 1.5), 1e-4)
check("α=2.0 时 20% 的份额", "0.2**(1-1/2)", 0.4472, 0.2 ** (1 - 1 / 2), 1e-4)
check("编译后的 top80", "content.generated top80", 0.8, built["values"]["top80"], 1e-9)
check("编译后的 top15", "content.generated top15", 0.5848, built["values"]["top15"], 1e-4)
check("编译后的 top20", "content.generated top20", 0.4472, built["values"]["top20"], 1e-4)

beta = 1 - 1 / alpha
lorenz = lambda p: 1 - (1 - p) ** beta
quint = [lorenz(0.2), lorenz(0.4) - lorenz(0.2), lorenz(0.6) - lorenz(0.4), lorenz(0.8) - lorenz(0.6), 1 - lorenz(0.8)]
check("五组份额之和为 1", "sum(quintiles)", 1.0, sum(quint), 1e-9)
check("最低 20% 的份额", "Lorenz(0.2)", 0.0305, quint[0], 1e-4)
check("最高 20% 的份额等于 top80", "1-Lorenz(0.8)", built["values"]["top80"], quint[4], 1e-9)
for i in range(5):
    check(f"编译后的 q{i+1} 与 Lorenz 差一致", f"q{i+1}", quint[i], built["values"][f"q{i+1}"], 1e-9)

summary = {
    "article": "https://zh.wikipedia.org/wiki/%E4%BA%8C%E5%85%AB%E5%AE%9A%E5%BE%8B",
    "formula": "top share(p) = p^(1-1/alpha), Lorenz(p) = 1-(1-p)^(1-1/alpha)",
    "checks": checks,
    "allPassed": all(c["pass"] for c in checks),
    "scope": "只核对片中出现的数字与它们的推导；不证明维基条目对帕累托 1896 年观察的记述本身准确。",
}
(ROOT / "evidence/fact-review.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"allPassed": summary["allPassed"], "checks": len(checks),
                  "failed": [c["claim"] for c in checks if not c["pass"]]}, ensure_ascii=False))
