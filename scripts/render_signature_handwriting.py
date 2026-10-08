#!/usr/bin/env python3
"""Write the intro handwriting letter by letter, in Paul's own pen order.

The approved still (intro-handwriting-split-complete.png, made from Paul's
handwriting photographs) stays the source of every ink pixel. This script only
decides when each pixel appears: every letter has explicit strokes in the
order Paul writes them, given as a few waypoints that are snapped to the
centreline of the ink and followed along it.

Pen speed follows the two-thirds power law of human handwriting: the pen
slows in tight curves and runs on straight strokes, so the signature reads as
one quick, fluid movement.

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
FADE = 0.035          # each ink pixel settles in 35 ms behind the pen
HOLD = 1.2            # the finished page rests before the loop ends
LIFT = 0.05           # pen lift between strokes and letters
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

# Lines: (name, letters, pause before the line, pen time, region x0, y0, x1, y1).
# Times are video seconds; the site plays the video at 1.25x, so a viewer sees
# 4/5 of them. The signature is written calmly in 4 s on the site (5.3 s of pen
# time here, of which the joins between letters save 0.3 s). A duration of None
# would give a line the motto's pace instead.
LINES = [
    ("signature", SIGNATURE, 0.30, 5.30, (40, 295, 862, 662)),
    ("trust", TRUST, 0.40, 1.35, (545, 682, 862, 742)),
    ("is my", IS_MY, 0.30, 1.15, (575, 768, 790, 868)),
]
CURRENCY = (0.30, 2.05, (548, 875, 860, 1020))


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
    """Time per 1 px step: the pen slows in curves (two-thirds power law)."""
    if len(points) < 3:
        return np.ones(max(len(points) - 1, 1))
    heading = np.unwrap(np.arctan2(*np.diff(points, axis=0)[:, ::-1].T))
    curvature = np.abs(np.gradient(heading))
    curvature = ndimage.uniform_filter1d(curvature, 9)
    return np.cbrt(curvature + 0.03)


def schedule(letters, start, duration, coords, index, tree):
    traced = []
    for name, strokes in letters:
        traced.append((name, [trace(stroke, coords, index, tree) for stroke in strokes]))
    lifts = sum(len(strokes) for _, strokes in traced) - 1
    total = sum(pen_weights(points).sum() for _, strokes in traced for points in strokes)
    scale = (duration - LIFT * lifts) / total
    cursor, result = start, []
    for name, strokes in traced:
        points_all, times_all, letter_start = [], [], cursor
        for points in strokes:
            weights = pen_weights(points) * scale
            times = cursor + np.r_[0, np.cumsum(weights)]
            points_all.append(points)
            times_all.append(times[: len(points)])
            cursor = times[len(points) - 1] + LIFT
        # Strokes that continue the previous letter do not lift the pen.
        result.append({"name": name, "points": np.vstack(points_all), "times": np.concatenate(times_all),
                       "start": letter_start, "end": cursor - LIFT})
    # Letters joined in one movement share their ends: remove the lift between them.
    for number in range(1, len(result)):
        before, after = result[number - 1], result[number]
        if np.hypot(*(before["points"][-1] - after["points"][0])) < 2.5:
            shift = after["start"] - before["end"]
            for item in result[number:]:
                item["times"] = item["times"] - shift
                item["start"] -= shift
                item["end"] -= shift
    return result


def currency_letters():
    from render_handwriting_photo import catmull_rom, cumulative_lengths
    start, duration, glyphs = CURRENCY_LINES[0]
    return [(glyph.name, [np.asarray(path, dtype=np.float32) for path in glyph.paths]) for glyph in glyphs], \
        (catmull_rom, cumulative_lengths)


def schedule_currency(start, duration):
    """currency keeps its approved hand-traced paths, at the new pace."""
    letters, (catmull_rom, cumulative_lengths) = currency_letters()
    prepared = []
    for name, paths in letters:
        strokes = []
        for anchors in paths:
            points = catmull_rom(anchors, 32)
            distance, length = cumulative_lengths(points)
            samples = np.linspace(0, length, max(2, int(length) + 1))
            strokes.append(np.column_stack([np.interp(samples, distance, points[:, i]) for i in (0, 1)]))
        prepared.append((name, strokes))
    lifts = sum(len(strokes) for _, strokes in prepared) - 1
    total = sum(pen_weights(points).sum() for _, strokes in prepared for points in strokes)
    scale = (duration - LIFT * lifts) / total
    cursor, result = start, []
    for name, strokes in prepared:
        pts, tms, letter_start = [], [], cursor
        for points in strokes:
            times = cursor + np.r_[0, np.cumsum(pen_weights(points) * scale)]
            pts.append(points)
            tms.append(times[: len(points)])
            cursor = times[len(points) - 1] + LIFT
        result.append({"name": name, "points": np.vstack(pts), "times": np.concatenate(tms),
                       "start": letter_start, "end": cursor - LIFT})
    return result


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
    reveal = np.full(gray.shape, np.inf, dtype=np.float32)
    # The motto's pace: seconds of pen time per unit of pen weight.
    def weight(letters):
        traced = [[trace(stroke, coords, index, tree) for stroke in strokes] for _, strokes in letters]
        return sum(pen_weights(points).sum() for strokes in traced for points in strokes), \
            sum(len(strokes) for strokes in traced) - 1
    paces = []
    for _, letters, _, duration, _ in LINES:
        if duration is not None:
            total, lifts = weight(letters)
            paces.append((duration - LIFT * lifts) / total)
    pace = float(np.mean(paces))
    lines, cursor = [], 0.0
    for name, letters, pause, duration, region in LINES:
        if duration is None:
            total, lifts = weight(letters)
            duration = total * pace + LIFT * lifts
        scheduled = schedule(letters, cursor + pause, duration, coords, index, tree)
        reveal_map(gray, scheduled, region, reveal)
        lines.append((name, scheduled))
        cursor = max(item["end"] for item in scheduled)
    pause, duration, region = CURRENCY
    scheduled = schedule_currency(cursor + pause, duration)
    reveal_map(gray, scheduled, region, reveal)
    lines.append(("currency", scheduled))
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
