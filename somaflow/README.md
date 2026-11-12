# myfoyo.com · foyo club

foyo club (forever young), formerly soma flow club. Paul Brinkmann. myfoyo.com shows the club; somaflowclub.com shows only "coming soon" (soon/index.html, by a host redirect in vercel.json). A static page, its own Vercel project (`somaflow`, root directory `somaflow/`).

- `index.html`, `app.js`: the page. Paul's clips as one loop (`flow.mp4`), his logo (`logo-white.webp` on the video, `logo-black.webp` in the header), the sessions and the sign-up in six languages.
- The sign-up runs on brinkmannpaul.com (`dist/api/soma.js`, sessions and the WhatsApp group in `dist/api/_soma.js`), where the Stripe key lives. `vercel.json` passes `/api/soma` through to it, so the page calls its own domain.
- New session: add it to `SESSIONS` in `dist/api/_soma.js`. Nothing on this page changes.

## the club (live since 12 nov 2026)

- start page: foyo's line, the team as circles (paul, nafisa, the lotus place that opens `/apply`), the session and the sign-up, wim hof's line under it. opening film `flow2.mp4` (poster `poster2.webp`).
- teacher pages `/paul`, `/nafisa`: the same head for everyone (circle, name, what they teach, instagram), then circle, words, circle, words. a new teacher: an entry in `TEAM` in `app.js` and a copy of `nafisa/index.html`.
- `/apply`: teachers apply with name, email, a few words and a voice note; it goes to `brinkmannpaul.com/api/teach` (stripe customers with metadata foyo_teacher, the voice in the vercel blob store foyo-teachers).
