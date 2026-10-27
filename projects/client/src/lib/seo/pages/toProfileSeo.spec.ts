import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_AVATAR } from '../../users/placeholderAvatar.ts';
import { toProfileSeo } from './toProfileSeo.ts';

const profile = {
  displayName: 'Justin Nemeth',
  slug: 'justin',
  firstName: 'Justin',
  about: 'I watch too much TV.',
  avatarUrl: 'https://media.trakt.tv/images/users/avatars/a.jpg',
  coverUrl: 'https://media.trakt.tv/images/movies/fanarts/full/b.jpg.webp',
};
const stats = { episodes: { watched: 12345 }, movies: { watched: 1 } };

describe('seo: toProfileSeo', () => {
  it('should title the profile by display name and slug, with their About text and avatar', () => {
    expect(toProfileSeo({ profile, stats })).toEqual({
      title: 'Justin Nemeth (@justin)',
      description: 'I watch too much TV.',
      image: profile.avatarUrl,
      imageAlt: 'Justin Nemeth (@justin)',
      type: 'profile',
    });
  });

  it('should describe what they watched without About text', () => {
    expect(toProfileSeo({ profile: { ...profile, about: ' ' }, stats }).description).toBe(
      'Justin has watched 12,345 episodes and 1 movie on Trakt.',
    );
    expect(toProfileSeo({ profile: { ...profile, about: null }, stats: null }).description).toBe(
      'Justin tracks the shows and movies they watch on Trakt.',
    );
  });

  it('should use the cover instead of the placeholder avatar, then the default image', () => {
    const placeholder = { ...profile, avatarUrl: PLACEHOLDER_AVATAR };

    expect(toProfileSeo({ profile: placeholder, stats }).image).toBe(profile.coverUrl);
    expect(toProfileSeo({ profile: { ...placeholder, coverUrl: null }, stats }).image).toBeNull();
  });
});
