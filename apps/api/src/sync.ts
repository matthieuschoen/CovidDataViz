import cron from 'node-cron';
import { config } from './config.js';

export async function syncData(): Promise<void> {
  console.log(`[sync] source: ${config.JHU_BASE_URL}`);
}

export function scheduleSync(): void {
  cron.schedule(config.SYNC_CRON, () => {
    syncData().catch((err) => console.error('[sync] échec', err));
  });
}
