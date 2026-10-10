"""Fade the border of each dive drawing to paper, once, in the file itself.

  python3 scripts/bake_dive_edges.py

A smaller drawing blooms inside the larger one instead of showing an edge.
The fade used to be painted in the browser on every load, a full 1920 px
canvas per drawing at the moment the dive reached it, which cost a stall
mid-scroll and twice the memory. Baked in, the browser only decodes the
file. The fade matches the old one exactly: white over the outer 7 % of
each side, opaque at the edge and gone at 7 % in. Each file is re-encoded at
the best quality that keeps it no larger than before, and marked, so running
the script twice changes nothing.
"""
import io
from pathlib import Path

import numpy as np
from PIL import Image

ASSETS = Path(__file__).resolve().parent.parent / 'dist' / 'assets'
NAMES = ['gyri', 'inside', 'dendrite', 'synapse', 'molecule', 'cosmos', 'web', 'deep']


def bake(a):
    h, w = a.shape[:2]
    edge = round(min(w, h) * 0.07)
    x = np.arange(w) + 0.5
    y = np.arange(h) + 0.5
    # Each side lays white over the drawing, opaque at the edge, clear at `edge`.
    keep = ((1 - np.clip(1 - x / edge, 0, 1)) * (1 - np.clip(1 - (w - x) / edge, 0, 1)))[None, :]
    keep = keep * ((1 - np.clip(1 - y / edge, 0, 1)) * (1 - np.clip(1 - (h - y) / edge, 0, 1)))[:, None]
    return 255 - (255 - a) * keep[..., None]


MARK = 'brinkmannpaul: edges baked'


def main():
    for name in NAMES:
        path = ASSETS / f'neuro-{name}.webp'
        source = Image.open(path)
        if source.getexif().get(270) == MARK:
            print(f'{path.name}: edges already baked')
            continue
        size = path.stat().st_size
        a = np.asarray(source.convert('RGB')).astype(np.float32)
        out = Image.fromarray(np.clip(bake(a) + 0.5, 0, 255).astype(np.uint8))
        exif = Image.Exif()
        exif[270] = MARK
        for quality in range(90, 60, -2):
            data = io.BytesIO()
            out.save(data, 'WEBP', quality=quality, method=6, exif=exif.tobytes())
            if data.tell() <= size:
                break
        path.write_bytes(data.getvalue())
        print(f'{path.name}: quality {quality}, {size // 1024} KB before, {data.tell() // 1024} KB now')


if __name__ == '__main__':
    main()
