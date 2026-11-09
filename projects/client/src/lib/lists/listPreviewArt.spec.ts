import { describe, expect, it } from 'vitest';
import { listPreviewArt } from './listPreviewArt.ts';
import type { ListItemCard } from './toListItemCard.ts';

const card = (fields: Partial<ListItemCard>) => ({ type: 'movie', id: 5, ...fields }) as ListItemCard;

describe('listPreviewArt', () => {
  it('should try a movie or show fanart, then its poster', () => {
    expect(listPreviewArt(card({}))).toMatch(/\/api\/art\/movie\/5\/fanart\/movie\/5\/poster$/);
  });

  it("should use the show's art for an episode", () => {
    expect(listPreviewArt(card({ type: 'episode', id: 9, seasonOf: { show: 2, number: 1, episode: 1 } }))).toMatch(
      /\/api\/art\/show\/2\/fanart\/show\/2\/poster$/,
    );
  });

  it('should use a headshot for a person and nothing for an empty list', () => {
    expect(listPreviewArt(card({ type: 'person', id: 7 }))).toMatch(/\/api\/art\/person\/7\/headshot$/);
    expect(listPreviewArt(undefined)).toBeUndefined();
  });
});
