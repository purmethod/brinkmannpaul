# studio — instagram content pipeline

Upload from the phone → render (carousel) or cut/subtitle (reel) → caption by Claude →
approve → published daily at 18:00 Europe/Berlin to Instagram.

Separate from the one-pager in `dist/`. Vercel project root directory: `studio`.

## Engine vs. brand kit

- `lib/`, `app/`, `worker/` = engine. No brand values hard-coded.
- `brands/<id>/` = brand kit: `brand.json` (handle, timezone, post hour, `autoApprove`,
  fonts, sizes, caption rules, video settings), `templates.json` (WHITE / BLACK / PHOTO),
  `fonts/`, `signature.png`, optional `logo.png`.
- Active brand: env `BRAND_ID` (default `brinkbuild`). A new brand = new folder.

`signature.png`: transparent PNG, dark ink. It gets inverted automatically for BLACK/PHOTO.

## Flow

| step | where |
| --- | --- |
| upload (client upload straight into Vercel Blob) | `/` |
| carousel: satori + resvg → 1080×1350 PNG (+ JPEG for Instagram) | `lib/carousel.ts` |
| reel: `repository_dispatch` → `.github/workflows/process-video.yml` | `worker/process_video.py` |
| preview, edit caption, save each file, approve | `/preview/<id>` |
| queue, errors, retry, post now | `/status` |
| cron 16:00 + 17:00 UTC → only the run at 18:00 berlin posts | `app/api/cron/publish` |

Status: `processing` (reel being rendered) → `draft` → `approved` → `posted` | `error`.
Token refresh (`refresh_access_token`) runs monthly inside the daily cron; the token is stored in Upstash Redis.
Manual: `GET /api/cron/publish?force=1` or `/api/cron/refresh-token?force=1` with `Authorization: Bearer <ADMIN_SECRET>`.

## Env (Vercel)

`ADMIN_SECRET`, `IG_ACCESS_TOKEN`, `ANTHROPIC_API_KEY`, `GITHUB_TOKEN` (fine-grained, this repo, Contents: read & write),
`CRON_SECRET`, `BLOB_READ_WRITE_TOKEN` + `KV_REST_API_URL` / `KV_REST_API_TOKEN` (set by the Blob / Upstash integrations).
Optional: `GITHUB_REPO` (default `purmethod/brinkmannpaul`), `BRAND_ID`, `APP_URL`.

GitHub Actions secrets: `ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `ADMIN_SECRET`.
