import { buildApp } from './app.js';
import { config } from './config.js';
import { prisma } from './db.js';
import { scheduleSync, syncData } from './sync.js';

const app = await buildApp();
scheduleSync();
await app.listen({ port: config.PORT, host: '0.0.0.0' });

if ((await prisma.country.count()) === 0) {
  syncData().catch((err) => console.error('[sync] échec', err));
}
