"""Blender 版 3D 微缩工具：动效函数、材质与几何、暗场棚拍、小人、渲染与断点续渲。

在场景脚本里：sys.path.insert(0, 这个目录); from dio_blender import *
单位是米。所有动画逐帧算出后打关键帧（线性插值），运动模糊在相邻帧之间取样。
"""
import bpy, bmesh, math, random, os, sys, json, time
from mathutils import Vector

# ───────── 动效函数（与 web/motion.js 同一套） ─────────
clamp01 = lambda x: max(0.0, min(1.0, x))
lerp = lambda a, b, t: a + (b - a) * t
win = lambda t, a, b: clamp01((t - a) / (b - a)) if b != a else float(t >= a)
out_cubic = lambda x: 1 - (1 - x) ** 3
in_cubic = lambda x: x ** 3
in_out_cubic = lambda x: 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
in_out_sine = lambda x: -(math.cos(math.pi * x) - 1) / 2
out_back = lambda x, s=1.70158: 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2
arc = lambda p, h: 4 * h * p * (1 - p)

def spring(t, freq=2.0, damp=.42):
    if t <= 0: return 0.0
    w = 2 * math.pi * freq; wd = w * math.sqrt(1 - damp * damp)
    return 1 - math.exp(-damp * w * t) * (math.cos(wd * t) + damp / math.sqrt(1 - damp * damp) * math.sin(wd * t))

def squash(kind, p, amt=.22):
    if kind == 'pre': k = math.sin(math.pi * p) * amt; return (1 + k * .6, 1 - k)
    if kind == 'air': k = math.sin(math.pi * p) * amt * .8; return (1 - k * .4, 1 + k)
    if kind == 'land': k = math.exp(-5 * p) * math.cos(9 * p) * amt; return (1 + k * .6, 1 - k)
    return (1, 1)

def stagger(i, n, start, spread): return start + (0 if n <= 1 else spread * i / (n - 1))

def track(keys):
    """非均匀 Catmull-Rom：keys=[(t,[...])]，经过关键帧不减速。"""
    n = len(keys); tan = []
    for i, (t, v) in enumerate(keys):
        a, b = keys[max(0, i - 1)], keys[min(n - 1, i + 1)]; dt = (b[0] - a[0]) or 1
        tan.append([0 if i in (0, n - 1) else (b[1][j] - a[1][j]) / dt for j in range(len(v))])
    def f(t):
        if t <= keys[0][0]: return list(keys[0][1])
        if t >= keys[-1][0]: return list(keys[-1][1])
        i = 0
        while keys[i + 1][0] < t: i += 1
        (ta, va), (tb, vb) = keys[i], keys[i + 1]
        h = tb - ta; s = (t - ta) / h; s2, s3 = s * s, s * s * s
        h00, h10, h01, h11 = 2 * s3 - 3 * s2 + 1, s3 - 2 * s2 + s, -2 * s3 + 3 * s2, s3 - s2
        return [h00 * va[j] + h10 * h * tan[i][j] + h01 * vb[j] + h11 * h * tan[i + 1][j] for j in range(len(va))]
    return f

def hop_path(keys, dur=.42, height=.04):
    """keys=[(落地时刻, Vector, 朝向弧度, 跳高)]，返回 t → (位置, 朝向, (sx, sz))。"""
    def f(t):
        i = 0
        while i + 1 < len(keys) and keys[i + 1][0] - dur <= t: i += 1
        cur = keys[i]
        if i > 0 and t < cur[0]:
            prev = keys[i - 1]; p = win(t, cur[0] - dur, cur[0])
            pos = prev[1].lerp(cur[1], in_out_sine(p)); pos.z += arc(p, cur[3] if len(cur) > 3 else height)
            return pos, lerp(prev[2], cur[2], in_out_cubic(p)), squash('air', p)
        nx = keys[i + 1] if i + 1 < len(keys) else None
        since = t - cur[0]
        if 0 <= since < .34: sq = squash('land', since / .34 * 1.4)
        elif nx and t > nx[0] - dur - .12: sq = squash('pre', win(t, nx[0] - dur - .12, nx[0] - dur))
        else: sq = (1, 1)
        return cur[1].copy(), cur[2], sq
    return f

def load_timeline(path):
    tl = json.load(open(path, encoding='utf-8'))
    return tl, {c['id']: c for c in tl['cues']}

# ───────── 几何与材质 ─────────
def reset_scene():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    return bpy.context.scene

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c)

def material(name, base, rough=.5, metal=0., emit=None, strength=0., coat=0., coat_rough=.05, alpha=1.0, transmission=0.):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(base), 1)
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if coat: b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = coat_rough
    if emit: b.inputs['Emission Color'].default_value = (*lin(emit), 1); b.inputs['Emission Strength'].default_value = strength
    if transmission: b.inputs['Transmission Weight'].default_value = transmission
    if alpha < 1: b.inputs['Alpha'].default_value = alpha
    return m

def bsdf(m): return m.node_tree.nodes['Principled BSDF']

def _link(name, data, loc=(0, 0, 0), parent=None):
    ob = bpy.data.objects.new(name, data); bpy.context.scene.collection.objects.link(ob); ob.location = loc
    if parent: ob.parent = parent
    return ob

def empty(name, loc=(0, 0, 0)):
    ob = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(ob); ob.location = loc; return ob

def _mesh(name, build, mat, smooth=True):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); build(bm); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = smooth
    if mat: me.materials.append(mat)
    return me

def box(name, dims, loc, mat, bevel=0., seg=5, parent=None, mesh=None):
    def b(bm):
        bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts: v.co.x *= dims[0]; v.co.y *= dims[1]; v.co.z *= dims[2]
    ob = _link(name, mesh or _mesh(name, b, mat), loc, parent)
    if bevel:
        m = ob.modifiers.new('bevel', 'BEVEL'); m.width = bevel; m.segments = seg; m.limit_method = 'NONE'; m.harden_normals = True
    return ob

def box_base(name, dims, loc, mat, bevel=0., seg=5, parent=None):
    """原点在底面中心，适合往上长的柱子：scale.z 就是高度倍数。"""
    def b(bm):
        bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts: v.co.x *= dims[0]; v.co.y *= dims[1]; v.co.z = (v.co.z + .5) * dims[2]
    ob = _link(name, _mesh(name, b, mat), loc, parent)
    if bevel:
        m = ob.modifiers.new('bevel', 'BEVEL'); m.width = bevel; m.segments = seg; m.limit_method = 'NONE'; m.harden_normals = True
    return ob

def sphere(name, r, loc, mat, parent=None, seg=24, mesh=None):
    return _link(name, mesh or _mesh(name, lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r), mat), loc, parent)

def cylinder(name, r, h, loc, mat, parent=None, seg=24, r2=None, mesh=None):
    return _link(name, mesh or _mesh(name, lambda bm: bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h), mat), loc, parent)

def torus(name, R, r, loc, mat):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=96, minor_segments=12, location=loc)
    ob = bpy.context.active_object; ob.name = name; ob.data.materials.append(mat)
    for p in ob.data.polygons: p.use_smooth = True
    return ob

def plane(name, w, h, loc, mat):
    me = bpy.data.meshes.new(name)
    me.from_pydata([(-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0)], [], [(0, 1, 2, 3)])
    uv = me.uv_layers.new(); uv.data[0].uv, uv.data[1].uv, uv.data[2].uv, uv.data[3].uv = (0, 0), (1, 0), (1, 1), (0, 1)
    me.materials.append(mat); return _link(name, me, loc)

FONTS = {}
def font(path):
    if path not in FONTS: FONTS[path] = bpy.data.fonts.load(path)
    return FONTS[path]

def text3d(name, body, loc, size, mat, extrude=.0015, align='CENTER', upright=True, fontfile='C:/Windows/Fonts/msyhbd.ttc', parent=None):
    """立着、正面朝 -Y 的立体字。"""
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = body; cu.size = size; cu.extrude = extrude
    cu.bevel_depth = extrude * .35; cu.bevel_resolution = 2; cu.align_x = align; cu.align_y = 'BOTTOM'
    cu.font = font(fontfile); cu.materials.append(mat)
    ob = _link(name, cu, loc, parent)
    if upright: ob.rotation_euler = (math.radians(90), 0, 0)
    return ob

def cable(name, pts, radius, mat):
    """多段线光缆；用 data.bevel_factor_end 0→1 让它“长出来”。"""
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = radius; cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for p, v in zip(sp.points, pts): p.co = (*v, 1)
    cu.materials.append(mat)
    return _link(name, cu)

def bezier_pts(a, c, b, n=40):
    return [a * (1 - s) ** 2 + c * 2 * s * (1 - s) + b * s * s for s in (i / (n - 1) for i in range(n))]

def along(pts, u):
    f = clamp01(u) * (len(pts) - 1); i = int(f); k = f - i
    return pts[i].lerp(pts[min(i + 1, len(pts) - 1)], k)

def area(name, loc, target, size, power, color, glossy=True):
    ld = bpy.data.lights.new(name, 'AREA'); ld.energy = power; ld.size = size; ld.color = color; ld.shape = 'DISK'
    ob = _link(name, ld, loc)
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    ob.visible_camera = False            # 灯面不进镜头，否则虚化成大光团
    ob.visible_glossy = glossy           # 轮廓光关掉，避免在光滑桌面上留光团
    return ob

# ───────── 暗场棚拍：桌面、世界、背景光斑、三盏灯 ─────────
def studio(seed=1029, bokeh_n=48, bokeh_box=((-1.4, 2.4), (.9, 3.4), (.03, .8)), desk_color='#101118', key=16, rim=10, focus_hint=(0, 0, .03)):
    sc = bpy.context.scene
    world = bpy.data.worlds.new('World'); sc.world = world; world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (.003, .0032, .006, 1)
    desk = material('desk', desk_color, rough=.3)
    nt = desk.node_tree; b = bsdf(desk)
    noise = nt.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 60
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = .22; mr.inputs['To Max'].default_value = .42
    nt.links.new(noise.outputs['Fac'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], b.inputs['Roughness'])
    plane('desk', 12, 12, (0, 0, 0), desk)
    rnd = random.Random(seed)
    mats = [material('bok%d' % i, c, emit=c, strength=s) for i, (c, s) in enumerate([('#ff5fa2', 40), ('#3fd0c9', 36), ('#ffd166', 34), ('#9b7bff', 40), ('#ffffff', 22)])]
    (x0, x1), (y0, y1), (z0, z1) = bokeh_box
    for i in range(bokeh_n):
        sphere('bok%d' % i, rnd.uniform(.004, .011), (rnd.uniform(x0, x1), rnd.uniform(y0, y1), rnd.uniform(z0, z1)), mats[i % 5], seg=12)
    fx, fy, fz = focus_hint
    lights = {
        'key': area('key', (fx - .45, fy - .38, .62), focus_hint, .5, key, (1, .9, .78)),
        'rim': area('rim', (fx + .22, fy + .5, .3), focus_hint, .22, rim, (1, .32, .6), glossy=False),
        'cool': area('cool', (fx - .5, fy + .3, .14), focus_hint, .3, 3, (.4, .75, 1), glossy=False),
    }
    return lights

def follow_lights(lights, target):
    """灯跟着当前站点走，保持同一种布光。"""
    t = Vector(target)
    for name, off in (('key', (-.45, -.38, .62)), ('rim', (.22, .5, .3)), ('cool', (-.5, .3, .14))):
        ob = lights[name]; ob.location = t + Vector(off)
        ob.rotation_euler = (t - ob.location).to_track_quat('-Z', 'Y').to_euler()

def camera_rig(lens=35):
    sc = bpy.context.scene
    cd = bpy.data.cameras.new('cam'); cd.lens = lens; cd.sensor_width = 36; cd.clip_start = .005; cd.dof.use_dof = True
    cam = _link('cam', cd); sc.camera = cam
    focus = empty('Focus'); cd.dof.focus_object = focus
    return cam, focus

def aim(cam, pos, target):
    cam.location = pos
    cam.rotation_euler = (Vector(target) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()

# ───────── 小人：原点在脚底，正面朝 -Y ─────────
def mascot(K=.05, color='#ff8f3a'):
    root = empty('Mascot')
    orange = material('orange', color, rough=.42, coat=.35, coat_rough=.2)
    box('m_body', (.72 * K, .62 * K, .6 * K), (0, 0, .42 * K), orange, bevel=.17 * K, parent=root)
    box('m_face', (.5 * K, .04 * K, .3 * K), (0, -.30 * K, .47 * K), material('cream', '#fff1df', rough=.5), bevel=.08 * K, parent=root)
    eye = material('eye', '#15161a', rough=.15, coat=.8); foot = material('foot', '#d9611c', rough=.5)
    for s in (-1, 1):
        box('m_eye', (.07 * K, .04 * K, .15 * K), (s * .12 * K, -.325 * K, .48 * K), eye, bevel=.025 * K, parent=root)
        box('m_foot', (.17 * K, .22 * K, .12 * K), (s * .18 * K, -.02 * K, .06 * K), foot, bevel=.04 * K, parent=root)
    cylinder('m_antenna', .025 * K, .25 * K, (0, 0, .84 * K), material('grey', '#8b8478', rough=.4), parent=root)
    sphere('m_bulb', .08 * K, (0, 0, .98 * K), material('bulb', '#ffd23f', rough=.3, emit='#ffc23a', strength=3), parent=root)
    root['face'] = (0, -.024 * K / .07, .034 * K / .07)
    return root

def pose(ob, pos, rz, sq):
    ob.location = pos; ob.rotation_euler = (0, 0, rz); ob.scale = (sq[0], sq[0], sq[1])

# ───────── 关键帧 ─────────
def key(ob, *props, f):
    for p in props: ob.keyframe_insert(p, frame=f)

def linear_keys():
    bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'

# ───────── 渲染 ─────────
def setup_render(w, h, fps, frames, samples=96, motion_blur=True):
    sc = bpy.context.scene
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'; prefs.get_devices()
    for d in prefs.devices: d.use = d.type == 'OPTIX'
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'GPU'
    sc.cycles.samples = samples; sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = .02
    sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPTIX'
    sc.cycles.max_bounces = 8; sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False; sc.cycles.blur_glossy = 1.0
    sc.render.use_persistent_data = True          # 不开的话每帧重载场景，慢十几倍
    sc.render.use_motion_blur = motion_blur; sc.render.motion_blur_shutter = .5
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w, h, 100
    sc.render.fps = fps; sc.frame_start, sc.frame_end = 1, frames
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGB'
    sc.view_settings.view_transform = 'AgX'
    for look in ('AgX - Punchy', 'Punchy', 'AgX - Medium High Contrast'):
        try: sc.view_settings.look = look; break
        except TypeError: pass

def render(root, mode, spec, out='frames'):
    """stills：渲指定帧到 out/stills；anim：渲 a..b 中缺失的帧（断线后重跑会接着渲）。"""
    sc = bpy.context.scene
    if mode == 'stills':
        d = os.path.join(root, 'out', 'stills'); os.makedirs(d, exist_ok=True)
        frames = [int(x) for x in spec.split(',')]; names = [os.path.join(d, 'f%04d.png' % f) for f in frames]
    else:
        a, b = (int(x) for x in spec.split(','))
        d = os.path.join(root, 'out', out); os.makedirs(d, exist_ok=True)
        frames = [f for f in range(a, b + 1) if not os.path.exists(os.path.join(d, '%04d.png' % f))]
        names = [os.path.join(d, '%04d.png' % f) for f in frames]
    print('TODO', len(frames), flush=True)
    t0 = time.time()
    for i, (f, path) in enumerate(zip(frames, names)):
        sc.frame_set(f); sc.render.filepath = path + '.tmp.png'
        bpy.ops.render.render(write_still=True)
        os.replace(path + '.tmp.png', path)        # 写完再改名，断线不留半张图
        if i % 20 == 0 or mode == 'stills': print('FRAME', f, round((time.time() - t0) / (i + 1), 2), flush=True)
    print('DONE', len(frames), round(time.time() - t0, 1), flush=True)
