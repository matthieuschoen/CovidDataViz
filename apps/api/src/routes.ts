import { countryLatestSchema, summarySchema } from '@covid/shared';
import type { FastifyInstance } from 'fastify';
import { prisma } from './db.js';

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/summary', async () => {
    const latest = await prisma.dailyStat.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    });
    if (!latest) {
      return summarySchema.parse({
        confirmed: 0,
        deaths: 0,
        recovered: 0,
        active: 0,
        lastUpdate: null,
      });
    }

    const { _sum: sum } = await prisma.dailyStat.aggregate({
      where: { date: latest.date },
      _sum: { confirmed: true, deaths: true, recovered: true },
    });
    const confirmed = sum.confirmed ?? 0;
    const deaths = sum.deaths ?? 0;
    const recovered = sum.recovered ?? 0;

    return summarySchema.parse({
      confirmed,
      deaths,
      recovered,
      active: Math.max(0, confirmed - deaths - recovered),
      lastUpdate: isoDate(latest.date),
    });
  });

  app.get('/api/countries', async () => {
    const latest = await prisma.dailyStat.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    });
    if (!latest) return [];

    const stats = await prisma.dailyStat.findMany({
      where: { date: latest.date },
      include: { country: true },
      orderBy: { country: { name: 'asc' } },
    });

    return stats.map(({ country, date, confirmed, deaths, recovered, newConfirmed, newDeaths }) =>
      countryLatestSchema.parse({
        iso3: country.iso3,
        name: country.name,
        population: country.population,
        lat: country.lat,
        lon: country.lon,
        date: isoDate(date),
        confirmed,
        deaths,
        recovered,
        newConfirmed,
        newDeaths,
      }),
    );
  });
}
