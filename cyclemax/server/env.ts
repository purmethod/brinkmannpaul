// Backend configuration (all from environment variables, documented in .env.example / README).

export interface Config {
  anthropicApiKey: string | null;
  claudeModel: string;
  claudeEffort: "low" | "medium" | "high" | null;
  claudeFallbacks: boolean;
  vapidPublicKey: string | null;
  vapidPrivateKey: string | null;
  vapidSubject: string;
  adminPassword: string | null;
  cronSecret: string | null;
  /** Pushes are sent if due within this many minutes (hourly cron → max ±30 min). */
  pushLeadMinutes: number;
  /** Items older than this are dropped instead of sent late. */
  pushStaleMinutes: number;
}

const FALLBACK_MODELS = new Set(["claude-sonnet-5-5", "claude-opus-5-5", "claude-opus-5", "claude-fable-5-1"]);

export function readConfig(env: Record<string, string | undefined> = process.env): Config {
  const model = env.CLAUDE_MODEL || "claude-sonnet-5-5";
  const effort = env.CLAUDE_EFFORT ?? "low";
  return {
    anthropicApiKey: env.ANTHROPIC_API_KEY || null,
    claudeModel: model,
    claudeEffort: effort === "low" || effort === "medium" || effort === "high" ? effort : null,
    claudeFallbacks: env.CLAUDE_FALLBACKS ? env.CLAUDE_FALLBACKS !== "off" : FALLBACK_MODELS.has(model),
    vapidPublicKey: env.VAPID_PUBLIC_KEY || null,
    vapidPrivateKey: env.VAPID_PRIVATE_KEY || null,
    vapidSubject: env.VAPID_SUBJECT || "mailto:orders@brinkmannpaul.com",
    adminPassword: env.ADMIN_PASSWORD || null,
    cronSecret: env.CRON_SECRET || null,
    pushLeadMinutes: Number(env.PUSH_LEAD_MINUTES ?? 30),
    pushStaleMinutes: Number(env.PUSH_STALE_MINUTES ?? 180),
  };
}
