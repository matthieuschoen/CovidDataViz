import { config } from './config.js';
import { parseCsv } from './csv.js';

export type Metric = 'confirmed' | 'deaths' | 'recovered';

export const TIME_SERIES_FILES: Record<Metric, string> = {
  confirmed: 'time_series_covid19_confirmed_global.csv',
  deaths: 'time_series_covid19_deaths_global.csv',
  recovered: 'time_series_covid19_recovered_global.csv',
};

const TIME_SERIES_PATH = 'csse_covid_19_data/csse_covid_19_time_series';
const LOOKUP_PATH = 'csse_covid_19_data/UID_ISO_FIPS_LookUp_Table.csv';

export interface TimeSeriesRow {
  province: string;
  country: string;
  lat: number | null;
  lon: number | null;
  dates: string[];
  values: number[];
}

export interface LookupRow {
  iso3: string;
  province: string;
  admin2: string;
  country: string;
  lat: number | null;
  lon: number | null;
  population: number | null;
}

export function parseJhuDate(header: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/.exec(header.trim());
  if (!m) throw new Error(`Date JHU invalide : "${header}"`);
  const [, month, day, year] = m;
  return `20${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`;
}

function toNumberOrNull(s: string | undefined): number | null {
  if (s === undefined || s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseTimeSeries(csv: string): TimeSeriesRow[] {
  const [header, ...rows] = parseCsv(csv);
  if (!header || header[0] !== 'Province/State' || header[1] !== 'Country/Region') {
    throw new Error('En-tête de série temporelle JHU inattendu');
  }
  const dates = header.slice(4).map(parseJhuDate);

  return rows.map((r) => ({
    province: (r[0] ?? '').trim(),
    country: (r[1] ?? '').trim(),
    lat: toNumberOrNull(r[2]),
    lon: toNumberOrNull(r[3]),
    dates,
    values: dates.map((_, i) => toNumberOrNull(r[4 + i]) ?? 0),
  }));
}

export function parseLookup(csv: string): LookupRow[] {
  const [header, ...rows] = parseCsv(csv);
  if (!header) throw new Error('Table de correspondance JHU vide');
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`Colonne manquante dans la table JHU : ${name}`);
    return i;
  };
  const [iso3, province, admin2, country, lat, lon, population] = [
    'iso3',
    'Province_State',
    'Admin2',
    'Country_Region',
    'Lat',
    'Long_',
    'Population',
  ].map(col) as [number, number, number, number, number, number, number];

  return rows.map((r) => ({
    iso3: (r[iso3] ?? '').trim(),
    province: (r[province] ?? '').trim(),
    admin2: (r[admin2] ?? '').trim(),
    country: (r[country] ?? '').trim(),
    lat: toNumberOrNull(r[lat]),
    lon: toNumberOrNull(r[lon]),
    population: toNumberOrNull(r[population]),
  }));
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Téléchargement échoué (${res.status}) : ${url}`);
  return res.text();
}

export async function fetchTimeSeries(metric: Metric): Promise<TimeSeriesRow[]> {
  const url = `${config.JHU_BASE_URL}/${TIME_SERIES_PATH}/${TIME_SERIES_FILES[metric]}`;
  return parseTimeSeries(await fetchText(url));
}

export async function fetchLookup(): Promise<LookupRow[]> {
  return parseLookup(await fetchText(`${config.JHU_BASE_URL}/${LOOKUP_PATH}`));
}
