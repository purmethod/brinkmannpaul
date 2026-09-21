#!/usr/bin/env python3
"""Render the traced Brinkmann handwriting as a reliable, Safari-safe MP4.

The source SVG contains two things: a clean bitmap mask made from Paul's
handwriting and a set of centre-line pen paths.  This script reveals the mask
along those paths, one stroke at a time, and then holds the complete artwork.
"""

from __future__ import annotations

import base64
import io
import math
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE_SVG = ROOT / "dist/assets/intro-handwriting-pen.svg"
OUTPUT_VIDEO = ROOT / "dist/assets/intro-handwriting-v4.mp4"
OUTPUT_STILL = ROOT / "dist/assets/intro-handwriting-v4-complete.png"

SOURCE_WIDTH = 1600
SOURCE_HEIGHT = 1200
OUTPUT_WIDTH = 1200
OUTPUT_HEIGHT = 900
FPS = 30
START_PAUSE = 0.28
GROUP_PAUSE = 0.30
STROKE_GAP = 0.012
FINAL_BLEND = 0.24
FINAL_HOLD = 1.55
SPEED = 0.85
INK_VALUE = 17


@dataclass
class Stroke:
    number: int
    points: list[tuple[float, float]]
    cumulative: list[float]
    length: float
    width: int
    duration: float
    start: float = 0.0


def parse_path(path_data: str) -> list[tuple[float, float]]:
    tokens = re.findall(r"[A-Za-z]|[-+]?(?:\d+\.?\d*|\.\d+)", path_data)
    index = 0
    current = (0.0, 0.0)
    points: list[tuple[float, float]] = []

    while index < len(tokens):
        command = tokens[index]
        index += 1

        if command == "M":
            current = (float(tokens[index]), float(tokens[index + 1]))
            index += 2
            points.append(current)
        elif command == "L":
            current = (float(tokens[index]), float(tokens[index + 1]))
            index += 2
            points.append(current)
        elif command == "C":
            p0 = current
            p1 = (float(tokens[index]), float(tokens[index + 1]))
            p2 = (float(tokens[index + 2]), float(tokens[index + 3]))
            p3 = (float(tokens[index + 4]), float(tokens[index + 5]))
            index += 6

            control_length = (
                math.dist(p0, p1) + math.dist(p1, p2) + math.dist(p2, p3)
            )
            samples = max(12, int(control_length / 2.2))
            for step in range(1, samples + 1):
                t = step / samples
                u = 1.0 - t
                x = (
                    u * u * u * p0[0]
                    + 3 * u * u * t * p1[0]
                    + 3 * u * t * t * p2[0]
                    + t * t * t * p3[0]
                )
                y = (
                    u * u * u * p0[1]
                    + 3 * u * u * t * p1[1]
                    + 3 * u * t * t * p2[1]
                    + t * t * t * p3[1]
                )
                points.append((x, y))
            current = p3
        else:
            raise ValueError(f"Unsupported SVG path command: {command}")

    return points


def transformed_points(
    points: list[tuple[float, float]], transform: str
) -> tuple[list[tuple[float, float]], float]:
    match = re.fullmatch(
        r"translate\(([-.\d]+) ([-.\d]+)\) scale\(([-.\d]+)\)", transform
    )
    if not match:
        raise ValueError(f"Unsupported transform: {transform}")

    tx, ty, source_scale = map(float, match.groups())
    output_scale = OUTPUT_WIDTH / SOURCE_WIDTH
    transformed = [
        ((x * source_scale + tx) * output_scale, (y * source_scale + ty) * output_scale)
        for x, y in points
    ]
    return transformed, source_scale * output_scale


def cumulative_lengths(points: list[tuple[float, float]]) -> tuple[list[float], float]:
    cumulative = [0.0]
    for first, second in zip(points, points[1:]):
        cumulative.append(cumulative[-1] + math.dist(first, second))
    return cumulative, cumulative[-1]


def extract_mask(svg: str) -> Image.Image:
    image_match = re.search(r'<image href="data:image/png;base64,([^"]+)"', svg)
    if not image_match:
        raise ValueError("Embedded handwriting mask not found")

    embedded = Image.open(io.BytesIO(base64.b64decode(image_match.group(1)))).convert("RGBA")
    pixels = np.asarray(embedded, dtype=np.float32)
    luminance = (
        pixels[..., 0] * 0.2126
        + pixels[..., 1] * 0.7152
        + pixels[..., 2] * 0.0722
    )
    alpha = pixels[..., 3] / 255.0
    mask_values = luminance * alpha

    # The clean source is white ink on transparent/black. Keep this fallback so
    # the renderer also works if the source is ever stored as alpha-only ink.
    if float(mask_values.max()) < 24 and float(pixels[..., 3].max()) > 24:
        mask_values = pixels[..., 3]

    mask = Image.fromarray(np.uint8(np.clip(mask_values, 0, 255)), mode="L")
    return mask.resize((OUTPUT_WIDTH, OUTPUT_HEIGHT), Image.Resampling.LANCZOS)


def parse_strokes(svg: str) -> list[Stroke]:
    tags = re.findall(r'<path class="reveal s\d+"[^>]+/>', svg)
    strokes: list[Stroke] = []

    for tag in tags:
        number = int(re.search(r'class="reveal s(\d+)"', tag).group(1))
        path_data = re.search(r'd="([^"]+)"', tag).group(1)
        transform = re.search(r'transform="([^"]+)"', tag).group(1)
        width = float(re.search(r'stroke-width="([^"]+)"', tag).group(1))
        duration = float(re.search(r'--duration:([\d.]+)s', tag).group(1)) * SPEED

        points, path_scale = transformed_points(parse_path(path_data), transform)
        cumulative, length = cumulative_lengths(points)
        strokes.append(
            Stroke(
                number=number,
                points=points,
                cumulative=cumulative,
                length=length,
                width=max(2, round(width * path_scale * 1.04)),
                duration=duration,
            )
        )

    if len(strokes) != 30:
        raise ValueError(f"Expected 30 traced strokes, found {len(strokes)}")

    cursor = START_PAUSE
    for stroke in strokes:
        if stroke.number == 12:
            cursor += GROUP_PAUSE
        stroke.start = cursor
        cursor += stroke.duration + STROKE_GAP

    return strokes


def ease(progress: float) -> float:
    progress = min(1.0, max(0.0, progress))
    return progress * progress * (3.0 - 2.0 * progress)


def partial_polyline(stroke: Stroke, progress: float) -> list[tuple[int, int]]:
    target = stroke.length * ease(progress)
    if target <= 0:
        return []
    if target >= stroke.length:
        return [(round(x), round(y)) for x, y in stroke.points]

    upper = int(np.searchsorted(stroke.cumulative, target, side="right"))
    result = list(stroke.points[:upper])
    previous_length = stroke.cumulative[upper - 1]
    next_length = stroke.cumulative[upper]
    ratio = (target - previous_length) / max(next_length - previous_length, 1e-6)
    x0, y0 = stroke.points[upper - 1]
    x1, y1 = stroke.points[upper]
    result.append((x0 + (x1 - x0) * ratio, y0 + (y1 - y0) * ratio))
    return [(round(x), round(y)) for x, y in result]


def draw_stroke(draw: ImageDraw.ImageDraw, stroke: Stroke, progress: float) -> None:
    points = partial_polyline(stroke, progress)
    if not points:
        return

    radius = stroke.width // 2
    if len(points) > 1:
        draw.line(points, fill=255, width=stroke.width, joint="curve")
    for point in (points[0], points[-1]):
        draw.ellipse(
            (point[0] - radius, point[1] - radius, point[0] + radius, point[1] + radius),
            fill=255,
        )


def composite_frame(ink_mask: Image.Image, reveal: Image.Image) -> Image.Image:
    visible = np.minimum(
        np.asarray(ink_mask, dtype=np.uint16), np.asarray(reveal, dtype=np.uint16)
    )
    alpha = visible.astype(np.float32) / 255.0
    value = np.uint8(np.clip(255.0 - alpha * (255 - INK_VALUE), 0, 255))
    rgb = np.repeat(value[..., None], 3, axis=2)
    return Image.fromarray(rgb, mode="RGB")


def complete_frame(ink_mask: Image.Image) -> Image.Image:
    alpha = np.asarray(ink_mask, dtype=np.float32) / 255.0
    value = np.uint8(np.clip(255.0 - alpha * (255 - INK_VALUE), 0, 255))
    rgb = np.repeat(value[..., None], 3, axis=2)
    return Image.fromarray(rgb, mode="RGB")


def render() -> None:
    svg = SOURCE_SVG.read_text(encoding="utf-8")
    ink_mask = extract_mask(svg)
    strokes = parse_strokes(svg)
    final = complete_frame(ink_mask)
    final.save(OUTPUT_STILL, optimize=True)

    writing_end = max(stroke.start + stroke.duration for stroke in strokes)
    blend_start = writing_end
    total_duration = writing_end + FINAL_BLEND + FINAL_HOLD
    total_frames = math.ceil(total_duration * FPS)

    command = [
        "ffmpeg",
        "-y",
        "-loglevel",
        "error",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{OUTPUT_WIDTH}x{OUTPUT_HEIGHT}",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(OUTPUT_VIDEO),
    ]

    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    if process.stdin is None:
        raise RuntimeError("Could not open ffmpeg input")

    final_array = np.asarray(final, dtype=np.float32)
    reveal = Image.new("L", (OUTPUT_WIDTH, OUTPUT_HEIGHT), 0)

    for frame_number in range(total_frames):
        timestamp = frame_number / FPS
        reveal.paste(0, (0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT))
        draw = ImageDraw.Draw(reveal)

        for stroke in strokes:
            progress = (timestamp - stroke.start) / stroke.duration
            if progress > 0:
                draw_stroke(draw, stroke, min(progress, 1.0))

        frame = composite_frame(ink_mask, reveal)

        # A very short blend fills any tiny graphite edge that sits outside the
        # centre-line masks. This guarantees the final signature is complete,
        # without a visible jump.
        if timestamp >= blend_start:
            blend = ease((timestamp - blend_start) / FINAL_BLEND)
            if blend >= 1:
                frame = final
            else:
                frame_array = np.asarray(frame, dtype=np.float32)
                mixed = np.uint8(
                    np.clip(frame_array * (1 - blend) + final_array * blend, 0, 255)
                )
                frame = Image.fromarray(mixed, mode="RGB")

        process.stdin.write(frame.tobytes())

    process.stdin.close()
    result = process.wait()
    if result != 0:
        raise RuntimeError(f"ffmpeg exited with status {result}")

    print(
        f"Rendered {OUTPUT_VIDEO.name}: {total_frames} frames, "
        f"{total_duration:.2f}s, complete from {writing_end + FINAL_BLEND:.2f}s"
    )


if __name__ == "__main__":
    render()
