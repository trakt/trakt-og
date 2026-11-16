import { describe, expect, it } from 'vitest';
import { certificationAge } from './certificationAge.ts';

const age = (country: string, certification: string) => certificationAge({ country, certification });

describe('certificationAge', () => {
  it('should read the age a rating names, whatever wraps it', () => {
    expect([age('au', 'MA 15+'), age('fr', '-12'), age('mx', 'B-15'), age('sg', 'NC16'), age('tr', '18+')]).toEqual([
      15, 12, 15, 16, 18,
    ]);
  });

  it("should know the ratings that name no number by their country's meaning", () => {
    expect([age('us', 'TV-MA'), age('us', 'R'), age('us', 'NC-17'), age('in', 'A'), age('es', 'A')]).toEqual([
      17, 17, 18, 18, 0,
    ]);
  });

  it('should put all-ages ratings at 0 and leave the ones that name no age out', () => {
    expect([age('gb', 'U'), age('br', 'L'), age('us', 'PG'), age('us', 'Not Rated')]).toEqual([0, 0, null, null]);
  });
});
