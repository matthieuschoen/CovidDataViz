import { buildApp } from './app.js';
import { config } from './config.js';
import { scheduleSync } from './sync.js';

const app = await buildApp();
scheduleSync();
await app.listen({ port: config.PORT, host: '0.0.0.0' });
