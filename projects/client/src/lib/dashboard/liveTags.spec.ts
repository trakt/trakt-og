import { describe, expect, it } from 'vitest';
import { liveTags } from './liveTags.ts';

const target = (type: 'movie' | 'show' | 'episode') => ({ type, id: 1, title: 'Severance' });

describe('liveTags', () => {
  it('should lead with a pulsing Watching now and name an episode', () => {
    expect(liveTags({ kind: 'watch', target: target('episode') })).toEqual([
      { text: 'Watching now', kind: 'primary', live: true },
      { text: 'Episode', kind: 'generic' },
    ]);
  });

  it('should say Checked in for a check-in', () => {
    expect(liveTags({ kind: 'checkin', target: target('movie') })).toEqual([
      { text: 'Checked in', kind: 'primary', live: true },
      { text: 'Movie', kind: 'generic' },
    ]);
  });
});
