import { z } from 'zod/v4';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { HeaderUser } from '../components/header/HeaderUser.ts';
import { canSeePortraits } from './canSeePortraits.ts';

const portraitTokenSchema = z.object({ token: z.string().min(1) });

type Params = {
  fetch: typeof globalThis.fetch;
  user: Pick<HeaderUser, 'isDirector'> | null;
};

/**
 * The week's `?verify=` token media.trakt.tv wants on every portrait link, for a viewer who sees portraits. Only
 * Trakt's own apps get one. Without it, the cast shows headshots.
 */
export async function loadPortraitToken({ fetch, user }: Params): Promise<string | null> {
  if (!canSeePortraits(user)) return null;
  const response = await rawApiFetch({ fetch, path: '/portraits/token' }).catch(() => null);
  if (!response?.ok) return null;
  const parsed = portraitTokenSchema.safeParse(await response.json().catch(() => null));
  return parsed.success ? parsed.data.token : null;
}
