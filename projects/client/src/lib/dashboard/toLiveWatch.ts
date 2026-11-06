import { z } from 'zod/v4';
import type { LiveWatch } from './fetchWatching.ts';
import { socialMediaSchema } from './socialMediaSchema.ts';
import type { SocialMember } from './toSocialItem.ts';
import { toSocialMedia } from './toSocialMedia.ts';

/** A `/watching` answer from `extended=full,images`. `@trakt/api` has no contract for the images. */
const watchingSchema = z.intersection(
  z.object({ started_at: z.string(), expires_at: z.string(), action: z.string() }),
  socialMediaSchema,
);

/** What `member` is watching, from a `/watching` answer, or `null` when the answer isn't one. */
export function toLiveWatch(body: unknown, member: SocialMember): LiveWatch | null {
  const parsed = watchingSchema.safeParse(body);
  if (!parsed.success) return null;

  const { started_at: startedAt, expires_at: expiresAt, action } = parsed.data;
  const media = toSocialMedia(parsed.data);
  const label = media.code ? `${media.title.name} ${media.code}` : media.title.name;
  return { ...media, member, kind: action === 'checkin' ? 'checkin' : 'watch', label, startedAt, expiresAt };
}
