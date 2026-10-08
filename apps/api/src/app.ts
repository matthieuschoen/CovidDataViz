import cors from '@fastify/cors';
import Fastify from 'fastify';
import { config } from './config.js';
import { prisma } from './db.js';

export async function buildApp() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: config.CORS_ORIGIN });

  app.get('/health', async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  });

  return app;
}
