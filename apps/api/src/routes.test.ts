import { beforeEach, describe, expect, it, vi } from 'vitest';

const prisma = vi.hoisted(() => ({
  dailyStat: { findFirst: vi.fn(), aggregate: vi.fn(), findMany: vi.fn() },
  $queryRaw: vi.fn(),
}));
vi.mock('./db.js', () => ({ prisma }));

import { buildApp } from './app.js';

const LATEST = { date: new Date('2023-03-09T00:00:00Z') };

describe('API', () => {
  beforeEach(() => vi.resetAllMocks());

  it('GET /api/summary retourne les KPI à la dernière date', async () => {
    prisma.dailyStat.findFirst.mockResolvedValue(LATEST);
    prisma.dailyStat.aggregate.mockResolvedValue({
      _sum: { confirmed: 1000, deaths: 100, recovered: 400 },
    });
    const app = await buildApp();
    const res = await app.inject('/api/summary');
    expect(res.json()).toEqual({
      confirmed: 1000,
      deaths: 100,
      recovered: 400,
      active: 500,
      lastUpdate: '2023-03-09',
    });
  });

  it('GET /api/summary retourne des zéros quand la base est vide', async () => {
    prisma.dailyStat.findFirst.mockResolvedValue(null);
    const app = await buildApp();
    expect((await app.inject('/api/summary')).json()).toMatchObject({
      confirmed: 0,
      lastUpdate: null,
    });
  });

  it('GET /api/countries retourne les pays avec leurs dernières stats', async () => {
    prisma.dailyStat.findFirst.mockResolvedValue(LATEST);
    prisma.dailyStat.findMany.mockResolvedValue([
      {
        date: LATEST.date,
        confirmed: 10,
        deaths: 1,
        recovered: 2,
        newConfirmed: 3,
        newDeaths: 0,
        country: { iso3: 'FRA', name: 'France', population: 67, lat: 46.2, lon: 2.2 },
      },
    ]);
    const app = await buildApp();
    expect((await app.inject('/api/countries')).json()).toEqual([
      {
        iso3: 'FRA',
        name: 'France',
        population: 67,
        lat: 46.2,
        lon: 2.2,
        date: '2023-03-09',
        confirmed: 10,
        deaths: 1,
        recovered: 2,
        newConfirmed: 3,
        newDeaths: 0,
      },
    ]);
  });

  it('GET /api/countries retourne [] quand la base est vide', async () => {
    prisma.dailyStat.findFirst.mockResolvedValue(null);
    const app = await buildApp();
    expect((await app.inject('/api/countries')).json()).toEqual([]);
  });
});
