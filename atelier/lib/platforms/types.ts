import type { Post } from '../types';

export type PlatformId = 'instagram' | 'tiktok';

export interface ConnectionData {
  accountId: string;
  username?: string;
  pageId?: string;
  token: string; // token used for publishing (instagram: page token)
  userToken?: string; // long-lived user token, used to refresh
  expiresAt?: Date | null;
}

export interface Connection extends ConnectionData {
  id: string;
  brandId: string;
  platform: PlatformId;
}

/** Every social network implements this — the scheduler and UI never talk to an api directly. */
export interface Platform {
  id: PlatformId;
  label: string;
  available: boolean;
  authorizeUrl(state: string, redirectUri: string): string;
  handleCallback(code: string, redirectUri: string): Promise<ConnectionData>;
  /** Extend tokens; return null when nothing changed. */
  refresh(conn: Connection): Promise<Partial<ConnectionData> | null>;
  publish(conn: Connection, post: Post): Promise<{ mediaId: string; permalink?: string }>;
}
