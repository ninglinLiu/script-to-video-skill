"""算出片中所有数字，写进 web/data.json。画面和字幕只读这份文件，不手抄数字。

python data/build_data.py
"""
import json
import math
from pathlib import Path

import numpy as np
from scipy.optimize import brentq

ROOT = Path(__file__).resolve().parents[1]
P, N, RUNS, SEED = 0.6, 100, 10_000, 2026


def path(seq, f):
    w, out = 1.0, [1.0]
    for h in seq:
        w *= 1 + f if h else 1 - f
        out.append(w)
    return out


def pick_sequence():
    """60 正 40 反的一种排列。挑一条押 50% 的人先领先、后崩掉的顺序，开头不要太顺。"""
    rng = np.random.default_rng(SEED)
    for _ in range(20000):
        seq = np.array([1] * 60 + [0] * 40)
        rng.shuffle(seq)
        half = path(seq, .5)
        peak = int(np.argmax(half))
        if 3 <= max(half) <= 12 and 15 <= peak <= 45 and seq[:6].sum() in (3, 4) and min(path(seq, .2)) > .55:
            return [int(x) for x in seq]
    raise SystemExit('没找到合适的排列')


def main():
    seq = pick_sequence()
    steps = {f'{f:.1f}': path(seq, f) for f in (.1, .2, .3, .4, .5)}
    growth = lambda f: P * math.log1p(f) + (1 - P) * math.log1p(-f)
    threshold = brentq(growth, .05, .99)
    hill = [[round(f, 3), round((1 + f) ** 60 * (1 - f) ** 40, 6)] for f in np.linspace(0, .6, 121)]

    rng = np.random.default_rng(SEED + 1)
    heads = rng.random((RUNS, N)) < P
    finals = {}
    for f in (.2, .5):
        lw = np.where(heads, math.log1p(f), math.log1p(-f)).sum(1)
        finals[f] = lw / math.log(10)
    order = rng.permutation(RUNS).tolist()
    stat = lambda f: dict(profit=float((finals[f] > 0).mean()), under1pct=float((finals[f] < -2).mean()),
                          median=float(10 ** np.median(finals[f])), expected=float((P * (1 + f) + (1 - P) * (1 - f)) ** N))

    data = dict(
        p=P, n=N, runs=RUNS, seed=SEED,
        sequence=''.join('H' if h else 'T' for h in seq),
        steps={k: [round(x, 6) for x in v] for k, v in steps.items()},
        finals60_40={k: v[-1] for k, v in steps.items()},
        threshold=threshold, kelly=2 * P - 1, hill=hill,
        runs20=[round(float(x), 2) for x in finals[.2]], runs50=[round(float(x), 2) for x in finals[.5]],
        order=order, stats={'0.2': stat(.2), '0.5': stat(.5)},
        experiment=dict(players=61, bust=17, bustShare=.28, stake=25, minutes=30,
                        source='Haghani & Dewey (2016), Rational Decision-Making under Uncertainty, arXiv:1701.01427: 28% of participants went bust'),
    )
    out = ROOT / 'web/data.json'
    out.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    summary = {k: v for k, v in data.items() if k not in ('steps', 'hill', 'runs20', 'runs50', 'order')}
    summary['pathPeak50'] = max(steps['0.5'])
    summary['pathMin20'] = min(steps['0.2'])
    (ROOT / 'qa').mkdir(exist_ok=True)
    (ROOT / 'qa/data-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding='utf-8')
    print(json.dumps(summary, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
