import { Redis } from '@upstash/redis';

let client: Redis | null = null;

/** Upstash Redis — works with the Vercel Marketplace (KV_REST_API_*) and plain Upstash (UPSTASH_REDIS_REST_*) env names. */
export function redis(): Redis {
  if (!client) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error('redis not configured: connect upstash redis in vercel (KV_REST_API_URL / KV_REST_API_TOKEN)');
    client = new Redis({ url, token });
  }
  return client;
}
