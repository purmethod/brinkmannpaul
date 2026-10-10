// Vercel Function entry (CommonJS). `npm run build` bundles the backend (server/node.ts) into .data/api.cjs with
// esbuild, so the function never depends on how Vercel would compile TypeScript modules.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const api = require("../.data/api.cjs");

module.exports = api.default ?? api;
