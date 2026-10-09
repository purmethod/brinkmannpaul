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

export type LookId = 'natural' | 'cinematic' | 'warm' | 'mono' | 'vivid';
export const LOOKS: Record<LookId, { label: string; filter: string }> = {
  natural: { label: 'natural', filter: 'eq=contrast=1.03:saturation=1.03' },
  // teal shadows, warm highlights, softer saturation, a vignette and fine grain — film, not instagram filter
  cinematic: {
    label: 'cinematic',
    filter: 'eq=contrast=1.08:saturation=0.86:gamma=0.98,colorbalance=rs=-0.05:gs=-0.01:bs=0.06:rh=0.06:gh=0.01:bh=-0.05,vignette=angle=PI/5,noise=alls=4:allf=t',
  },
  warm: { label: 'warm', filter: 'eq=contrast=1.04:saturation=1.06,colorbalance=rm=0.05:gm=0.01:bm=-0.05:rh=0.04:bh=-0.04,vignette=angle=PI/6' },
  mono: { label: 'mono', filter: 'hue=s=0,eq=contrast=1.14:brightness=-0.01,vignette=angle=PI/5,noise=alls=5:allf=t' },
  vivid: { label: 'vivid', filter: 'eq=contrast=1.06:saturation=1.22' },
};

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
    const look = LOOKS[o.look ?? 'natural'] ?? LOOKS.natural;
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
