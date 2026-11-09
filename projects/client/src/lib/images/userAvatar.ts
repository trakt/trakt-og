/**
 * A member's uploaded avatar, built from their Trakt id. A member without one is a 404, which `brokenImageFallback`
 * turns into OG's placeholder avatar (the API's Gravatar fallback is gone with it). A new upload can take up to a day to
 * show for someone who saw the old one.
 */
export function userAvatar(id: number): string {
  return `https://media.trakt.tv/users/${id}/avatar.webp`;
}
