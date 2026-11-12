import { error } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { profileResponseSchema } from './profileResponseSchema.ts';
import type { ProfileUser } from './ProfileUser.ts';
import { toProfileUser } from './toProfileUser.ts';

/** A member's profile as a signed-out visitor reads it, with the profile frame's answers for a missing one. */
export async function loadProfilePreview({
  fetch,
  id,
}: {
  fetch: typeof globalThis.fetch;
  id: string;
}): Promise<ProfileUser> {
  const profile = await api({ fetch }).users.profile({ params: { id }, query: { extended: 'full,vip' } });
  if (profile.status === 404) error(404, 'Page Not Found');
  if (profile.status === 200 && profile.body.deleted) error(410, 'Page Not Found');
  if (profile.status !== 200) error(502, 'Trakt is having trouble loading this profile.');

  const parsed = profileResponseSchema.safeParse(profile.body);
  if (!parsed.success) error(502, 'Trakt returned an invalid profile response.');
  return toProfileUser(parsed.data);
}
