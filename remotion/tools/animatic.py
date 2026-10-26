"""Builds the animatic panels for Short #5: real NASA footage and photos redrawn
as pencil/charcoal (tools/sketchify.py) at 12 drawings per second, three
alternating "boil" variants, and a draw-on reveal at the start of each panel.
Output: white-background graphite clips (multiplied onto paper in Remotion)
and a transparent astronaut layer.
Usage: python3 tools/animatic.py <dir with NASA SVS mp4s> public/horizon/animatic [name ...]
"""
import os, subprocess, sys
import cv2
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from sketchify import sketch, sketch_photo

src, out = sys.argv[1], sys.argv[2]
only = set(sys.argv[3:])
os.makedirs(out, exist_ok=True)
FPS = 12
W, H = 1080, 1920
PLUNGE = 'crop=1152:2048:1472:0,scale=1080:1920'
SKY = 'crop=810:1440:1515:0,scale=1080:1920'
DISK = 'scale=2100:2100,crop=1080:1920'
DISKF, PLUNGEF, FLYF, ZOOMF = 'Black_Hole_Accretion_Disk_Sim_4k.mp4', '14576_BH_Plunge_Rectilinear_4096x2048_60.mp4', '14576_BH_FlyBy_Rectilinear_4096x2048_60.mp4', '14576_BH_Plunge_Zoom2b_4k60.mp4'
HOLE = [(0.5, 0.47), (0.5, 0.5)]
LOW = [(0.5, 0.97), (0.5, 0.85)]
# name: (file, src start, src end, output seconds, crop filter, shadow seeds)
CLIPS = {
    'disk_hook': (DISKF, 0.0, 8.3, 8.3, DISK, HOLE),
    'disk_face': (DISKF, 10.0, 15.5, 5.5, DISK, HOLE),
    'plunge_in': (PLUNGEF, 0.0, 21.0, 12.15, PLUNGE, [(0.5, 0.55), (0.5, 0.6), (0.5, 0.7), (0.5, 0.75)]),
    'plunge_cross': (PLUNGEF, 32.0, 48.0, 15.9, PLUNGE, LOW),
    'inside_hold': (PLUNGEF, 43.0, 48.0, 8.3, PLUNGE, LOW),  # past the horizon: the sky is still up there
    'flyby_ring': (FLYF, 26.0, 33.0, 5.0, PLUNGE, LOW + [(0.5, 0.6)]),
    'disk_end': (DISKF, 24.0, 31.7, 7.7, DISK, HOLE),
}
STILLS = {'einstein': ('public/horizon/art/einstein.jpg', 2.6)}


def reveal(dark, k, seed):
    """Draw-on: strokes appear over k in [0, 1], darkest first, in patches."""
    if k >= 1:
        return dark
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    sweep = np.hypot(xx - W / 2, (yy - H / 2) * 0.7) / np.hypot(W / 2, H * 0.35)  # from the centre outwards
    fine = cv2.GaussianBlur(rng.random((H, W)).astype(np.float32), (0, 0), 3)
    fine = (fine - fine.min()) / (fine.max() - fine.min())
    order = 0.6 * np.clip(sweep, 0, 1) + 0.25 * fine + 0.15 * (1 - np.clip(dark * 1.5, 0, 1))  # strong lines first
    vis = np.clip((k * 1.3 - order) / 0.08, 0, 1)
    return dark * vis


def writer(path):
    return subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                             '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', path], stdin=subprocess.PIPE)


def to_gray(dark):
    return (255 * (1 - 0.86 * dark)).astype(np.uint8)


for name, (f, a, b, length, vf, seeds) in CLIPS.items():
    if only and name not in only:
        continue
    speed = (b - a) / length
    rd = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', str(a), '-t', str(b - a), '-i', f'{src}/{f}', '-an',
                           '-vf', f'setpts=PTS/{speed},fps={FPS},{vf}', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
    wr = writer(f'{out}/{name}.mp4')
    i = 0
    while True:
        buf = rd.stdout.read(W * H * 3)
        if len(buf) < W * H * 3:
            break
        frame = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        dark = sketch(frame, variant=i % 3, line_gain=11, tone_gain=1.0, seeds=seeds)
        if name != 'disk_hook':  # the first panel is fully drawn on frame 0 (hook)
            dark = reveal(dark, i / (FPS * 0.9), hash(name) % 1000)
        wr.stdin.write(to_gray(dark).tobytes())
        i += 1
    wr.stdin.close(); wr.wait()
    print(name, i, 'drawings', f'{speed:.2f}x')

for name, (path, length) in STILLS.items():
    if only and name not in only:
        continue
    im = cv2.imread(path)
    h, w = im.shape[:2]
    tw = int(h * 9 / 16)
    im = cv2.resize(im[:, (w - tw) // 2:(w - tw) // 2 + tw] if tw <= w else im, (W, H))
    variants = [sketch_photo(im, v) for v in range(3)]
    wr = writer(f'{out}/{name}.mp4')
    n = int(length * FPS)
    for i in range(n):
        wr.stdin.write(to_gray(reveal(variants[i % 3], i / (FPS * 0.9), 7)).tobytes())
    wr.stdin.close(); wr.wait()
    print(name, n, 'drawings')

# Astronaut layer: cut out from the photo (space is black, Earth below), pencil, transparent.
if not only or 'astronaut' in only:
    im = cv2.imread('public/horizon/art/astronaut.jpg')
    im = im[0:int(im.shape[0] * 0.62)]
    L = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    m = (cv2.GaussianBlur(L, (0, 0), 3) > 45).astype(np.uint8)
    m[686:] = 0  # Earth's limb starts at y≈690 (only the tip of one boot is lost)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    mask = cv2.dilate((lab == big).astype(np.uint8), np.ones((9, 9), np.uint8))
    mask = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 2)
    x, y, w, h = cv2.boundingRect((mask > 0.1).astype(np.uint8))
    im, mask = im[y:y + h, x:x + w], mask[y:y + h, x:x + w]
    mask *= np.clip((h - np.arange(h)) / 40, 0, 1)[:, None]  # soften the cut boots
    im = (im * mask[..., None] + 255 * (1 - mask[..., None])).astype(np.uint8)  # white behind the suit
    dark = sketch_photo(im, 0, blur=15) * mask
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., :3] = (40, 42, 46)
    rgba[..., 3] = (np.clip(dark * 1.1, 0, 1) * 255).astype(np.uint8)
    # paper-white suit fill so the hole doesn't show through the astronaut
    fill = (mask > 0.5).astype(np.float32)
    cv2.imwrite(f'{out}/astronaut.png', rgba)
    suit = np.zeros((h, w, 4), np.uint8)
    suit[..., :3] = (214, 230, 237)
    suit[..., 3] = (fill * 255).astype(np.uint8)
    cv2.imwrite(f'{out}/astronaut_fill.png', suit)
    print('astronaut', w, h)
