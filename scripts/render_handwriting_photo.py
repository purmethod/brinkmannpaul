#!/usr/bin/env python3
"""Render Paul's handwriting from the supplied photo, letter by letter.

The photograph provides the final letter shapes. Hand-traced centre lines
provide the actual pen movement, so the result is neither a left-to-right wipe
nor a group fade. Every letter has its own timing, all original marks finish,
and the final frame is a clean black-on-white copy of the handwriting.
"""

from __future__ import annotations

import math
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from scipy import ndimage
from scipy.spatial import cKDTree


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_VIDEO = ROOT / "dist/assets/intro-handwriting-optimized.mp4"
OUTPUT_STILL = ROOT / "dist/assets/intro-handwriting-optimized-complete.png"
DEBUG_IMAGE = Path("/tmp/intro-handwriting-lettered-paths.png")

# Crop the paper itself, then place the writing in the centre of the tall intro.
PHOTO_CROP = (120, 410, 1020, 1010)
CANVAS_SIZE = (900, 1100)
PASTE_OFFSET = (0, 250)

FPS = 60
START_PAUSE = 0.25
LETTER_GAP = 0.012
STROKE_GAP = 0.008
REVEAL_FADE = 0.045
FINAL_HOLD = 1.2
PEN_SPEED = 1100.0
INK_VALUE = 8
MAX_INK_DISTANCE = 25.0

# Tight source regions keep the paper, old pencil traces and table out of the
# finished artwork. Coordinates are relative to PHOTO_CROP.
SOURCE_REGIONS = (
    (0, 100, 880, 275),     # signature baseline
    (455, 10, 880, 300),    # tall P and l
    (520, 190, 625, 510),   # long P downstroke
    (0, 255, 410, 380),     # Trust
    (20, 350, 150, 470),    # is
    (170, 340, 350, 490),   # my
    (20, 470, 520, 595),    # Currency
)


@dataclass(frozen=True)
class StrokeSpec:
    points: tuple[tuple[float, float], ...]
    smooth: bool = True


@dataclass(frozen=True)
class LetterSpec:
    name: str
    strokes: tuple[StrokeSpec, ...]
    pause_after: float = 0.0


@dataclass
class TimedStroke:
    letter: str
    points: np.ndarray
    cumulative: np.ndarray
    length: float
    start: float
    duration: float


def stroke(*points: tuple[float, float], smooth: bool = True) -> StrokeSpec:
    return StrokeSpec(tuple(points), smooth)


def letter(
    name: str, *strokes: StrokeSpec, pause_after: float = 0.0
) -> LetterSpec:
    return LetterSpec(name, tuple(strokes), pause_after)


# Coordinates are on the final 900 x 1100 canvas. Each entry represents one
# written letter; separate entries inside a letter are real pen lifts such as a
# crossbar or underline.
LETTERS: tuple[LetterSpec, ...] = (
    # Brinkmann
    letter(
        "B",
        stroke((40, 370), (58, 372), (74, 379), (82, 392), (76, 410), (60, 426),
               (71, 447), (91, 470), (112, 491), (130, 486), (132, 463)),
        stroke((42, 374), (48, 405), (52, 438), (54, 468), smooth=False),
        stroke((67, 468), (61, 489), (76, 505), (99, 503), (117, 493)),
    ),
    letter("r", stroke((126, 470), (113, 448), (115, 418), (127, 397), (141, 392),
                              (150, 405), (151, 435), (151, 469), (164, 484))),
    letter("i", stroke((164, 407), (165, 438), (169, 467), (181, 482))),
    letter("n", stroke((185, 407), (188, 448), (190, 472), (204, 482), (217, 463),
                              (220, 418), (228, 433), (232, 469), (244, 481))),
    letter(
        "k",
        stroke((252, 406), (254, 438), (256, 470), (268, 482), (281, 456), (284, 414)),
        stroke((263, 449), (280, 465), (293, 480), (306, 474)),
    ),
    letter("m", stroke((310, 409), (312, 448), (314, 472), (326, 481), (339, 458),
                              (340, 414), (349, 435), (354, 470), (368, 481), (380, 456),
                              (382, 417), (390, 437), (395, 470))),
    letter("a", stroke((399, 469), (400, 438), (409, 416), (421, 410), (432, 428),
                              (429, 461), (440, 477), (451, 465))),
    letter("n", stroke((452, 421), (454, 449), (456, 471), (469, 479), (481, 456),
                              (482, 421), (491, 439), (495, 470), (507, 478))),
    letter("n", stroke((509, 423), (511, 451), (513, 472), (526, 479), (539, 456),
                              (540, 427), (550, 445), (554, 474), (570, 480)),
           pause_after=0.18),

    # Paul
    letter(
        "P",
        stroke((596, 429), (614, 403), (619, 367), (615, 326), (602, 295), (581, 279),
               (563, 285), (558, 313), (560, 347), (570, 377)),
        stroke((615, 401), (604, 421), (592, 431), (584, 451), (582, 500), (583, 570),
               (584, 650), (590, 748)),
    ),
    letter("a", stroke((622, 422), (619, 443), (626, 461), (640, 470), (654, 458),
                              (657, 429), (665, 447), (679, 466))),
    letter("u", stroke((680, 421), (681, 449), (685, 465), (697, 471), (709, 457),
                              (713, 423), (716, 453), (731, 470))),
    letter("l", stroke((733, 437), (740, 461), (752, 470), (766, 463), (778, 442),
                              (785, 410), (784, 365), (782, 318), (790, 294), (799, 315),
                              (800, 355), (792, 408), (802, 438), (821, 461), (842, 476),
                              (850, 465)), pause_after=0.34),

    # Trust
    letter(
        "T",
        stroke((20, 555), (58, 554), (98, 553), (140, 552), smooth=False),
        stroke((112, 568), (119, 586), (128, 607), (134, 620), smooth=False),
    ),
    letter("r", stroke((137, 569), (140, 591), (145, 606), (157, 611), (169, 596),
                              (170, 573))),
    letter("u", stroke((172, 575), (174, 596), (181, 609), (192, 612), (204, 600),
                              (207, 576), (210, 601), (224, 614))),
    letter("s", stroke((252, 575), (240, 584), (242, 595), (255, 602), (273, 609),
                              (282, 618), (265, 615), (247, 606), (237, 599))),
    letter(
        "t",
        stroke((307, 568), (309, 587), (314, 603), (322, 618), smooth=False),
        stroke((302, 553), (333, 552), (370, 551), (405, 550), smooth=False),
        pause_after=0.24,
    ),

    # is
    letter("i", stroke((69, 652), (71, 671), (74, 696), smooth=False)),
    letter("s", stroke((139, 650), (126, 645), (115, 655), (116, 669), (130, 679),
                              (145, 684), (150, 696), (140, 706), (115, 705)),
           pause_after=0.17),

    # my
    letter("m", stroke((233, 690), (232, 661), (239, 650), (249, 675), (260, 652),
                              (269, 681), (285, 656), (292, 686))),
    letter(
        "y",
        stroke((294, 656), (297, 677), (306, 688), (318, 689), (330, 675), (335, 653),
               (337, 680), (340, 708)),
        stroke((340, 708), (333, 721), (316, 724), (299, 729), smooth=False),
        pause_after=0.24,
    ),

    # Currency
    letter("C", stroke((111, 757), (95, 749), (78, 752), (65, 769), (63, 795),
                              (70, 811), (84, 815), (101, 803), (114, 785))),
    letter("u", stroke((115, 772), (117, 793), (123, 805), (134, 807), (146, 793),
                              (148, 773), (151, 797), (164, 807))),
    letter(
        "r",
        stroke((168, 773), (169, 797), (172, 805), (185, 803), (198, 785), (198, 765),
               (188, 756), (177, 762), (173, 776)),
        stroke((186, 781), (202, 795), (218, 807)),
    ),
    letter(
        "r",
        stroke((221, 773), (222, 798), (226, 805), (239, 802), (251, 785), (250, 764),
               (240, 757), (229, 764), (225, 777)),
        stroke((239, 781), (255, 797), (273, 807)),
    ),
    letter(
        "e",
        stroke((282, 759), (282, 782), (284, 802), (310, 805), (339, 802), smooth=False),
        stroke((283, 759), (310, 757), (344, 757), smooth=False),
        stroke((284, 781), (309, 780), (334, 780), smooth=False),
    ),
    letter("n", stroke((350, 772), (352, 799), (361, 805), (374, 798), (380, 777),
                              (389, 763), (400, 775), (404, 801))),
    letter("c", stroke((463, 763), (448, 753), (430, 753), (416, 765), (413, 783),
                              (423, 797), (442, 801), (461, 791), (468, 780))),
    letter(
        "y",
        stroke((466, 770), (469, 792), (478, 802), (490, 801), (500, 787), (505, 767),
               (506, 797), (508, 823), (505, 838)),
        stroke((505, 838), (476, 838), (440, 838), (405, 838), (380, 838), smooth=False),
    ),
)


def catmull_rom(points: np.ndarray, samples_per_segment: int = 16) -> np.ndarray:
    """Interpolate anchors into a smooth pen trajectory."""
    if len(points) < 3:
        pieces = []
        for first, second in zip(points, points[1:]):
            pieces.append(np.linspace(first, second, samples_per_segment, endpoint=False))
        return np.vstack((*pieces, points[-1:])) if pieces else points

    padded = np.vstack((points[0], points, points[-1]))
    result: list[np.ndarray] = []
    for index in range(1, len(padded) - 2):
        p0, p1, p2, p3 = padded[index - 1 : index + 3]
        t = np.linspace(0.0, 1.0, samples_per_segment, endpoint=False)[:, None]
        segment = 0.5 * (
            2 * p1
            + (-p0 + p2) * t
            + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t**2
            + (-p0 + 3 * p1 - 3 * p2 + p3) * t**3
        )
        result.append(segment)
    result.append(points[-1:])
    return np.vstack(result)


def interpolate(spec: StrokeSpec) -> np.ndarray:
    anchors = np.asarray(spec.points, dtype=np.float32)
    if spec.smooth:
        return catmull_rom(anchors)
    pieces = [
        np.linspace(first, second, 18, endpoint=False)
        for first, second in zip(anchors, anchors[1:])
    ]
    return np.vstack((*pieces, anchors[-1:])) if pieces else anchors


def cumulative_lengths(points: np.ndarray) -> tuple[np.ndarray, float]:
    distances = np.linalg.norm(np.diff(points, axis=0), axis=1)
    cumulative = np.concatenate(([0.0], np.cumsum(distances))).astype(np.float32)
    return cumulative, float(cumulative[-1])


def build_timed_strokes() -> list[TimedStroke]:
    result: list[TimedStroke] = []
    cursor = START_PAUSE

    for current_letter in LETTERS:
        prepared: list[tuple[np.ndarray, np.ndarray, float]] = []
        total_length = 0.0
        for current_stroke in current_letter.strokes:
            points = interpolate(current_stroke)
            cumulative, length = cumulative_lengths(points)
            prepared.append((points, cumulative, length))
            total_length += length

        # Short characters remain deliberate; long capitals never rush.
        letter_duration = min(1.0, max(0.10, total_length / PEN_SPEED))
        for index, (points, cumulative, length) in enumerate(prepared):
            duration = letter_duration * (length / max(total_length, 1e-6))
            result.append(
                TimedStroke(
                    letter=current_letter.name,
                    points=points,
                    cumulative=cumulative,
                    length=length,
                    start=cursor,
                    duration=duration,
                )
            )
            cursor += duration
            if index < len(prepared) - 1:
                cursor += STROKE_GAP
        cursor += LETTER_GAP + current_letter.pause_after

    return result


def extract_clean_ink(photo_path: Path, timed: list[TimedStroke]) -> Image.Image:
    photo = Image.open(photo_path).convert("RGB")
    crop = photo.crop(PHOTO_CROP)
    gray = ImageOps.grayscale(crop).filter(ImageFilter.MedianFilter(3))
    background = gray.filter(ImageFilter.GaussianBlur(22))
    detail = np.maximum(
        np.asarray(background, dtype=np.float32) - np.asarray(gray, dtype=np.float32),
        0.0,
    )

    allowed = np.zeros(detail.shape, dtype=bool)
    for x0, y0, x1, y1 in SOURCE_REGIONS:
        allowed[y0:y1, x0:x1] = True

    raw = (detail > 7.5) & allowed
    canvas = np.zeros((CANVAS_SIZE[1], CANVAS_SIZE[0]), dtype=bool)
    ox, oy = PASTE_OFFSET
    canvas[oy : oy + raw.shape[0], ox : ox + raw.shape[1]] = raw

    # Retain only graphite close to the hand-traced pen trajectories. This
    # removes paper grain and faint abandoned pencil marks without redrawing the
    # user's handwriting.
    path_points = np.vstack([item.points for item in timed])
    tree = cKDTree(path_points)
    ys, xs = np.where(canvas)
    distances, _ = tree.query(np.column_stack((xs, ys)), workers=-1)
    near_path = np.zeros_like(canvas)
    near_path[ys[distances <= MAX_INK_DISTANCE], xs[distances <= MAX_INK_DISTANCE]] = True

    labels, _ = ndimage.label(near_path, structure=np.ones((3, 3), dtype=np.uint8))
    sizes = np.bincount(labels.ravel())
    keep = sizes >= 100
    keep[0] = False
    cleaned = keep[labels]

    # A subpixel edge keeps the final result sharp on Retina displays.
    alpha = ndimage.gaussian_filter(cleaned.astype(np.float32), 0.48)
    alpha = np.clip(alpha * 1.32, 0.0, 1.0)
    return Image.fromarray(np.uint8(alpha * 255), mode="L")


def smoothstep(values: np.ndarray) -> np.ndarray:
    values = np.clip(values, 0.0, 1.0)
    return values * values * (3.0 - 2.0 * values)


def pen_curve(values: np.ndarray) -> np.ndarray:
    """Keep the pen moving through a stroke without robotic hard stops."""
    values = np.clip(values, 0.0, 1.0)
    return values - 0.055 * np.sin(2.0 * np.pi * values)


def build_reveal_times(ink_mask: Image.Image, timed: list[TimedStroke]) -> np.ndarray:
    all_points: list[np.ndarray] = []
    all_times: list[np.ndarray] = []

    for item in timed:
        fraction = item.cumulative / max(item.length, 1e-6)
        # A soft-linear curve preserves handwriting rhythm while keeping the
        # motion continuous at the beginning and end of each pen stroke.
        times = item.start + item.duration * pen_curve(fraction)
        all_points.append(item.points)
        all_times.append(times.astype(np.float32))

    points = np.vstack(all_points)
    times = np.concatenate(all_times)
    tree = cKDTree(points)

    ink = np.asarray(ink_mask)
    reveal = np.full(ink.shape, np.inf, dtype=np.float32)
    ys, xs = np.where(ink > 0)
    _, nearest = tree.query(np.column_stack((xs, ys)), workers=-1)
    reveal[ys, xs] = times[nearest]
    return reveal


def complete_frame(ink_mask: Image.Image) -> Image.Image:
    alpha = np.asarray(ink_mask, dtype=np.float32) / 255.0
    value = np.uint8(np.clip(255.0 - alpha * (255 - INK_VALUE), 0, 255))
    return Image.fromarray(np.repeat(value[..., None], 3, axis=2), mode="RGB")


def save_debug_overlay(ink_mask: Image.Image, timed: list[TimedStroke]) -> None:
    image = complete_frame(ink_mask).convert("RGB")
    draw = ImageDraw.Draw(image, "RGBA")
    palette = (
        (221, 46, 68, 210),
        (14, 116, 200, 210),
        (0, 145, 106, 210),
        (218, 126, 0, 210),
        (128, 70, 170, 210),
    )
    for index, item in enumerate(timed):
        colour = palette[index % len(palette)]
        points = [tuple(map(float, point)) for point in item.points]
        draw.line(points, fill=colour, width=2, joint="curve")
        x, y = points[0]
        draw.ellipse((x - 4, y - 4, x + 4, y + 4), fill=colour)
    image.save(DEBUG_IMAGE, optimize=True)


def render(photo_path: Path, debug: bool = False) -> None:
    timed = build_timed_strokes()
    ink_mask = extract_clean_ink(photo_path, timed)
    reveal_times = build_reveal_times(ink_mask, timed)
    final = complete_frame(ink_mask)
    final.save(OUTPUT_STILL, optimize=True)

    if debug:
        save_debug_overlay(ink_mask, timed)

    finite = reveal_times[np.isfinite(reveal_times)]
    writing_end = float(finite.max()) + REVEAL_FADE
    total_duration = writing_end + FINAL_HOLD
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
        f"{CANVAS_SIZE[0]}x{CANVAS_SIZE[1]}",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-tune",
        "animation",
        "-crf",
        "17",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(OUTPUT_VIDEO),
    ]

    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    if process.stdin is None:
        raise RuntimeError("Could not open ffmpeg input")

    ink = np.asarray(ink_mask, dtype=np.float32)
    for frame_number in range(total_frames):
        timestamp = frame_number / FPS
        progress = smoothstep((timestamp - reveal_times) / REVEAL_FADE)
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
    if len(sys.argv) not in (2, 3):
        raise SystemExit("usage: render_handwriting_photo.py PHOTO [--debug]")
    render(Path(sys.argv[1]).resolve(), debug="--debug" in sys.argv[2:])
