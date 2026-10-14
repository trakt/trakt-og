import { describe, expect, it } from 'vitest';
import { sortsFor } from './sortsFor.ts';

const ids = (mode: Parameters<typeof sortsFor>[0]) => sortsFor(mode).map(({ id }) => id);

describe('util: sortsFor', () => {
  it('should lead personal lists with rank and leave out liked date', () => {
    expect(ids('personal')).toEqual(['rank', 'updated', 'title', 'likes', 'comments', 'items', 'random']);
  });

  it('should drop rank and liked date from collaborations', () => {
    expect(ids('collaborations')).toEqual(['updated', 'title', 'likes', 'comments', 'items', 'random']);
  });

  it('should lead both liked views with liked date and leave out rank', () => {
    expect(ids('liked')).toEqual(['liked', 'updated', 'title', 'likes', 'comments', 'items', 'random']);
    expect(ids('liked-official')).toEqual(ids('liked'));
  });
});
