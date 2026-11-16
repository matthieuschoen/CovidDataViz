import { describe, expect, it } from 'vitest';
import type { LookupRow, TimeSeriesRow } from './jhu.js';
import { dailyDeltas, normalize } from './normalize.js';
import { checkQuality } from './quality.js';

const lk = (o: Partial<LookupRow>): LookupRow => ({
  iso3: '',
  province: '',
  admin2: '',
  country: '',
  lat: null,
  lon: null,
  population: null,
  ...o,
});

const ts = (province: string, country: string, values: number[]): TimeSeriesRow => ({
  province,
  country,
  lat: null,
  lon: null,
  dates: ['2020-01-22', '2020-01-23', '2020-01-24'].slice(0, values.length),
  values,
});

const lookup: LookupRow[] = [
  lk({ iso3: 'FRA', country: 'France', population: 100 }),
  lk({ iso3: 'DNK', country: 'Denmark', population: 50 }),
  lk({ iso3: 'GRL', province: 'Greenland', country: 'Denmark', population: 5 }),
  lk({ iso3: 'CAN', province: 'Alberta', country: 'Canada', population: 4 }),
  lk({ iso3: 'CAN', province: 'Quebec', country: 'Canada', population: 8 }),
];

describe('dailyDeltas', () => {
  it('calcule les variations et ramène les corrections négatives à 0', () => {
    expect(dailyDeltas([1, 3, 2, 6])).toEqual([1, 2, 0, 4]);
  });
});

describe('normalize', () => {
  const data = normalize(
    {
      confirmed: [
        ts('', 'France', [1, 2, 4]),
        ts('', 'Denmark', [1, 1, 1]),
        ts('Greenland', 'Denmark', [0, 1, 2]),
        ts('Alberta', 'Canada', [1, 1, 2]),
        ts('Quebec', 'Canada', [0, 1, 1]),
        ts('', 'Diamond Princess', [5, 5, 5]),
      ],
      deaths: [ts('', 'France', [0, 0, 1])],
      recovered: [],
    },
    lookup,
  );

  it('agrège les provinces par pays', () => {
    const can = data.stats.filter((s) => s.countryIso3 === 'CAN');
    expect(can.map((s) => s.confirmed)).toEqual([1, 2, 3]);
    expect(can.map((s) => s.newConfirmed)).toEqual([1, 1, 1]);
  });
  it('rattache une province dotée de son propre ISO3 à celui-ci', () => {
    expect(data.stats.filter((s) => s.countryIso3 === 'GRL').map((s) => s.confirmed)).toEqual([
      0, 1, 2,
    ]);
    expect(data.stats.filter((s) => s.countryIso3 === 'DNK').map((s) => s.confirmed)).toEqual([
      1, 1, 1,
    ]);
  });
  it("calcule la population d'un pays sans ligne propre à partir de ses provinces", () => {
    expect(data.countries.find((c) => c.iso3 === 'CAN')?.population).toBe(12);
  });
  it('ignore et signale les entités sans ISO3', () => {
    expect(data.unmapped).toEqual(['Diamond Princess']);
    expect(data.countries.map((c) => c.iso3)).not.toContain('');
  });
  it('remplit décès et guéris à 0 quand la série manque', () => {
    const fra = data.stats.filter((s) => s.countryIso3 === 'FRA');
    expect(fra.map((s) => s.deaths)).toEqual([0, 0, 1]);
    expect(fra.map((s) => s.recovered)).toEqual([0, 0, 0]);
  });
  it('enregistre les régions', () => {
    expect(data.regions).toContainEqual({ name: 'Alberta', countryIso3: 'CAN' });
  });
});

describe('checkQuality', () => {
  const base = normalize(
    { confirmed: [ts('', 'France', [1, 2, 4])], deaths: [], recovered: [] },
    lookup,
  );

  it('accepte des données cohérentes', () => {
    expect(checkQuality(base).errors).toEqual([]);
  });
  it('signale un jour manquant comme erreur', () => {
    const stats = base.stats.filter((s) => s.date !== '2020-01-23');
    expect(checkQuality({ ...base, stats }).errors[0]).toMatch(/manquant/);
  });
  it('signale un cumul en baisse comme avertissement', () => {
    const stats = base.stats.map((s, i) => (i === 2 ? { ...s, confirmed: 0 } : s));
    const report = checkQuality({ ...base, stats });
    expect(report.errors).toEqual([]);
    expect(report.warnings.join()).toMatch(/en baisse/);
  });
  it('refuse un import vide', () => {
    expect(checkQuality({ ...base, stats: [] }).errors).toContain(
      'Aucune statistique journalière à importer',
    );
  });
});
