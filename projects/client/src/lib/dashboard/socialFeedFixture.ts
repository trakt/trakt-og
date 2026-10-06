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
  justin: user('sample-justin', 'Justin'),
};

/** A title's poster and fanart, as `extended=images` paths. */
const art = (kind: 'shows' | 'movies', id: string, poster: string, fanart: string) => ({
  poster: [`media.trakt.tv/images/${kind}/000/${id}/posters/medium/${poster}.jpg.webp`],
  fanart: [`media.trakt.tv/images/${kind}/000/${id}/fanarts/medium/${fanart}.jpg.webp`],
});
const show = (trakt: number, slug: string, title: string, images: ReturnType<typeof art>) => ({
  ids: { trakt, slug },
  title,
  images,
});

// Public titles with their real artwork.
const SHOWS = {
  seventies: show(52, 'that-70s-show', "That '70s Show", art('shows', '000/052', '93b5799066', '0ece27e5ec')),
  homeImprovement: show(
    1547,
    'home-improvement',
    'Home Improvement',
    art('shows', '001/547', '1a98f7cdf5', 'b25fefd43d'),
  ),
  lizzie: show(4551, 'lizzie-mcguire', 'Lizzie McGuire', art('shows', '004/551', '02c62ff1ed', '343a0e6566')),
  bell: show(4321, 'saved-by-the-bell', 'Saved by the Bell', art('shows', '004/321', '4e6045953a', '4da82c8f63')),
  hope: show(32674, 'raising-hope', 'Raising Hope', art('shows', '032/674', 'd348e63ef3', '8add849da6')),
  persona: show(274608, 'persona-2025', 'Persona', art('shows', '274/608', '7d019dacd1', '73b96ee95c')),
  lioness: show(167187, 'lioness', 'Lioness', art('shows', '167/187', 'beaf515513', '88ea4a00c4')),
  lanterns: show(157599, 'lanterns', 'Lanterns', art('shows', '157/599', '1fdc413e93', '4feb71753a')),
  paper: show(239158, 'the-paper-2025', 'The Paper', art('shows', '239/158', '924da7c942', '52d6a6f864')),
  severance: show(154997, 'severance', 'Severance', art('shows', '154/997', 'f60ddb06de', '9400ecb8e2')),
  slowHorses: show(155534, 'slow-horses', 'Slow Horses', art('shows', '155/534', '6b6d40b6de', '631e5c2683')),
  bear: show(189717, 'the-bear', 'The Bear', art('shows', '189/717', 'ef28e34e51', '59290b738d')),
  paw: show(57161, 'paw-patrol', 'PAW Patrol', art('shows', '057/161', '3d1bf17471', '42eedc3892')),
  addams: show(
    13948,
    'the-addams-family-1964',
    'The Addams Family',
    art('shows', '013/948', '447681ecc6', 'a872da22e3'),
  ),
  community: show(18265, 'community', 'Community', art('shows', '018/265', '45b7f2b304', '9c0a79d9e6')),
  spinCity: show(2345, 'spin-city', 'Spin City', art('shows', '002/345', 'ca76eb8de6', '05be47249b')),
  drewCarey: show(
    96,
    'the-drew-carey-show',
    'The Drew Carey Show',
    art('shows', '000/096', '7e43f341c2', '107fb7f4c5'),
  ),
  simpsons: show(455, 'the-simpsons', 'The Simpsons', art('shows', '000/455', '8b737766ea', 'e69f8ca9ad')),
  middle: show(1413, 'the-middle', 'The Middle', art('shows', '001/413', '700f8ef40b', '529e1b2f4c')),
  roseanne: show(2688, 'roseanne', 'Roseanne', art('shows', '002/688', '3a6e1325e0', '699ffb33d6')),
  familyMatters: show(2667, 'family-matters', 'Family Matters', art('shows', '002/667', '31a896c988', '3b9b898633')),
  bewitched: show(4458, 'bewitched', 'Bewitched', art('shows', '004/458', '166078642b', '08d5bccb13')),
  partyDown: show(17209, 'party-down', 'Party Down', art('shows', '017/209', '8a0c6d3ff2', '4ea865c35f')),
  mork: show(2537, 'mork-mindy', 'Mork & Mindy', art('shows', '002/537', '03d423b87c', 'd9982e5050')),
  soap: show(3274, 'soap', 'Soap', art('shows', '003/274', 'f40c976994', '8545f41253')),
  threes: show(2668, 'three-s-company', "Three's Company", art('shows', '002/668', '30efffdb2d', '90266a2fa3')),
  maude: show(2171, 'maude', 'Maude', art('shows', '002/171', '54ba0f008d', 'da2c261424')),
  mtm: show(
    2942,
    'the-mary-tyler-moore-show',
    'The Mary Tyler Moore Show',
    art('shows', '002/942', 'cc06a943fa', '2107d45a81'),
  ),
  brady: show(2113, 'the-brady-bunch', 'The Brady Bunch', art('shows', '002/113', 'd07437f99e', '54661a4920')),
  munsters: show(1700, 'the-munsters', 'The Munsters', art('shows', '001/700', 'bc93c955d9', 'aaa145ac85')),
  dickVanDyke: show(
    2119,
    'the-dick-van-dyke-show',
    'The Dick Van Dyke Show',
    art('shows', '002/119', '597bef4665', 'cf75bde1cc'),
  ),
  happyDays: show(3822, 'happy-days', 'Happy Days', art('shows', '003/822', 'dcc8fada43', 'e129802b80')),
  taxi: show(2237, 'taxi', 'Taxi', art('shows', '002/237', '40ca371e07', 'dc3672de74')),
  cheers: show(140, 'cheers', 'Cheers', art('shows', '000/140', '8119f421cb', '0e1dec7964')),
  jeffersons: show(1951, 'the-jeffersons', 'The Jeffersons', art('shows', '001/951', 'e77c2b1926', 'bf096409d6')),
  allInTheFamily: show(
    1909,
    'all-in-the-family',
    'All in the Family',
    art('shows', '001/909', 'f4eac22f19', '469107d795'),
  ),
  gilligan: show(1908, 'gilligan-s-island', "Gilligan's Island", art('shows', '001/908', '66fb4e643f', 'f7db9315b3')),
};
const WEAPONS = {
  ids: { trakt: 867094, slug: 'weapons-2025' },
  title: 'Weapons',
  year: 2025,
  images: art('movies', '867/094', '70d5a3734e', '61b76e51d4'),
};

type Show = keyof typeof SHOWS;

const episode = (show: Show, season: number, number: number) => ({
  type: 'episode' as const,
  show: SHOWS[show],
  episode: { ids: { trakt: SHOWS[show].ids.trakt * 1000 + season * 100 + number }, season, number },
});
const whole = (show: Show) => ({ type: 'show' as const, show: SHOWS[show] });
const movie = { type: 'movie' as const, movie: WEAPONS };

// Kristin's day yesterday: 33 episodes of 27 shows from 8:20 AM to 11:17 PM, about 25 minutes apart, newest first.
const KRISTINS_DAY: readonly (readonly [Show, number, number, number])[] = [
  ['bell', 1, 6, 1033],
  ['hope', 1, 7, 1055],
  ['addams', 1, 2, 1077],
  ['community', 1, 1, 1103],
  ['spinCity', 1, 7, 1128],
  ['drewCarey', 3, 23, 1151],
  ['simpsons', 2, 3, 1182],
  ['middle', 2, 6, 1205],
  ['roseanne', 2, 7, 1227],
  ['homeImprovement', 2, 6, 1257],
  ['familyMatters', 2, 7, 1281],
  ['bewitched', 1, 8, 1310],
  ['partyDown', 1, 1, 1336],
  ['roseanne', 1, 10, 1364],
  ['mork', 1, 1, 1388],
  ['soap', 1, 2, 1414],
  ['threes', 1, 2, 1449],
  ['maude', 1, 2, 1474],
  ['mtm', 1, 2, 1511],
  ['brady', 1, 2, 1587],
  ['munsters', 1, 2, 1613],
  ['mtm', 1, 1, 1649],
  ['dickVanDyke', 1, 2, 1674],
  ['happyDays', 1, 2, 1700],
  ['taxi', 1, 2, 1726],
  ['cheers', 1, 2, 1752],
  ['bewitched', 1, 7, 1778],
  ['jeffersons', 1, 2, 1804],
  ['threes', 1, 1, 1829],
  ['allInTheFamily', 1, 2, 1855],
  ['soap', 1, 1, 1880],
  ['gilligan', 1, 2, 1906],
  ['munsters', 1, 1, 1930],
];

const ago = (now: Date, minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

/**
 * A week of the people you follow, newest first, with made-up members and public titles: Kristin's two sittings with
 * other members' rows between them (the second a 33-episode day), Sefer's check-in and rating, Damien's two shows,
 * comment and rating, MajorMercyFlush binging Lanterns 1x06 to 1x08 over two calendar days, Technicolour's review, a
 * movie, Justin's two PAW Patrol episodes and Rook's spoiler comment from two days ago.
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
    { ...rating(19, 705, 'damien', 8), ...whole('lanterns') },
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
    { ...watch(1, 1068, 'mmf'), ...episode('lanterns', 1, 6) },
    { ...watch(0, 1225, 'sefer', 'watch'), ...movie },
    { ...watch(20, 1380, 'justin'), ...episode('paw', 7, 21) },
    { ...watch(21, 1408, 'justin'), ...episode('paw', 7, 1) },
    ...KRISTINS_DAY.map(([show, season, number, minutes], i) => ({
      ...watch(100 + i, minutes, 'kristin'),
      ...episode(show, season, number),
    })),
    {
      ...comment(18, 2900, 'rook', 'I did not see that ending coming. Mark is the one who sends the message.', {
        spoiler: true,
        likes: 2,
        replies: 0,
      }),
      ...episode('severance', 2, 10),
    },
  ].toSorted((a, b) => Date.parse(b.activity_at) - Date.parse(a.activity_at));
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
