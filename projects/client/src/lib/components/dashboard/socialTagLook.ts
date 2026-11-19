import type { CardTag } from '#lib/components/media/CardTag.ts';
import type { SocialTag } from '#lib/dashboard/toSocialTag.ts';
import forward from '#lib/icons/solid/forward.svg?raw';
import userGroup from '#lib/icons/regular/user-group.svg?raw';
import heart from '#lib/icons/solid/heart.svg?raw';

/** A Social Feed tag as a card tag, and the color of the band a story card closes with. */
export type SocialTagLook = CardTag & { readonly band: string };

/**
 * How a reason looks, the same on a poster and a story card: a premiere or finale in its episode type's color, Loved
 * in the rating's, a binge's episodes in the watched purple, and Buzzing in the brand blue when 3 or more watched it.
 */
export function socialTagLook(tag: SocialTag): SocialTagLook {
  if (tag.kind === 'episode') {
    return { text: tag.episode.text, kind: tag.episode.kind, band: `var(--episode-${tag.episode.kind})` };
  }
  if (tag.kind === 'loved') {
    const color = `var(--rating-${tag.rating})`;
    return { text: 'Loved', icon: heart, color, band: color };
  }
  if (tag.kind === 'binge') {
    const color = 'var(--color-social-binge)';
    return { text: `${tag.episodes} episodes`, icon: forward, color, band: color };
  }
  return {
    text: 'Buzzing',
    icon: userGroup,
    color: 'var(--color-social-together)',
    band: 'var(--color-social-together)',
  };
}
