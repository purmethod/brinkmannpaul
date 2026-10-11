import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

/*
 * Photo → reel, right inside the app (no worker): a slow camera move over every photo, soft
 * dissolves, the words faded in where the picture is calm, one colour look over everything.
 * ffmpeg comes as a static binary (ffmpeg-static), so it runs on vercel as it runs locally.
 */

export type LookId = 'pure' | 'concrete' | 'stone' | 'noir';
/** Four looks from architecture — far apart on purpose, so the choice is obvious at a glance. */
export const LOOKS: Record<LookId, { label: string; filter: string }> = {
  // bright, true colour, crisp edges — white gallery walls, daylight
  pure: { label: 'pure', filter: 'eq=brightness=0.035:contrast=1.02:saturation=0.96,unsharp=5:5:0.45' },
  // cool, matte, colour almost gone, lifted blacks, fine grain — raw concrete
  concrete: {
    label: 'concrete',
    filter: "eq=contrast=0.92:saturation=0.42:brightness=0.015,colorbalance=rs=-0.03:bs=0.05:rh=-0.01:bh=0.02,curves=all='0/0.07 0.5/0.52 1/0.94',noise=alls=3:allf=t",
  },
  // warm sand and travertine, creamy highlights, muted greens — natural stone in late sun
  stone: {
    label: 'stone',
    filter: "eq=contrast=1.03:saturation=0.78:gamma=1.03,colorbalance=rs=0.03:bs=-0.04:rm=0.04:gm=0.015:bm=-0.04:rh=0.03:bh=-0.03,curves=all='0/0.04 0.5/0.53 1/0.97',vignette=angle=PI/7",
  },
  // graphic black and white, deep shadows, bright planes — light and shadow on facades
  noir: { label: 'noir', filter: "hue=s=0,curves=all='0/0 0.22/0.12 0.5/0.5 0.78/0.9 1/1',eq=contrast=1.12,vignette=angle=PI/5,noise=alls=4:allf=t" },
};
/** Looks saved before the four existed map onto their nearest one. */
const OLD_LOOKS: Record<string, LookId> = { natural: 'pure', vivid: 'pure', cinematic: 'concrete', warm: 'stone', mono: 'noir' };
export const DEFAULT_LOOK: LookId = 'pure';
export function lookOf(id?: string | null): LookId {
  if (id && id in LOOKS) return id as LookId;
  return (id && OLD_LOOKS[id]) || DEFAULT_LOOK;
}

let bin: string | null = null;
async function ffmpegPath(): Promise<string> {
  if (bin) return bin;
  const mod = (await import('ffmpeg-static')) as unknown as { default?: string } | string;
  const p = typeof mod === 'string' ? mod : mod.default;
  if (!p) throw new Error('ffmpeg is not available on this server');
  bin = p;
  return p;
}

function run(cmd: string, args: string[]) {
  return new Promise<void>((ok, fail) =>
    execFile(cmd, args, { maxBuffer: 32 * 1024 * 1024 }, (err, _out, stderr) => (err ? fail(new Error(`video: ${String(stderr).trim().split('\n').slice(-2).join(' ') || err.message}`)) : ok())),
  );
}

/** Can this server cut photo reels? (the binary shipped and runs) — for the health check. */
export async function reelsReady(): Promise<boolean> {
  try {
    await run(await ffmpegPath(), ['-hide_banner', '-version']);
    return true;
  } catch {
    return false;
  }
}

/** Seconds per photo so the whole reel lands at ~7–12 s. */
export function photoTiming(n: number) {
  const per = Math.min(3.2, Math.max(1.8, 9 / Math.max(1, n)));
  const fade = n > 1 ? 0.35 : 0;
  return { per, fade, total: per * n - fade * Math.max(0, n - 1) };
}

export async function renderPhotoReel(o: {
  photos: Buffer[];
  overlays: (Buffer | null)[]; // transparent 1080×1920 png per photo
  look?: LookId;
}): Promise<{ video: Buffer; cover: Buffer; duration: number }> {
  if (!o.photos.length) throw new Error('needs at least one photo');
  const W = 1080;
  const H = 1920;
  const fps = 30;
  const dir = await mkdtemp(path.join(tmpdir(), 'reel-'));
  try {
    const n = o.photos.length;
    const { per, fade, total } = photoTiming(n);
    const big = { w: Math.round(W * 1.16), h: Math.round(H * 1.16) };
    const args: string[] = ['-hide_banner', '-loglevel', 'error', '-y'];
    for (let i = 0; i < n; i++) {
      const file = path.join(dir, `p${i}.jpg`);
      await writeFile(file, await sharp(o.photos[i]).rotate().resize(big.w, big.h, { fit: 'cover', position: 'attention' }).jpeg({ quality: 92 }).toBuffer());
      args.push('-loop', '1', '-framerate', String(fps), '-t', per.toFixed(3), '-i', file);
    }
    const textAt: number[] = [];
    for (let i = 0; i < n; i++) {
      if (!o.overlays[i]) continue;
      const file = path.join(dir, `t${i}.png`);
      await writeFile(file, o.overlays[i]!);
      textAt[i] = n + textAt.filter((x) => x !== undefined).length;
      args.push('-loop', '1', '-framerate', String(fps), '-t', per.toFixed(3), '-i', file);
    }
    const silence = n + textAt.filter((x) => x !== undefined).length;
    args.push('-f', 'lavfi', '-t', total.toFixed(3), '-i', 'anullsrc=r=44100:cl=stereo');

    const fc: string[] = [];
    for (let i = 0; i < n; i++) {
      // alternate the move: slow push in, slow pull out, a drift — never the same twice in a row
      const zIn = i % 2 === 0;
      const z = zIn ? `(1+0.07*t/${per.toFixed(3)})` : `(1.07-0.07*t/${per.toFixed(3)})`;
      const driftX = i % 3 === 1 ? `+(in_w-${W})*0.25*t/${per.toFixed(3)}` : i % 3 === 2 ? `-(in_w-${W})*0.25*t/${per.toFixed(3)}` : '';
      fc.push(
        `[${i}:v]scale=w='trunc(${W}*${z}*1.0/2)*2+2':h=-2:eval=frame:flags=bicubic,crop=${W}:${H}:x='(in_w-${W})/2${driftX}':y='(in_h-${H})/2',setsar=1,fps=${fps},format=yuv420p[b${i}]`,
      );
      if (textAt[i] !== undefined) {
        const tIn = 0.25;
        const tOut = Math.max(tIn + 0.6, per - 0.5);
        fc.push(`[${textAt[i]}:v]format=rgba,fade=t=in:st=${tIn}:d=0.35:alpha=1,fade=t=out:st=${tOut.toFixed(3)}:d=0.3:alpha=1[o${i}]`);
        fc.push(`[b${i}][o${i}]overlay=0:0:format=auto,format=yuv420p[c${i}]`);
      } else fc.push(`[b${i}]null[c${i}]`);
    }
    let cur = 'c0';
    let offset = per;
    for (let i = 1; i < n; i++) {
      fc.push(`[${cur}][c${i}]xfade=transition=fade:duration=${fade}:offset=${(offset - fade).toFixed(3)}[x${i}]`);
      cur = `x${i}`;
      offset += per - fade;
    }
    const look = LOOKS[lookOf(o.look)];
    fc.push(`[${cur}]${look.filter},format=yuv420p[v]`);
    const out = path.join(dir, 'reel.mp4');
    args.push('-filter_complex', fc.join(';'), '-map', '[v]', '-map', `${silence}:a`);
    // capped bitrate: grain would otherwise blow the file up (instagram limit is generous, uploads are not)
    args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-maxrate', '7M', '-bufsize', '14M', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(fps));
    args.push('-c:a', 'aac', '-b:a', '128k', '-t', total.toFixed(3), '-movflags', '+faststart', out);
    const ff = await ffmpegPath();
    await run(ff, args);
    const coverFile = path.join(dir, 'cover.jpg');
    await run(ff, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', Math.min(0.8, total / 2).toFixed(2), '-i', out, '-frames:v', '1', '-q:v', '3', coverFile]);
    return { video: await readFile(out), cover: await readFile(coverFile), duration: Math.round(total * 100) / 100 };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

/** Where the picture is calm: compares the detail in the top, middle and bottom bands. */
export async function calmBand(photo: Buffer): Promise<'top' | 'middle' | 'bottom'> {
  const img = sharp(photo).rotate().resize(270, 480, { fit: 'cover', position: 'attention' }).greyscale();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  const band = (y0: number, y1: number) => {
    let sum = 0;
    let n = 0;
    for (let y = y0; y < y1; y++)
      for (let x = 1; x < 270; x++) {
        sum += Math.abs(data[y * 270 + x] - data[y * 270 + x - 1]);
        n++;
      }
    return sum / n;
  };
  const scores = { bottom: band(300, 400), top: band(60, 160) * 1.08, middle: band(180, 300) * 1.25 };
  return (Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0] as 'top' | 'middle' | 'bottom');
}
