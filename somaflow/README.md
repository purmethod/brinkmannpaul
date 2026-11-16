# myfoyo.com · foyo club

foyo club (forever young), formerly soma flow club. Paul Brinkmann. myfoyo.com shows the club; somaflowclub.com shows only "coming soon" (soon/index.html, by a host redirect in vercel.json). A static page, its own Vercel project (`somaflow`, root directory `somaflow/`).

- `index.html`, `app.js`: the page. Paul's clips as one loop (`flow.mp4`), his logo (`logo-white.webp` on the video, `logo-black.webp` in the header), the sessions and the sign-up in six languages.
- The sign-up runs on brinkmannpaul.com (`dist/api/soma.js`, sessions and the WhatsApp group in `dist/api/_soma.js`), where the Stripe key lives. `vercel.json` passes `/api/soma` through to it, so the page calls its own domain.
- New session: add it to `SESSIONS` in `dist/api/_soma.js`. Nothing on this page changes.

## the club (live since 12 nov 2026)

- start page: foyo's line, the team as circles (paul, nafisa, the lotus place ("join the circle") that opens `/apply`), the session and the sign-up, wim hof's line under it. opening film `flow2.mp4` (poster `poster2.webp`).
- teacher pages `/paul`, `/nafisa`: the same head for everyone (circle, name, what they teach, instagram), then circle, words, circle, words. a new teacher: an entry in `TEAM` in `app.js` and a copy of `nafisa/index.html`.
- `/apply`: teachers apply with name, email, a few words and a voice note; it goes to `brinkmannpaul.com/api/teach` (stripe customers with metadata foyo_teacher, the voice in the vercel blob store foyo-teachers).

## teachers' own accounts (since 16 nov 2026)

- `/login`: a teacher registers (name, email, password) and fills in the profile: up to three photos, what they teach, their own words (typed or spoken), instagram, the whatsapp group, the price of a class, payment (cash, card), where they are now (a tap reads the device's place; only town and country are kept and shown), and up to six retreats, each with title, dates, place and its own price ("add retreat"). six languages. a teacher can delete the own account with the password.
- the written profile: after saving, the teacher's words are turned into the club's profile in the shape of the hand-written ones (lead, who, path, for whom, what they teach, their way, their line) and into the six languages. it is written by a model through vercel's ai gateway with the deployment's own oidc token (no key in the repo or in the environment; `MODEL` in `dist/api/teacher.js`), only from what the teacher said, and kept as one json file in the blob store. `renderBio` in `app.js` draws every teacher's profile, hand-written or written this way, with the same parts. until a profile is written, the teacher's own words stand on the page.
- it runs on `brinkmannpaul.com/api/teacher` (`dist/api/teacher.js`): each account is a stripe customer (metadata foyo_account), the password a salted scrypt hash, the photos in the blob store foyo-teachers. no database, no new environment variable.
- a profile is on the site only after paul confirmed it in `/admin` (section "lehrer": confirm and set the address, take it off the site, new password, delete).
- on the site (`app.js`, `loadProfiles`): 📍 and the town under the circle on the start page; on the teacher's page the place, the whatsapp group, prices, payment and the next retreat. an account whose address is a hand-built page (`paul`, `nafisa`, `yury`, `judit`) adds these to that page; any other address is the teacher's own page, drawn by `t/index.html` (rewrite in `vercel.json`) from their photos and words.

- "join the circle" (the free place in the team) opens the registration (`/login/?new=1`); the old application page `/apply` redirects there.
