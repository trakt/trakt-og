import { describe, expect, it } from 'vitest';
import { bookQuotes, pickBookQuote } from './bookQuotes.ts';

describe('pickBookQuote', () => {
  it('should pick the line at the random point in the list', () => {
    expect(pickBookQuote(() => 0)).toBe(bookQuotes[0]);
    expect(pickBookQuote(() => 0.999)).toBe(bookQuotes.at(-1));
  });

  it('should keep twenty distinct lines to pick from', () => {
    expect(new Set(bookQuotes.map((line) => line.quote)).size).toBe(20);
  });
});
