import type { PrismaClient } from '@prisma/client';
import type { NormalizedData } from './normalize.js';

const BATCH_SIZE = 5000;

export async function ingest(prisma: PrismaClient, data: NormalizedData): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      for (const c of data.countries) {
        await tx.country.upsert({
          where: { iso3: c.iso3 },
          create: c,
          update: { name: c.name, population: c.population, lat: c.lat, lon: c.lon },
        });
      }

      await tx.region.createMany({ data: data.regions, skipDuplicates: true });

      for (let i = 0; i < data.stats.length; i += BATCH_SIZE) {
        const b = data.stats.slice(i, i + BATCH_SIZE);
        await tx.$executeRaw`
          INSERT INTO "DailyStat"
            ("countryIso3", "date", "confirmed", "deaths", "recovered", "newConfirmed", "newDeaths")
          SELECT * FROM unnest(
            ${b.map((s) => s.countryIso3)}::text[],
            ${b.map((s) => s.date)}::date[],
            ${b.map((s) => s.confirmed)}::int[],
            ${b.map((s) => s.deaths)}::int[],
            ${b.map((s) => s.recovered)}::int[],
            ${b.map((s) => s.newConfirmed)}::int[],
            ${b.map((s) => s.newDeaths)}::int[]
          )
          ON CONFLICT ("countryIso3", "date") DO UPDATE SET
            "confirmed" = EXCLUDED."confirmed",
            "deaths" = EXCLUDED."deaths",
            "recovered" = EXCLUDED."recovered",
            "newConfirmed" = EXCLUDED."newConfirmed",
            "newDeaths" = EXCLUDED."newDeaths"`;
      }
    },
    { timeout: 120_000 },
  );
}
