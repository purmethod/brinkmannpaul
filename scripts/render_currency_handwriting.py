#!/usr/bin/env python3
"""Correct currency pen order while preserving the existing animation above it.

Reads the original photo-derived still and split MP4. Explicit paths schedule
existing ink pixels; they do not replace or redraw Paul's handwriting.
Run: python3 scripts/render_currency_handwriting.py
"""
from __future__ import annotations

import math
import subprocess
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.spatial import cKDTree

from render_handwriting_photo import catmull_rom, cumulative_lengths

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "dist/assets/intro-handwriting-split-complete.png"
OUTPUT = ROOT / "dist/assets/intro-handwriting-currency.mp4"
FPS = 60
FADE = 0.035


@dataclass(frozen=True)
class Glyph:
    name: str
    paths: tuple


def glyph(name, *paths):
    return Glyph(name, paths)


# Explicit C U R R E N C Y order, then the final underline.
LINES = (
    (7.04, 2.05, (
        glyph("C", [(583,910),(581,900),(570,911),(563,929),(565,942),(573,946),(586,939),(596,928)]),
        glyph("U", [(599,913),(600,931),(605,935),(613,923),(617,935),(624,939),(637,928)]),
        glyph("R1", [(642,908),(641,921),(639,945)],
              [(642,908),(650,904),(658,907),(661,916),(656,928),(651,941),(661,943),(670,940)]),
        glyph("R2", [(683,909),(683,922),(685,943)],
              [(683,909),(696,907),(703,913),(698,924),(690,939),(693,943),(703,941)]),
        glyph("E", [(725,904),(724,921),(724,936),(738,939),(759,937)],
              [(726,904),(742,902)], [(720,927),(739,922)]),
        glyph("N", [(762,905),(767,935)],
              [(765,917),(772,908),(780,919),(783,934),(788,937)]),
        glyph("C", [(804,909),(804,901),(796,916),(797,929),(804,934),(818,931),(828,926)]),
        glyph("Y", [(828,908),(831,924),(839,930),(846,925),(851,908)],
              [(849,919),(846,944),(846,967)]),
        glyph("underline", [(846,967),(813,979),(779,991),(752,1003),(733,1013)]),
    )),
)


def timeline():
    result = []
    for line_number, (start, duration, letters) in enumerate(LINES):
        prepared = []
        for letter in letters:
            paths = []
            for anchors in letter.paths:
                points = catmull_rom(np.asarray(anchors, dtype=np.float32), 32)
                distance, length = cumulative_lengths(points)
                paths.append((points, distance, length))
            prepared.append((letter, paths, sum(p[2] for p in paths)))
        # Equal pen speed within each line, with small deliberate pen lifts.
        stroke_gap = 0.012
        path_count = sum(len(paths) for _, paths, _ in prepared)
        gaps = stroke_gap * (path_count - len(letters)) + FADE * (len(letters) - 1)
        speed = sum(length for _, _, length in prepared) / (duration - gaps)
        cursor = start
        for letter, paths, _ in prepared:
            item = {"name": letter.name, "line": line_number, "start": cursor, "points": [], "times": []}
            for points, distance, length in paths:
                # Arc-length timing avoids speeding through sparsely traced parts.
                item["points"].append(points)
                item["times"].append(cursor + distance / speed)
                cursor += length / speed + stroke_gap
            cursor -= stroke_gap
            item["end"] = cursor
            item["points"] = np.vstack(item["points"])
            item["times"] = np.concatenate(item["times"])
            result.append(item)
            # The final ink of one letter settles before the next starts.
            cursor += FADE
    return result


def reveal_map(original, strokes):
    ink = np.min(original, axis=2) < 255
    ys, xs = np.where(ink)
    pixels = np.column_stack((xs, ys))
    # Assign ink to a named letter, so touching letters cannot start together.
    distances = np.stack([cKDTree(item["points"]).query(pixels)[0] for item in strokes])
    owner = distances.argmin(axis=0)
    reveal = np.full(ink.shape, np.inf, dtype=np.float32)
    for index, item in enumerate(strokes):
        selected = owner == index
        points = pixels[selected]
        nearest_distance, nearest = cKDTree(item["points"]).query(points, k=min(64, len(item["points"])))
        # At crossings, the first pass deposits the ink. A narrow pen footprint
        # avoids holes that would otherwise wait until a later return stroke.
        candidates = np.where(nearest_distance <= nearest_distance[:, :1] + 3.0,
                              item["times"][nearest], np.inf)
        reveal[ys[selected], xs[selected]] = candidates.min(axis=1)
    return reveal, owner


def frame_at(original, reveal, timestamp):
    progress = np.clip((timestamp - reveal) / FADE, 0, 1)
    progress = progress * progress * (3 - 2 * progress)
    return np.uint8(np.rint(255 - (255 - original.astype(np.float32)) * progress[..., None]))



def render():
    original = np.asarray(Image.open(SOURCE).convert("RGB"))
    strokes = timeline()
    # Restrict ownership to the currency area; all other animation is preserved.
    word_source = np.full_like(original, 255)
    word_source[875:1018, 548:858] = original[875:1018, 548:858]
    reveal, _ = reveal_map(word_source, strokes)
    duration = max(item["end"] for item in strokes) + FADE + 0.75
    decoder = subprocess.Popen([
        "ffmpeg", "-v", "error", "-i", str(ROOT / "dist/assets/intro-handwriting-split.mp4"),
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    encoder = subprocess.Popen([
        "ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", "900x1100", "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
        "-preset", "medium", "-tune", "animation", "-crf", "17", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(OUTPUT)], stdin=subprocess.PIPE)
    frame_bytes = 900 * 1100 * 3
    last = None
    try:
        for number in range(math.ceil(duration * FPS)):
            raw = decoder.stdout.read(frame_bytes)
            if raw:
                if len(raw) != frame_bytes:
                    raise RuntimeError("Incomplete input video frame")
                last = np.frombuffer(raw, dtype=np.uint8).reshape(1100, 900, 3).copy()
            if last is None:
                raise RuntimeError("No source video frames")
            frame = last.copy()
            replacement = frame_at(word_source, reveal, number / FPS)
            frame[875:1018, 548:858] = replacement[875:1018, 548:858]
            encoder.stdin.write(frame.tobytes())
    finally:
        decoder.stdout.close()
        encoder.stdin.close()
    if decoder.wait() != 0 or encoder.wait() != 0:
        raise RuntimeError("ffmpeg failed")
    for item in strokes:
        print(f"{item['name']}: {item['start']:.3f}–{item['end']:.3f}s")
    print(f"{OUTPUT.name}: {OUTPUT.stat().st_size:,} bytes, {FPS} fps, {duration:.2f}s")


if __name__ == "__main__":
    render()
