"""算出片中所有数字，写进 web/data.json；qa/data-summary.json 留给核对。画面和文字只读这份数据。

起手例子：一枚正面概率 60% 的硬币抛 100 次，每次押 20%。换题时整份重写，随机数固定种子。
python data/build_data.py
"""
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
P, N, F, SEED = .6, 100, .2, 1


def main():
    rng = random.Random(SEED)
    flips = [rng.random() < P for _ in range(N)]
    wealth = [1.0]
    for h in flips:
        wealth.append(wealth[-1] * (1 + F if h else 1 - F))
    data = dict(p=P, n=N, f=F, seed=SEED, flips=''.join('H' if h else 'T' for h in flips),
                wealth=[round(w, 6) for w in wealth], heads=sum(flips), final=wealth[-1])
    (ROOT / 'web/data.json').write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
    (ROOT / 'qa').mkdir(exist_ok=True)
    summary = {k: v for k, v in data.items() if k != 'wealth'}
    (ROOT / 'qa/data-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding='utf-8')
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == '__main__':
    main()
