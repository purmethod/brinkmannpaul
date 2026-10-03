import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import Anthropic from '@anthropic-ai/sdk';

import {
  buildParams,
  buildUserMessage,
  DEFAULT_MODEL,
  extractText,
  handleCoachRequest,
  parseCoachInput,
  preflight,
  SYSTEM_PROMPT,
  type CoachEnv,
  type CreateMessage,
} from '../lib/coach.ts';

const valid = {
  phase: 'brandung',
  cycleDay: 25,
  daysSinceLastGesture: 12,
  situation: 'Sie ist gereizt wegen der Arbeit',
  lang: 'de',
};

const post = (body: unknown) =>
  new Request('https://coach.example/api/coach', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

function env(create: CreateMessage, apiKey = 'test-key', model?: string) {
  const calls: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming[] = [];
  const e: CoachEnv = {
    apiKey,
    model,
    createMessage: () => async (params) => {
      calls.push(params);
      return create(params);
    },
  };
  return { env: e, calls };
}

const reply =
  (text: string): CreateMessage =>
  async () => ({
    content: [{ type: 'text', text, citations: null }],
    stop_reason: 'end_turn',
  });

describe('parseCoachInput', () => {
  it('accepts the anonymous payload and drops unknown fields', () => {
    const parsed = parseCoachInput({ ...valid, name: 'Anna', date: '2026-03-01', deviceId: 'x' });
    assert.ok(parsed.ok);
    assert.deepEqual(Object.keys(parsed.value).sort(), [
      'cycleDay',
      'daysSinceLastGesture',
      'lang',
      'phase',
      'situation',
    ]);
  });

  it('rejects malformed input', () => {
    assert.equal(parseCoachInput(null).ok, false);
    assert.equal(parseCoachInput([]).ok, false);
    assert.equal(parseCoachInput({ ...valid, phase: 'storm' }).ok, false);
    assert.equal(parseCoachInput({ ...valid, cycleDay: 0 }).ok, false);
    assert.equal(parseCoachInput({ ...valid, cycleDay: 2.5 }).ok, false);
    assert.equal(parseCoachInput({ ...valid, daysSinceLastGesture: -1 }).ok, false);
    assert.equal(parseCoachInput({ ...valid, situation: 42 }).ok, false);
  });

  it('cleans and caps the situation text', () => {
    const parsed = parseCoachInput({ ...valid, situation: `  <b>Hallo</b>\n\n${'x'.repeat(900)}` });
    assert.ok(parsed.ok);
    assert.ok(!parsed.value.situation.includes('<'));
    assert.equal(parsed.value.situation.length, 500);
    const empty = parseCoachInput({ phase: 'ruhe', cycleDay: 2 });
    assert.ok(empty.ok);
    assert.deepEqual(empty.value, {
      phase: 'ruhe',
      cycleDay: 2,
      daysSinceLastGesture: null,
      situation: '',
      lang: 'de',
    });
  });
});

describe('prompt', () => {
  it('uses the specified system prompt', () => {
    assert.ok(
      SYSTEM_PROMPT.startsWith(
        'Du bist ein stoischer Mentor für Männer. Kernhaltung: Fels in der Brandung – ruhig, loyal, transparent, selbstbeherrscht, muss nicht das letzte Wort haben. Antworte in der Sprache der App, maximal 3 kurze Sätze, eine konkrete Handlung. Keine Manipulation, keine sexuellen Inhalte, keine Diagnosen, keine Abwertung der Frau, keine Behauptungen über ihre Denkfähigkeit.',
      ),
    );
  });

  it('builds the user message from the payload only', () => {
    const parsed = parseCoachInput({ ...valid, lang: 'en', daysSinceLastGesture: null });
    assert.ok(parsed.ok);
    const message = buildUserMessage(parsed.value);
    assert.match(message, /antworte auf Englisch/);
    assert.match(message, /Brandung/);
    assert.match(message, /Zyklustag: 25/);
    assert.match(message, /noch keine Geste/);
    assert.match(message, /Situation: Sie ist gereizt/);
  });

  it('requests a short low-effort reply with the default refusal fallback', () => {
    const parsed = parseCoachInput(valid);
    assert.ok(parsed.ok);
    const params = buildParams(parsed.value, DEFAULT_MODEL);
    assert.equal(params.model, 'claude-sonnet-5-5');
    assert.deepEqual(params.output_config, { effort: 'low' });
    assert.equal(params.fallbacks, 'default');
    assert.deepEqual(params.betas, ['server-side-fallback-2026-07-01']);
    assert.equal('thinking' in params, false);
    const other = buildParams(parsed.value, 'claude-haiku-4-5');
    assert.equal('fallbacks' in other, false);
  });

  it('extracts text blocks only', () => {
    const text = extractText({
      content: [
        { type: 'thinking', thinking: '', signature: 's' },
        { type: 'text', text: 'Bleib ruhig.\n', citations: null },
        { type: 'text', text: 'Hör zu.', citations: null },
      ],
    } as Pick<Anthropic.Beta.Messages.BetaMessage, 'content'>);
    assert.equal(text, 'Bleib ruhig. Hör zu.');
  });
});

describe('handleCoachRequest', () => {
  it('returns the reply', async () => {
    const { env: e, calls } = env(reply('Atme. Hör zu, ohne dich zu verteidigen. Frag sie, was ihr jetzt hilft.'));
    const res = await handleCoachRequest(post(valid), e);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), {
      text: 'Atme. Hör zu, ohne dich zu verteidigen. Frag sie, was ihr jetzt hilft.',
    });
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.equal(calls[0]?.model, 'claude-sonnet-5-5');
  });

  it('honours CLAUDE_MODEL', async () => {
    const { env: e, calls } = env(reply('Ok.'), 'k', 'claude-opus-5-5');
    await handleCoachRequest(post(valid), e);
    assert.equal(calls[0]?.model, 'claude-opus-5-5');
  });

  it('answers 503 without a key and never calls Claude', async () => {
    const { env: e, calls } = env(reply('x'), '');
    const res = await handleCoachRequest(post(valid), e);
    assert.equal(res.status, 503);
    assert.equal(calls.length, 0);
  });

  it('rejects bad requests', async () => {
    const { env: e } = env(reply('x'));
    assert.equal((await handleCoachRequest(post('{nope'), e)).status, 400);
    assert.equal((await handleCoachRequest(post({ ...valid, phase: 'x' }), e)).status, 400);
    assert.equal((await handleCoachRequest(post({ ...valid, situation: 'x'.repeat(5000) }), e)).status, 413);
  });

  it('maps refusals, empty replies and API errors', async () => {
    const refusal: CreateMessage = async () => ({ content: [], stop_reason: 'refusal' });
    assert.equal((await handleCoachRequest(post(valid), env(refusal).env)).status, 502);
    assert.equal((await handleCoachRequest(post(valid), env(reply('  ')).env)).status, 502);
    const throwing =
      (error: Error): CreateMessage =>
      async () => {
        throw error;
      };
    const cases: [Error, number][] = [
      [new Anthropic.RateLimitError(429, undefined, 'slow down', new Headers()), 429],
      [new Anthropic.AuthenticationError(401, undefined, 'bad key', new Headers()), 503],
      [new Anthropic.InternalServerError(500, undefined, 'boom', new Headers()), 502],
      [new Anthropic.APIConnectionTimeoutError(), 504],
      [new Anthropic.APIConnectionError({ message: 'offline' }), 502],
      [new Error('weird'), 500],
    ];
    const originalError = console.error;
    console.error = () => {};
    try {
      for (const [error, status] of cases) {
        assert.equal((await handleCoachRequest(post(valid), env(throwing(error)).env)).status, status);
      }
    } finally {
      console.error = originalError;
    }
  });

  it('answers CORS preflight', () => {
    const res = preflight();
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
  });
});
