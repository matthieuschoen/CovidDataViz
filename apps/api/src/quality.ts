import type { NormalizedData } from './normalize.js';

export interface QualityReport {
  errors: string[];
  warnings: string[];
}

const DAY_MS = 86_400_000;

export function checkQuality(data: NormalizedData): QualityReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (data.stats.length === 0) errors.push('Aucune statistique journalière à importer');

  const byCountry = new Map<string, NormalizedData['stats']>();
  for (const s of data.stats) {
    const list = byCountry.get(s.countryIso3) ?? [];
    list.push(s);
    byCountry.set(s.countryIso3, list);
  }

  const known = new Set(data.countries.map((c) => c.iso3));
  for (const iso3 of byCountry.keys()) {
    if (!known.has(iso3)) errors.push(`${iso3} : statistiques sans pays correspondant`);
  }

  for (const [iso3, stats] of byCountry) {
    let gaps = 0;
    let decreases = 0;
    let deathsAbove = 0;
    stats.forEach((s, i) => {
      const prev = stats[i - 1];
      if (prev) {
        if (Date.parse(s.date) - Date.parse(prev.date) !== DAY_MS) gaps++;
        if (s.confirmed < prev.confirmed || s.deaths < prev.deaths) decreases++;
      }
      if (s.deaths > s.confirmed) deathsAbove++;
    });
    if (gaps > 0) errors.push(`${iso3} : ${gaps} jour(s) manquant(s) ou dans le désordre`);
    if (decreases > 0)
      warnings.push(`${iso3} : cumul en baisse ${decreases} fois (corrections JHU)`);
    if (deathsAbove > 0) warnings.push(`${iso3} : décès > confirmés ${deathsAbove} jour(s)`);
  }

  for (const c of data.countries) {
    if (c.population === null) warnings.push(`${c.iso3} (${c.name}) : population inconnue`);
  }
  if (data.unmapped.length > 0) {
    warnings.push(`Entités sans code ISO3 ignorées : ${data.unmapped.join(', ')}`);
  }

  return { errors, warnings };
}
