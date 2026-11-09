import { mediaImage } from '../images/mediaImage.ts';
import type { CalendarItem } from './calendarDays.ts';
import type { toCalendarPreferences } from './toCalendarPreferences.ts';

type ImageType = ReturnType<typeof toCalendarPreferences>['imageType'];

/**
 * OG uses show artwork; screenshots and missing thumbs fall back to the episode still, then show fanart. The show or
 * movie's fanart also comes along on its own: the Watch Now modal's backdrop, and what a still shows in its place
 * while it would spoil an unwatched episode. The art's URL doesn't say whether it exists, so a title is hidden
 * wherever its own art would carry it.
 */
export function toCalendarImage(item: CalendarItem, type: ImageType) {
  const media = item.type === 'episode' ? item.show : item.movie;
  const mediaType = item.type === 'episode' ? 'show' : 'movie';
  const size = type === 'thumb' || type === 'banner' ? 'medium' : 'thumb';
  const art = (slot: 'fanart' | 'poster' | 'banner' | 'thumb' | 'logo', fallback?: string) =>
    mediaImage({ type: mediaType, id: media.ids.trakt, slot, size: slot === 'logo' ? 'medium' : size, fallback });
  const fanart = mediaImage({ type: mediaType, id: media.ids.trakt, slot: 'fanart', size: 'thumb' });
  const still =
    item.type === 'episode'
      ? mediaImage({
          type: 'episode',
          id: item.episode.ids.trakt,
          slot: 'screenshot',
          size,
          fallback: art('fanart'),
        })
      : art('fanart');
  const images: Record<ImageType, string | undefined> = {
    screenshot: still,
    thumb: art('thumb', still),
    banner: art('banner'),
    poster: art('poster'),
    none: undefined,
    logo: art('fanart'),
    fanart: art('fanart'),
  };
  return {
    image: images[type],
    fanart,
    spoilerImage: type === 'screenshot' ? fanart : undefined,
    logo: type === 'logo' ? art('logo') : undefined,
    logoMode: type === 'logo',
    worded: type === 'thumb' || type === 'banner' || type === 'poster',
    variant: type === 'poster' ? ('poster' as const) : type === 'banner' ? ('banner' as const) : ('fanart' as const),
    hideTitle: item.type === 'movie' && type === 'poster',
    hideSmallTitle: type === 'logo' || type === 'thumb' || type === 'poster' || type === 'banner',
  };
}
