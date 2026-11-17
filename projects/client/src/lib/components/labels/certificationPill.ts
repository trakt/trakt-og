import { certificationTip } from '../summary/certificationTip.ts';
import type { TagPill } from './TagPill.ts';

/**
 * A certificate's badge pill, with OG's tip saying what the rating means. OG's tips explain US ratings only, so another
 * `country`'s rating goes without.
 */
export function certificationPill(certification: string, country = 'us'): TagPill {
  const tip = country === 'us' ? certificationTip(certification) : undefined;
  return { text: certification, kind: 'badge', ...(tip ? { tip } : {}) };
}
