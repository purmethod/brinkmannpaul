import { neon } from '@neondatabase/serverless';
import { normalizeEnv } from './env';

type Sql = ReturnType<typeof neon>;
let client: Sql | null = null;
let ready: Promise<void> | null = null;

// Multi-user from day one: every row hangs off a user → brand. Phase 1 has one user.
const SCHEMA = [
  `create table if not exists users (
    id text primary key, email text unique not null, timezone text not null default 'Europe/Berlin',
    created_at timestamptz not null default now())`,
  `create table if not exists brands (
    id text primary key, user_id text not null references users(id) on delete cascade,
    kit text not null, name text not null, settings jsonb not null default '{}',
    created_at timestamptz not null default now())`,
  `create table if not exists connections (
    id text primary key, brand_id text not null references brands(id) on delete cascade,
    platform text not null, account_id text not null, username text, page_id text,
    token_enc text not null, user_token_enc text, expires_at timestamptz, refreshed_at timestamptz,
    status text not null default 'active', error text, created_at timestamptz not null default now(),
    unique (brand_id, platform))`,
  `create table if not exists media (
    id text primary key, brand_id text not null references brands(id) on delete cascade,
    number int not null, kind text not null, url text not null, status text not null default 'ready',
    filename text, created_at timestamptz not null default now(), unique (brand_id, number))`,
  `create table if not exists posts (
    id text primary key, brand_id text not null references brands(id) on delete cascade,
    kind text not null, status text not null, template text not null, media_ids text[] not null default '{}',
    text text, caption text not null default '', output jsonb not null default '{}', options jsonb not null default '{}',
    transcript text, error text, ig_media_id text, permalink text,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
  `create table if not exists schedules (
    id text primary key, post_id text not null references posts(id) on delete cascade,
    brand_id text not null references brands(id) on delete cascade, at timestamptz not null,
    status text not null default 'pending', message_id text, attempts int not null default 0, error text,
    created_at timestamptz not null default now())`,
  `create index if not exists schedules_brand_at on schedules (brand_id, at)`,
  `create table if not exists edit_feedback (
    id text primary key, brand_id text not null references brands(id) on delete cascade, post_id text,
    text text not null, consumed boolean not null default false, created_at timestamptz not null default now())`,
  `create table if not exists messages (
    id text primary key, brand_id text not null references brands(id) on delete cascade,
    role text not null, text text not null, proposal jsonb, created_at timestamptz not null default now())`,
  `create table if not exists api_keys (
    id text primary key, user_id text not null references users(id) on delete cascade,
    hash text unique not null, label text, created_at timestamptz not null default now())`,
  `create table if not exists oauth_clients (
    client_id text primary key, name text, redirect_uris text[] not null, created_at timestamptz not null default now())`,
  `create table if not exists oauth_codes (
    code_hash text primary key, client_id text not null, user_id text not null, redirect_uri text not null,
    challenge text not null, expires_at timestamptz not null)`,
  `create table if not exists oauth_tokens (
    token_hash text primary key, kind text not null, client_id text not null, user_id text not null,
    expires_at timestamptz not null)`,
];

function raw(): Sql {
  if (!client) {
    normalizeEnv();
    const url = process.env.DATABASE_URL;
    if (!url) {
      const names = Object.keys(process.env).filter((k) => /URL|DATABASE|POSTGRES|PG/.test(k) && !/^(VERCEL|NEXT|NODE)/.test(k));
      throw new Error(`DATABASE_URL missing — connect neon to this project for "production" (vercel → storage). seen: ${names.join(', ') || 'none'}`);
    }
    client = neon(url);
  }
  return client;
}

async function ensureSchema() {
  if (!ready) {
    ready = (async () => {
      for (const stmt of SCHEMA) await raw().query(stmt);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

/** Parameterised query ($1, $2 …) returning rows. */
export async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  return (await raw().query(text, params)) as T[];
}

export async function one<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(text, params))[0] ?? null;
}

export function id(prefix: string): string {
  const rnd = Array.from(crypto.getRandomValues(new Uint8Array(9)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 12);
  return `${prefix}_${Date.now().toString(36)}${rnd}`;
}
