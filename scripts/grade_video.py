"""Give a short clip the site's photo look and loop it without a seam.

  python3 scripts/grade_video.py SOURCE NAME CX CY R [EV] [BLUE]

writes, from the same grade as scripts/grade_photo.py (without grain, which
would only cost bytes and flicker):

  dist/assets/video-NAME.mp4         the circle, 480 px square, CX CY R in source pixels
  dist/assets/video-NAME-full.mp4    the whole clip, 640 px wide, opened on tap
  dist/assets/video-NAME-poster.webp the circle's first frame, shown until the clip plays

The last frames dissolve into the first ones, so the loop runs on without a
jump. Both clips are H.264 without sound and start playing while loading.
"""
import io
import subprocess
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from grade_photo import ASSETS, LOOK, grade  # noqa: E402

FADE = 12  # frames dissolved at the loop point


def size(source):
    """Width and height as played, after the phone's rotation."""
    png = subprocess.run(['ffmpeg', '-v', 'error', '-i', source, '-frames:v', '1', '-f', 'image2pipe',
                          '-vcodec', 'png', '-'], capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(png)).size


def render(source, crop, out_size, target, look, crf):
    width, height = out_size
    decode = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', source, '-an', '-vf',
                               f'crop={crop},scale={width}:{height}:in_color_matrix=bt2020:flags=lanczos',
                               '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    encode = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                               '-s', f'{width}x{height}', '-r', '30', '-i', '-', '-c:v', 'libx264',
                               '-preset', 'slow', '-crf', str(crf), '-pix_fmt', 'yuv420p', '-profile:v', 'high',
                               '-movflags', '+faststart', '-an', str(target)], stdin=subprocess.PIPE)
    frame_bytes = width * height * 3
    head, tail, start = [], deque(), None
    while True:
        raw = decode.stdout.read(frame_bytes)
        if len(raw) < frame_bytes:
            break
        frame = np.asarray(grade(Image.frombytes('RGB', (width, height), raw), **look))
        if len(head) < FADE:
            head.append(frame)
            continue
        if start is None:
            start = frame  # the loop opens here, right after the frames it dissolves into
        tail.append(frame)
        if len(tail) > FADE:
            encode.stdin.write(tail.popleft().tobytes())
    # The last frames dissolve into the first ones the loop returns to.
    for i, frame in enumerate(tail):
        mix = (i + 1) / (len(tail) + 1)
        encode.stdin.write(((1 - mix) * frame + mix * head[i]).astype(np.uint8).tobytes())
    encode.stdin.close()
    decode.wait()
    encode.wait()
    return Image.fromarray(start)


def main(source, name, cx, cy, r, ev=0.0, blue=0.0):
    look = {**LOOK, 'grain': 0.0, 'ev': ev, 'blue': blue}
    poster = render(source, f'{2 * r}:{2 * r}:{cx - r}:{cy - r}', (480, 480), ASSETS / f'video-{name}.mp4', look, 29)
    poster.save(ASSETS / f'video-{name}-poster.webp', quality=78, method=6)
    width, height = size(source)
    full_w = 640
    full_h = round(full_w * height / width / 2) * 2
    render(source, f'{width}:{height}:0:0', (full_w, full_h), ASSETS / f'video-{name}-full.mp4', look, 30)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], *map(int, sys.argv[3:6]), *map(float, sys.argv[6:8]))
