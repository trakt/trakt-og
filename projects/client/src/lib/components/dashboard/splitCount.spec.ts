import { describe, expect, it } from 'vitest';
import { splitCount } from './splitCount.ts';

describe('util: splitCount', () => {
  it('should split a count into its number and its words', () => {
    expect(splitCount('2 shows')).toEqual({ value: '2', text: 'shows' });
    expect(splitCount('1,204 votes')).toEqual({ value: '1,204', text: 'votes' });
    expect(splitCount('12 of 30 days')).toEqual({ value: '12', text: 'of 30 days' });
    expect(splitCount('23% of watchers')).toEqual({ value: '23%', text: 'of watchers' });
    expect(splitCount('32% of 21,852 votes')).toEqual({ value: '32%', text: 'of 21,852 votes' });
  });

  it('should keep a time whole as the number', () => {
    expect(splitCount('3h 26m')).toEqual({ value: '3h 26m', text: undefined });
    expect(splitCount('1d 4h 2m')).toEqual({ value: '1d 4h 2m', text: undefined });
    expect(splitCount('45m')).toEqual({ value: '45m', text: undefined });
  });

  it('should leave a count that starts with words as words', () => {
    expect(splitCount('Sep 13 to 19')).toEqual({ text: 'Sep 13 to 19' });
    expect(splitCount('hearts out of 10')).toEqual({ text: 'hearts out of 10' });
    expect(splitCount('gave it 7 or higher')).toEqual({ text: 'gave it 7 or higher' });
  });
});
