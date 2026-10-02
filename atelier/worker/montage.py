"""
Montage: minutes of mostly silent process footage (baking, building, crafting, training) -> a 5–8 s reel.

  1. look    every clip is sampled at 4 fps as tiny grayscale frames -> motion, sharpness and
             repetition (a moment that looks like an earlier moment of the same action)
  2. choose  claude sees time-stamped contact sheets, the scores and what the creator said, and returns
             a shot list (one beat per shot, the story in order) plus 1–3 short text overlays
  3. refine  every shot snaps to the sharpest, most active window around claude's pick; shots that show
             the same thing twice are dropped; durations are fitted to the target length

Without claude (no key, error) the same scores pick the beats on their own.
"""
import base64
import json
import subprocess

import numpy as np

FPS = 4  # analysis samples per second
W, H = 96, 54  # analysis frame size (aspect does not matter for the scores)
MIN_SHOT, MAX_SHOT, MAX_LAST = 0.6, 1.8, 2.5

SYSTEM = """you are a top short-form video editor. you turn long, mostly silent process footage — cooking, baking, building, \
crafting, training — into a {target} second instagram reel that people watch twice and save.

how you edit:
- tell the process as a story in beats: the raw start -> the 2–5 most visual moments of the making -> the result. every beat is shown once.
- repetition is the enemy. two minutes of kneading is one beat, not ten. tiles marked "repeats" look like an earlier moment — \
take only the best moment of each action.
- pick moments of change: hands acting, material transforming (flour becomes dough, dough is folded, rises, the crust breaks), \
a pour, a cut, a reveal, steam, texture up close. skip setup, waiting, reaching out of frame, blur, shaky or empty frames.
- the first shot must stop the scroll: the most striking image or the most dramatic action. it may show the result first as a \
hook, then the making, then the result again.
- rhythm: shots of {min_shot}–{max_shot} s, shorter in the middle, the last shot up to {max_last} s. total {target} s. \
if the creator asks for another length, follow it (4–15 s).
- "start" is the moment in the clip where the shot begins; use the tile times; a shot must lie inside its clip.

text on screen:
- 1–3 overlays, english, lowercase, at most 6 words each, built from what the creator said (their words, sharpened) — never invented facts.
- the first overlay is the hook and starts at 0.0; the last may name the result. leave the middle quiet if the images speak.
- no emojis, no hashtags, no brand or account names.

answer only json:
{{"story": "one sentence", "length": {target}, "shots": [{{"clip": 0, "start": 12.5, "duration": 1.2, "beat": "flour into the bowl"}}], \
"overlays": [{{"text": "bread, the slow way", "start": 0.0, "end": 2.0}}]}}"""


# ---------------------------------------------------------------- 1. look

def analyse(path, dur):
    """Per-sample motion, sharpness and a brightness-invariant fingerprint of every analysis frame."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-vf", f"fps={FPS},scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
        check=True, capture_output=True,
    ).stdout
    n = len(raw) // (W * H)
    if n < 2:
        raise RuntimeError("video too short to analyse")
    f = np.frombuffer(raw[: n * W * H], np.uint8).reshape(n, H, W).astype(np.float32)
    motion = np.zeros(n, np.float32)
    motion[1:] = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
    motion[0] = motion[1]
    # a hard cut in the footage is one huge sample, not action: a 3-sample median removes it
    motion = np.median(np.stack([np.roll(motion, 1), motion, np.roll(motion, -1)]), axis=0)
    lap = np.abs(4 * f[:, 1:-1, 1:-1] - f[:, :-2, 1:-1] - f[:, 2:, 1:-1] - f[:, 1:-1, :-2] - f[:, 1:-1, 2:])
    sharp = lap.mean(axis=(1, 2))
    # 12x6 block means, centred and normalised -> cosine similarity ignores exposure changes
    small = f.reshape(n, 6, H // 6, 12, W // 12).mean(axis=(2, 4)).reshape(n, -1)
    small -= small.mean(axis=1, keepdims=True)
    small /= np.linalg.norm(small, axis=1, keepdims=True) + 1e-6
    norm = lambda a: np.clip(a / (np.percentile(a, 95) + 1e-6), 0, 1.5)  # noqa: E731
    return {"n": n, "dur": dur, "motion": norm(motion), "sharp": norm(sharp), "fp": small, "brightness": f.mean(axis=(1, 2))}


def idx(a, t):
    return int(min(a["n"] - 1, max(0, round(t * FPS))))


def repeats_of(a, t, gap=5.0, threshold=0.93):
    """Earliest earlier moment (>= gap seconds back) that looks like t, or None."""
    i, j = idx(a, t), idx(a, t - gap)
    if j <= 0 or t < gap:
        return None
    sims = a["fp"][:j] @ a["fp"][i]
    k = int(np.argmax(sims))
    return round(k / FPS, 1) if sims[k] >= threshold else None


def score_window(a, start, length):
    i, j = idx(a, start), max(idx(a, start) + 1, idx(a, start + length))
    m, s = a["motion"][i:j], a["sharp"][i:j]
    dark = a["brightness"][i:j].mean() < 18  # lens covered / black
    # active and sharp, but punish violent shake (motion far above the clip's normal)
    return float(np.minimum(m, 1.0).mean() * 0.6 + s.mean() * 0.4 - (m > 1.3).mean() * 0.3 - (1.0 if dark else 0))


def describe(a, t):
    m, s = float(a["motion"][idx(a, t)]), float(a["sharp"][idx(a, t)])
    parts = ["motion " + ("high" if m > 0.7 else "mid" if m > 0.3 else "still"), "sharp" if s > 0.6 else "soft"]
    rep = repeats_of(a, t)
    if rep is not None:
        parts.append(f"repeats {rep:.0f}s")
    return ", ".join(parts)


# ---------------------------------------------------------------- 2. choose

def contact_sheets(path, dur, ci, work, every, font_path=None, cols=4, rows=3, tile_w=240):
    """Time-stamped tiles of one clip; returns [(jpeg bytes, [times])]."""
    from PIL import Image, ImageDraw, ImageFont

    d = work / f"sheet-frames-{ci}"
    d.mkdir(exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(path), "-vf", f"fps=1/{every:.3f},scale={tile_w}:-2", "-q:v", "5", str(d / "%05d.jpg")],
        check=True,
    )
    frames = sorted(d.glob("*.jpg"))
    try:
        font = ImageFont.truetype(str(font_path), 22) if font_path else ImageFont.load_default()
    except OSError:
        font = ImageFont.load_default()
    out = []
    per = cols * rows
    for s in range(0, len(frames), per):
        group = frames[s : s + per]
        imgs = [Image.open(f).convert("RGB") for f in group]
        th = imgs[0].height
        sheet = Image.new("RGB", (cols * tile_w + (cols - 1) * 6, rows * th + (rows - 1) * 6), "white")
        times = []
        for k, im in enumerate(imgs):
            t = (s + k) * every
            if t > dur:
                break
            x, y = (k % cols) * (tile_w + 6), (k // cols) * (th + 6)
            sheet.paste(im, (x, y))
            draw = ImageDraw.Draw(sheet)
            label = f"{t:.1f}s"
            draw.rectangle([x, y, x + 74, y + 30], fill="black")
            draw.text((x + 6, y + 3), label, fill="white", font=font)
            times.append(round(t, 1))
        buf = work / f"sheet-{ci}-{s}.jpg"
        sheet.save(buf, quality=80)
        out.append((buf.read_bytes(), times))
    return out


def ask_claude(clips, analyses, opts, target, work, claude_call, font_path=None):
    total = sum(c["dur"] for c in clips)
    every = max(1.0, total / 96)  # at most ~96 tiles in all
    content = []
    for ci, (c, a) in enumerate(zip(clips, analyses)):
        speech = " ".join(w["text"] for w in c["words"]) or "none"
        content.append({"type": "text", "text": f"clip {ci} · {c['dur']:.1f} s · speech: {speech[:1500]}"})
        for jpg, times in contact_sheets(c["path"], c["dur"], ci, work, every, font_path):
            notes = "; ".join(f"{t:.1f}s {describe(a, t)}" for t in times)
            content.append({"type": "text", "text": f"clip {ci} tiles (left->right, top->bottom): {notes}"})
            content.append({"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": base64.b64encode(jpg).decode()}})
    content.append({
        "type": "text",
        "text": "\n".join([
            f"what the creator says it is about: {opts.get('description') or '-'}",
            f"notes for this post: {opts.get('notes') or '-'}",
            f"feedback on the previous cut (apply it): {opts.get('feedback') or '-'}",
            f"the creator's learned editing preferences (ignore rules about speech): {opts.get('rules') or '-'}",
        ]),
    })
    system = SYSTEM.format(target=target, min_shot=MIN_SHOT, max_shot=MAX_SHOT, max_last=MAX_LAST)
    text = claude_call(content, system, 3000)
    return json.loads(text[text.index("{") : text.rindex("}") + 1])


def auto_pick(clips, analyses, target):
    """No claude: split the footage into beats and take the best, non-repeating moment of each."""
    beats = max(4, min(6, round(target / 1.2)))
    total = sum(c["dur"] for c in clips)
    shots = []
    for b in range(beats):
        t0, t1 = total * b / beats, total * (b + 1) / beats
        best = None
        acc = 0.0
        for ci, (c, a) in enumerate(zip(clips, analyses)):
            lo, hi = max(t0 - acc, 0), min(t1 - acc, c["dur"])
            t = lo
            while t + 1.2 <= hi:
                sc = score_window(a, t, 1.2)
                if any(looks_same(a, t, 1.2, analyses[p["clip"]], p["start"], p["duration"]) for p in shots):
                    sc -= 1.0
                if best is None or sc > best[0]:
                    best = (sc, ci, t)
                t += 0.5
            acc += c["dur"]
        if best:
            shots.append({"clip": best[1], "start": best[2], "duration": 1.2, "beat": f"beat {b + 1}"})
    return {"story": "", "length": target, "shots": shots, "overlays": []}


# ---------------------------------------------------------------- 3. refine

def looks_same(a, s1, d1, b, s2, d2, threshold=0.97):
    """Two windows show the same thing when beginning, middle and end all match."""
    return all(float(a["fp"][idx(a, s1 + d1 * f)] @ b["fp"][idx(b, s2 + d2 * f)]) >= threshold for f in (0.1, 0.5, 0.9))


def refine(choice, clips, analyses, target):
    length = float(choice.get("length") or target)
    length = min(15.0, max(4.0, length))
    shots = []
    for s in choice.get("shots") or []:
        ci = int(s.get("clip", 0))
        if not 0 <= ci < len(clips):
            continue
        a, dur = analyses[ci], clips[ci]["dur"]
        d = min(MAX_LAST, max(MIN_SHOT, float(s.get("duration", 1.2))))
        d = min(d, dur)
        want = min(max(0.0, float(s.get("start", 0))), max(0.0, dur - d))
        # snap to the best window within ±1 s of claude's pick
        best, t = (score_window(a, want, d), want), max(0.0, want - 1.0)
        while t <= min(dur - d, want + 1.0):
            sc = score_window(a, t, d)
            if sc > best[0] + 0.03:
                best = (sc, t)
            t += 1 / FPS
        start = round(best[1], 3)
        # the same action twice (kneading at 0:40 and at 1:20) is shown once
        if any(looks_same(analyses[ci], start, d, analyses[p["clip"]], p["start"], p["dur"]) for p in shots):
            continue
        shots.append({"clip": ci, "start": start, "dur": d, "beat": str(s.get("beat", ""))[:80]})
    if not shots:
        raise RuntimeError("no usable shots")
    # fit the total (each shot stays within its bounds and its clip)
    total = sum(s["dur"] for s in shots)
    k = length / total
    for i, s in enumerate(shots):
        cap = MAX_LAST if i == len(shots) - 1 else MAX_SHOT * 1.25
        s["dur"] = round(min(cap, max(0.5, s["dur"] * k), clips[s["clip"]]["dur"] - s["start"]), 3)
    overlays = []
    for o in choice.get("overlays") or []:
        text = " ".join(str(o.get("text", "")).lower().split()[:8])
        if text:
            overlays.append({"text": text, "start": max(0.0, float(o.get("start", 0))), "end": float(o.get("end", 0))})
    return {
        "mode": "montage",
        "story": str(choice.get("story", ""))[:200],
        "shots": [{"clip": s["clip"], "start": s["start"], "end": round(s["start"] + s["dur"], 3), "beat": s["beat"]} for s in shots],
        "overlays": overlays[:3],
    }


def plan_montage(clips, opts, work, claude_call, log, font_path=None):
    target = float(opts.get("targetSeconds") or 7)
    analyses = [analyse(c["path"], c["dur"]) for c in clips]
    try:
        choice = ask_claude(clips, analyses, opts, target, work, claude_call, font_path)
        log(f"montage: claude story: {choice.get('story', '')}")
    except Exception as e:  # noqa: BLE001 — never fail the reel because the selection failed
        log(f"montage: claude failed ({e}); picking by motion and sharpness")
        choice = auto_pick(clips, analyses, target)
    plan = refine(choice, clips, analyses, target)
    log("montage: " + " | ".join(f"c{s['clip']} {s['start']:.1f}-{s['end']:.1f} {s['beat']}" for s in plan["shots"]))
    return plan


def is_montage(clips, opts):
    """Mostly silent footage -> montage; talking -> the speech cut. The creator can force either."""
    mode = opts.get("mode")
    if mode in ("montage", "talk"):
        return mode == "montage"
    total = sum(c["dur"] for c in clips) or 1
    spoken = sum(w["end"] - w["start"] for c in clips for w in c["words"])
    return spoken / total < 0.25
