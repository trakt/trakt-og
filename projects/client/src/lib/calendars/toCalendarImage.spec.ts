import { describe, expect, it } from 'vitest';
import type { CalendarItem } from './calendarDays.ts';
import { toCalendarImage } from './toCalendarImage.ts';

const item = {
  type: 'episode',
  at: '2026-09-30T01:00:00Z',
  show: { title: 'Show', ids: { trakt: 1, slug: 'show' } },
  episode: { season: 1, number: 1, ids: { trakt: 2 } },
} as Extract<CalendarItem, { type: 'episode' }>;

const media = 'https://media.trakt.tv';
const showFanartThumb = `${media}/shows/1/thumb/fanart.webp`;
const showFanartMedium = `${media}/shows/1/medium/fanart.webp`;
const screenshotThumb = `${media}/episodes/2/thumb/screenshot.webp`;
const screenshotMedium = `${media}/episodes/2/medium/screenshot.webp`;
const withFallback = (url: string, fallback: string) => `${url}#fallback=${encodeURIComponent(fallback)}`;

describe('toCalendarImage', () => {
  it('should choose the image and shape for every setting', () => {
    expect(toCalendarImage(item, 'logo')).toMatchObject({
      image: showFanartThumb,
      logo: `${media}/shows/1/medium/logo.webp`,
    });
    expect(toCalendarImage(item, 'fanart').logo).toBeUndefined();
    expect(toCalendarImage(item, 'screenshot').image).toBe(withFallback(screenshotThumb, showFanartThumb));
    expect(toCalendarImage(item, 'thumb').image).toBe(
      withFallback(`${media}/shows/1/medium/thumb.webp`, withFallback(screenshotMedium, showFanartMedium)),
    );
    expect(toCalendarImage(item, 'banner')).toMatchObject({
      variant: 'banner',
      hideTitle: false,
      image: `${media}/shows/1/medium/banner.webp`,
    });
    expect(toCalendarImage(item, 'poster')).toMatchObject({
      variant: 'poster',
      hideTitle: false,
      image: `${media}/shows/1/thumb/poster.webp`,
    });
    expect(toCalendarImage(item, 'none').image).toBeUndefined();
  });

  it("should bring the show's fanart, standing in for a spoiling still", () => {
    expect(toCalendarImage(item, 'logo').fanart).toBe(showFanartThumb);
    expect(toCalendarImage(item, 'logo').spoilerImage).toBeUndefined();
    expect(toCalendarImage(item, 'screenshot')).toMatchObject({
      image: withFallback(screenshotThumb, showFanartThumb),
      spoilerImage: showFanartThumb,
    });
  });

  it('should hide the title where the art carries it, and a movie poster hides its title too', () => {
    const movie = {
      type: 'movie',
      at: item.at,
      movie: { title: 'Naza', ids: { trakt: 5, slug: 'naza-2026' } },
    } as Extract<CalendarItem, { type: 'movie' }>;
    expect(toCalendarImage(movie, 'poster')).toMatchObject({
      hideTitle: true,
      image: `${media}/movies/5/thumb/poster.webp`,
    });
    expect(toCalendarImage(item, 'thumb')).toMatchObject({ hideSmallTitle: true, worded: true });
    expect(toCalendarImage(item, 'fanart').hideSmallTitle).toBe(false);
  });
});
