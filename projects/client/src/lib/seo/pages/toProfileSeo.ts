import type { UserStats } from '../../stats/userStatsSchema.ts';
import type { ProfileUser } from '../../users/ProfileUser.ts';
import { PLACEHOLDER_AVATAR } from '../../users/placeholderAvatar.ts';
import { countLabel } from '../../utils/countLabel.ts';
import type { SeoMeta } from '../SeoMeta.ts';

type Params = {
  profile: Pick<ProfileUser, 'displayName' | 'slug' | 'firstName' | 'about' | 'avatarUrl' | 'coverUrl'>;
  stats: {
    readonly episodes: Pick<UserStats['episodes'], 'watched'>;
    readonly movies: Pick<UserStats['movies'], 'watched'>;
  } | null;
};

const watchedLine = ({ profile, stats }: Params) =>
  stats
    ? `${profile.firstName} has watched ${countLabel(stats.episodes.watched, 'episode')} and ${countLabel(stats.movies.watched, 'movie')} on Trakt.`
    : `${profile.firstName} tracks the shows and movies they watch on Trakt.`;

/** `/users/:id`: "Justin Nemeth (@justin)", their About text, else what they've watched, and their avatar or cover. */
export function toProfileSeo(params: Params): SeoMeta {
  const { profile } = params;
  const avatar = profile.avatarUrl === PLACEHOLDER_AVATAR ? undefined : profile.avatarUrl;
  const title = `${profile.displayName} (@${profile.slug})`;
  return {
    title,
    description: profile.about?.trim() || watchedLine(params),
    image: avatar ?? profile.coverUrl,
    imageAlt: title,
    type: 'profile',
  };
}
