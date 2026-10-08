"""Give a short clip the site's photo look and loop it so the loop never shows.

  python3 scripts/grade_video.py SOURCE NAME CX CY R [--ev EV] [--blue BLUE]
                                 [--loop dissolve|glide] [--speed S] [--fade SECONDS]

writes, from the same grade as scripts/grade_photo.py (without grain, which
would only cost bytes and flicker):

  dist/assets/video-NAME.mp4         the circle, 480 px square, CX CY R in source pixels
  dist/assets/video-NAME-poster.webp the loop's first frame, shown until the clip plays

Two ways to hide the loop:

  dissolve  for texture and steady scenes. The two most alike moments of the
            clip become the loop's ends and dissolve into each other over
            --fade seconds (default 1.2), so no cut can be seen.
  glide     for a moving camera, whose ends never look alike. The clip runs
            forward, slows to rest, runs back and slows to rest again, on a
            cosine, so there is never a jump. --speed sets the top speed
            (1 = as filmed); frames in between are blended for slow motion.

The clip is H.264 without sound and starts playing while loading.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from grade_photo import ASSETS, LOOK, grade  # noqa: E402

FPS = 30
SIZE = 480


def matrix(source):
    """The source's colour matrix, so phone HDR and SDR clips decode alike."""
    info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                                      'stream=color_space', '-of', 'json', source],
                                     capture_output=True, text=True, check=True).stdout)
    space = (info.get('streams') or [{}])[0].get('color_space', '')
    return 'bt2020' if space.startswith('bt2020') else 'bt709'


def frames(source, crop, look):
    decode = subprocess.run(['ffmpeg', '-v', 'error', '-i', source, '-an', '-vf',
                             f'crop={crop},scale={SIZE}:{SIZE}:in_color_matrix={matrix(source)}:flags=lanczos,fps={FPS}',
                             '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    size = SIZE * SIZE * 3
    return [np.asarray(grade(Image.frombytes('RGB', (SIZE, SIZE), decode[i:i + size]), **look)).astype(np.float32)
            for i in range(0, len(decode) - size + 1, size)]


def dissolve(clip, fade):
    """Loop between the two most alike moments, dissolving the end into the start."""
    n, span = len(clip), max(2, round(fade * FPS))
    small = [f[::16, ::16] for f in clip]
    best, ends = None, (0, n - 1)
    for a in range(0, n // 3):
        for b in range(max(a + n // 2, a + 3 * span), n):
            diff = float(np.abs(small[a] - small[b]).mean())
            if best is None or diff < best:
                best, ends = diff, (a, b)
    a, b = ends
    out = clip[a + span:b + 1 - span]
    for i in range(span):
        mix = (i + 1) / (span + 1)
        out.append((1 - mix) * clip[b + 1 - span + i] + mix * clip[a + i])
    return out


def glide(clip, speed):
    """Forward, rest, back, rest: a cosine through the clip, never a jump."""
    last = len(clip) - 1
    period = np.pi * last / speed  # in output frames; the top speed is `speed`
    out = []
    for k in range(int(round(period))):
        t = last * (1 - np.cos(2 * np.pi * k / period)) / 2
        i = min(int(t), last - 1)
        f = t - i
        out.append((1 - f) * clip[i] + f * clip[i + 1])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source'); ap.add_argument('name')
    ap.add_argument('cx', type=int); ap.add_argument('cy', type=int); ap.add_argument('r', type=int)
    ap.add_argument('--ev', type=float, default=0.0); ap.add_argument('--blue', type=float, default=0.0)
    ap.add_argument('--loop', choices=['dissolve', 'glide'], default='dissolve')
    ap.add_argument('--speed', type=float, default=1.0); ap.add_argument('--fade', type=float, default=1.2)
    ap.add_argument('--crf', type=int, default=30)
    o = ap.parse_args()
    look = {**LOOK, 'grain': 0.0, 'ev': o.ev, 'blue': o.blue}
    clip = frames(o.source, f'{2 * o.r}:{2 * o.r}:{o.cx - o.r}:{o.cy - o.r}', look)
    out = glide(clip, o.speed) if o.loop == 'glide' else dissolve(clip, o.fade)
    target = ASSETS / f'video-{o.name}.mp4'
    encode = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                               '-s', f'{SIZE}x{SIZE}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264',
                               '-preset', 'slow', '-crf', str(o.crf), '-pix_fmt', 'yuv420p', '-profile:v', 'high',
                               '-movflags', '+faststart', '-an', str(target)], stdin=subprocess.PIPE)
    for frame in out:
        encode.stdin.write(np.clip(frame + 0.5, 0, 255).astype(np.uint8).tobytes())
    encode.stdin.close()
    encode.wait()
    Image.fromarray(np.clip(out[0] + 0.5, 0, 255).astype(np.uint8)).save(
        ASSETS / f'video-{o.name}-poster.webp', quality=78, method=6)
    print(f'{target.name}: {len(out)} frames, {len(out) / FPS:.1f} s, {target.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
