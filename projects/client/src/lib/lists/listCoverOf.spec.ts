import { describe, expect, it } from 'vitest';
import { type ListItemRow, listItemRowsSchema } from './listItemRowsSchema.ts';
import { listCoverOf } from './listCoverOf.ts';

const listed = { rank: 1, id: 1, listed_at: '2026-01-01T00:00:00.000Z' };
const show = {
  title: 'The Boys',
  ids: { trakt: 1, slug: 'the-boys' },
};
const [episode, person] = listItemRowsSchema.parse([
  { type: 'episode', show, episode: { season: 1, number: 1, ids: { trakt: 2 } }, ...listed },
  { type: 'person', person: { name: 'Al Pacino', ids: { trakt: 5, slug: 'al-pacino' } }, ...listed },
]) as ListItemRow[];

describe('listCoverOf', () => {
  it('should use the show fanart for an episode, at full size', () => {
    expect(listCoverOf(episode)).toBe('https://media.trakt.tv/shows/1/full/fanart.webp');
  });

  it('should have no cover for a person or an empty list', () => {
    expect(listCoverOf(person)).toBeUndefined();
    expect(listCoverOf(undefined)).toBeUndefined();
  });
});
