import { describe, expect, it } from 'vitest';
import { countryOfLocation } from './countryOfLocation.ts';

describe('countryOfLocation', () => {
  it('should read a bare country name', () => {
    expect(countryOfLocation('Brazil')).toBe('BR');
    expect(countryOfLocation('United States')).toBe('US');
  });

  it('should take the country after a city', () => {
    expect(countryOfLocation('Nottingham, United Kingdom')).toBe('GB');
  });

  it('should read a region when there is no country', () => {
    expect(countryOfLocation('Karachi, Sindh')).toBe('PK');
    expect(countryOfLocation('Berlin, Land Berlin')).toBe('DE');
  });

  it('should read the spellings people type', () => {
    expect(countryOfLocation('USA')).toBe('US');
    expect(countryOfLocation('England')).toBe('GB');
    expect(countryOfLocation('São Paulo, Brasil')).toBe('BR');
  });

  it('should read a US state code after a comma', () => {
    expect(countryOfLocation('Austin, TX')).toBe('US');
  });

  it('should not read a lone two-letter code as a state', () => {
    expect(countryOfLocation('CA')).toBeNull();
  });

  it('should return null for anything that is not a place', () => {
    expect(countryOfLocation('Nowhere')).toBeNull();
    expect(countryOfLocation('someone@example.com')).toBeNull();
    expect(countryOfLocation('')).toBeNull();
    expect(countryOfLocation(null)).toBeNull();
  });
});
