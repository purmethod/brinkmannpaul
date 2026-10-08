#!/usr/bin/env python3
"""Write the intro handwriting letter by letter, in Paul's own pen order.

The approved still (intro-handwriting-split-complete.png, made from Paul's
handwriting photographs) stays the source of every ink pixel. This script only
decides when each pixel appears: every letter has explicit strokes in the
order Paul writes them, given as a few waypoints that are snapped to the
centreline of the ink and followed along it.

Pen speed follows the two-thirds power law of human handwriting: the pen
slows in curves and runs on straight strokes, smoothed so it never jerks.
Between strokes it travels on through the air instead of pausing, so the
writing flows. The signature and the motto each take 3.5 s on the site.

Run: python3 scripts/render_signature_handwriting.py [--sheet contact.png]
"""
from __future__ import annotations

import argparse
import heapq
import math
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.spatial import cKDTree

from render_currency_handwriting import LINES as CURRENCY_LINES
from render_split_handwriting import zhang_suen_thinning

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "dist/assets/intro-handwriting-split-complete.png"
OUTPUT = ROOT / "dist/assets/intro-handwriting-signed.mp4"
SIZE = (900, 1100)
FPS = 60
PLAYBACK = 1.25       # the site plays the video at 1.25x
SIGNATURE_SECONDS = 3.5  # on the site: the whole signature
MOTTO_SECONDS = 3.5      # on the site: "trust is my currency", first ink to underline
START = 0.30          # video s: the photo is seen before the pen starts
BREATH = 0.35         # video s between the signature and the motto
LINE_GAP = 0.22       # video s between the motto lines
FADE = 0.06           # each ink pixel flows in over 60 ms behind the pen
HOLD = 1.2            # the finished page rests before the video ends
AIR = 0.2             # pen weight per px of travel through the air between strokes
AIR_MIN = 4.0         # the shortest lift still takes a moment
CROSSING = 3.0        # px: where strokes cross, the first pass deposits the ink

# Waypoints in canvas pixels. Each letter is a list of strokes; each stroke is
# drawn from its first waypoint to its last, following the ink between them.
SIGNATURE = (
    ("B", [[(65, 485), (68, 440), (72, 400), (74, 392), (88, 390), (100, 398), (97, 420),
            (95, 445), (98, 470), (107, 488), (115, 505), (113, 522), (100, 532), (80, 531), (59, 526)]]),
    ("r", [[(146, 498), (130, 470), (124, 440), (130, 418), (148, 408), (165, 413), (170, 440),
            (172, 480), (171, 513)]]),
    ("i", [[(191, 425), (194, 465), (198, 503)]]),
    ("n", [[(215, 408), (219, 450), (224, 487), (233, 455), (243, 422), (248, 460), (255, 500),
            (262, 505), (268, 493)]]),
    ("k", [[(285, 422), (287, 455), (290, 482), (300, 450), (308, 426), (310, 460), (313, 495),
            (320, 500), (326, 489)]]),
    # m: down, up, down, up, down. "ann" follows without lifting the pen and
    # runs straight into the long stroke of the P, which goes all the way down.
    ("m", [[(343, 435), (350, 475), (356, 509), (350, 470), (348, 445), (362, 420), (368, 455),
            (373, 490), (390, 455), (405, 427), (406, 460), (408, 490)]]),
    ("a", [[(408, 490), (425, 460), (441, 430), (442, 460), (442, 490)]]),
    ("n", [[(442, 490), (455, 460), (467, 435), (470, 465), (473, 496), (490, 462), (503, 434),
            (505, 462), (507, 490)]]),
    ("n", [[(507, 490), (522, 462), (536, 436), (540, 455), (543, 472), (556, 455), (569, 440),
            (573, 462), (577, 485), (590, 460), (599, 440), (601, 458), (603, 474), (612, 460),
            (621, 447)]]),
    ("P stem", [[(621, 447), (626, 480), (632, 520), (640, 555), (646, 585), (652, 615), (657, 642)]]),
    # The P's bowl: from the left, up and over to the right, curling back in.
    ("P bowl", [[(610, 415), (598, 385), (592, 350), (596, 320), (603, 312), (620, 324), (640, 345),
                 (656, 366), (666, 392), (666, 410), (660, 428), (650, 437), (643, 427)]]),
    ("a", [[(675, 450), (685, 450), (690, 425), (697, 430), (700, 455), (700, 471)]]),
    ("u", [[(700, 471), (708, 450), (715, 421), (720, 450), (726, 470), (735, 450), (743, 434),
            (750, 452), (755, 466), (765, 450), (774, 438), (777, 455), (780, 468)]]),
    ("l", [[(780, 468), (800, 465), (815, 440), (828, 400), (835, 365), (840, 354), (846, 370),
            (842, 395), (833, 425), (830, 445), (838, 468)]]),
)

TRUST = (
    ("T", [[(557, 697), (595, 698), (635, 698)], [(595, 700), (595, 715), (595, 732)]]),
    ("r", [[(656, 730), (653, 712), (652, 696), (660, 690), (667, 695), (669, 710), (673, 724)]]),
    ("u", [[(673, 724), (685, 712), (696, 701), (699, 712), (702, 723), (712, 716), (720, 710),
            (722, 718), (725, 725)]]),
    ("s", [[(725, 725), (740, 724), (750, 712), (757, 701), (754, 712), (756, 722), (758, 730)]]),
    ("T", [[(792, 724), (790, 710), (782, 698), (810, 695), (846, 694)]]),
)

IS_MY = (
    ("i", [[(585, 785), (585, 803), (586, 820)]]),
    ("s", [[(627, 790), (620, 781), (612, 790), (618, 802), (625, 810), (622, 818), (611, 818)]]),
    ("m", [[(686, 780), (689, 806), (690, 790), (695, 779), (705, 795), (708, 800), (715, 790),
            (722, 784), (727, 795), (730, 800), (738, 790), (744, 785)]]),
    ("y", [[(744, 785), (749, 795), (752, 800), (760, 790), (767, 782), (770, 800), (774, 820),
            (778, 835), (765, 843), (740, 851), (709, 861)]]),
)

# Lines and the ink region each one owns (x0, y0, x1, y1).
REGIONS = {
    "signature": (40, 295, 862, 662),
    "trust": (545, 682, 862, 742),
    "is my": (575, 768, 790, 868),
    "currency": (548, 875, 860, 1020),
}


def load_ink():
    gray = np.asarray(Image.open(SOURCE).convert("L"), dtype=np.float32)
    return gray, gray < 160


def skeleton_graph(binary):
    skeleton = zhang_suen_thinning(binary)
    coords = np.argwhere(skeleton)  # (y, x)
    index = np.full(binary.shape, -1, dtype=np.int64)
    index[coords[:, 0], coords[:, 1]] = np.arange(len(coords))
    return coords, index, cKDTree(coords[:, ::-1])


def shortest(coords, index, start, goal):
    """Dijkstra along the skeleton from one skeleton pixel to another."""
    distance = {start: 0.0}
    previous = {}
    queue = [(0.0, start)]
    height, width = index.shape
    while queue:
        cost, current = heapq.heappop(queue)
        if current == goal:
            break
        if cost > distance[current]:
            continue
        y, x = coords[current]
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if not dy and not dx:
                    continue
                ny, nx = y + dy, x + dx
                if not (0 <= ny < height and 0 <= nx < width):
                    continue
                neighbour = int(index[ny, nx])
                if neighbour < 0:
                    continue
                step = cost + (1.4142 if dy and dx else 1.0)
                if step < distance.get(neighbour, math.inf):
                    distance[neighbour] = step
                    previous[neighbour] = current
                    heapq.heappush(queue, (step, neighbour))
    if goal not in distance:
        raise RuntimeError(f"No ink connects {coords[start][::-1]} and {coords[goal][::-1]}")
    path = [goal]
    while path[-1] != start:
        path.append(previous[path[-1]])
    return coords[path[::-1]][:, ::-1].astype(np.float32)  # (x, y)


def trace(waypoints, coords, index, tree):
    snapped = [int(tree.query(point)[1]) for point in waypoints]
    pieces = [shortest(coords, index, a, b) for a, b in zip(snapped, snapped[1:]) if a != b]
    points = np.vstack(pieces) if pieces else coords[snapped][:, ::-1].astype(np.float32)
    # Smooth the pixel staircase, then resample at 1 px along the stroke.
    if len(points) > 5:
        kernel = np.ones(5) / 5
        padded = np.pad(points, ((2, 2), (0, 0)), mode="edge")
        points = np.column_stack([np.convolve(padded[:, i], kernel, mode="valid") for i in (0, 1)])
    step = np.r_[0, np.cumsum(np.hypot(*np.diff(points, axis=0).T))]
    length = step[-1]
    samples = np.linspace(0, length, max(2, int(length) + 1))
    return np.column_stack([np.interp(samples, step, points[:, i]) for i in (0, 1)])


def pen_weights(points):
    """Time per 1 px step, after the two-thirds power law of handwriting.

    The pen slows in curves and runs on straight strokes; curvature and the
    resulting weights are smoothed along the stroke so the pen never brakes or
    surges abruptly.
    """
    if len(points) < 3:
        return np.ones(max(len(points) - 1, 1))
    heading = np.unwrap(np.arctan2(*np.diff(points, axis=0)[:, ::-1].T))
    curvature = ndimage.uniform_filter1d(np.abs(np.gradient(heading)), 35)
    return ndimage.uniform_filter1d(np.cbrt(curvature + 0.06), 15)


def eased(weights, lifts_in, lifts_out, reach=14):
    """A pen speeds up after touching down and slows before lifting off."""
    weights = weights.copy()
    # Short strokes of the small motto letters get a shorter run-up.
    reach = int(max(3, min(reach, 0.2 * len(weights))))
    ramp = np.linspace(0, 1, min(reach, len(weights)))
    slow = 1 + 0.6 * (1 - ramp * ramp * (3 - 2 * ramp))
    if lifts_in:
        weights[: len(slow)] *= slow
    if lifts_out:
        weights[len(weights) - len(slow):] *= slow[::-1]
    return weights


def air(a, b):
    """Pen weight for moving through the air from one stroke to the next."""
    distance = float(np.hypot(*(b - a)))
    return 0.0 if distance < 2.5 else max(AIR_MIN, AIR * distance)


def currency_letters():
    """currency keeps its approved hand-traced paths."""
    from render_handwriting_photo import catmull_rom, cumulative_lengths
    letters = []
    for glyph in CURRENCY_LINES[0][2]:
        strokes = []
        for anchors in glyph.paths:
            points = catmull_rom(np.asarray(anchors, dtype=np.float32), 32)
            distance, length = cumulative_lengths(points)
            samples = np.linspace(0, length, max(2, int(length) + 1))
            strokes.append(np.column_stack([np.interp(samples, distance, points[:, i]) for i in (0, 1)]))
        letters.append((glyph.name, strokes))
    return letters


def stroke_weights(strokes):
    """Weights of each stroke in a line, eased where the pen touches or lifts."""
    result = []
    for number, points in enumerate(strokes):
        lifts_in = number == 0 or air(strokes[number - 1][-1], points[0]) > 0
        lifts_out = number == len(strokes) - 1 or air(points[-1], strokes[number + 1][0]) > 0
        result.append(eased(pen_weights(points), lifts_in, lifts_out))
    return result


def group_weight(lines):
    """Ink plus air weight of a group of lines written at one pace."""
    total = 0.0
    for _, letters in lines:
        strokes = [points for _, letter in letters for points in letter]
        total += sum(weights.sum() for weights in stroke_weights(strokes))
        total += sum(air(a[-1], b[0]) for a, b in zip(strokes, strokes[1:]))
    return total


def lay_out(lines, start, span, gap):
    """Give every point of every stroke its time; the group takes `span`."""
    scale = (span - gap * (len(lines) - 1)) / group_weight(lines)
    cursor, result = start, []
    for number, (name, letters) in enumerate(lines):
        if number:
            cursor += gap
        scheduled, previous = [], None
        weights = iter(stroke_weights([points for _, letter in letters for points in letter]))
        for letter_name, strokes in letters:
            points_all, times_all = [], []
            for points in strokes:
                if previous is not None:
                    cursor += air(previous, points[0]) * scale
                times = cursor + np.r_[0, np.cumsum(next(weights) * scale)]
                points_all.append(points)
                times_all.append(times[: len(points)])
                cursor, previous = float(times[len(points) - 1]), points[-1]
            times = np.concatenate(times_all)
            scheduled.append({"name": letter_name, "points": np.vstack(points_all), "times": times,
                              "start": float(times[0]), "end": float(times[-1])})
        result.append((name, scheduled))
    return result, cursor


def reveal_map(gray, letters, region, reveal):
    x0, y0, x1, y1 = region
    ys, xs = np.where(gray[y0:y1, x0:x1] < 250)
    ys, xs = ys + y0, xs + x0
    pixels = np.column_stack((xs, ys)).astype(np.float32)
    trees = [cKDTree(item["points"]) for item in letters]
    owner = np.stack([tree.query(pixels)[0] for tree in trees]).argmin(axis=0)
    for number, item in enumerate(letters):
        chosen = owner == number
        if not np.any(chosen):
            continue
        k = min(64, len(item["points"]))
        distance, nearest = trees[number].query(pixels[chosen], k=k)
        if k == 1:
            distance, nearest = distance[:, None], nearest[:, None]
        candidates = np.where(distance <= distance[:, :1] + CROSSING, item["times"][nearest], np.inf)
        reveal[ys[chosen], xs[chosen]] = np.minimum(reveal[ys[chosen], xs[chosen]], candidates.min(axis=1))


def frame(gray, reveal, timestamp):
    progress = np.clip((timestamp - reveal) / FADE, 0, 1)
    progress = progress * progress * (3 - 2 * progress)
    value = 255 - (255 - gray) * progress
    return np.repeat(np.uint8(np.rint(value))[..., None], 3, axis=2)


def build():
    gray, binary = load_ink()
    coords, index, tree = skeleton_graph(binary)

    def traced(letters):
        return [(name, [trace(stroke, coords, index, tree) for stroke in strokes]) for name, strokes in letters]

    signature = [("signature", traced(SIGNATURE))]
    motto = [("trust", traced(TRUST)), ("is my", traced(IS_MY)), ("currency", currency_letters())]
    # Each part takes its time on the site; the video plays 1.25x faster.
    first, cursor = lay_out(signature, START, SIGNATURE_SECONDS * PLAYBACK, 0.0)
    second, _ = lay_out(motto, cursor + BREATH, MOTTO_SECONDS * PLAYBACK, LINE_GAP)
    lines = first + second
    reveal = np.full(gray.shape, np.inf, dtype=np.float32)
    for name, scheduled in lines:
        reveal_map(gray, scheduled, REGIONS[name], reveal)
    missing = (gray < 200) & ~np.isfinite(reveal)
    if missing.sum():
        print(f"warning: {missing.sum()} ink pixels outside every line region stay hidden")
    return gray, reveal, lines


def render(sheet: Path | None):
    gray, reveal, lines = build()
    end = float(np.nanmax(np.where(np.isfinite(reveal), reveal, np.nan))) + FADE
    duration = end + HOLD
    encoder = subprocess.Popen([
        "ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{SIZE[0]}x{SIZE[1]}", "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
        "-preset", "medium", "-tune", "animation", "-crf", "17", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(OUTPUT)], stdin=subprocess.PIPE)
    try:
        for number in range(math.ceil(duration * FPS)):
            encoder.stdin.write(frame(gray, reveal, number / FPS).tobytes())
    finally:
        encoder.stdin.close()
    if encoder.wait() != 0:
        raise RuntimeError("ffmpeg failed")
    for name, letters in lines:
        print(f"{name}: " + "  ".join(f"{item['name']} {item['start']:.2f}-{item['end']:.2f}" for item in letters))
    print(f"{OUTPUT.name}: {OUTPUT.stat().st_size:,} bytes, {FPS} fps, {duration:.2f}s video, "
          f"{duration / 1.25:.2f}s on the site")
    if sheet:
        contact_sheet(gray, reveal, lines, sheet)


def contact_sheet(gray, reveal, lines, path: Path):
    """Pen paths coloured by time over the still, plus frames along the way."""
    still = Image.fromarray(frame(gray, reveal, 1e9)).convert("RGB")
    draw = ImageDraw.Draw(still)
    for _, letters in lines:
        for item in letters:
            span = max(item["times"].max() - item["times"].min(), 1e-6)
            for (x, y), t in zip(item["points"][::2], item["times"][::2]):
                hue = (t - item["times"].min()) / span
                draw.point((x, y), fill=(int(255 * hue), 40, int(255 * (1 - hue))))
            x, y = item["points"][0]
            draw.ellipse((x - 3, y - 3, x + 3, y + 3), outline=(0, 160, 0), width=2)
    end = float(np.nanmax(np.where(np.isfinite(reveal), reveal, np.nan)))
    times = np.linspace(0.3, end + FADE, 12)
    tiles = [Image.fromarray(frame(gray, reveal, t)).crop((40, 290, 865, 1025)).resize((275, 245)) for t in times]
    sheet = Image.new("RGB", (still.width + 4 * 280, max(still.height, 3 * 250)), "white")
    sheet.paste(still, (0, 0))
    for number, tile in enumerate(tiles):
        sheet.paste(tile, (still.width + (number % 4) * 280, (number // 4) * 250))
        ImageDraw.Draw(sheet).text((still.width + (number % 4) * 280 + 4, (number // 4) * 250 + 4),
                                   f"{times[number]:.2f}s", fill=(200, 0, 0))
    sheet.save(path)
    print(f"contact sheet: {path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--sheet", type=Path, help="also save a contact sheet for checking the pen order")
    render(parser.parse_args().sheet)
