import type { PersonResponse } from '@trakt/api';
import { personLinks } from '../people/personLinks.ts';
import { mediaImage } from '../images/mediaImage.ts';
import { previewArt } from '../images/previewArt.ts';
import type { SubpageFrameMedia } from './SubpageFrameMedia.ts';

/**
 * A person subpage's header and sidebar: the person's own fanart
 * (`item_top_fanart`), the headshot as the poster and the person's external links.
 */
export function toPersonSubpageMedia(person: PersonResponse): SubpageFrameMedia {
  return {
    item: { title: person.name },
    title: person.name,
    href: `/people/${person.ids.slug}`,
    parents: [],
    fanart: mediaImage({ type: 'person', id: person.ids.trakt, slot: 'fanart', size: 'full' }),
    poster: mediaImage({ type: 'person', id: person.ids.trakt, slot: 'headshot', size: 'medium' }),
    preview: previewArt(
      { type: 'person', id: person.ids.trakt, slot: 'fanart' },
      { type: 'person', id: person.ids.trakt, slot: 'headshot' },
    ),
    links: personLinks(person),
  };
}
