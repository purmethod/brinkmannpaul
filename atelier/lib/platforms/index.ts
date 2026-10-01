import { decrypt, encrypt } from '../crypto';
import { id, one, q } from '../db';
import { instagram } from './instagram';
import { tiktok } from './tiktok';
import type { Connection, ConnectionData, Platform, PlatformId } from './types';

export const platforms: Record<PlatformId, Platform> = { instagram, tiktok };

export function getPlatform(pid: string): Platform {
  const p = platforms[pid as PlatformId];
  if (!p) throw new Error(`unknown platform ${pid}`);
  return p;
}

interface Row {
  id: string;
  brand_id: string;
  platform: PlatformId;
  account_id: string;
  username: string | null;
  page_id: string | null;
  token_enc: string;
  user_token_enc: string | null;
  expires_at: string | null;
}

function fromRow(r: Row): Connection {
  return {
    id: r.id,
    brandId: r.brand_id,
    platform: r.platform,
    accountId: r.account_id,
    username: r.username ?? undefined,
    pageId: r.page_id ?? undefined,
    token: decrypt(r.token_enc),
    userToken: r.user_token_enc ? decrypt(r.user_token_enc) : undefined,
    expiresAt: r.expires_at ? new Date(r.expires_at) : null,
  };
}

/** Tokens are stored AES-256-GCM encrypted (ENCRYPTION_KEY). */
export async function saveConnection(brandId: string, platform: PlatformId, d: ConnectionData) {
  await q(
    `insert into connections (id, brand_id, platform, account_id, username, page_id, token_enc, user_token_enc, expires_at, refreshed_at, status, error)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),'active',null)
     on conflict (brand_id, platform) do update set account_id = excluded.account_id, username = excluded.username,
       page_id = excluded.page_id, token_enc = excluded.token_enc, user_token_enc = excluded.user_token_enc,
       expires_at = excluded.expires_at, refreshed_at = now(), status = 'active', error = null`,
    [id('con'), brandId, platform, d.accountId, d.username ?? null, d.pageId ?? null, encrypt(d.token), d.userToken ? encrypt(d.userToken) : null, d.expiresAt ?? null],
  );
}

export async function getConnection(brandId: string, platform: PlatformId = 'instagram'): Promise<Connection | null> {
  const r = await one<Row>('select * from connections where brand_id = $1 and platform = $2', [brandId, platform]);
  return r ? fromRow(r) : null;
}

export async function connectionStatus(brandId: string) {
  return q<{ platform: string; username: string | null; status: string; error: string | null; expires_at: string | null; refreshed_at: string | null }>(
    'select platform, username, status, error, expires_at, refreshed_at from connections where brand_id = $1',
    [brandId],
  );
}

/** Daily cron: extend tokens that expire within 20 days. */
export async function refreshConnections() {
  const rows = await q<Row>("select * from connections where status = 'active' and (expires_at is null or expires_at < now() + interval '20 days')");
  const out: Record<string, string> = {};
  for (const r of rows) {
    const conn = fromRow(r);
    try {
      const upd = await getPlatform(conn.platform).refresh(conn);
      if (upd) await saveConnection(conn.brandId, conn.platform, { ...conn, ...upd });
      out[conn.id] = upd ? 'refreshed' : 'unchanged';
    } catch (e) {
      await q('update connections set error = $2 where id = $1', [conn.id, (e as Error).message]);
      out[conn.id] = (e as Error).message;
    }
  }
  return out;
}
