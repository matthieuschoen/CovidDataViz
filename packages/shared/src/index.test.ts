import { describe, expect, it } from 'vitest';
import { compareQuerySchema } from './index';

describe('compareQuerySchema', () => {
  it('parse une liste de pays', () => {
    expect(compareQuerySchema.parse({ countries: 'fra,usa' }).countries).toEqual(['FRA', 'USA']);
  });
  it('refuse plus de 5 pays', () => {
    expect(() => compareQuerySchema.parse({ countries: 'FRA,USA,DEU,ITA,ESP,GBR' })).toThrow();
  });
});
