// All runtime settings come from the environment (see .env.example).

const int = (value, fallback) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
};

const list = value => (value || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export function loadConfig(env = process.env) {
  const demo = env.DEMO === '1';
  const port = int(env.PORT, 8787);
  const config = {
    demo,
    port,
    baseUrl: (env.BASE_URL || `http://localhost:${port}`).replace(/\/$/, ''),
    googleClientId: env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: env.GOOGLE_CLIENT_SECRET || '',
    appSecret: env.APP_SECRET || (demo ? 'demo-secret-demo-secret-demo-secret!' : ''),
    allowedEmails: list(env.ALLOWED_EMAILS),
    openSignup: env.OPEN_SIGNUP === '1',
    claudeModel: env.CLAUDE_MODEL || 'claude-opus-5-5',
    triageEveryMinutes: int(env.TRIAGE_EVERY_MINUTES, 30),
    triageMaxThreads: int(env.TRIAGE_MAX_THREADS, 50),
    triageDryRun: env.TRIAGE_DRY_RUN === '1',
    archiveOlderThanDays: int(env.ARCHIVE_OLDER_THAN_DAYS, 0),
    dataDir: env.DATA_DIR || './data',
  };
  return config;
}

export function assertLiveConfig(config) {
  if (config.demo) return;
  const missing = [];
  if (!config.googleClientId) missing.push('GOOGLE_CLIENT_ID');
  if (!config.googleClientSecret) missing.push('GOOGLE_CLIENT_SECRET');
  if (config.appSecret.length < 32) missing.push('APP_SECRET (32+ chars)');
  if (missing.length) {
    throw new Error(`missing config: ${missing.join(', ')}. see mail/.env.example or run with DEMO=1.`);
  }
  if (!config.allowedEmails.length && !config.openSignup) {
    console.warn('[zero] ALLOWED_EMAILS is empty and OPEN_SIGNUP is off: nobody can sign in.');
  }
}

export function mayUse(config, email) {
  if (config.openSignup) return true;
  return config.allowedEmails.includes(String(email).toLowerCase());
}
