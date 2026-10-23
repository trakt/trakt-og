import { describe, expect, it } from 'vitest';
import { hasCodeTalk } from './hasCodeTalk.ts';

describe('util: hasCodeTalk', () => {
  it('should pass plain words about what members can see or do', () => {
    expect(hasCodeTalk('Profiles now show your favorite genres and a bigger ratings chart.')).toBe(false);
    expect(hasCodeTalk('Specials are listed under their own season.')).toBe(false);
    expect(hasCodeTalk('Pages load faster and lists keep their place.')).toBe(false);
  });

  it('should catch developer words in any case or plural', () => {
    expect(hasCodeTalk('Refactored the header.')).toBe(true);
    expect(hasCodeTalk('A new Component for posters.')).toBe(true);
    expect(hasCodeTalk('Spacing moved to 12px.')).toBe(true);
    expect(hasCodeTalk('The CSS is tidier.')).toBe(true);
    expect(hasCodeTalk('Responses are cached longer.')).toBe(true);
    expect(hasCodeTalk('New design tokens.')).toBe(true);
    expect(hasCodeTalk('A faster API route for lists.')).toBe(true);
    expect(hasCodeTalk('Svelte runes everywhere.')).toBe(true);
    expect(hasCodeTalk('Twelve commits landed.')).toBe(true);
  });

  it('should cover the rest of the banned list', () => {
    const words = ['endpoint', 'prop', 'hook', 'worker', 'lint', 'spec', 'schema', 'typescript', 'token'];
    expect(words.filter((word) => !hasCodeTalk(`The ${word} changed.`))).toEqual([]);
  });
});
