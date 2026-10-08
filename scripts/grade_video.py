"""Give a short clip the site's photo look and loop it so the loop never shows.

  python3 scripts/grade_video.py SOURCE NAME CX CY R [--ev EV] [--blue BLUE]
                                 [--loop dissolve|glide] [--speed S] [--fade SECONDS]
                                 [--look honey|clean] [--steady] [--deflicker]

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

--steady holds the hand-held camera still (vidstab, two passes) and, for
glide, computes real in-between frames from the motion (minterpolate) so slow
motion runs smooth instead of flickering between blended frames. Only for a
hand-held camera: on a clip filmed from a steady stand it adds wobble.

--deflicker evens out lamp flicker, the fast pulsing of brightness that a
phone films under artificial light and that reads as trembling.

--look clean leaves the honey grade for a clip whose whites are the point,
such as skyn's cream: neutral white balance taken from the clip's own
highlights, clear whites, more contrast, colour held back.

The clip is H.264 without sound and starts playing while loading.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from grade_photo import ASSETS, LOOK, grade  # noqa: E402

FPS = 30
SIZE = 480
INTERP = 4  # glide with --steady: in-between frames computed per filmed frame
# Clean whites: neutral, bright, contrasty, nearly without colour cast or grain.
CLEAN = dict(sat=0.25, orange=0.0, fade=0.03, white=0.995, curve=0.32, gamma=0.92, vignette=0.0,
             shadow=(0.0, 0.0, 0.0), high=(0.0, 0.0, 0.0), warm=(1.0, 1.0, 1.0), grain=0.0,
             skin_sat=0.0, skin_warm=0.0)


def matrix(source):
    """The source's colour matrix, so phone HDR and SDR clips decode alike."""
    info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                                      'stream=color_space', '-of', 'json', source],
                                     capture_output=True, text=True, check=True).stdout)
    space = (info.get('streams') or [{}])[0].get('color_space', '')
    return 'bt2020' if space.startswith('bt2020') else 'bt709'


def smooth(a, span, axis):
    """Moving average over `span` steps along `axis`, the ends held."""
    pad = [(0, 0)] * a.ndim
    pad[axis] = (span // 2, span - 1 - span // 2)
    c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis, dtype=np.float64)
    c = np.concatenate([np.zeros_like(c.take([0], axis=axis)), c], axis=axis)
    return (c.take(range(span, c.shape[axis]), axis=axis) - c.take(range(0, c.shape[axis] - span), axis=axis)) / span


def steady_light(shots, span=12):
    """Lamp flicker, which a phone films as bands pulsing brighter and darker
    many times a second: each band of rows, in each colour, gets the
    brightness it has on average over the neighbouring frames."""
    rows = np.array([s.mean(axis=1) for s in shots], np.float32)  # frame x row x colour
    bands = smooth(rows, 31, axis=1)
    gain = smooth(bands, span, axis=0) / np.maximum(bands, 1)
    return [np.clip(s * g[:, None, :], 0, 255).astype(np.uint8) for s, g in zip(shots, gain)]


def frames(source, crop, look, steady=False, interp=1, clean=False, deflicker=False):
    chain = f'crop={crop},scale={SIZE}:{SIZE}:in_color_matrix={matrix(source)}:flags=lanczos,fps={FPS},format=yuv420p'
    with tempfile.TemporaryDirectory() as tmp:
        if steady:
            trf = os.path.join(tmp, 'motion.trf')
            subprocess.run(['ffmpeg', '-v', 'error', '-i', source, '-an', '-vf',
                            f'{chain},vidstabdetect=shakiness=6:accuracy=15:result={trf}', '-f', 'null', '-'], check=True)
            chain += f',vidstabtransform=input={trf}:smoothing=24:optzoom=1:interpol=bicubic'
            if interp > 1:
                chain += f',minterpolate=fps={FPS * interp}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1'
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', source, '-an', '-vf', chain,
                              '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    size = SIZE * SIZE * 3
    shots = [np.frombuffer(raw[i:i + size], np.uint8).reshape(SIZE, SIZE, 3)
             for i in range(0, len(raw) - size + 1, size)]
    if deflicker:
        shots = steady_light(shots)
    gains = np.ones(3, np.float32)
    if clean:
        # White balance and exposure from the clip's own highlights: they become neutral white.
        sample = np.concatenate([s.reshape(-1, 3) for s in shots[::max(1, len(shots) // 12)]]).astype(np.float32)
        gains = 0.97 * 255 / np.percentile(sample, 93, axis=0)
    # Kept as 8 bit: four times the frames for glide would not fit in memory as floats.
    return [np.asarray(grade(Image.fromarray(np.clip(s * gains, 0, 255).astype(np.uint8)), **look)) for s in shots]


def dissolve(clip, fade):
    """Loop between the two most alike moments, dissolving the end into the start."""
    n, span = len(clip), max(2, round(fade * FPS))
    small = [f[::16, ::16].astype(np.float32) for f in clip]
    best, ends = None, (0, n - 1)
    for a in range(0, n // 3):
        for b in range(max(a + n // 2, a + 3 * span), n):
            diff = float(np.abs(small[a] - small[b]).mean())
            if best is None or diff < best:
                best, ends = diff, (a, b)
    a, b = ends
    out = [f.astype(np.float32) for f in clip[a + span:b + 1 - span]]
    for i in range(span):
        mix = (i + 1) / (span + 1)
        out.append((1 - mix) * clip[b + 1 - span + i].astype(np.float32) + mix * clip[a + i].astype(np.float32))
    return out


def glide(clip, speed, interp=1):
    """Forward, rest, back, rest: a cosine through the clip, never a jump."""
    last = len(clip) - 1
    period = np.pi * last / interp / speed  # in output frames; the top speed is `speed`
    out = []
    for k in range(int(round(period))):
        t = last * (1 - np.cos(2 * np.pi * k / period)) / 2
        i = min(int(t), last - 1)
        f = t - i
        out.append((1 - f) * clip[i].astype(np.float32) + f * clip[i + 1].astype(np.float32))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source'); ap.add_argument('name')
    ap.add_argument('cx', type=int); ap.add_argument('cy', type=int); ap.add_argument('r', type=int)
    ap.add_argument('--ev', type=float, default=0.0); ap.add_argument('--blue', type=float, default=0.0)
    ap.add_argument('--loop', choices=['dissolve', 'glide'], default='dissolve')
    ap.add_argument('--speed', type=float, default=1.0); ap.add_argument('--fade', type=float, default=1.2)
    ap.add_argument('--crf', type=int, default=30)
    ap.add_argument('--look', choices=['honey', 'clean'], default='honey')
    ap.add_argument('--steady', action='store_true')
    ap.add_argument('--deflicker', action='store_true')
    o = ap.parse_args()
    base = CLEAN if o.look == 'clean' else {**LOOK, 'grain': 0.0}
    look = {**base, 'ev': o.ev, 'blue': o.blue}
    interp = INTERP if o.steady and o.loop == 'glide' else 1
    clip = frames(o.source, f'{2 * o.r}:{2 * o.r}:{o.cx - o.r}:{o.cy - o.r}', look,
                  steady=o.steady, interp=interp, clean=o.look == 'clean', deflicker=o.deflicker)
    out = glide(clip, o.speed, interp) if o.loop == 'glide' else dissolve(clip, o.fade)
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
