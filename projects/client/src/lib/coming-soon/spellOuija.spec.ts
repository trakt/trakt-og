import { describe, expect, it } from 'vitest';
import { spellOuija } from './spellOuija.ts';

const spell = (letters: string) =>
  [...letters].reduce(
    (state, letter) => spellOuija({ spelled: state.spelled, letter }),
    { spelled: '', reply: null as string | null },
  );

describe('spellOuija', () => {
  it('should answer a known word and clear the board', () => {
    expect(spell('trakt')).toEqual({ spelled: '', reply: 'The spirits are tracking you. They always were.' });
  });

  it('should answer a word spelled after stray letters', () => {
    expect(spell('XQBOO').reply).toBe('Boo yourself.');
  });

  it('should keep collecting letters until a word matches', () => {
    expect(spell('TRAK')).toEqual({ spelled: 'TRAK', reply: null });
  });

  it('should only remember the last twelve letters', () => {
    expect(spell('ABCDEFGHIJKLMN').spelled).toBe('CDEFGHIJKLMN');
  });
});
