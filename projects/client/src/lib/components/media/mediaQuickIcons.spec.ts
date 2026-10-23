import { describe, expect, it } from 'vitest';
import { mediaQuickIcons } from './mediaQuickIcons.ts';

const movie = { type: 'movie' as const, id: 1, title: 'Heat', released: true, rating: 8.3, runtime: 170 };

describe('util: mediaQuickIcons', () => {
  it("should total a watched movie's play time in its tooltip", () => {
    const icons = mediaQuickIcons({ item: movie, state: { watched: true, plays: 2 } });
    expect(icons.fill.titles.watched).toBe('2 plays\n5h 40m');
  });

  it('should target the item for rating and watching', () => {
    const icons = mediaQuickIcons({ item: movie, state: {} });
    expect(icons.ratingTarget).toEqual({ type: 'movie', id: 1, title: 'Heat' });
    expect(icons.watchTarget).toEqual({ type: 'movie', id: 1, title: 'Heat', runtime: 170 });
  });

  it("should key an episode's watch target by its show and season", () => {
    const season = { show: 9, number: 2, episode: 5 };
    const icons = mediaQuickIcons({
      item: { type: 'episode', id: 3, title: 'Pilot', released: true, season },
      state: {},
    });
    expect(icons.watchTarget.season).toEqual(season);
  });

  it('should show the rating and watch now once the item is out', () => {
    expect(mediaQuickIcons({ item: movie, state: {} })).toMatchObject({ rating: 8.3, watchNow: 'play' });
  });

  it('should leave out the rating and watch now before release', () => {
    const icons = mediaQuickIcons({ item: { ...movie, released: false }, state: {} });
    expect(icons.rating).toBeUndefined();
    expect(icons.watchNow).toBeUndefined();
  });
});
