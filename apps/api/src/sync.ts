import cron from 'node-cron';
import { config } from './config.js';
import { prisma } from './db.js';
import { ingest } from './ingest.js';
import { fetchLookup, fetchTimeSeries } from './jhu.js';
import { normalize } from './normalize.js';
import { checkQuality } from './quality.js';

export async function syncData(): Promise<void> {
  console.log(`[sync] source: ${config.JHU_BASE_URL}`);

  const [confirmed, deaths, recovered, lookup] = await Promise.all([
    fetchTimeSeries('confirmed'),
    fetchTimeSeries('deaths'),
    fetchTimeSeries('recovered'),
    fetchLookup(),
  ]);

  const data = normalize({ confirmed, deaths, recovered }, lookup);
  const report = checkQuality(data);
  report.warnings.forEach((w) => console.warn(`[sync] ${w}`));
  if (report.errors.length > 0) {
    throw new Error(`Contrôles qualité échoués :\n${report.errors.join('\n')}`);
  }

  await ingest(prisma, data);
  console.log(`[sync] ${data.countries.length} pays, ${data.stats.length} statistiques importés`);
}

export function scheduleSync(): void {
  cron.schedule(config.SYNC_CRON, () => {
    syncData().catch((err) => console.error('[sync] échec', err));
  });
}
