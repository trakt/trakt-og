import type { LiveWatch } from './fetchWatching.ts';
import type { SocialActivity } from './socialActivitySchema.ts';
import type { SocialMedia } from './socialMediaSchema.ts';
import { toSocialItem } from './toSocialItem.ts';
import { toSocialMedia } from './toSocialMedia.ts';

const user = (slug: string, name: string) => ({ username: slug, name, ids: { slug }, images: null });

const USERS = {
  kristin: user('sample-kristin', 'Kristin'),
  sefer: user('sample-sefer', 'Sefer'),
  damien: user('sample-damien', 'Damien'),
  mmf: user('sample-mmf', 'MajorMercyFlush'),
  techni: user('sample-technicolour', 'Technicolour'),
  ana: user('sample-ana', 'Ana'),
  rook: user('sample-rook', 'Rook'),
  noor: user('sample-noor', 'Noor'),
};

const fanart = (kind: 'shows' | 'movies', id: string, file: string) => ({
  fanart: [`media.trakt.tv/images/${kind}/000/${id}/fanarts/medium/${file}.jpg.webp`],
});

// Public titles with their real artwork.
const SHOWS = {
  seventies: {
    ids: { trakt: 52, slug: 'that-70s-show' },
    title: "That '70s Show",
    images: fanart('shows', '000/052', '0ece27e5ec'),
  },
  homeImprovement: {
    ids: { trakt: 1547, slug: 'home-improvement' },
    title: 'Home Improvement',
    images: fanart('shows', '001/547', 'b25fefd43d'),
  },
  lizzie: {
    ids: { trakt: 4551, slug: 'lizzie-mcguire' },
    title: 'Lizzie McGuire',
    images: fanart('shows', '004/551', '343a0e6566'),
  },
  bell: {
    ids: { trakt: 4321, slug: 'saved-by-the-bell' },
    title: 'Saved by the Bell',
    images: fanart('shows', '004/321', '4da82c8f63'),
  },
  hope: {
    ids: { trakt: 32674, slug: 'raising-hope' },
    title: 'Raising Hope',
    images: fanart('shows', '032/674', '8add849da6'),
  },
  persona: {
    ids: { trakt: 274608, slug: 'persona-2025' },
    title: 'Persona',
    images: fanart('shows', '274/608', '73b96ee95c'),
  },
  lioness: {
    ids: { trakt: 167187, slug: 'lioness' },
    title: 'Lioness',
    images: fanart('shows', '167/187', '88ea4a00c4'),
  },
  lanterns: {
    ids: { trakt: 157599, slug: 'lanterns' },
    title: 'Lanterns',
    images: fanart('shows', '157/599', '4feb71753a'),
  },
  paper: {
    ids: { trakt: 239158, slug: 'the-paper-2025' },
    title: 'The Paper',
    images: fanart('shows', '239/158', '52d6a6f864'),
  },
  severance: {
    ids: { trakt: 154997, slug: 'severance' },
    title: 'Severance',
    images: fanart('shows', '154/997', '9400ecb8e2'),
  },
  slowHorses: {
    ids: { trakt: 155534, slug: 'slow-horses' },
    title: 'Slow Horses',
    images: fanart('shows', '155/534', '631e5c2683'),
  },
  bear: {
    ids: { trakt: 189717, slug: 'the-bear' },
    title: 'The Bear',
    images: fanart('shows', '189/717', '59290b738d'),
  },
};
const WEAPONS = {
  ids: { trakt: 867094, slug: 'weapons-2025' },
  title: 'Weapons',
  year: 2025,
  images: fanart('movies', '867/094', '61b76e51d4'),
};

type Show = keyof typeof SHOWS;

const episode = (show: Show, season: number, number: number) => ({
  type: 'episode' as const,
  show: SHOWS[show],
  episode: { ids: { trakt: SHOWS[show].ids.trakt * 1000 + season * 100 + number }, season, number },
});
const whole = (show: Show) => ({ type: 'show' as const, show: SHOWS[show] });
const movie = { type: 'movie' as const, movie: WEAPONS };

const ago = (now: Date, minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

/**
 * A week of the people you follow, newest first, with made-up members and public titles: Kristin's two sittings with
 * other members' rows between them, Sefer's check-in and rating, Damien's comment, MajorMercyFlush binging Lanterns
 * 1x06 to 1x08 over two calendar days, Technicolour's review, a movie, and Rook's spoiler comment from two days ago.
 */
function rows(now: Date): readonly SocialActivity[] {
  const watch = (id: number, minutes: number, by: keyof typeof USERS, method = 'scrobble') => ({
    id,
    activity_at: ago(now, minutes),
    user: USERS[by],
    action: 'watch' as const,
    method,
  });
  const rating = (id: number, minutes: number, by: keyof typeof USERS, stars: number) => ({
    id,
    activity_at: ago(now, minutes),
    user: USERS[by],
    action: 'rating' as const,
    rating: stars,
  });
  const comment = (id: number, minutes: number, by: keyof typeof USERS, body: string, extra: object = {}) => ({
    id,
    activity_at: ago(now, minutes),
    user: USERS[by],
    action: 'comment' as const,
    comment: { id, comment: body, spoiler: false, review: false, likes: 4, replies: 1, ...extra },
  });

  return [
    { ...watch(17, 24, 'kristin'), ...episode('seventies', 3, 4) },
    { ...watch(16, 46, 'kristin'), ...episode('homeImprovement', 3, 6) },
    { ...watch(15, 77, 'kristin'), ...episode('lizzie', 1, 24) },
    { ...rating(14, 119, 'sefer', 9), ...episode('persona', 1, 3) },
    { ...watch(13, 132, 'sefer', 'checkin'), ...episode('persona', 1, 3) },
    {
      ...comment(
        12,
        710,
        'damien',
        'Best episode of the season so far. The last ten minutes had me holding my breath.',
      ),
      ...episode('lioness', 3, 2),
    },
    { ...watch(11, 726, 'damien'), ...episode('lioness', 3, 2) },
    { ...watch(10, 754, 'damien'), ...episode('lanterns', 1, 8) },
    { ...rating(9, 850, 'mmf', 10), ...whole('lanterns') },
    { ...watch(8, 855, 'mmf'), ...episode('lanterns', 1, 8) },
    {
      ...comment(
        7,
        920,
        'techni',
        'The pilot takes a while to find its feet, but the cast clicks by the end. Sticking with it for now.',
        { review: true, likes: 11, replies: 3 },
      ),
      ...whole('paper'),
    },
    { ...rating(6, 928, 'techni', 8), ...episode('lanterns', 1, 8) },
    { ...watch(5, 938, 'techni', 'watch'), ...episode('paper', 1, 1) },
    { ...watch(4, 1002, 'mmf'), ...episode('lanterns', 1, 7) },
    { ...watch(3, 1033, 'kristin'), ...episode('bell', 1, 6) },
    { ...watch(2, 1055, 'kristin'), ...episode('hope', 1, 7) },
    { ...watch(1, 1068, 'mmf'), ...episode('lanterns', 1, 6) },
    { ...watch(0, 1225, 'sefer', 'watch'), ...movie },
    {
      ...comment(18, 2900, 'rook', 'I did not see that ending coming. Mark is the one who sends the message.', {
        spoiler: true,
        likes: 2,
        replies: 0,
      }),
      ...episode('severance', 2, 10),
    },
  ];
}

const DATE_PREFERENCES = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;

/** Seven members watching now, in the order they started: the "+N watching" tile needs five or more. */
function live(now: Date): readonly LiveWatch[] {
  const watching = (by: keyof typeof USERS, media: SocialMedia, started: number, left: number, checkin = false) => {
    const item = toSocialItem(
      { id: 0, activity_at: ago(now, started), user: USERS[by], action: 'watch', method: null, ...media },
      DATE_PREFERENCES,
    );
    return {
      ...toSocialMedia(media),
      member: item.member,
      kind: checkin ? 'checkin' as const : 'watch' as const,
      label: item.label,
      startedAt: ago(now, started),
      expiresAt: ago(now, -left),
    };
  };

  return [
    watching('kristin', episode('seventies', 3, 5), 22, 4),
    watching('sefer', episode('persona', 1, 4), 28, 22, true),
    watching('damien', episode('lioness', 3, 3), 9, 36),
    watching('ana', episode('severance', 2, 1), 32, 24),
    watching('rook', episode('slowHorses', 5, 2), 27, 20),
    watching('mmf', episode('lanterns', 1, 9), 18, 34),
    watching('noor', episode('bear', 4, 1), 5, 28, true),
  ];
}

export const socialFeedFixture = { rows, live };
