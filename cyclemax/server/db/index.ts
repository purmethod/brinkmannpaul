// Database: Neon Postgres when DATABASE_URL is a postgres URL, otherwise local SQLite (libsql).
// Both dialects share identical table/column names, so the store runs one code path.
import { sql } from "drizzle-orm";
import * as pg from "./schema-pg";
import * as lite from "./schema-sqlite";
import { PG_DDL, SQLITE_DDL } from "./ddl";

export type Tables = typeof pg;

export interface Database {
  kind: "postgres" | "sqlite";
  /** Drizzle instance. Typed loosely because the two dialect types differ; queries are identical. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
  t: Tables;
  close(): Promise<void>;
}

export function isPostgresUrl(url: string | undefined): url is string {
  return !!url && /^postgres(ql)?:\/\//.test(url);
}

export async function createDatabase(url = process.env.DATABASE_URL): Promise<Database> {
  if (isPostgresUrl(url)) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const db = drizzle({ client: neon(url) });
    for (const stmt of PG_DDL) await db.execute(sql.raw(stmt));
    return { kind: "postgres", db, t: pg, close: async () => undefined };
  }
  const { createClient } = await import("@libsql/client");
  const { drizzle } = await import("drizzle-orm/libsql");
  const fileUrl = url ? url : process.env.SQLITE_URL || (process.env.VERCEL ? "file:/tmp/cyclemax.db" : "file:.data/cyclemax.db");
  if (fileUrl.startsWith("file:") && !fileUrl.includes(":memory:")) {
    const { mkdirSync } = await import("node:fs");
    const { dirname } = await import("node:path");
    mkdirSync(dirname(fileUrl.slice(5)), { recursive: true });
  }
  const client = createClient({ url: fileUrl });
  const db = drizzle({ client });
  for (const stmt of SQLITE_DDL) await client.execute(stmt);
  return { kind: "sqlite", db, t: lite as unknown as Tables, close: async () => client.close() };
}

let shared: Promise<Database> | null = null;

export function getDatabase(): Promise<Database> {
  if (!shared) shared = createDatabase().catch((e) => ((shared = null), Promise.reject(e)));
  return shared;
}
