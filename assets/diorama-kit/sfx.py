"""按场景导出的事件表合成音效，再和旁白混音。全部由代码算出，不用采样。

python sfx.py <工程根>   → audio/sfx.wav、audio/mix.wav
音效压在旁白下面约 14 dB；铺底再低 10 dB。
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

ROOT = Path(sys.argv[1]); SR = 48000
EV = json.loads((ROOT / 'audio' / 'events.json').read_text(encoding='utf-8'))
TL = json.loads((ROOT / 'audio' / 'timeline.json').read_text(encoding='utf-8'))
DUR = TL['seconds'] + .3; n = int(DUR * SR)
L, R = np.zeros(n), np.zeros(n)
rng = np.random.default_rng(29)
env = lambda m, a, d: np.minimum(1, np.arange(m) / max(1, a * SR)) * np.exp(-np.arange(m) / (d * SR))

def put(t, sig, pan=0.):
    i = int(t * SR); j = min(n, i + len(sig))
    if i >= n: return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:j] += sig[:j - i] * l; R[i:j] += sig[:j - i] * r

def clink(pitch=1.):     # 金属：几个不成谐波的正弦，快衰减
    m = int(.35 * SR); t = np.arange(m) / SR
    s = sum(a * np.sin(2 * np.pi * f * pitch * t) * np.exp(-t / d) for f, a, d in ((2380, .6, .09), (3720, .35, .06), (5240, .25, .04), (1130, .3, .12)))
    return s * env(m, .001, 1)

def pop():               # 方块升起：音高上滑的短音
    m = int(.18 * SR); t = np.arange(m) / SR
    return np.sin(2 * np.pi * np.cumsum(220 + 500 * t / .18) / SR) * env(m, .004, .06)

def crumble():           # 坍塌：一串低通咔嗒 + 低频噪声
    m = int(1.6 * SR); s = np.zeros(m)
    for _ in range(90):
        k = int(rng.beta(1.4, 3) * (m - 3000)); g = int(rng.uniform(300, 1400))
        s[k:k + g] += rng.normal(0, 1, g) * np.exp(-np.arange(g) / (g / 4)) * rng.uniform(.2, .8)
    noise = np.convolve(rng.normal(0, 1, m), np.ones(60) / 60, 'same') * np.exp(-np.arange(m) / (.6 * SR)) * 1.5
    return np.convolve(s, np.ones(8) / 8, 'same') + noise

def whoosh():            # 转场：滤波噪声，音量先升后降
    m = int(.7 * SR); t = np.arange(m) / m
    x = rng.normal(0, 1, m); k = (20 + 120 * np.sin(np.pi * t)).astype(int); y = np.zeros(m); c = np.cumsum(np.r_[0, x])
    for i in range(m): a = max(0, i - k[i]); y[i] = (c[i + 1] - c[a]) / (i + 1 - a)
    return y * np.sin(np.pi * t) ** 2 * 2.2

def grow():              # 塔长一节：短促上行双音
    m = int(.22 * SR); t = np.arange(m) / SR
    return (np.sin(2 * np.pi * 523 * t) * (t < .1) + np.sin(2 * np.pi * 784 * t) * (t >= .08)) * env(m, .003, .09) * .7

for t, kind in EV:
    if kind == 'clink_l': put(t, clink(1.06) * .55, -.55)
    elif kind == 'clink_r': put(t, clink(.92) * .5, .55)
    elif kind == 'pop': put(t, pop() * .7)
    elif kind == 'crumble': put(t, crumble() * .55)
    elif kind == 'whoosh': put(t - .25, whoosh() * .35)
    elif kind == 'grow': put(t, grow() * .5)
    elif kind == 'tick': put(t, pop()[::2] * .35)     # 砌一层：短促高一点的啵

# 铺底：低音和弦，慢速起伏，结尾淡出
t = np.arange(n) / SR
pad = sum(np.sin(2 * np.pi * f * t + p) for f, p in ((55, 0), (82.4, 1.1), (110, 2.3), (164.8, .7))) / 4
pad *= (.6 + .4 * np.sin(2 * np.pi * t / 6)) * np.minimum(1, t / 2) * np.minimum(1, (DUR - t) / 2.5)
L += pad * .08; R += pad * .08

def db(x): return 20 * np.log10(np.max(np.abs(x)) + 1e-9)
sfx = np.stack([L, R], 1); sfx *= 10 ** ((-14 - db(sfx)) / 20)     # 音效峰值 -14 dBFS
def write(p, a):
    a = np.clip(a, -1, 1); w = wave.open(str(p), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((a * 32767).astype('<i2').tobytes()); w.close()
write(ROOT / 'audio' / 'sfx.wav', sfx)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(ROOT / 'audio' / 'voice.wav'), '-i', str(ROOT / 'audio' / 'sfx.wav'), '-filter_complex',
                '[0:a]aformat=sample_rates=48000:channel_layouts=stereo[v];[1:a]aformat=sample_rates=48000:channel_layouts=stereo[s];[v][s]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95[m]',
                '-map', '[m]', str(ROOT / 'audio' / 'mix.wav')], check=True)
print('sfx', round(db(sfx), 1), 'dBFS peak; events', len(EV))
