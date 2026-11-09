"""凯撒《AI不是泡沫：OpenAI才是》竖屏 3D 微缩，Blender Cycles。

blender -b --factory-startup --python caesar.py -- <工程根> stills <帧,帧> [采样]
blender -b --factory-startup --python caesar.py -- <工程根> anim <起,止> [采样]   # 只渲缺失的帧
站点沿 x 轴：雅虎塔 → OpenAI 核心 → 天平 → 人群 → 循环。时间全部取自 audio/timeline.json。
"""
import sys, os, math, random, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dio_blender import *

ARGS = sys.argv[sys.argv.index('--') + 1:]
ROOT, MODE, SPEC = ARGS[0], ARGS[1], ARGS[2]
SAMPLES = int(ARGS[3]) if len(ARGS) > 3 else 96
W, H, FPS = 1080, 1920, 30
TL, C = load_timeline(os.path.join(ROOT, 'audio', 'timeline.json'))
DUR = TL['seconds']; N = int(round(DUR * FPS))
EVENTS = []          # 给音效用：(秒, 类型)

def word_t(cid, s, default=None):
    for w in C[cid]['words']:
        if s in w['w']: return w['t']
    return C[cid]['start'] if default is None else default

sc = reset_scene(); linear_keys()
XY, XO, XB, XC, XL = -.5, 0., .4, .78, 1.15
lights = studio(bokeh_box=((-1.6, 2.6), (.9, 3.4), (.03, .8)), focus_hint=(XY, 0, .04))
cam, focus = camera_rig(35)

white = material('label', '#f4f2ee', rough=.4, emit='#ffffff', strength=.6)
dark = material('dark', '#17181d', rough=.26, metal=.75)

# ───────── 1 雅虎塔：4×4×7 体素，雅虎一倒就散 ─────────
vox_mat = material('yahoo', '#7b3fe4', rough=.35, coat=.4)
V = .012; vox, vox0 = [], []
vmesh = None
for k in range(7):
    for i in range(4):
        for j in range(4):
            p = Vector((XY + (i - 1.5) * V, (j - 1.5) * V, V / 2 + k * V))
            ob = box('vox', (V * .96, V * .96, V * .96), p, vox_mat, bevel=.0012, seg=2, mesh=vmesh)
            vmesh = ob.data; vox.append(ob); vox0.append(p)
lab_yahoo = text3d('t_yahoo', '雅虎 · 2000', (XY, -.045, 0), .012, white)
T_B0, T_B1 = C['L1']['start'] + .15, word_t('L1', '雅虎') + .2
def layer_t(k): return T_B0 + (T_B1 - T_B0) * k / 6
for k in range(7): EVENTS.append((layer_t(k) + .22, 'tick'))
T_FALL = word_t('L2', '倒') + .05
EVENTS.append((T_FALL, 'crumble'))
rr = random.Random(2000)
sim = []    # 每个体素逐帧位置与转角（慢重力：微缩场景下真实重力太快）
G, DT = -2.4, 1 / 240
for p0 in vox0:
    d = (p0 - Vector((XY, 0, p0.z))); d.z = 0
    if d.length < 1e-6: d = Vector((rr.uniform(-1, 1), rr.uniform(-1, 1), 0))
    d.normalize()
    delay = .25 * (1 - p0.z / (7 * V)) * rr.uniform(.3, 1) + rr.uniform(0, .08)
    v = d * rr.uniform(.05, .22) + Vector((rr.uniform(-.03, .03), rr.uniform(-.06, .03), rr.uniform(.0, .12)))
    w = Vector((rr.uniform(-9, 9), rr.uniform(-9, 9), rr.uniform(-5, 5)))
    pos, vel, rot, track_ = p0.copy(), v, Vector((0, 0, 0)), []
    for f in range(int(4.5 * 240)):
        t = f * DT
        if t >= delay:
            vel.z += G * DT; pos += vel * DT; rot += w * DT
            if pos.z < V / 2:
                pos.z = V / 2; vel.z = -vel.z * .28; vel.x *= .6; vel.y *= .6; w *= .55
                if abs(vel.z) < .02: vel.z = 0
        track_.append((pos.copy(), rot.copy()))
    sim.append(track_)

# ───────── 2 OpenAI 核心 + 四家公司 + 光缆 ─────────
box_base('pedestal', (.1, .1, .02), (XO, 0, 0), dark, bevel=.004)
glass = material('glass', '#ffffff', rough=.05, transmission=1.0)
box('core_glass', (.062, .062, .062), (XO, 0, .02 + .031), glass, bevel=.006)
core_mat = material('core', '#c9fff0', emit='#c9fff0', strength=6)
box('core_inner', (.034, .034, .034), (XO, 0, .051), core_mat, bevel=.004)
text3d('t_openai', 'OpenAI', (XO, -.052, .004), .011, white)
COS = [('微软', '#3b7ddd', 132), ('英伟达', '#76b900', 106), ('亚马逊', '#ff9900', 78), ('甲骨文', '#e2312b', 52)]
companies = []
for name, colr, ang in COS:
    a = math.radians(ang); p = Vector((XO + .17 * math.cos(a), .17 * math.sin(a), 0))
    m = material('c_' + name, colr, rough=.4, coat=.3)
    blk = box_base('blk_' + name, (.05, .05, .065), p, m, bevel=.006)
    lab = text3d('t_' + name, name, (p.x, p.y - .027, .02), .0135, white)
    top = p + Vector((0, 0, .066)); tgt = Vector((XO, 0, .07))
    pts = bezier_pts(top, (top + tgt) / 2 + Vector((0, 0, .06)), tgt)
    cmat = material('cable_' + name, colr, emit=colr, strength=5)
    cb = cable('cable_' + name, pts, .0016, cmat)
    t_rise = word_t('L4', name[:2])
    pulses = [sphere('pulse_%s_%d' % (name, k), .0032, (0, 0, -1), material('pm_' + name, '#ffffff', emit=colr, strength=14), seg=10) for k in range(3)]
    companies.append(dict(blk=blk, lab=lab, cb=cb, pts=pts, t=t_rise, pulses=pulses))
    EVENTS.append((t_rise, 'pop'))

# ───────── 3 天平：收入 13 枚，支出 34 枚，倾角由币数算 ─────────
cylinder('scale_base', .04, .008, (XB, 0, .004), dark)
cylinder('scale_post', .005, .11, (XB, 0, .008 + .055), dark)
PIV = Vector((XB, 0, .118))
beam = box('beam', (.17, .007, .007), PIV, material('brass', '#c9a24a', rough=.3, metal=.9), bevel=.002)
brass = beam.data.materials[0]
pans, rods = [], []
for s in (-1, 1):
    pans.append(cylinder('pan', .036, .004, (0, 0, 0), brass))
    rods.append(cylinder('rod', .0012, .045, (0, 0, 0), brass))
coin_geo = None
gold = material('gold', '#e8b53c', rough=.25, metal=.9)
red = material('redcoin', '#d8231a', rough=.3, coat=.6, emit='#ff2a1a', strength=.35)
SLOTS = [(-.012, -.004), (.012, -.004), (0, .013)]
def coin_plan(n, t0, t1, side):
    out = []
    for i in range(n):
        col, lvl = i % 3 if n > 13 else (0 if i < 12 else 1), i // 3 if n > 13 else (i if i < 12 else 0)
        out.append(dict(side=side, slot=SLOTS[col], lvl=lvl, te=stagger(i, n, t0, t1 - t0)))
    return out
T_IN = word_t('L5', '收入'); T_OUT = word_t('L5', '花')
coins = coin_plan(13, T_IN, T_IN + 1.1, 0) + coin_plan(34, T_OUT, T_OUT + 1.6, 1)
coin_mesh = {}     # 金币、红币各一份网格：材质挂在网格上，共用会全变成同一种颜色
for c in coins:
    ob = cylinder('coin', .0125, .0034, (0, 0, -1), gold if c['side'] == 0 else red, seg=28, mesh=coin_mesh.get(c['side']))
    coin_mesh.setdefault(c['side'], ob.data)
    c['ob'] = ob
    EVENTS.append((c['te'] + .2, 'clink_l' if c['side'] == 0 else 'clink_r'))
# 倾角：二阶弹簧追随目标
theta, th_v, thetas = 0., 0., []
for f in range(N + 2):
    t = (f - 1) / FPS
    for _ in range(8):
        L = sum(1 for c in coins if c['side'] == 0 and t >= c['te'] + .2)
        Rn = sum(1 for c in coins if c['side'] == 1 and t >= c['te'] + .2)
        tgt = math.radians(20) * (Rn - L) / max(1, Rn + L)
        acc = 70 * (tgt - theta) - 7 * th_v; th_v += acc / (FPS * 8); theta += th_v / (FPS * 8)
    thetas.append(theta)

# ───────── 4 人群：100 人，5 个付费；其余往 GPU 送火花 ─────────
grey = material('crowd_grey', '#7d8391', rough=.5)
paid = material('crowd_paid', '#ff8f3a', rough=.4, emit='#ff8f3a', strength=1.2)
rp = random.Random(5); PAID = set(rp.sample(range(100), 5))
people, bmesh_, hmesh_ = [], None, None
for i in range(100):
    r, c = divmod(i, 10)
    p = Vector((XC + (c - 4.5) * .018, -.02 + (r - 4.5) * .018, 0))
    m = paid if i in PAID else grey
    b = cylinder('pb', .0042, .011, p + Vector((0, 0, .0055)), m, seg=12)
    h = sphere('ph', .0038, p + Vector((0, 0, .015)), m, seg=12)
    people.append(dict(p=p, b=b, h=h, delay=((r * 7 + c * 13) % 23) * .018, paid=i in PAID))
GPU = Vector((XC, .15, 0))
box_base('gpu', (.11, .05, .028), GPU, dark, bevel=.003)
for k in range(7): box_base('fin', (.004, .045, .012), GPU + Vector((-.045 + k * .015, 0, .028)), dark, bevel=.001)
gpu_glow = material('gpu_glow', '#ff4a1c', emit='#ff4a1c', strength=0)
box('gpu_strip', (.1, .002, .006), GPU + Vector((0, -.026, .014)), gpu_glow)
text3d('t_gpu', 'GPU', (GPU.x, GPU.y - .027, .003), .008, white)
spark_mat = material('spark', '#ff7a2a', emit='#ff7a2a', strength=25)
rs = random.Random(9); T_SP0, T_SP1 = C['L7']['start'] + .8, C['L8']['start'] + .6
sparks = []
for k in range(70):
    src = people[rs.choice([i for i in range(100) if i not in PAID])]
    sparks.append(dict(ob=sphere('spark', .0022, (0, 0, -1), spark_mat, seg=8), src=src['p'] + Vector((0, 0, .02)), te=rs.uniform(T_SP0, T_SP1 - .5), dur=rs.uniform(.45, .7)))

# ───────── 5 循环：英伟达 ↔ CoreWeave，币每绕一圈两塔一起长 ─────────
nv = box_base('nv', (.05, .05, .06), (XL - .07, 0, 0), material('nv', '#76b900', rough=.4, coat=.3), bevel=.006)
cw = box_base('cw', (.05, .05, .06), (XL + .07, 0, 0), material('cw', '#3a6df0', rough=.4, coat=.3), bevel=.006)
text3d('t_nv', '英伟达', (XL - .07, -.027, .012), .0095, white)
text3d('t_cw', 'CoreWeave', (XL + .07, -.027, .012), .0075, white)
ring = torus('loop', .115, .0018, (XL, 0, .035), material('ring', '#ffd166', emit='#ffd166', strength=3))
ring.scale = (1, .55, 1)
loop_coin = cylinder('loop_coin', .011, .003, (0, 0, -1), gold, seg=28)
trail = [sphere('trail', .0035 * (1 - k / 8), (0, 0, -1), material('tr%d' % k, '#ffd166', emit='#ffd166', strength=10 * (1 - k / 8)), seg=8) for k in range(8)]
T_LOOP0 = word_t('L8', '英伟') ; T_LOOP1 = C['L8']['end'] + .3
LAPS = 3
def loop_angle(t): return 2 * math.pi * LAPS * in_out_sine(win(t, T_LOOP0, T_LOOP1)) + math.pi   # 从英伟达那侧出发
grow_times = []     # 每经过一座塔就长一节
for f in range(int(T_LOOP0 * FPS), int(T_LOOP1 * FPS) + 1):
    a0, a1 = loop_angle(f / FPS), loop_angle((f + 1) / FPS)
    for target_a, who in ((math.pi * 2, 'cw'), (math.pi, 'nv')):
        for n in range(-2, 6):
            x = target_a + n * 2 * math.pi
            if a0 < x <= a1 and f / FPS > T_LOOP0 + .2: grow_times.append(((f + 1) / FPS, who))
for t_, who in grow_times: EVENTS.append((t_, 'grow'))
def tower_h(t, who):
    return 1 + sum(.28 * max(0, spring(t - tg, 1.8, .45)) for tg, w in grow_times if w == who)

# ───────── 小人：一路跳过五个站点 ─────────
mas = mascot(K=.05)
gp = lambda x, y: Vector((x, y, 0))
hop = hop_path([
    (0, gp(XY + .062, -.012), .5),
    (C['L3']['start'] + .25, gp(XY + .2, -.07), .9, .05), (C['L3']['start'] + .7, gp(XO - .22, -.07), .9, .05), (C['L3']['start'] + 1.15, gp(XO - .1, -.075), .35),
    (C['L5']['start'] - .2, gp(XO + .14, -.08), .9, .05), (C['L5']['start'] + .25, gp(XB - .2, -.07), .9, .05), (C['L5']['start'] + .7, gp(XB - .085, -.065), .3),
    (C['L7']['start'] - .2, gp(XB + .14, -.09), .9, .05), (C['L7']['start'] + .25, gp(XC - .125, -.02), .6, .05),
    (C['L8']['start'] + .25, gp(XC + .01, .1), .9, .05), (C['L8']['start'] + .7, gp(XL - .2, -.09), .9, .06), (C['L8']['start'] + 1.15, gp(XL - .13, -.085), .35),
    (C['L9']['start'] + 1.2, gp(XL - .13, -.085), .35, .03),
], dur=.42, height=.04)

# ───────── 镜头 ─────────
cam_track = track([
    (0.0, [XY + .02, -.26, .09, XY, 0, .045]),
    (C['L1']['end'], [XY + .04, -.235, .08, XY, 0, .045]),
    (T_FALL + .5, [XY + .05, -.3, .13, XY, 0, .03]),
    (C['L2']['end'], [XY + .14, -.34, .14, XY + .09, 0, .03]),
    (C['L3']['start'] + 1.4, [XO - .06, -.3, .12, XO, 0, .05]),
    (C['L3']['end'], [XO - .03, -.28, .1, XO, 0, .05]),
    (C['L4']['start'] + 2.2, [XO, -.5, .3, XO, .07, .05]),
    (C['L4']['end'], [XO + .05, -.54, .31, XO + .01, .07, .05]),
    (C['L5']['start'] + 1.0, [XB - .02, -.41, .17, XB, 0, .07]),
    (C['L6']['end'], [XB + .02, -.36, .14, XB + .01, 0, .07]),
    (C['L7']['start'] + 1.0, [XC, -.3, .27, XC, .04, .01]),
    (C['L7']['end'], [XC + .03, -.27, .23, XC, .05, .01]),
    (C['L8']['start'] + 1.2, [XL - .03, -.37, .14, XL, 0, .05]),
    (C['L8']['end'], [XL + .05, -.34, .13, XL, 0, .06]),
    (C['L9']['start'] + 1.6, [XL + .25, -.55, .32, XL - .1, .02, .03]),
    (DUR, [1.55, -.75, .55, .35, .05, 0.]),
])
EVENTS += [(C['L3']['start'] + .3, 'whoosh'), (C['L5']['start'], 'whoosh'), (C['L7']['start'], 'whoosh'), (C['L8']['start'], 'whoosh'), (C['L9']['start'] + .8, 'whoosh')]

# ───────── 逐帧 ─────────
def frame(f):
    t = (f - 1) / FPS
    cx, cy, cz, tx, ty, tz = cam_track(t)
    aim(cam, (cx, cy, cz), (tx, ty, tz)); key(cam, 'location', 'rotation_euler', f=f)
    focus.location = (tx, ty, tz); key(focus, 'location', f=f)
    cam.data.dof.aperture_fstop = lerp(2.8, 5.0, win(Vector((cx - tx, cy - ty, cz - tz)).length, .35, 1.6))
    cam.data.dof.keyframe_insert('aperture_fstop', frame=f)
    follow_lights(lights, (tx, ty, .04))
    lights['key'].visible_glossy = t < C['L9']['start'] + 1.0
    lights['key'].keyframe_insert('visible_glossy', frame=f)
    for n in ('key', 'rim', 'cool'): key(lights[n], 'location', 'rotation_euler', f=f)

    # 雅虎
    fi = int(max(0, t - T_FALL) * 240)
    for idx, (ob, tr, p0) in enumerate(zip(vox, sim, vox0)):
        if t >= T_FALL:
            pos, rot = tr[min(fi, len(tr) - 1)]; ob.location = pos; ob.rotation_euler = rot; ob.scale = (1, 1, 1)
        else:
            k, i = divmod(idx, 16); ts = layer_t(k) + i * .012
            u = win(t, ts, ts + .24)
            ob.location = p0 + Vector((0, 0, .05 * (1 - u) ** 2)); ob.rotation_euler = (0, 0, 0)
            ob.scale = (1, 1, 1) if t >= ts else (.001,) * 3
        key(ob, 'location', 'rotation_euler', 'scale', f=f)
    ly = max(.001, out_cubic(win(t, T_B1 - .3, T_B1 + .3))); lab_yahoo.scale = (ly, ly, ly); key(lab_yahoo, 'scale', f=f)

    # 公司升起、光缆长出、脉冲流向核心
    for c in companies:
        k = max(0, spring(t - c['t'], 1.7, .45))
        c['blk'].scale = (1, 1, max(.001, k)) if k > .002 else (.001, .001, .001); key(c['blk'], 'scale', f=f)
        s = max(.001, min(1.2, k)); c['lab'].scale = (s, s, s); key(c['lab'], 'scale', f=f)
        g = out_cubic(win(t, c['t'] + .35, c['t'] + .95))
        c['cb'].data.bevel_factor_end = max(.001, g); c['cb'].data.keyframe_insert('bevel_factor_end', frame=f)
        for k2, pu in enumerate(c['pulses']):
            if g < 1: pu.location = c['pts'][0]; pu.scale = (.001,) * 3
            else: pu.location = along(c['pts'], ((t - c['t']) * .7 + k2 / 3) % 1); pu.scale = (1, 1, 1)
            key(pu, 'location', 'scale', f=f)
    flick = 1.0 if t < C['L9']['start'] + 1.0 else .55 + .45 * abs(math.sin(t * 23) * math.sin(t * 7.3))
    bsdf(core_mat).inputs['Emission Strength'].default_value = 6 * flick
    bsdf(core_mat).inputs['Emission Strength'].keyframe_insert('default_value', frame=f)

    # 天平
    th = thetas[f]
    beam.rotation_euler = (0, th, 0); key(beam, 'rotation_euler', f=f)
    for s, pan, rod in ((-1, pans[0], rods[0]), (1, pans[1], rods[1])):
        end = PIV + Vector((s * .075 * math.cos(th), 0, -s * .075 * math.sin(th)))
        rod.location = end + Vector((0, 0, -.0225)); pan.location = end + Vector((0, 0, -.045))
        key(rod, 'location', f=f); key(pan, 'location', f=f)
    for c in coins:
        pan = pans[c['side']].location
        rest = pan + Vector((c['slot'][0], c['slot'][1], .002 + .0017 + c['lvl'] * .0035))
        p = win(t, c['te'], c['te'] + .2)
        c['ob'].location = rest + Vector((0, 0, .09 * (1 - p) ** 2))
        c['ob'].scale = (1, 1, 1) if t >= c['te'] else (.001, .001, .001)
        key(c['ob'], 'location', 'scale', f=f)

    # 人群与火花
    for pe in people:
        k = max(0, spring(t - (C['L7']['start'] - .3 + pe['delay']), 2.4, .5))
        bob = .003 * abs(math.sin(t * 6 + pe['delay'] * 20)) if pe['paid'] and t > C['L7']['start'] + 1 else 0
        for ob, base_z in ((pe['b'], .0055), (pe['h'], .015)):
            ob.location = pe['p'] + Vector((0, 0, base_z * k + bob)); ob.scale = (max(.001, k),) * 3
            key(ob, 'location', 'scale', f=f)
    arrived = 0
    for sp in sparks:
        u = (t - sp['te']) / sp['dur']
        p = sp['src'].lerp(GPU + Vector((0, 0, .03)), in_out_sine(clamp01(u))); p.z += arc(clamp01(u), .05); sp['ob'].location = p
        sp['ob'].scale = (1, 1, 1) if 0 <= u <= 1 else (.001,) * 3
        if u > 1: arrived += 1
        key(sp['ob'], 'location', 'scale', f=f)
    bsdf(gpu_glow).inputs['Emission Strength'].default_value = 1 + 40 * arrived / len(sparks) * (1 + .15 * math.sin(t * 17))
    bsdf(gpu_glow).inputs['Emission Strength'].keyframe_insert('default_value', frame=f)

    # 循环
    nv.scale = (1, 1, tower_h(t, 'nv')); cw.scale = (1, 1, tower_h(t, 'cw')); key(nv, 'scale', f=f); key(cw, 'scale', f=f)
    on = T_LOOP0 - .1 <= t <= T_LOOP1 + .6
    for k, ob in enumerate([loop_coin] + trail):
        a = loop_angle(t - k * .035)
        ob.location = (XL + .115 * math.cos(a), .115 * .55 * math.sin(a), .035 + (.004 if k == 0 else 0))
        ob.scale = (1, 1, 1) if on else (.001,) * 3
        if k == 0: ob.rotation_euler = (math.radians(90), 0, a + math.pi / 2)
        key(ob, 'location', 'rotation_euler', 'scale', f=f)

    # 小人
    pos, rz, sq = hop(t)
    ap = max(.001, spring(t - .2, 2, .45))
    pose(mas, pos, rz, (sq[0] * ap, sq[1] * ap)); key(mas, 'location', 'rotation_euler', 'scale', f=f)

for f in range(1, N + 1): frame(f)
for t_, kind in grow_times: pass
json.dump(sorted(EVENTS), open(os.path.join(ROOT, 'audio', 'events.json'), 'w', encoding='utf-8'))
print('KEYED', N, flush=True)

setup_render(W, H, FPS, N, SAMPLES)
sc.use_nodes = True
try:
    nt = sc.node_tree; rl = nt.nodes['Render Layers']; comp = nt.nodes['Composite']
    gl = nt.nodes.new('CompositorNodeGlare')
    try: gl.glare_type = 'BLOOM'
    except TypeError: gl.glare_type = 'FOG_GLOW'
    gl.threshold = 1.2; gl.mix = -.75; gl.size = 7
    nt.links.new(rl.outputs['Image'], gl.inputs['Image']); nt.links.new(gl.outputs['Image'], comp.inputs['Image'])
    print('GLARE', gl.glare_type, flush=True)
except Exception as e:
    print('GLARE_SKIP', e, flush=True)
render(ROOT, MODE, SPEC)
