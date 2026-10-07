import { describe, expect, it } from 'vitest';
import { spellOuija, type SpiritReply } from './spellOuija.ts';

const spell = (letters: string) =>
  [...letters].reduce(
    (state, letter) => spellOuija({ spelled: state.spelled, letter }),
    { spelled: '', reply: null as SpiritReply | null },
  );

describe('spellOuija', () => {
  it('should answer a known word and clear the board', () => {
    expect(spell('trakt')).toEqual({
      spelled: '',
      reply: { answer: 'WATCHING', text: 'The spirits are tracking you. They always were.' },
    });
  });

  it('should answer a word spelled after stray letters', () => {
    expect(spell('XQBOO').reply?.answer).toBe('BOO');
  });

  it('should keep collecting letters until a word matches', () => {
    expect(spell('TRAK')).toEqual({ spelled: 'TRAK', reply: null });
  });

  it('should only remember the last twelve letters', () => {
    expect(spell('ABCDEFGHIJKLMN').spelled).toBe('CDEFGHIJKLMN');
  });

  it('should answer only in letters the board has', () => {
    const answers = ['SPOILER', 'TRAKT', 'HELLO', 'BINGE', 'WHEN', 'BOO', 'OG'].map((word) =>
      spell(word).reply?.answer
    );

    answers.forEach((answer) => expect(answer).toMatch(/^[A-Z]+$/));
  });
});
