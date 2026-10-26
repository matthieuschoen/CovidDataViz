import { describe, expect, it } from 'vitest';
import { parseJhuDate, parseLookup, parseTimeSeries } from './jhu.js';

describe('parseJhuDate', () => {
  it('convertit M/D/YY en ISO', () => {
    expect(parseJhuDate('1/22/20')).toBe('2020-01-22');
    expect(parseJhuDate('12/5/22')).toBe('2022-12-05');
  });
  it('refuse un format inconnu', () => {
    expect(() => parseJhuDate('2020-01-22')).toThrow();
  });
});

describe('parseTimeSeries', () => {
  const csv = [
    'Province/State,Country/Region,Lat,Long,1/22/20,1/23/20',
    ',Afghanistan,33.9,67.7,0,5',
    '"Hong Kong",China,22.3,114.2,1,2',
  ].join('\n');

  it('transforme le format large en lignes typées', () => {
    const rows = parseTimeSeries(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      province: '',
      country: 'Afghanistan',
      dates: ['2020-01-22', '2020-01-23'],
      values: [0, 5],
    });
    expect(rows[1]).toMatchObject({ province: 'Hong Kong', country: 'China', lat: 22.3 });
  });
  it('refuse un en-tête inattendu', () => {
    expect(() => parseTimeSeries('a,b,c,d\n1,2,3,4')).toThrow();
  });
});

describe('parseLookup', () => {
  it('lit les colonnes utiles', () => {
    const csv = [
      'UID,iso2,iso3,code3,FIPS,Admin2,Province_State,Country_Region,Lat,Long_,Combined_Key,Population',
      '124,CA,CAN,124,,,,Canada,60,-95,Canada,38246108',
      '9999,,,,,,,Diamond Princess,,,Diamond Princess,',
    ].join('\n');
    const rows = parseLookup(csv);
    expect(rows[0]).toMatchObject({ iso3: 'CAN', country: 'Canada', population: 38246108 });
    expect(rows[1]).toMatchObject({ iso3: '', population: null, lat: null });
  });
});
