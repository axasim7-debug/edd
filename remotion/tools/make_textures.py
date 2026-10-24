"""Procedural surface textures for the paper style (no third-party images).
Usage: python3 tools/make_textures.py public/paper
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

out = sys.argv[1]
rng = np.random.default_rng(7)

def smooth_noise(h, w, scale):
    small = rng.random((max(2, h // scale), max(2, w // scale))).astype(np.float32)
    return np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255

# Dark cork board: fine granules + low-frequency patches.
H, W = 6400, 2400
gran = rng.random((H, W)).astype(np.float32)
gran = np.asarray(Image.fromarray((gran * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1))).astype(np.float32) / 255
patch = smooth_noise(H, W, 180) * 0.6 + smooth_noise(H, W, 40) * 0.4
base = np.array([0x33, 0x27, 0x1e], np.float32) / 255
v = 0.72 + 0.35 * (gran - 0.5) + 0.25 * (patch - 0.5)
specks = (rng.random((H, W)) > 0.985).astype(np.float32) * -0.25
img = np.clip(base[None, None, :] * (v + specks)[..., None], 0, 1)
Image.fromarray((img * 255).astype(np.uint8)).save(f'{out}/cork.jpg', quality=88)

# Archival paper: ivory with fibres and soft mottling.
S = 1024
fib = rng.random((S, S)).astype(np.float32)
fib = np.asarray(Image.fromarray((fib * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255
mott = smooth_noise(S, S, 64)
ivory = np.array([0xE8, 0xDD, 0xC5], np.float32) / 255
pv = 0.97 + 0.05 * (fib - 0.5) + 0.06 * (mott - 0.5)
img = np.clip(ivory[None, None, :] * pv[..., None], 0, 1)
Image.fromarray((img * 255).astype(np.uint8)).save(f'{out}/paper.jpg', quality=90)
print('ok')
