"""Give a photo the site's honey look and cut its circle.

Every photo on the site gets the same grade, so pictures from any camera or
light read as one series: subtle but warm, colour held back (loud oranges
more so), warm skin, amber highlights, warm brown shadows, a gentle curve,
fine grain and no hard black.

  python3 scripts/grade_photo.py SOURCE NAME CX CY R [EV] [BLUE]

writes dist/assets/photo-NAME.webp (the circle, 720 px) and
dist/assets/photo-NAME-full.webp (the whole photo, uncropped). CX, CY and R
place the circle in source pixels: faces and gestures in its upper third.
EV corrects exposure in stops before the grade, e.g. -0.4 for bright snow so
it keeps its texture. BLUE (0 to 1) keeps strong blues clear and out of the
warm cast, for places whose blue is the point, such as sidi bou saïd.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

ASSETS = Path(__file__).resolve().parent.parent / 'dist' / 'assets'
LOOK = dict(sat=0.72, orange=0.5, fade=0.12, white=0.972, curve=0.12, gamma=0.86, vignette=0.0,
            shadow=(0.026, 0.008, -0.018), high=(0.055, 0.026, -0.042), warm=(1.03, 0.995, 0.915), grain=0.012,
            skin_sat=0.3, skin_warm=0.07)


def grade(img, sat, orange, fade, white, curve, gamma, vignette, shadow, high, warm, grain, skin_sat=0.0, skin_warm=0.0, ev=0.0, blue=0.0):
    a = np.clip(np.asarray(img).astype(np.float32) / 255 * 2 ** ev, 0, 1) ** gamma
    luma = np.array([0.2126, 0.7152, 0.0722])
    L = (a * luma).sum(2, keepdims=True)
    mx, mn = a.max(2), a.min(2)
    d = mx - mn + 1e-6
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = d / (mx + 1e-6)
    # Hold back loud oranges and reds; skin, far less saturated, is left out.
    near = np.exp(-((((hue - 22 + 180) % 360) - 180) / 18) ** 2)
    loud = near * np.clip((s - 0.5) / 0.35, 0, 1)
    # Skin, pink to peach and softly saturated, keeps its colour and turns
    # from cool pink towards peach, so faces never look cold.
    skin = (np.exp(-((((hue - 10 + 180) % 360) - 180) / 24) ** 2)
            * np.clip((s - 0.06) / 0.08, 0, 1) * np.clip((0.5 - s) / 0.15, 0, 1))
    # Strong blues (doors, shutters, sea and sky) can keep their full colour.
    keep = blue * np.exp(-((((hue - 215 + 180) % 360) - 180) / 30) ** 2) * np.clip((s - 0.15) / 0.2, 0, 1)
    k = sat * (1 - orange * loud) * (1 + skin_sat * skin)
    a = L + (k * (1 - keep) + 1.08 * keep)[..., None] * (a - L)
    a = a * (1 + skin_warm * skin[..., None] * np.array([1.0, 0.35, -1.5]))
    a = np.clip(a, 0, 1)
    a = a + curve * (a - a ** 2) * (a - 0.5) * 2
    neutral = a
    L = (a * luma).sum(2, keepdims=True)
    a = a + (1 - L) ** 2 * np.array(shadow) + L ** 2 * np.array(high)
    a = a * np.array(warm)
    a = a + keep[..., None] * (neutral - a)
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    edge = np.hypot(xx / (w - 1) - 0.5, (yy / (h - 1) - 0.5) * h / w)
    a = a * (1 - vignette * np.clip((edge - 0.25) / 0.45, 0, 1) ** 1.5)[..., None]
    a = fade + (white - fade) * np.clip(a, 0, 1)
    a = a + np.random.default_rng(7).normal(0, grain, (h, w))[..., None]
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))


def main(source, name, cx, cy, r, ev=0.0, blue=0.0):
    photo = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    circle = photo.crop((cx - r, cy - r, cx + r, cy + r)).resize((720, 720), Image.LANCZOS)
    grade(circle, **LOOK, ev=ev, blue=blue).save(ASSETS / f'photo-{name}.webp', quality=78, method=6)
    whole = photo.copy()
    whole.thumbnail((1080, 1440), Image.LANCZOS)
    # The whole photo is shown larger, so its grain can be finer.
    grade(whole, **{**LOOK, 'grain': LOOK['grain'] * 0.7}, ev=ev, blue=blue).save(ASSETS / f'photo-{name}-full.webp', quality=60, method=6)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], *map(int, sys.argv[3:6]), *map(float, sys.argv[6:8]))
