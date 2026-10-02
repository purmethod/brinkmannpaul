// One cleaning run for every connected account, then exit. Useful for cron or a first look:
//   TRIAGE_DRY_RUN=1 npm run triage
import { assertLiveConfig, loadConfig } from '../lib/config.js';
import { createClaude } from '../lib/claude.js';
import { createGmail } from '../lib/gmail.js';
import { createStore } from '../lib/store.js';
import { runTriage } from '../lib/triage.js';

const config = loadConfig();
assertLiveConfig(config);
const store = createStore({ dir: config.dataDir, secret: config.appSecret });
const claude = createClaude({ model: config.claudeModel });
const emails = await store.emails();
if (!emails.length) console.log('no connected account yet. start the server and sign in first.');

for (const email of emails) {
  const doc = await store.read(email);
  const gmail = createGmail({ config, refreshToken: store.refreshToken(doc) });
  const report = await runTriage({
    gmail, claude, store, email,
    options: { dryRun: config.triageDryRun, maxThreads: config.triageMaxThreads, archiveOlderThanDays: config.archiveOlderThanDays, log: console.log },
  });
  console.log(`\n${email}${report.dryRun ? ' (dry run, nothing changed)' : ''}`);
  for (const d of report.drafted) console.log(`  draft  ${d.from.email}  ${d.summary}${d.draft ? `\n${d.draft.replace(/^/gm, '         | ')}` : ''}`);
  for (const f of report.fyi) console.log(`  fyi    ${f.from.email}  ${f.summary}`);
  for (const n of report.noise) console.log(`  noise  ${n.from.email}  ${n.subject}`);
  console.log(`  ${report.archived} archived, ${report.waiting} already waiting, ${report.errors.length} errors`);
}
