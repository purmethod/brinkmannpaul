#!/usr/bin/env python3
"""Render the two supplied handwriting photographs as one pen-written intro.

The signature is written first, letter by letter. The three-line motto follows
as a smaller block in the lower-right corner. The photographs remain the source
of every final ink pixel; the traced paths only control when those pixels appear.
"""

from __future__ import annotations

import math
import heapq
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps
from scipy import ndimage
from scipy.spatial import cKDTree

import render_handwriting_photo as base


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_VIDEO = ROOT / "dist/assets/intro-handwriting-split.mp4"
OUTPUT_STILL = ROOT / "dist/assets/intro-handwriting-split-complete.png"

CANVAS_SIZE = (900, 1100)
FPS = 60
REVEAL_FADE = 0.045
FINAL_HOLD = 1.35
INK_VALUE = 9

# Coordinate systems of the original hand traces and their new placements.
OLD_SIGNATURE = (35.0, 275.0, 850.0, 750.0)
NEW_SIGNATURE = (48.0, 300.0, 852.0, 655.0)
OLD_MOTTO = (20.0, 550.0, 520.0, 840.0)
NEW_MOTTO = (548.0, 686.0, 858.0, 1018.0)


def clean_photo_mask(
    path: Path, crop_box: tuple[int, int, int, int]
) -> Image.Image:
    photo = Image.open(path).convert("RGB").crop(crop_box)
    gray = ImageOps.grayscale(photo).filter(ImageFilter.MedianFilter(3))
    background = gray.filter(ImageFilter.GaussianBlur(24))
    detail = np.maximum(
        np.asarray(background, dtype=np.float32) - np.asarray(gray, dtype=np.float32),
        0.0,
    )

    raw = detail > 10.0
    raw[:12, :] = False
    raw[-18:, :] = False
    raw[:, :12] = False
    raw[:, -12:] = False
    labels, _ = ndimage.label(raw, structure=np.ones((3, 3), dtype=np.uint8))
    sizes = np.bincount(labels.ravel())
    keep = sizes >= 400
    keep[0] = False
    cleaned = keep[labels]

    ys, xs = np.where(cleaned)
    if len(xs) == 0:
        raise ValueError(f"No handwriting detected in {path}")

    padding = 5
    x0 = max(0, int(xs.min()) - padding)
    y0 = max(0, int(ys.min()) - padding)
    x1 = min(cleaned.shape[1], int(xs.max()) + padding + 1)
    y1 = min(cleaned.shape[0], int(ys.max()) + padding + 1)
    cropped = cleaned[y0:y1, x0:x1]

    alpha = ndimage.gaussian_filter(cropped.astype(np.float32), 0.52)
    alpha = np.clip(alpha * 1.34, 0.0, 1.0)
    return Image.fromarray(np.uint8(alpha * 255), mode="L")


def place_mask(canvas: Image.Image, source: Image.Image, box: tuple[float, float, float, float]) -> None:
    x0, y0, x1, y1 = box
    resized = source.resize(
        (round(x1 - x0), round(y1 - y0)), Image.Resampling.LANCZOS
    )
    canvas.paste(resized, (round(x0), round(y0)))


def transform_points(
    points: np.ndarray,
    source: tuple[float, float, float, float],
    target: tuple[float, float, float, float],
) -> np.ndarray:
    sx0, sy0, sx1, sy1 = source
    tx0, ty0, tx1, ty1 = target
    result = points.copy().astype(np.float32)
    result[:, 0] = tx0 + (result[:, 0] - sx0) * (tx1 - tx0) / (sx1 - sx0)
    result[:, 1] = ty0 + (result[:, 1] - sy0) * (ty1 - ty0) / (sy1 - sy0)
    return result


def prepare_strokes() -> list[base.TimedStroke]:
    timed = base.build_timed_strokes()
    signature_count = sum(len(item.strokes) for item in base.LETTERS[:13])

    for index, item in enumerate(timed):
        if index < signature_count:
            item.points = transform_points(item.points, OLD_SIGNATURE, NEW_SIGNATURE)
        else:
            item.points = transform_points(item.points, OLD_MOTTO, NEW_MOTTO)
        item.cumulative, item.length = base.cumulative_lengths(item.points)

    return timed


def keep_ink_near_paths(mask: Image.Image, timed: list[base.TimedStroke]) -> Image.Image:
    points = np.vstack([item.points for item in timed])
    tree = cKDTree(points)
    ink = np.asarray(mask)
    ys, xs = np.where(ink > 0)
    distances, _ = tree.query(np.column_stack((xs, ys)), workers=-1)
    retained = np.zeros_like(ink)
    retained[ys[distances <= 29.0], xs[distances <= 29.0]] = ink[
        ys[distances <= 29.0], xs[distances <= 29.0]
    ]
    return Image.fromarray(retained, mode="L")


def build_reveal_times(mask: Image.Image, timed: list[base.TimedStroke]) -> np.ndarray:
    path_points: list[np.ndarray] = []
    path_times: list[np.ndarray] = []

    for item in timed:
        fraction = item.cumulative / max(item.length, 1e-6)
        times = item.start + item.duration * base.pen_curve(fraction)
        path_points.append(item.points)
        path_times.append(times.astype(np.float32))

    points = np.vstack(path_points)
    times = np.concatenate(path_times)
    tree = cKDTree(points)

    ink = np.asarray(mask)
    reveal = np.full(ink.shape, np.inf, dtype=np.float32)
    ys, xs = np.where(ink > 0)
    _, nearest = tree.query(np.column_stack((xs, ys)), workers=-1)
    reveal[ys, xs] = times[nearest]
    return reveal


def build_left_to_right_reveal_times(mask: Image.Image) -> np.ndarray:
    """Give every ink pixel one continuous left-to-right writing time.

    Each visual line starts only after the line above has finished. A small
    vertical component prevents the reveal from looking like a rigid wipe while
    keeping the dominant movement unmistakably left to right.
    """
    ink = np.asarray(mask)
    reveal = np.full(ink.shape, np.inf, dtype=np.float32)

    regions = (
        # x0, y0, x1, y1, start, duration
        (48, 300, 852, 655, 0.28, 4.20),       # brinkmann paul
        (548, 686, 858, 765, 4.78, 0.92),      # trust
        (548, 765, 858, 875, 5.88, 0.72),      # is my
        (548, 875, 858, 1018, 6.78, 1.10),     # currency + underline
    )

    for x0, y0, x1, y1, start, duration in regions:
        local = ink[y0:y1, x0:x1]
        ys, xs = np.where(local > 0)
        if len(xs) == 0:
            continue
        x_phase = xs.astype(np.float32) / max(x1 - x0 - 1, 1)
        y_phase = ys.astype(np.float32) / max(y1 - y0 - 1, 1)
        phase = np.clip(0.96 * x_phase + 0.04 * y_phase, 0.0, 1.0)
        reveal[y0 + ys, x0 + xs] = start + duration * phase

    return reveal


def zhang_suen_thinning(binary: np.ndarray) -> np.ndarray:
    """Reduce a solid ink shape to a one-pixel connected pen centreline."""
    image = np.pad(binary.astype(np.uint8), 1)

    while True:
        changed = False
        for first_step in (True, False):
            p1 = image[1:-1, 1:-1]
            p2 = image[:-2, 1:-1]
            p3 = image[:-2, 2:]
            p4 = image[1:-1, 2:]
            p5 = image[2:, 2:]
            p6 = image[2:, 1:-1]
            p7 = image[2:, :-2]
            p8 = image[1:-1, :-2]
            p9 = image[:-2, :-2]

            neighbours = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9
            transitions = (
                ((p2 == 0) & (p3 == 1)).astype(np.uint8)
                + ((p3 == 0) & (p4 == 1)).astype(np.uint8)
                + ((p4 == 0) & (p5 == 1)).astype(np.uint8)
                + ((p5 == 0) & (p6 == 1)).astype(np.uint8)
                + ((p6 == 0) & (p7 == 1)).astype(np.uint8)
                + ((p7 == 0) & (p8 == 1)).astype(np.uint8)
                + ((p8 == 0) & (p9 == 1)).astype(np.uint8)
                + ((p9 == 0) & (p2 == 1)).astype(np.uint8)
            )

            if first_step:
                shape_rule = (p2 * p4 * p6 == 0) & (p4 * p6 * p8 == 0)
            else:
                shape_rule = (p2 * p4 * p8 == 0) & (p2 * p6 * p8 == 0)

            remove = (
                (p1 == 1)
                & (neighbours >= 2)
                & (neighbours <= 6)
                & (transitions == 1)
                & shape_rule
            )
            if np.any(remove):
                p1[remove] = 0
                changed = True

        if not changed:
            break

    return image[1:-1, 1:-1].astype(bool)


def skeleton_distances(skeleton: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Return skeleton coordinates and travel distance from a natural start."""
    coordinates = np.argwhere(skeleton)
    if len(coordinates) == 0:
        return coordinates, np.empty(0, dtype=np.float32)

    index = np.full(skeleton.shape, -1, dtype=np.int32)
    index[coordinates[:, 0], coordinates[:, 1]] = np.arange(len(coordinates))

    neighbour_count = np.zeros(len(coordinates), dtype=np.uint8)
    for offset_y in (-1, 0, 1):
        for offset_x in (-1, 0, 1):
            if offset_x == 0 and offset_y == 0:
                continue
            shifted_y = coordinates[:, 0] + offset_y
            shifted_x = coordinates[:, 1] + offset_x
            valid = (
                (shifted_y >= 0)
                & (shifted_y < skeleton.shape[0])
                & (shifted_x >= 0)
                & (shifted_x < skeleton.shape[1])
            )
            neighbour_count[valid] += (
                index[shifted_y[valid], shifted_x[valid]] >= 0
            ).astype(np.uint8)

    endpoints = np.flatnonzero(neighbour_count <= 1)
    candidates = endpoints if len(endpoints) else np.arange(len(coordinates))
    start_index = candidates[
        np.lexsort((coordinates[candidates, 0], coordinates[candidates, 1]))[0]
    ]

    distances = np.full(len(coordinates), np.inf, dtype=np.float32)
    distances[start_index] = 0.0
    queue: list[tuple[float, int]] = [(0.0, int(start_index))]

    while queue:
        distance, current = heapq.heappop(queue)
        if distance > distances[current]:
            continue
        y, x = coordinates[current]
        for offset_y in (-1, 0, 1):
            for offset_x in (-1, 0, 1):
                if offset_x == 0 and offset_y == 0:
                    continue
                next_y = y + offset_y
                next_x = x + offset_x
                if not (0 <= next_y < skeleton.shape[0] and 0 <= next_x < skeleton.shape[1]):
                    continue
                next_index = int(index[next_y, next_x])
                if next_index < 0:
                    continue
                step = math.sqrt(2.0) if offset_x and offset_y else 1.0
                next_distance = distance + step
                if next_distance < distances[next_index]:
                    distances[next_index] = next_distance
                    heapq.heappush(queue, (next_distance, next_index))

    # Extremely rare isolated skeleton fragments are appended left to right.
    finite = np.isfinite(distances)
    if not np.all(finite):
        cursor = float(distances[finite].max()) if np.any(finite) else 0.0
        for current in np.flatnonzero(~finite):
            cursor += 1.0
            distances[current] = cursor

    return coordinates, distances


def trace_region(
    ink: np.ndarray,
    reveal: np.ndarray,
    box: tuple[int, int, int, int],
    start: float,
    duration: float,
) -> None:
    """Animate disconnected pen strokes in a region in writing order."""
    x0, y0, x1, y1 = box
    local = ink[y0:y1, x0:x1] > 8
    labels, count = ndimage.label(local, structure=np.ones((3, 3), dtype=np.uint8))
    components: list[dict[str, object]] = []

    for number in range(1, count + 1):
        component = labels == number
        ys, xs = np.where(component)
        if len(xs) < 8:
            continue
        skeleton = zhang_suen_thinning(component)
        skeleton_points, distances = skeleton_distances(skeleton)
        if len(skeleton_points) == 0:
            continue
        components.append(
            {
                "component": component,
                "points": skeleton_points,
                "distances": distances,
                "left": int(xs.min()),
                "top": int(ys.min()),
                "weight": max(float(distances.max()), 18.0),
            }
        )

    components.sort(key=lambda item: (item["left"], item["top"]))
    if not components:
        return

    gap = 0.025
    available = max(duration - gap * (len(components) - 1), duration * 0.8)
    scale = available / sum(float(item["weight"]) for item in components)
    cursor = start

    for item in components:
        component = item["component"]
        points = item["points"]
        distances = item["distances"]
        component_duration = float(item["weight"]) * scale
        path_duration = max(float(distances.max()), 1e-6)
        path_times = cursor + component_duration * distances / path_duration

        ys, xs = np.where(component)
        tree = cKDTree(np.column_stack((points[:, 1], points[:, 0])))
        _, nearest = tree.query(np.column_stack((xs, ys)), workers=-1)
        reveal[y0 + ys, x0 + xs] = path_times[nearest]
        cursor += component_duration + gap


def build_pen_reveal_times(mask: Image.Image) -> np.ndarray:
    ink = np.asarray(mask)
    reveal = np.full(ink.shape, np.inf, dtype=np.float32)
    trace_region(ink, reveal, (48, 300, 852, 655), 0.28, 4.45)
    trace_region(ink, reveal, (548, 686, 858, 765), 5.00, 0.95)
    trace_region(ink, reveal, (548, 765, 858, 875), 6.12, 0.76)
    trace_region(ink, reveal, (548, 875, 858, 1018), 7.04, 1.18)
    return reveal


def complete_frame(mask: Image.Image) -> Image.Image:
    alpha = np.asarray(mask, dtype=np.float32) / 255.0
    value = np.uint8(np.clip(255.0 - alpha * (255 - INK_VALUE), 0, 255))
    return Image.fromarray(np.repeat(value[..., None], 3, axis=2), mode="RGB")


def render(signature_path: Path, motto_path: Path) -> None:
    signature = clean_photo_mask(signature_path, (145, 80, 1060, 505))
    motto = clean_photo_mask(motto_path, (40, 15, 590, 590))

    mask = Image.new("L", CANVAS_SIZE, 0)
    place_mask(mask, signature, NEW_SIGNATURE)
    place_mask(mask, motto, NEW_MOTTO)

    timed = prepare_strokes()
    reveal_times = build_pen_reveal_times(mask)
    final = complete_frame(mask)
    final.save(OUTPUT_STILL, optimize=True)

    finite = reveal_times[np.isfinite(reveal_times)]
    writing_end = float(finite.max()) + REVEAL_FADE
    total_duration = writing_end + FINAL_HOLD
    total_frames = math.ceil(total_duration * FPS)

    command = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{CANVAS_SIZE[0]}x{CANVAS_SIZE[1]}",
        "-r", str(FPS), "-i", "-", "-an",
        "-c:v", "libx264", "-preset", "medium", "-tune", "animation",
        "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        str(OUTPUT_VIDEO),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    if process.stdin is None:
        raise RuntimeError("Could not open ffmpeg input")

    ink = np.asarray(mask, dtype=np.float32)
    for frame_number in range(total_frames):
        timestamp = frame_number / FPS
        progress = base.smoothstep((timestamp - reveal_times) / REVEAL_FADE)
        visible = ink * progress
        alpha = visible / 255.0
        value = np.uint8(np.clip(255.0 - alpha * (255 - INK_VALUE), 0, 255))
        frame = np.repeat(value[..., None], 3, axis=2)
        process.stdin.write(frame.tobytes())

    process.stdin.close()
    status = process.wait()
    if status != 0:
        raise RuntimeError(f"ffmpeg exited with status {status}")

    print(
        f"rendered {OUTPUT_VIDEO.name}: {total_frames} frames at {FPS} fps, "
        f"writing complete at {writing_end:.2f}s, duration {total_duration:.2f}s"
    )


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: render_split_handwriting.py SIGNATURE MOTTO")
    render(Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve())
