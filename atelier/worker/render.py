#!/usr/bin/env python3
"""
Atelier render worker (GitHub Actions today, any server later — CPU only):

  mostly silent footage (baking, building …) -> montage.py: motion/sharpness/repetition analysis + contact sheets
  to Claude -> 5–8 s of the best, non-repeating beats with 1–3 text overlays.

  talking footage:
  download clips -> faster-whisper (word timestamps) -> 1 frame/s + transcript to Claude, which
  picks the strongest parts and the hook (applying the brand's learned cut rules + feedback) ->

  cut pauses > threshold and filler words -> soft cuts (short cross-dissolve + audio crossfade) -> join clips in
  upload order -> subtitles (translated to english via Claude if needed) -> brand
  template (framed / full-bleed, gradient, signature in the last third) -> 1080x1920
  H.264/AAC mp4 (reels spec).

Input:  env PAYLOAD = {"postId","kit","template","clips":[urls],"options":{rules,feedback,language,voiceover,signature,plan}}
Output: $WORK_DIR/result.json (always) + $WORK_DIR/final.mp4 on success.
Everything brand-specific comes from atelier/brands/<kit>/ and the options.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import textwrap
import traceback
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import montage  # noqa: E402

STUDIO = Path(__file__).resolve().parents[1]
WORK = Path(os.environ.get("WORK_DIR", "work")).resolve()
GROUP = 10  # max inputs per ffmpeg join


def log(*a):
    print("[reel]", *a, flush=True)


def run(cmd, cwd=None):
    log(" ".join(str(c) for c in cmd)[:400])
    subprocess.run([str(c) for c in cmd], check=True, cwd=cwd)


def probe(path, entries, stream=None):
    cmd = ["ffprobe", "-v", "error"]
    if stream:
        cmd += ["-select_streams", stream]
    cmd += ["-show_entries", entries, "-of", "json", str(path)]
    return json.loads(subprocess.run(cmd, check=True, capture_output=True, text=True).stdout)


def duration_of(path):
    return float(probe(path, "format=duration")["format"]["duration"])


def has_audio(path):
    return bool(probe(path, "stream=index", "a").get("streams"))


def is_hdr(path):
    streams = probe(path, "stream=color_transfer", "v:0").get("streams") or [{}]
    return streams[0].get("color_transfer") in ("arib-std-b67", "smpte2084")


def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "atelier-render-worker"})
    with urllib.request.urlopen(req, timeout=600) as r, open(dest, "wb") as f:
        shutil.copyfileobj(r, f)


def hex_rgb(h):
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def ass_color(h):
    r, g, b = hex_rgb(h)
    return f"&H00{b:02X}{g:02X}{r:02X}"


# ---------------------------------------------------------------- transcription

_model = None


def transcribe(path):
    global _model
    from faster_whisper import WhisperModel

    if _model is None:
        _model = WhisperModel(os.environ.get("WHISPER_MODEL", "small"), device="cpu", compute_type="int8")
    segments, info = _model.transcribe(
        str(path),
        word_timestamps=True,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 300},
        condition_on_previous_text=False,
        beam_size=5,
        # nudges whisper to keep disfluencies so they can be cut
        initial_prompt="Ähm, äh, ähm. Uh, um, uhm.",
    )
    words = []
    for seg in segments:
        for w in seg.words or []:
            t = w.word.strip()
            if t and w.end > w.start:
                words.append({"start": float(w.start), "end": float(w.end), "text": t})
    log(f"{path.name}: language={info.language} words={len(words)}")
    return words, info.language


def norm(word):
    return re.sub(r"[^\w]", "", word.lower())


# ---------------------------------------------------------------- cutting

def plan_segments(words, range_start, range_end, cfg):
    """Keep-ranges inside [range_start, range_end]: break at pauses > threshold and around filler words."""
    fillers = {norm(f) for f in cfg["fillers"]}
    threshold = cfg["pauseThreshold"]
    pad_in, pad_out, min_len = 0.12, 0.18, 0.5
    items = [dict(w, filler=norm(w["text"]) in fillers) for w in words if w["end"] > range_start and w["start"] < range_end]
    if not any(not i["filler"] for i in items):
        return [{"start": range_start, "end": range_end, "words": []}]

    groups, cur, broken = [], [], False
    for idx, it in enumerate(items):
        if it["filler"]:
            broken = True
            continue
        if cur and (broken or it["start"] - items[cur[-1]]["end"] > threshold):
            groups.append(cur)
            cur = []
        cur.append(idx)
        broken = False
    if cur:
        groups.append(cur)

    segs = []
    for g in groups:
        first, last = g[0], g[-1]
        start = items[first]["start"] - pad_in
        end = items[last]["end"] + pad_out
        if first > 0:
            start = max(start, items[first - 1]["end"])
        if last + 1 < len(items):
            end = min(end, items[last + 1]["start"])
        start, end = max(range_start, start), min(range_end, end)
        if end - start < min_len:
            end = min(range_end, start + min_len)
        if end - start >= 0.3:
            segs.append({"start": start, "end": end, "words": [items[i] for i in g]})
    return segs or [{"start": range_start, "end": range_end, "words": []}]


# ---------------------------------------------------------------- claude: pick the strongest parts

def claude_call(content, system, max_tokens=4000):
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY missing")
    body = json.dumps({
        "model": os.environ.get("CLAUDE_MODEL", "claude-sonnet-5-5"),
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": content}],
    }).encode()
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=300) as r:
        res = json.loads(r.read())
    return "".join(c.get("text", "") for c in res.get("content", []) if c.get("type") == "text")


def extract_frames(src, clip_dur, ci, every, width):
    d = WORK / f"frames-{ci}"
    d.mkdir(exist_ok=True)
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", src, "-vf", f"fps=1/{every:.3f},scale={width}:-2", "-q:v", "6", d / "%05d.jpg"])
    return [((i) * every, f) for i, f in enumerate(sorted(d.glob("*.jpg")))]


def claude_select(clips, rules, feedback, cfg):
    """clips: [{dur, words, path}] -> ordered list of {clip, start, end}. Falls back to whole clips."""
    import base64

    ccfg = cfg.get("claude", {})
    max_frames = ccfg.get("maxFrames", 60)
    total = sum(c["dur"] for c in clips)
    every = max(1.0 / ccfg.get("framesPerSecond", 1), total / max_frames)
    content = []
    for ci, c in enumerate(clips):
        words = " ".join(f'[{w["start"]:.1f}]{w["text"]}' for w in c["words"]) or "(no speech)"
        content.append({"type": "text", "text": f"clip {ci} · {c['dur']:.1f}s · transcript with start times:\n{words}"})
        for t, f in extract_frames(c["path"], c["dur"], ci, every, ccfg.get("frameWidth", 384)):
            content.append({"type": "text", "text": f"clip {ci} t={t:.0f}s"})
            content.append({"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": base64.b64encode(f.read_bytes()).decode()}})
    content.append({"type": "text", "text": f"editing rules:\n{rules or '-'}\n\nfeedback on the previous cut:\n{feedback or '-'}"})
    system = (
        "you are a calm, precise video editor for instagram reels (architect's taste: less is more, no hectic cuts). "
        "choose the strongest parts of the footage. put the best hook moment first (a strong sentence or striking image), "
        "then the remaining parts in a logical order. keep complete sentences — use the word start times. "
        'answer only json: {"segments":[{"clip":0,"start":12.4,"end":19.8,"role":"hook"},{"clip":0,"start":0.0,"end":11.2}]} '
        "times in seconds of the original clip. no overlaps."
    )
    text = claude_call(content, system)
    data = json.loads(text[text.index("{"): text.rindex("}") + 1])
    out = []
    for seg in data.get("segments", []):
        ci = int(seg.get("clip", 0))
        if ci < 0 or ci >= len(clips):
            continue
        st, en = max(0.0, float(seg["start"])), min(clips[ci]["dur"], float(seg["end"]))
        if en - st >= 1.0:
            out.append({"clip": ci, "start": st, "end": en})
    return out


def encode_segment(src, seg, out, box_w, box_h, fps, audio, hdr):
    d = round((seg["end"] - seg["start"]) * fps) / fps
    seg["dur"] = d
    vf = []
    if hdr:  # iphone HLG/PQ -> SDR bt709
        vf.append("zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv")
    vf += [
        f"fps={fps}",
        f"scale={box_w}:{box_h}:force_original_aspect_ratio=increase",
        f"crop={box_w}:{box_h}",
        "setsar=1",
        "format=yuv420p",
    ]
    af = f"aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,apad=whole_dur={d:.4f},atrim=end={d:.4f}"
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", f"{seg['start']:.4f}", "-t", f"{d:.4f}", "-i", src]
    if not audio:
        cmd += ["-f", "lavfi", "-t", f"{d:.4f}", "-i", "anullsrc=r=48000:cl=stereo"]
    cmd += ["-vf", ",".join(vf), "-af", af, "-map", "0:v:0", "-map", "0:a:0" if audio else "1:a:0"]
    cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", "-r", str(fps)]
    cmd += ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-t", f"{d:.4f}", out]
    run(cmd)
    return d


def join(files, durs, out, fade, fps, depth=0):
    """Cross-dissolve join. Every junction overlaps by `fade`, at any grouping depth."""
    if len(files) == 1:
        shutil.copyfile(files[0], out)
        return durs[0]
    if len(files) > GROUP:
        parts, pdurs = [], []
        for i in range(0, len(files), GROUP):
            p = WORK / f"join-{depth}-{i}.mp4"
            pdurs.append(join(files[i:i + GROUP], durs[i:i + GROUP], p, fade, fps, depth + 1))
            parts.append(p)
        return join(parts, pdurs, out, fade, fps, depth + 1)

    # identical timebase/format on every input, otherwise xfade refuses to link
    fc = [f"[{i}:v]fps={fps},settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[n{i}];[{i}:a]asetpts=PTS-STARTPTS[m{i}]" for i in range(len(files))]
    cur, pv, pa = durs[0], "n0", "m0"
    for i in range(1, len(files)):
        off = cur - fade
        fc.append(f"[{pv}][n{i}]xfade=transition=fade:duration={fade:.4f}:offset={off:.4f}[v{i}]")
        fc.append(f"[{pa}][m{i}]acrossfade=d={fade:.4f}[a{i}]")
        pv, pa = f"v{i}", f"a{i}"
        cur = cur + durs[i] - fade
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"]
    for f in files:
        cmd += ["-i", f]
    cmd += ["-filter_complex", ";".join(fc), "-map", f"[{pv}]", "-map", f"[{pa}]"]
    cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", "-r", str(fps)]
    cmd += ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", out]
    run(cmd)
    return cur


# ---------------------------------------------------------------- subtitles

def make_chunks(words, max_chars, max_lines):
    limit = max_chars * max_lines
    chunks, cur = [], []

    def flush():
        if cur:
            chunks.append({"text": " ".join(w["text"] for w in cur), "start": cur[0]["t0"], "end": cur[-1]["t1"]})

    for w in words:
        if cur:
            text = " ".join(x["text"] for x in cur)
            sentence_end = re.search(r"[.!?…]$", cur[-1]["text"]) and len(text) > 14
            if len(text) + 1 + len(w["text"]) > limit or w["t0"] - cur[-1]["t1"] > 0.5 or sentence_end:
                flush()
                cur = []
        cur.append(w)
    flush()
    return chunks


def fit_chunks(chunks, max_chars, max_lines):
    """Ensure every chunk renders in <= max_lines; split longer ones with proportional timing."""
    out = []
    for c in chunks:
        lines = textwrap.wrap(c["text"], max_chars) or [""]
        if len(lines) <= max_lines:
            out.append(dict(c, lines=lines))
            continue
        pieces = [lines[i:i + max_lines] for i in range(0, len(lines), max_lines)]
        total = sum(len(" ".join(p)) for p in pieces)
        t = c["start"]
        for p in pieces:
            d = (c["end"] - c["start"]) * len(" ".join(p)) / max(total, 1)
            out.append({"text": " ".join(p), "lines": p, "start": t, "end": t + d})
            t += d
    for i, c in enumerate(out):  # calm pacing: linger a little, never overlap the next line
        nxt = out[i + 1]["start"] if i + 1 < len(out) else c["end"] + 1.0
        c["end"] = max(c["end"] + 0.2, c["start"] + 0.9)
        c["end"] = min(c["end"], nxt - 0.04) if nxt - 0.04 > c["start"] else c["end"]
    return out


def claude_translate(texts, target):
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY missing — needed to translate subtitles")
    model = os.environ.get("CLAUDE_MODEL", "claude-sonnet-5-5")
    system = (
        f"you translate spoken video subtitles into natural, calm {target}. keep each line short and faithful, "
        "no added words, no quotes around lines. answer only with a json array of strings with exactly the same "
        "number of items as the input array, same order."
    )
    out = []
    for i in range(0, len(texts), 80):
        batch = texts[i:i + 80]
        for attempt in range(3):
            body = json.dumps({
                "model": model,
                "max_tokens": 8000,
                "system": system,
                "messages": [{"role": "user", "content": json.dumps(batch, ensure_ascii=False)}],
            }).encode()
            req = urllib.request.Request(
                "https://api.anthropic.com/v1/messages",
                data=body,
                headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=180) as r:
                res = json.loads(r.read())
            text = "".join(c.get("text", "") for c in res.get("content", []) if c.get("type") == "text")
            try:
                arr = json.loads(text[text.index("["): text.rindex("]") + 1])
                if len(arr) == len(batch):
                    out += [str(x) for x in arr]
                    break
            except ValueError:
                pass
            log(f"translation batch mismatch, retry {attempt + 1}")
        else:
            raise RuntimeError("translation failed: model returned a wrong number of lines")
    return out


def ass_time(t):
    t = max(0.0, t)
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def write_ass(chunks, path, brand, tpl, scale=1.0):
    sub = brand["video"]["subtitles"]
    v = tpl["video"]
    W, H = brand["video"]["width"], brand["video"]["height"]
    family = brand["fonts"]["family"]
    style = (
        f"Style: Default,{family},{round(sub['fontSize'] * scale)},{ass_color(v['subtitleColor'])},&H000000FF,&H00000000,&H00000000,"
        f"0,0,0,0,100,100,0,0,1,0,0,1,{sub['marginSide']},{sub['marginSide']},{v['subtitleMarginV']},1"
    )
    lines = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "WrapStyle: 2",
        "ScaledBorderAndShadow: yes", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
        "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, "
        "MarginR, MarginV, Encoding",
        style, "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    for c in chunks:
        text = "\\N".join(re.sub(r"[{}\\]", "", l) for l in c["lines"])
        lines.append(f"Dialogue: 0,{ass_time(c['start'])},{ass_time(c['end'])},Default,,0,0,0,,{{\\fad(150,150)}}{text}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


# ---------------------------------------------------------------- brand overlays

def signature_png(brand_dir, brand, tpl, out, override_url=None):
    from PIL import Image, ImageOps

    src = brand_dir / brand["signature"]["file"]
    if override_url:  # signature uploaded in the app wins over the repo file
        src = WORK / "signature-src.png"
        download(override_url, src)
    if not src.exists():
        log("no signature.png in brand kit — skipping signature")
        return None
    img = Image.open(src).convert("RGBA")
    if tpl["signature"] == "inverted":
        r, g, b, a = img.split()
        rgb = ImageOps.invert(Image.merge("RGB", (r, g, b)))
        img = Image.merge("RGBA", (*rgb.split(), a))
    w = brand["video"]["signature"]["width"]
    img = img.resize((w, max(1, round(img.height * w / img.width))), Image.LANCZOS)
    img.save(out)
    return out


def gradient_png(tpl, W, H, out):
    from PIL import Image

    g = tpl.get("gradient")
    if not g:
        return None
    r, gr, b = hex_rgb(g["color"])
    h = int(H * g["heightRatio"])
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for y in range(h):
        a = int(255 * g["maxAlpha"] * ((y + 1) / h) ** 1.4)  # eased, darkest at the bottom
        img.paste((r, gr, b, a), (0, H - h + y, W, H - h + y + 1))
    img.save(out)
    return out


def logo_png(brand_dir, tpl, out):
    from PIL import Image

    cfg = tpl.get("logo")
    if not cfg or not (brand_dir / cfg["file"]).exists():
        return None
    img = Image.open(brand_dir / cfg["file"]).convert("RGBA")
    img = img.resize((cfg["width"], max(1, round(img.height * cfg["width"] / img.width))), Image.LANCZOS)
    img.save(out)
    return out


def render_final(joined, dur, ass, brand, tpl, brand_dir, out, assets=None, voiceover=None):
    W, H, fps = brand["video"]["width"], brand["video"]["height"], brand["video"]["fps"]
    v = tpl["video"]
    sig_cfg = brand["video"]["signature"]
    fonts = WORK / "fonts"
    fonts.mkdir(exist_ok=True)
    for key in ("regular", "bold"):
        shutil.copy(brand_dir / brand["fonts"][key], fonts)

    inputs = ["-i", joined]
    fc = []
    if v["layout"] == "framed":
        frame = v.get("frameColor") or tpl.get("paper") or tpl["background"]["color"]
        fc.append(f"[0:v]pad={W}:{H}:0:0:color=0x{frame.lstrip('#')}[base]")
    else:
        fc.append(f"[0:v]scale={W}:{H},setsar=1[base]")
    cur, n = "base", 1

    def still(path):
        nonlocal n
        inputs.extend(["-loop", "1", "-framerate", str(fps), "-t", f"{dur:.3f}", "-i", path])
        n += 1
        return n - 1

    grad = gradient_png(tpl, W, H, WORK / "gradient.png") if v["layout"] == "fullbleed" else None
    if grad:
        i = still(grad)
        fc.append(f"[{cur}][{i}:v]overlay=0:0:format=auto[g]")
        cur = "g"
    logo = logo_png(brand_dir, tpl, WORK / "logo.png") if v["layout"] == "fullbleed" else None
    if logo:
        i = still(logo)
        fc.append(f"[{cur}][{i}:v]overlay={tpl['logo']['x']}:{tpl['logo']['y']}:format=auto[l]")
        cur = "l"
    if ass:
        fc.append(f"[{cur}]subtitles=filename=subs.ass:fontsdir=fonts[s]")
        cur = "s"
    sig = signature_png(brand_dir, brand, tpl, WORK / "signature.png", (assets or {}).get("signature"))
    if sig:
        i = still(sig)
        start = dur * sig_cfg["startFraction"]
        fc.append(f"[{i}:v]format=rgba,fade=t=in:st={start:.3f}:d={sig_cfg['fadeInSec']}:alpha=1[sig]")
        fc.append(f"[{cur}][sig]overlay=x=W-w-{sig_cfg['marginRight']}:y=H-h-{sig_cfg['marginBottom']}:format=auto[o]")
        cur = "o"
    fc.append(f"[{cur}]format=yuv420p[vout]")
    if voiceover:  # own voice on top, original sound quietly underneath
        inputs.extend(["-i", voiceover])
        vo = n
        fc.append(f"[0:a]volume=0.2[orig];[{vo}:a]aresample=48000,apad[vo];[orig][vo]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[aout]")
    else:
        fc.append("[0:a]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[aout]")

    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *inputs]
    cmd += ["-filter_complex", ";".join(fc), "-map", "[vout]", "-map", "[aout]"]
    cmd += ["-c:v", "libx264", "-profile:v", "high", "-level", "4.1", "-preset", "medium", "-crf", "20"]
    cmd += ["-maxrate", "8M", "-bufsize", "16M", "-pix_fmt", "yuv420p", "-r", str(fps), "-g", str(fps * 2)]
    cmd += ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]
    cmd += ["-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2", "-t", f"{dur:.3f}", "-movflags", "+faststart", out]
    run(cmd, cwd=WORK)


# ---------------------------------------------------------------- main

def subtitle_chunks(mapped, lang, target, sub_cfg):
    chunks = make_chunks(mapped, sub_cfg["maxCharsPerLine"], sub_cfg["maxLines"])
    if chunks and not (lang or "").startswith(target):
        log(f"translating {len(chunks)} subtitle lines {lang} -> {target}")
        names = {"en": "english", "de": "german", "es": "spanish", "fr": "french", "it": "italian"}
        for c, t in zip(chunks, claude_translate([c["text"] for c in chunks], names.get(target, target))):
            c["text"] = t.strip()
    if sub_cfg.get("lowercase"):
        for c in chunks:
            c["text"] = c["text"].lower()
    return chunks


def render_montage(clips, plan, opts, brand, tpl, brand_dir, fps, box_w, box_h, sub_cfg):
    """5–8 s from minutes of footage: claude picks the beats, hard-ish cuts, short text overlays."""
    if not isinstance(plan, dict):
        font = brand_dir / brand["fonts"].get("sansMedium", brand["fonts"]["regular"])
        plan = montage.plan_montage(clips, opts, WORK, claude_call, log, font)
    files, durs = [], []
    for i, shot in enumerate(plan["shots"]):
        c = clips[shot["clip"]]
        out = WORK / f"shot-{i}.mp4"
        durs.append(encode_segment(c["path"], dict(shot), out, box_w, box_h, fps, c["audio"], c["hdr"]))
        files.append(out)
    cut = 2 / fps  # two-frame dissolve: reads as a cut, never as a jump
    joined = WORK / "joined.mp4"
    join(files, durs, joined, cut, fps)
    dur = duration_of(joined)

    ass = None
    lines = []
    for o in plan.get("overlays") or []:
        start = min(max(0.0, o["start"]), max(0.0, dur - 0.8))
        end = min(dur, o["end"] if o["end"] > start + 0.6 else start + 1.8)
        text = o["text"].lower() if sub_cfg.get("lowercase") else o["text"]
        lines.append({"text": text, "lines": textwrap.wrap(text, sub_cfg["maxCharsPerLine"])[: sub_cfg["maxLines"]], "start": start, "end": end})
    if lines:
        ass = WORK / "subs.ass"
        write_ass(lines, ass, brand, tpl, scale=1.3)

    final = WORK / "final.mp4"
    render_final(joined, dur, ass, brand, tpl, brand_dir, final, {"signature": opts.get("signature")})
    dur = duration_of(final)
    cover = WORK / "cover.jpg"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", f"{min(0.5, dur / 2):.2f}", "-i", final, "-frames:v", "1", "-q:v", "2", cover])
    # the caption is written from this: the story and the words on screen
    transcript = " ".join([plan.get("story") or ""] + [o["text"] for o in plan.get("overlays") or []]).strip()
    return {"ok": True, "video": str(final), "cover": str(cover), "duration": round(dur, 2), "transcript": transcript, "plan": plan}


def main(payload):
    kit = payload.get("kit", "")
    if not re.fullmatch(r"[a-z0-9_-]+", kit):
        raise ValueError(f"invalid kit {kit!r}")
    opts = payload.get("options") or {}
    brand_dir = STUDIO / "brands" / kit
    brand = json.loads((brand_dir / "brand.json").read_text())
    tpl = json.loads((brand_dir / "templates.json").read_text())["templates"][payload["template"]]
    cfg = brand["video"]
    sub_cfg = cfg["subtitles"]
    target = opts.get("language") or brand.get("subtitleLanguage") or sub_cfg["language"]
    fps = cfg["fps"]
    fade = round(cfg["crossfade"] * fps) / fps
    box_w, box_h = cfg["width"], tpl["video"]["boxHeight"]
    urls = payload.get("clips") or []
    if not urls:
        raise ValueError("no clips")

    # 1. download + transcribe every clip
    clips = []
    for ci, url in enumerate(urls):
        src = WORK / f"clip-{ci}"
        download(url, src)
        audio = has_audio(src)
        words, lang = transcribe(src) if audio else ([], target)
        clips.append({"path": src, "dur": duration_of(src), "audio": audio, "words": words, "lang": lang, "hdr": is_hdr(src)})

    # 2a. mostly silent process footage -> a short montage with text overlays
    plan = opts.get("plan")
    if isinstance(plan, dict) or (not plan and montage.is_montage(clips, opts)):
        return render_montage(clips, plan, opts, brand, tpl, brand_dir, fps, box_w, box_h, sub_cfg)

    # 2b. talking: what goes in, in which order (claude), unless we re-render a known cut
    if not plan:
        try:
            plan = claude_select(clips, opts.get("rules"), opts.get("feedback"), cfg)
            log(f"claude picked {len(plan)} parts")
        except Exception as e:  # noqa: BLE001 — never fail a cut because the selection failed
            log(f"selection failed ({e}); using whole clips")
            plan = []
    if not plan:
        plan = [{"clip": i, "start": 0.0, "end": c["dur"]} for i, c in enumerate(clips)]

    # 3. cut pauses / fillers inside every part, soft joins, timeline mapping for subtitles
    seg_files, seg_durs, chunks, transcript = [], [], [], []
    offset = 0.0
    for pi, part in enumerate(plan):
        c = clips[part["clip"]]
        segs = plan_segments(c["words"], part["start"], part["end"], cfg)
        mapped = []
        for si, seg in enumerate(segs):
            out = WORK / f"seg-{pi}-{si}.mp4"
            d = encode_segment(c["path"], seg, out, box_w, box_h, fps, c["audio"], c["hdr"])
            if seg_files:
                offset -= fade
            for w in seg["words"]:
                mapped.append({"text": w["text"], "t0": max(offset + w["start"] - seg["start"], offset), "t1": min(offset + w["end"] - seg["start"], offset + d)})
            seg_files.append(out)
            seg_durs.append(d)
            offset += d
        part_chunks = subtitle_chunks(mapped, c["lang"], target, sub_cfg)
        chunks += part_chunks
        transcript += [x["text"] for x in part_chunks]

    joined = WORK / "joined.mp4"
    join(seg_files, seg_durs, joined, fade, fps)
    dur = duration_of(joined)

    # 4. optional voiceover recorded in the app over the previous render: its words become the subtitles
    voiceover = None
    if opts.get("voiceover"):
        voiceover = WORK / "voiceover"
        download(opts["voiceover"], voiceover)
        vo_words, vo_lang = transcribe(voiceover)
        vo_mapped = [{"text": w["text"], "t0": w["start"], "t1": w["end"]} for w in vo_words if w["start"] < dur]
        if vo_mapped:
            chunks = subtitle_chunks(vo_mapped, vo_lang, target, sub_cfg)
            transcript = [x["text"] for x in chunks]

    ass = None
    fitted = fit_chunks(chunks, sub_cfg["maxCharsPerLine"], sub_cfg["maxLines"])
    if fitted:
        ass = WORK / "subs.ass"
        write_ass(fitted, ass, brand, tpl)

    final = WORK / "final.mp4"
    render_final(joined, dur, ass, brand, tpl, brand_dir, final, {"signature": opts.get("signature")}, voiceover)
    dur = duration_of(final)
    cover = WORK / "cover.jpg"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", f"{min(1.0, dur / 2):.2f}", "-i", final, "-frames:v", "1", "-q:v", "2", cover])
    if dur > 180:
        log(f"warning: {dur:.0f}s is longer than instagram's reel limit for the api")
    return {"ok": True, "video": str(final), "cover": str(cover), "duration": round(dur, 2), "transcript": " ".join(transcript), "plan": plan}


if __name__ == "__main__":
    WORK.mkdir(parents=True, exist_ok=True)
    payload = json.loads(os.environ.get("PAYLOAD") or "{}")
    result_file = WORK / "result.json"
    try:
        result = main(payload)
        result["postId"] = payload.get("postId")
        result_file.write_text(json.dumps(result))
        log("done", json.dumps({k: v for k, v in result.items() if k != "transcript"}))
    except Exception as e:  # noqa: BLE001 — report every failure back to the app
        traceback.print_exc()
        msg = str(e)
        if isinstance(e, subprocess.CalledProcessError):
            msg = f"ffmpeg failed ({e.returncode})"
        result_file.write_text(json.dumps({"ok": False, "postId": payload.get("postId"), "error": msg[:500]}))
        sys.exit(1)
