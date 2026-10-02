// runs once when a server instance starts
export async function register() {
  const { normalizeEnv } = await import('./lib/env');
  normalizeEnv();
}
