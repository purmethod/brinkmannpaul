import Anthropic from '@anthropic-ai/sdk';

import { handleCoachRequest, preflight } from '../lib/coach.js';

// Vercel Function (Node.js runtime, Web handler signature): POST /api/coach
export function OPTIONS(): Response {
  return preflight();
}

export function POST(request: Request): Promise<Response> {
  return handleCoachRequest(request, {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.CLAUDE_MODEL,
    createMessage: (apiKey) => {
      // The app waits 20 s; one retry covers a transient overload.
      const client = new Anthropic({ apiKey, timeout: 9_000, maxRetries: 1 });
      return (params) => client.beta.messages.create(params);
    },
  });
}
