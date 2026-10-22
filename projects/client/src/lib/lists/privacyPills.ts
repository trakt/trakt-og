/** A link list is private too, and friends-only reads "Following". */
export function privacyPills(privacy: string | null | undefined): readonly string[] {
  if (privacy === 'private' || privacy === 'link') return ['Private'];
  if (privacy === 'friends') return ['Following'];
  return [];
}
