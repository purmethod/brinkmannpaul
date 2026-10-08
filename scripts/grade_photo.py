"""Give a photo the site's film look and cut its circle.

Every photo on the site gets the same grade, so pictures from any camera or
light read as one series: analogue film colour, slightly held back (loud
oranges more so), warm skin and highlights, teal-leaning shadows, a soft
s-curve, fine grain and no hard black.

  python3 scripts/grade_photo.py SOURCE NAME CX CY R

writes dist/assets/photo-NAME.webp (the circle, 720 px) and
dist/assets/photo-NAME-full.webp (the whole photo, uncropped). CX, CY and R
place the circle in source pixels: faces and gestures in its upper third.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

ASSETS = Path(__file__).resolve().parent.parent / 'dist' / 'assets'
LOOK = dict(sat=0.82, orange=0.5, fade=0.12, white=0.965, curve=0.22, gamma=0.9, vignette=0.0,
            shadow=(-0.035, 0.015, 0.045), high=(0.06, 0.03, -0.05), warm=(1.0, 0.985, 0.95), grain=0.022)


def grade(img, sat, orange, fade, white, curve, gamma, vignette, shadow, high, warm, grain):
    a = (np.asarray(img).astype(np.float32) / 255) ** gamma
    luma = np.array([0.2126, 0.7152, 0.0722])
    L = (a * luma).sum(2, keepdims=True)
    mx, mn = a.max(2), a.min(2)
    d = mx - mn + 1e-6
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = d / (mx + 1e-6)
    # Hold back loud oranges and reds; skin stays natural.
    loud = np.exp(-((((hue - 22 + 180) % 360) - 180) / 18) ** 2) * np.clip((s - 0.35) / 0.4, 0, 1)
    a = L + (sat * (1 - orange * loud))[..., None] * (a - L)
    a = np.clip(a, 0, 1)
    a = a + curve * (a - a ** 2) * (a - 0.5) * 2
    L = (a * luma).sum(2, keepdims=True)
    a = a + (1 - L) ** 2 * np.array(shadow) + L ** 2 * np.array(high)
    a = a * np.array(warm)
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    edge = np.hypot(xx / (w - 1) - 0.5, (yy / (h - 1) - 0.5) * h / w)
    a = a * (1 - vignette * np.clip((edge - 0.25) / 0.45, 0, 1) ** 1.5)[..., None]
    a = fade + (white - fade) * np.clip(a, 0, 1)
    a = a + np.random.default_rng(7).normal(0, grain, (h, w))[..., None]
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))


def main(source, name, cx, cy, r):
    photo = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    circle = photo.crop((cx - r, cy - r, cx + r, cy + r)).resize((720, 720), Image.LANCZOS)
    grade(circle, **LOOK).save(ASSETS / f'photo-{name}.webp', quality=78, method=6)
    whole = photo.copy()
    whole.thumbnail((1080, 1440), Image.LANCZOS)
    # The whole photo is shown larger, so its grain can be finer.
    grade(whole, **{**LOOK, 'grain': 0.014}).save(ASSETS / f'photo-{name}-full.webp', quality=60, method=6)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], *map(int, sys.argv[3:6]))
