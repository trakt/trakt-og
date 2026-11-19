import { traktUrls } from '../../../../traktUrls.ts';
import type { BoxInput } from '../BoxInput.ts';
import type { AboutMeView } from './AboutMeView.ts';

/** The owner's words, a prompt on your own empty profile, or `null` on someone else's empty one. */
export function toAboutMe({ profile, isSelf }: Pick<BoxInput, 'profile' | 'isSelf'>): AboutMeView | null {
  const label = isSelf ? 'About Me' : `About ${profile.firstName}`;
  if (profile.about) return { label, kind: 'filled', about: profile.about };
  return isSelf ? { label, kind: 'self', settingsHref: traktUrls.settings } : null;
}
