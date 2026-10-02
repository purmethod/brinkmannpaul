/**
 * Vercel storage integrations may add a custom prefix to their variables
 * (e.g. ATELIER_DB_DATABASE_URL, ATELIER_MEDIA_READ_WRITE_TOKEN). Map them to the names the code uses.
 */
export function normalizeEnv() {
  const env = process.env;
  // process.env stringifies: assigning undefined would create the literal "undefined"
  for (const [k, v] of Object.entries(env)) if (v === 'undefined' || v === '') delete env[k];
  const find = (test: (k: string, v: string) => boolean) => Object.entries(env).find(([k, v]) => v && test(k, v))?.[1];
  const set = (name: string, value: string | undefined) => {
    if (!env[name] && value) env[name] = value;
  };
  set(
    'DATABASE_URL',
    env.POSTGRES_URL ||
      find((k, v) => /(DATABASE_URL|POSTGRES_URL)$/.test(k) && !/UNPOOLED|NON_POOLING|NO_SSL/.test(k) && /^postgres(ql)?:\/\//.test(v)) ||
      find((k, v) => /_URL$/.test(k) && /^postgres(ql)?:\/\//.test(v)),
  );
  set('BLOB_READ_WRITE_TOKEN', find((k, v) => /READ_WRITE_TOKEN$/.test(k) && v.startsWith('vercel_blob_rw_')));
  for (const name of ['QSTASH_TOKEN', 'QSTASH_CURRENT_SIGNING_KEY', 'QSTASH_NEXT_SIGNING_KEY', 'QSTASH_URL']) {
    set(name, find((k) => k.endsWith(`_${name}`)));
  }
  if (env.QSTASH_URL && !/^https?:\/\//.test(env.QSTASH_URL)) delete env.QSTASH_URL;
}
