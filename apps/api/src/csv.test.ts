import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv.js';

describe('parseCsv', () => {
  it('parse des lignes simples', () => {
    expect(parseCsv('a,b\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
  it('gère les champs entre guillemets avec virgule et guillemets échappés', () => {
    expect(parseCsv('"Korea, South","dit ""oui"""\r\nx,y')).toEqual([
      ['Korea, South', 'dit "oui"'],
      ['x', 'y'],
    ]);
  });
  it('conserve les champs vides', () => {
    expect(parseCsv(',France,1\n')).toEqual([['', 'France', '1']]);
  });
});
