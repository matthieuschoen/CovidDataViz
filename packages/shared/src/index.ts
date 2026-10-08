import { z } from 'zod';

export const dailyStatSchema = z.object({
  date: z.string().date(),
  confirmed: z.number().int(),
  deaths: z.number().int(),
  recovered: z.number().int(),
  newConfirmed: z.number().int(),
  newDeaths: z.number().int(),
});
export type DailyStat = z.infer<typeof dailyStatSchema>;

export const countrySchema = z.object({
  iso3: z.string().length(3),
  name: z.string(),
  population: z.number().int().nullable(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
});
export type Country = z.infer<typeof countrySchema>;

export const summarySchema = z.object({
  confirmed: z.number().int(),
  deaths: z.number().int(),
  recovered: z.number().int(),
  active: z.number().int(),
  lastUpdate: z.string().date().nullable(),
});
export type Summary = z.infer<typeof summarySchema>;

export const compareQuerySchema = z.object({
  countries: z
    .string()
    .transform((s) => s.split(',').map((c) => c.trim().toUpperCase()))
    .pipe(z.array(z.string().length(3)).min(1).max(5)),
});
