"""Turns real footage/photos into a pencil-and-charcoal animatic drawing.
Lines = difference-of-Gaussians edges; tone = cross-hatching whose density
follows brightness; regions of black fully enclosed by light (a black hole's
shadow) are filled with dense charcoal. `boil` picks one of a few hatch/jitter
variants so lines shimmer like redrawn animatic frames.
"""
import cv2
import numpy as np

_HATCH = {}

def hatch(h, w, angle, spacing, variant):
    key = (h, w, angle, spacing, variant)
    if key in _HATCH:
        return _HATCH[key]
    rng = np.random.default_rng(variant * 31 + int(angle))
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    a = np.deg2rad(angle)
    d = xx * np.cos(a) + yy * np.sin(a)
    wob = cv2.GaussianBlur(rng.standard_normal((h // 8 + 1, w // 8 + 1)).astype(np.float32), (0, 0), 2)
    wob = cv2.resize(wob, (w, h)) * 6
    phase = (d + wob + variant * spacing * 0.37) % spacing
    line = np.clip(1 - np.abs(phase - spacing / 2) / 1.3, 0, 1)
    # broken strokes: fade in and out along the stroke
    gaps = cv2.resize(rng.random((h // 24 + 1, w // 24 + 1)).astype(np.float32), (w, h), interpolation=cv2.INTER_CUBIC)
    line *= np.clip(gaps * 1.6, 0.25, 1)
    _HATCH[key] = line
    return line


def shadow_mask(L, seeds, thr=2.5 / 255):
    """The hole's shadow: pure-black (renders put exactly 0 there; space never is)
    solid, convex regions under the seed points (fractions of w, h). Regions
    reaching the top edge are open space and are skipped."""
    dark = (cv2.GaussianBlur(L, (0, 0), 1.5) < thr).astype(np.uint8)
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    h, w = dark.shape
    _, lab = cv2.connectedComponents(dark, connectivity=4)
    top = set(np.unique(lab[0]))
    mask = np.zeros_like(L)
    for sx, sy in seeds:
        x, y = int(sx * (w - 1)), int(sy * (h - 1))
        i = lab[y, x]
        if not dark[y, x] or i in top:
            continue
        comp = (lab == i).astype(np.uint8)
        area = comp.sum()
        cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        hull = cv2.contourArea(cv2.convexHull(np.vstack(cnts)))
        if area > 0.0005 * h * w and area / max(hull, 1) > 0.8:
            mask[comp > 0] = 1
    return cv2.GaussianBlur(mask, (0, 0), 3)


def sketch(bgr, variant=0, line_gain=9.0, tone_gain=0.75, invert_tone=False, seeds=()):
    h, w = bgr.shape[:2]
    L = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    raw = L
    L = np.clip(L / max(0.2, float(np.percentile(L, 99.7))), 0, 1)
    # small hand jitter per variant
    if variant:
        rng = np.random.default_rng(variant)
        M = np.float32([[1, 0, rng.uniform(-1.5, 1.5)], [0, 1, rng.uniform(-1.5, 1.5)]])
        L = cv2.warpAffine(L, M, (w, h), borderMode=cv2.BORDER_REFLECT)
        raw = cv2.warpAffine(raw, M, (w, h), borderMode=cv2.BORDER_REFLECT)
    s = max(1.0, w / 900)
    g1 = cv2.GaussianBlur(L, (0, 0), 1.0 * s)
    g2 = cv2.GaussianBlur(L, (0, 0), 1.8 * s)
    lines = np.clip((np.abs(g1 - g2) * line_gain) ** 0.8, 0, 1)
    tone = (1 - L) if invert_tone else np.clip((L - 0.1) / 0.9, 0, 1)
    tone = np.clip(tone ** 0.9 * tone_gain, 0, 1)
    sp = 7 * s
    t1 = hatch(h, w, 35, sp, variant)
    t2 = hatch(h, w, -50, sp, variant + 7)
    t3 = hatch(h, w, 80, sp * 0.8, variant + 13)
    shade = t1 * np.clip(tone * 2.2, 0, 1) + t2 * np.clip(tone * 2.2 - 0.7, 0, 1) + t3 * np.clip(tone * 2.2 - 1.3, 0, 1)
    shade = np.clip(shade * 0.85, 0, 1)
    dark = np.maximum(lines, shade)
    if seeds:
        m = shadow_mask(raw, seeds)
        rng = np.random.default_rng(variant + 101)
        grain = cv2.GaussianBlur(rng.random((h, w)).astype(np.float32), (0, 0), 1.2)
        grain = (grain - grain.mean()) / (grain.std() + 1e-6)
        smudge = cv2.resize(rng.random((h // 90 + 2, w // 90 + 2)).astype(np.float32), (w, h), interpolation=cv2.INTER_CUBIC)
        charcoal = np.clip(0.74 + 0.07 * grain + 0.1 * smudge + 0.12 * np.maximum(t1, t2), 0, 0.97)
        dark = np.maximum(dark, m * charcoal)
    # graphite on paper: return alpha of graphite (0..1)
    return np.clip(dark, 0, 1)


def sketch_photo(bgr, variant=0, blur=21, strength=1.0):
    """Pencil portrait from a photo (colour-dodge sketch) + hatching in the shadows."""
    h, w = bgr.shape[:2]
    g = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
    if variant:
        rng = np.random.default_rng(variant)
        M = np.float32([[1, 0, rng.uniform(-1.2, 1.2)], [0, 1, rng.uniform(-1.2, 1.2)]])
        g = cv2.warpAffine(g, M, (w, h), borderMode=cv2.BORDER_REFLECT)
    s = max(1.0, w / 900)
    b = cv2.GaussianBlur(255 - g, (0, 0), blur * s / 3)
    dodge = np.clip(g * 255 / np.maximum(1, 255 - b), 0, 255) / 255
    lines = np.clip((1 - dodge) * 2.2 * strength, 0, 1) ** 0.9
    tone = np.clip(1 - g / 255, 0, 1)
    sp = 6 * s
    shade = hatch(h, w, 40, sp, variant) * np.clip(tone * 1.6 - 0.5, 0, 1) + hatch(h, w, -45, sp, variant + 5) * np.clip(tone * 1.6 - 1.0, 0, 1)
    return np.clip(np.maximum(lines, shade * 0.7), 0, 1)


def make_paper(w, h, seed=3):
    """Seamless paper: warm base, soft blotches, fine grain and a few fibres."""
    rng = np.random.default_rng(seed)
    low = cv2.resize(rng.standard_normal((h // 120 + 2, w // 120 + 2)).astype(np.float32), (w, h), interpolation=cv2.INTER_CUBIC)
    mid = cv2.GaussianBlur(rng.standard_normal((h, w)).astype(np.float32), (0, 0), 6)
    fine = rng.standard_normal((h, w)).astype(np.float32)
    v = 1 + 0.018 * low + 0.03 * mid / mid.std() * 0.4 + 0.012 * fine
    base = np.array([214, 230, 237], np.float32)  # BGR of #EDE6D6
    img = base[None, None, :] * v[..., None]
    return np.clip(img, 0, 255).astype(np.uint8)
