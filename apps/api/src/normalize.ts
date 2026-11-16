import type { LookupRow, Metric, TimeSeriesRow } from './jhu.js';

export interface CountryRecord {
  iso3: string;
  name: string;
  population: number | null;
  lat: number | null;
  lon: number | null;
}

export interface RegionRecord {
  name: string;
  countryIso3: string;
}

export interface DailyStatRecord {
  countryIso3: string;
  date: string;
  confirmed: number;
  deaths: number;
  recovered: number;
  newConfirmed: number;
  newDeaths: number;
}

type CountrySeries = Map<string, number[]>;

export interface NormalizedData {
  countries: CountryRecord[];
  regions: RegionRecord[];
  stats: DailyStatRecord[];
  unmapped: string[];
}

const key = (province: string, country: string) => `${province}|${country}`;

export function buildLookupIndex(lookup: LookupRow[]) {
  const iso3ByKey = new Map<string, string>();
  const countries = new Map<string, CountryRecord>();

  const rows = lookup.filter((r) => r.iso3 !== '' && r.admin2 === '');
  for (const r of rows.filter((r) => r.province === '')) {
    iso3ByKey.set(key('', r.country), r.iso3);
    countries.set(r.iso3, {
      iso3: r.iso3,
      name: r.country,
      population: r.population,
      lat: r.lat,
      lon: r.lon,
    });
  }
  for (const r of rows.filter((r) => r.province !== '')) {
    iso3ByKey.set(key(r.province, r.country), r.iso3);
    if (!countries.has(r.iso3)) {
      countries.set(r.iso3, {
        iso3: r.iso3,
        name: r.country,
        population: null,
        lat: r.lat,
        lon: r.lon,
      });
    }
  }

  for (const c of countries.values()) {
    if (c.population !== null) continue;
    const provinces = rows.filter((r) => r.iso3 === c.iso3 && r.province !== '');
    const known = provinces.filter((r) => r.population !== null);
    c.population = known.length ? known.reduce((s, r) => s + (r.population ?? 0), 0) : null;
  }

  return {
    countries,
    resolve(province: string, country: string): string | undefined {
      return iso3ByKey.get(key(province, country)) ?? iso3ByKey.get(key('', country));
    },
  };
}

function aggregate(
  series: TimeSeriesRow[],
  resolve: (province: string, country: string) => string | undefined,
  unmapped: Set<string>,
  regions: Map<string, RegionRecord>,
): CountrySeries {
  const out: CountrySeries = new Map();
  for (const row of series) {
    const iso3 = resolve(row.province, row.country);
    if (!iso3) {
      unmapped.add(row.province ? `${row.province}, ${row.country}` : row.country);
      continue;
    }
    if (row.province) {
      regions.set(key(row.province, iso3), { name: row.province, countryIso3: iso3 });
    }
    const acc = out.get(iso3) ?? new Array<number>(row.values.length).fill(0);
    row.values.forEach((v, i) => {
      acc[i] = (acc[i] ?? 0) + v;
    });
    out.set(iso3, acc);
  }
  return out;
}

export function dailyDeltas(cumulative: number[]): number[] {
  return cumulative.map((v, i) => (i === 0 ? v : Math.max(0, v - (cumulative[i - 1] ?? 0))));
}

export function normalize(
  series: Record<Metric, TimeSeriesRow[]>,
  lookup: LookupRow[],
): NormalizedData {
  const index = buildLookupIndex(lookup);
  const unmapped = new Set<string>();
  const regions = new Map<string, RegionRecord>();

  const dates = series.confirmed[0]?.dates ?? [];
  const byMetric = {
    confirmed: aggregate(series.confirmed, index.resolve, unmapped, regions),
    deaths: aggregate(series.deaths, index.resolve, unmapped, new Map()),
    recovered: aggregate(series.recovered, index.resolve, unmapped, new Map()),
  };

  const stats: DailyStatRecord[] = [];
  const used = new Set<string>();
  for (const [iso3, confirmed] of byMetric.confirmed) {
    const deaths = byMetric.deaths.get(iso3) ?? new Array<number>(dates.length).fill(0);
    const recovered = byMetric.recovered.get(iso3) ?? new Array<number>(dates.length).fill(0);
    const newConfirmed = dailyDeltas(confirmed);
    const newDeaths = dailyDeltas(deaths);
    used.add(iso3);
    dates.forEach((date, i) => {
      stats.push({
        countryIso3: iso3,
        date,
        confirmed: confirmed[i] ?? 0,
        deaths: deaths[i] ?? 0,
        recovered: recovered[i] ?? 0,
        newConfirmed: newConfirmed[i] ?? 0,
        newDeaths: newDeaths[i] ?? 0,
      });
    });
  }

  return {
    countries: [...index.countries.values()].filter((c) => used.has(c.iso3)),
    regions: [...regions.values()],
    stats,
    unmapped: [...unmapped].sort(),
  };
}
