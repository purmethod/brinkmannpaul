// Local backend: node server/dev.ts  (npm run dev:server) – same handler as on Vercel.
import { createServer } from "node:http";
import { nodeHandler } from "./node";

const port = Number(process.env.PORT ?? 8787);

createServer((req, res) => void nodeHandler(req, res)).listen(port, () => console.log(`cyclemax api on http://localhost:${port}`));
