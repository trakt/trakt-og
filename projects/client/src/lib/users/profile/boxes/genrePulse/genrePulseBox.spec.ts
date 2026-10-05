import { describe, expect, it } from 'vitest';
import { boxPersonas } from '../boxPersonas.ts';
import { genrePulseBox } from './genrePulseBox.ts';

const { dex, lena, sam } = boxPersonas;

describe('genrePulseBox', () => {
  it("should find the genre running hottest against the user's usual share", async () => {
    expect(await genrePulseBox.evaluate(dex.input, dex.extras())).toMatchObject({
      score: 73,
      entry: {
        view: {
          spike: '3.5×',
          genre: 'Horror',
          rows: [
            { name: 'Horror', now: 42, usual: 12 },
            { name: 'Mystery', now: 17, usual: 12 },
            { name: 'Comedy', now: 8, usual: 10 },
          ],
        },
      },
    });
  });

  it('should skip a month that matches the usual mix', async () => {
    expect(await genrePulseBox.evaluate(lena.input, lena.extras())).toMatchObject({ score: null, entry: null });
  });

  it('should need 15 plays this month', async () => {
    expect(await genrePulseBox.evaluate(sam.input, sam.extras())).toMatchObject({ score: null, entry: null });
  });
});
