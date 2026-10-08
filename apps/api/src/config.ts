import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SYNC_CRON: z.string().default('0 3 * * *'),
  JHU_BASE_URL: z
    .string()
    .default('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master'),
});

export const config = envSchema.parse(process.env);
