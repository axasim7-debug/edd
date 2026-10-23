"""Night-grades satellite mosaics: keeps real terrain and coastlines but
pulls them into a dark, cool, cinematic palette.
Usage: python3 tools/grade_dark.py public/enigma/sat/*.jpg   (writes *-dark.jpg)
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

def grade(src):
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.float32) / 255
    lum = a @ np.array([0.299, 0.587, 0.114], np.float32)
    # Partial desaturation, then darken with a soft curve.
    a = lum[..., None] * 0.45 + a * 0.55
    a = np.clip(a, 0, 1) ** 1.2 * 0.85
    a = np.clip((a - 0.22) * 1.35 + 0.22, 0, 1)
    # Cool shadows, slightly warm highlights.
    shadow = np.array([0.02, 0.05, 0.09], np.float32)
    a = a + shadow * (1 - lum[..., None]) * 0.7
    a[..., 0] *= 0.92
    a[..., 2] *= 1.08
    # Local contrast: unsharp the relief a little.
    out = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    out = out.filter(ImageFilter.UnsharpMask(radius=3, percent=60, threshold=2))
    dst = src.replace('.jpg', '-dark.jpg')
    out.save(dst, quality=90)
    print(dst)

for f in sys.argv[1:]:
    if not f.endswith('-dark.jpg'):
        grade(f)
