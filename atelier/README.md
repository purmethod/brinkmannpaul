# atelier

Mobile web app (PWA) to plan, cut and automatically post videos, photos and carousels to Instagram.
Calm, architectural design; Next.js on Vercel. Vercel project root directory: `atelier`.

## How it works

| | |
| --- | --- |
| **week** `/` | calendar of the next days: time, preview, status ("approve" when it needs you) |
| **media** `/media` | upload many videos/photos at once (straight into Vercel Blob). Every file gets a number #1, #2 … |
| **plan** `/chat` | speak or type in any language → Claude proposes a list → "passt" saves it |
| **post** `/p/<id>` | preview, save each file, caption, template, time, feedback → recut, voiceover, approve, post now |
| **settings** | connect instagram, auto-approve, rules, signature, ios shortcut key, claude connector url |

Engine and brand are separate: `brands/<kit>/` holds the defaults (fonts, templates WHITE/BLACK/PHOTO, layout,
caption and cut rules); everything the user changes lives in `brands.settings` in Postgres. Data model is
multi-user from day one: `users → brands → connections, media, posts → schedules, edit_feedback, messages`.

- **Instagram**: Facebook Login for Business → long-lived user token → page token (does not expire), AES-256-GCM encrypted. Daily cron extends tokens. TikTok: interface in `lib/platforms/`, not built.
- **Cut** (`worker/render.py`, GitHub Action `atelier-render` via `repository_dispatch`): faster-whisper word timestamps → 1 frame/s + transcript to Claude (strongest parts, hook first, learned rules + feedback) → pauses > 0.6 s and fillers out, soft cross-dissolves → subtitles (max 2 lines, lower third, translated to the chosen language) → signature in the last third → 1080×1920 H.264/AAC + cover. Swap `lib/worker.ts` to move rendering to an own server.
- **Learning cut**: every feedback note is stored; every 5 notes Claude folds them into the brand's cut rules (visible and editable in settings).
- **Posting**: Upstash QStash delivers each schedule at the exact minute to `/api/qstash/publish`. Failures retry after 10 minutes (3 attempts), then status error + notice in the app.
- **Claude connector**: remote MCP server at `/api/mcp`, OAuth 2.1 with discovery (`/.well-known/*`), dynamic client registration and PKCE.
- **Phone**: Android share target (install to home screen), iOS shortcut via `/api/ingest` + personal key (instructions in settings).

## Music

The official Instagram content publishing API has no music library search and no way to attach licensed
songs to a reel (only an `audio_name` for original audio). Song requests are stored on the post (`options.song`)
so they can be attached once Meta offers it to this app; until then add music in the Instagram app.

## Env (Vercel)

| name | source |
| --- | --- |
| `DATABASE_URL` | Neon integration (Vercel → Storage) |
| `BLOB_READ_WRITE_TOKEN` | Blob store, **public** (Vercel → Storage) |
| `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` (+ `QSTASH_URL`) | Upstash QStash integration |
| `META_APP_ID`, `META_APP_SECRET` (optional `META_CONFIG_ID`) | Meta app → settings → basic (config id: Facebook Login for Business) |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `GITHUB_TOKEN` | fine-grained PAT for this repo, Contents: read & write |
| `ENCRYPTION_KEY` | 32+ random characters |
| `ADMIN_SECRET` | your password |
| `CRON_SECRET` | random string (daily token refresh) |
| optional | `ADMIN_EMAIL`, `APP_URL`, `GITHUB_REPO`, `BRAND_KIT`, `CLAUDE_MODEL`, `META_GRAPH_VERSION` |

GitHub → Actions secrets: `ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN`. The worker reports back with a
per-post HMAC, so no app secret lives in GitHub.
