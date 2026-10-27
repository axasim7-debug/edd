"""Black hole hanging in the sky of a real place: the same Schwarzschild ray
tracing as tools/lens_render.py, applied to a 360° photo (Poly Haven HDRI,
CC0, equirectangular) with free camera and hole directions, so the skyline and
the stars bend around the shadow physically.
Usage: python3 tools/lens_scene.py <hdri_dir> <out_dir> [shot ...]
"""
import os, subprocess, sys
import cv2
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from lens_render import W, H, FPS, SS, phi_table, ease, lerp


def dirv(lon, lat):
    lon, lat = np.radians(lon), np.radians(lat)
    return np.array([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)])


def render(sky, r, hole, fwd, roll, fov, shake=(0.0, 0.0)):
    w, h = int(W * SS), int(H * SS)
    f = fwd / np.linalg.norm(fwd)
    up0 = np.array([0.0, 1.0, 0.0])
    rt = np.cross(up0, f); rt /= np.linalg.norm(rt)
    up = np.cross(f, rt)
    c, s = np.cos(np.radians(roll)), np.sin(np.radians(roll))
    rt, up = c * rt + s * up, -s * rt + c * up
    ty = np.tan(np.radians(fov) / 2)
    tx = ty * w / h
    X, Y = np.meshgrid(np.linspace(-tx, tx, w, dtype=np.float32) + shake[0], np.linspace(ty, -ty, h, dtype=np.float32) + shake[1])
    d = f[None, None, :] + X[..., None] * rt + Y[..., None] * up
    d /= np.linalg.norm(d, axis=2, keepdims=True)
    cpsi = np.clip(d @ hole, -1, 1)
    psi = np.arccos(cpsi)
    e = d - cpsi[..., None] * hole
    e /= np.maximum(np.linalg.norm(e, axis=2, keepdims=True), 1e-9)
    tp, tphi = phi_table(r)
    cap = np.isnan(tphi)
    phi = np.interp(psi, tp, np.where(cap, 0, tphi))
    dead = np.interp(psi, tp, cap.astype(np.float32)) > 0.5
    out = np.cos(phi)[..., None] * (-hole) + np.sin(phi)[..., None] * e
    lon = np.degrees(np.arctan2(out[..., 0], out[..., 2]))
    lat = np.degrees(np.arcsin(np.clip(out[..., 1], -1, 1)))
    sh, sw = sky.shape[:2]
    mx = ((lon / 360 + 0.5) * sw).astype(np.float32)
    my = ((90 - lat) / 180 * sh).astype(np.float32)
    img = cv2.remap(sky, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    img[dead] = 0
    return cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA)


def grade(img, gain=1.0):
    x = img.astype(np.float32) / 255 * gain
    x = np.clip(x, 0, 1) ** 1.08
    bloom = cv2.GaussianBlur(np.clip(x - 0.7, 0, 1), (0, 0), 8) * 0.7
    return (np.clip(x + bloom, 0, 1) * 255).astype(np.uint8)


# name: (hdri, seconds, hole (lon, lat), start, end) with start/end = (r, cam_lon, cam_lat, roll, fov)
SHOTS = {
    'city_reveal': ('shanghai_bund', 3.0, (36, 27), (19, 36, 9, -2, 72), (16, 36, 19, 1, 70)),
    'savanna_huge': ('dikhololo_night', 3.2, (-20, 24), (10, -20, 6, 0, 74), (8.2, -20, 13, 2, 74)),
    'city_outside': ('hansaplatz', 3.6, (0, 34), (9, 0, 22, -3, 80), (7.2, 6, 27, 3, 80)),
    'city_final': ('shanghai_bund', 4.1, (36, 27), (15, 36, 17, 0, 70), (6.2, 36, 26, 4, 58)),
}

if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    only = set(sys.argv[3:])
    os.makedirs(out, exist_ok=True)
    cache = {}
    for name, (hdri, secs, hl, a, b) in SHOTS.items():
        if only and name not in only:
            continue
        if hdri not in cache:
            sky = cv2.imread(f'{src}/{hdri}.jpg')
            cache[hdri] = cv2.resize(sky, (6144, 3072), interpolation=cv2.INTER_AREA)
        sky = cache[hdri]
        hole = dirv(*hl)
        n = int(round(secs * FPS))
        wr = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                               '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', f'{out}/{name}.mp4'], stdin=subprocess.PIPE)
        rng = np.random.default_rng(len(name))
        sx = sy = 0.0
        for i in range(n):
            k = ease(i / max(1, n - 1))
            r = float(np.exp(lerp(np.log(a[0]), np.log(b[0]), k)))
            cam = [lerp(a[j], b[j], k) for j in range(1, 5)]
            # gentle handheld drift
            sx = 0.9 * sx + 0.1 * rng.normal(0, 0.004)
            sy = 0.9 * sy + 0.1 * rng.normal(0, 0.004)
            wr.stdin.write(grade(render(sky, r, hole, dirv(cam[0], cam[1]), cam[2], cam[3], (sx, sy))).tobytes())
        wr.stdin.close(); wr.wait()
        print(name, n, flush=True)
