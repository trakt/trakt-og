import type { DatePreferences } from '../settings/DatePreferences.ts';
import { describeSitting } from './describeSitting.ts';
import type { DescribedSitting, SocialSitting } from './fetchSocialFeed.ts';
import type { Sitting } from './groupSittings.ts';
import { splitSitting } from './splitSitting.ts';

type ToSocialSittingParams = { sitting: Sitting; now: Date; datePreferences: DatePreferences };

/** A sitting summed up for the panel, whole and split for a tile. */
export function toSocialSitting({ sitting, now, datePreferences }: ToSocialSittingParams): SocialSitting {
  const describe = (part: Sitting): DescribedSitting => ({
    ...part,
    summary: describeSitting({ sitting: part, now, datePreferences }),
  });
  const { lead, rest } = splitSitting(sitting);

  return { ...describe(sitting), split: { lead: describe(lead), rest: rest && describe(rest) } };
}
