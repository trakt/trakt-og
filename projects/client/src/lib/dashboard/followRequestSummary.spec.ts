import { describe, expect, it } from 'vitest';
import { followRequestSummary } from './followRequestSummary.ts';

const sentence = (names: string[]) =>
  followRequestSummary(names).map(({ text, strong }) => strong ? `*${text}*` : text).join('');

describe('followRequestSummary', () => {
  it('should name a single requester', () => {
    expect(sentence(['Maryam'])).toBe('*Maryam* wants to follow you.');
  });

  it('should name two or three requesters', () => {
    expect(sentence(['Maryam', 'Dahmi'])).toBe('*Maryam* and *Dahmi* want to follow you.');
    expect(sentence(['Maryam', 'Dahmi', 'Stefan'])).toBe('*Maryam*, *Dahmi* and *Stefan* want to follow you.');
  });

  it('should name the first two and count the rest from four requesters', () => {
    expect(sentence(['Maryam', 'Dahmi', 'Stefan', 'Zaiteli'])).toBe(
      '*Maryam*, *Dahmi* and *2 others* want to follow you.',
    );
  });
});
