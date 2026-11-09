# somaflowclub.com · foyo club

foyo club (forever young), formerly soma flow club. Raouf Baaroussi & Paul Brinkmann. The home page says "coming soon"; the full page is at /preview/ until Paul opens it. A static page, its own Vercel project (`somaflow`, root directory `somaflow/`).

- `index.html`, `app.js`: the page. Paul's clips as one loop (`flow.mp4`), his logo (`logo-white.webp` on the video, `logo-black.webp` in the header), the sessions and the sign-up in six languages.
- The sign-up runs on brinkmannpaul.com (`dist/api/soma.js`, sessions and the WhatsApp group in `dist/api/_soma.js`), where the Stripe key lives. `vercel.json` passes `/api/soma` through to it, so the page calls its own domain.
- New session: add it to `SESSIONS` in `dist/api/_soma.js`. Nothing on this page changes.
