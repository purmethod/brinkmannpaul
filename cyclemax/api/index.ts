// Vercel Function entry. All /api/* requests are rewritten here (see vercel.json).
import { handle } from "../server/app";

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
