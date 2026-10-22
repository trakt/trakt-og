import { describe, expect, it } from 'vitest';
import { countLabel } from './countLabel.ts';

describe('util: countLabel', () => {
  it('should keep the word singular for one', () => {
    expect(countLabel(1, 'vote')).toBe('1 vote');
  });

  it('should pluralize everything else and group thousands', () => {
    expect([0, 2, 1234].map((n) => countLabel(n, 'vote'))).toEqual(['0 votes', '2 votes', '1,234 votes']);
  });
});
