"""Renders a Schwarzschild black hole lensing a real sky (ESO Milky Way
panorama, equirectangular, galactic coordinates) for a static observer at
radius r (units of the horizon radius rs = 1). Each pixel's ray is traced back
analytically: impact parameter b = r·sinψ/√(1−1/r), azimuth swept
φ = ∫ du/√(1/b² − u² + u³) (u = 1/r), so the Einstein ring, the photon ring and
the growing shadow come from the metric, not from drawing.
Usage: python3 tools/lens_render.py <sky.jpg> <out_dir> [shot ...]
"""
import os, subprocess, sys
import cv2
import numpy as np

W, H, FPS, SS = 1080, 1920, 30, 1.5
BC = 1.5 * np.sqrt(3)  # critical impact parameter (rs = 1)
GLx, GLw = np.polynomial.legendre.leggauss(48)
GLx, GLw = (GLx + 1) / 2, GLw / 2  # on [0, 1]


def dirv(lon, lat):
    lon, lat = np.radians(lon), np.radians(lat)
    return np.array([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)])


HOLE = dirv(6.0, -4.0)  # the hole sits just below the galactic centre


def umax_of(b):
    """Smallest positive root of u³ − u² + 1/b² (turning point), b > BC."""
    lo, hi = np.zeros_like(b), np.full_like(b, 2 / 3)
    c = 1 / b ** 2
    for _ in range(50):
        mid = (lo + hi) / 2
        pos = mid ** 3 - mid ** 2 + c > 0
        lo, hi = np.where(pos, mid, lo), np.where(pos, hi, mid)
    return (lo + hi) / 2


def integral_to_turn(a, um, b):
    """∫_a^um du/√g with the endpoint square-root singularity removed (u = um − (um−a)s²)."""
    s = GLx[None, :]
    u = um[:, None] - (um - a)[:, None] * s ** 2
    g = 1 / b[:, None] ** 2 - u ** 2 + u ** 3
    f = 2 * (um - a)[:, None] * s / np.sqrt(np.maximum(g, 1e-12))
    return (f * GLw).sum(1)


def integral_plain(a, c, b):
    u = a[:, None] + (c - a)[:, None] * GLx[None, :]
    g = 1 / b[:, None] ** 2 - u ** 2 + u ** 3
    return ((c - a)[:, None] / np.sqrt(np.maximum(g, 1e-12)) * GLw).sum(1)


def phi_table(r, n=6000):
    """Swept azimuth φ(ψ) for ψ in [0, π]; NaN = captured."""
    psi = np.linspace(1e-4, np.pi - 1e-4, n)
    b = r * np.sin(psi) / np.sqrt(1 - 1 / r)
    u0 = np.full(n, 1 / r)
    phi = np.full(n, np.nan)
    inward = psi < np.pi / 2
    ok = inward & (b > BC * 1.0005) & (r > 1.5)
    if ok.any():
        um = umax_of(b[ok])
        phi[ok] = integral_to_turn(u0[ok], um, b[ok]) + integral_to_turn(np.zeros(ok.sum()), um, b[ok])
    out = ~inward & ((r > 1.5) | (b < BC))
    if out.any():
        phi[out] = integral_plain(np.zeros(out.sum()), u0[out], b[out])
    return psi, phi


def basis(fwd, roll):
    f = fwd / np.linalg.norm(fwd)
    up0 = np.array([0.0, 1.0, 0.0])
    rt = np.cross(up0, f); rt /= np.linalg.norm(rt)
    up = np.cross(f, rt)
    c, s = np.cos(np.radians(roll)), np.sin(np.radians(roll))
    return f, c * rt + s * up, -s * rt + c * up


def rot(v, axis, deg):
    axis = axis / np.linalg.norm(axis)
    a = np.radians(deg)
    return v * np.cos(a) + np.cross(axis, v) * np.sin(a) + axis * np.dot(axis, v) * (1 - np.cos(a))


def render(sky, r, yaw, pitch, roll, fov):
    w, h = int(W * SS), int(H * SS)
    f = rot(rot(HOLE, np.array([0, 1.0, 0]), yaw), np.cross(HOLE, [0, 1.0, 0]), pitch)
    f, rt, up = basis(f, roll)
    ty = np.tan(np.radians(fov) / 2)
    tx = ty * w / h
    xs = np.linspace(-tx, tx, w, dtype=np.float32)
    ys = np.linspace(ty, -ty, h, dtype=np.float32)
    X, Y = np.meshgrid(xs, ys)
    d = f[None, None, :] + X[..., None] * rt + Y[..., None] * up
    d /= np.linalg.norm(d, axis=2, keepdims=True)
    cpsi = np.clip(d @ HOLE, -1, 1)
    psi = np.arccos(cpsi)
    e = d - cpsi[..., None] * HOLE
    e /= np.maximum(np.linalg.norm(e, axis=2, keepdims=True), 1e-9)
    tp, tphi = phi_table(r)
    cap = np.isnan(tphi)
    phi = np.interp(psi, tp, np.where(cap, 0, tphi))
    dead = np.interp(psi, tp, cap.astype(np.float32)) > 0.5
    out = np.cos(phi)[..., None] * (-HOLE) + np.sin(phi)[..., None] * e
    lon = np.degrees(np.arctan2(out[..., 0], out[..., 2]))
    lat = np.degrees(np.arcsin(np.clip(out[..., 1], -1, 1)))
    sh, sw = sky.shape[:2]
    mx = ((-lon + 180) / 360 * sw).astype(np.float32)  # galactic longitude increases to the left
    my = ((90 - lat) / 180 * sh).astype(np.float32)
    img = cv2.remap(sky, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    img[dead] = 0
    return cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA)


def grade(img):
    x = img.astype(np.float32) / 255
    x = np.clip((x - 0.03) * 1.25, 0, 1) ** 1.15
    bloom = cv2.GaussianBlur(np.clip(x - 0.6, 0, 1), (0, 0), 6) * 0.6
    return (np.clip(x + bloom, 0, 1) * 255).astype(np.uint8)


def lerp(a, b, k):
    return a + (b - a) * k


def ease(k):
    return k * k * (3 - 2 * k)


# shot: seconds, and (r, yaw, pitch, roll, fov) at start and end; r is interpolated in log space
SHOTS = {
    'approach_close': (8.3, (30, 0, 3, 0, 62), (21, 0, 2, 6, 60)),
    'wide': (5.5, (70, -10, 4, 0, 72), (60, -6, 3, 3, 70)),
    'fall_in': (12.2, (40, 0, 1, 0, 64), (6.5, 0, 0, 5, 64)),
    'orbit': (2.6, (13, 16, 0, -6, 62), (12, 11, 0, -3, 62)),
    'last_light': (15.9, (6.5, 0, 0, 5, 64), (2.2, 0, 0, 12, 40)),
    'look_back': (8.3, (1.25, 180, 0, 0, 100), (1.04, 180, 0, 8, 100)),
    'photon_ring': (5.0, (11, 15, -2, 0, 60), (10, 10, -2, 3, 60)),
    'final': (7.7, (24, 0, 0, 0, 62), (2.4, 0, 0, 12, 30)),
}

if __name__ == '__main__':
    sky_path, out = sys.argv[1], sys.argv[2]
    only = set(sys.argv[3:])
    os.makedirs(out, exist_ok=True)
    sky = cv2.imread(sky_path)
    for name, (secs, a, b) in SHOTS.items():
        if only and name not in only:
            continue
        n = int(round(secs * FPS))
        wr = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                               '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', f'{out}/{name}.mp4'], stdin=subprocess.PIPE)
        for i in range(n):
            k = ease(i / max(1, n - 1))
            r = float(np.exp(lerp(np.log(a[0]), np.log(b[0]), k)))
            vals = [lerp(a[j], b[j], k) for j in range(1, 5)]
            wr.stdin.write(grade(render(sky, r, *vals)).tobytes())
        wr.stdin.close(); wr.wait()
        print(name, n, flush=True)
