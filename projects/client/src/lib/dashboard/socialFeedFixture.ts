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

const show = (trakt: number, slug: string, title: string) => ({ ids: { trakt, slug }, title });

// Public titles.
const SHOWS = {
  seventies: show(52, 'that-70s-show', "That '70s Show"),
  homeImprovement: show(1547, 'home-improvement', 'Home Improvement'),
  lizzie: show(4551, 'lizzie-mcguire', 'Lizzie McGuire'),
  bell: show(4321, 'saved-by-the-bell', 'Saved by the Bell'),
  hope: show(32674, 'raising-hope', 'Raising Hope'),
  persona: show(274608, 'persona-2025', 'Persona'),
  lioness: show(167187, 'lioness', 'Lioness'),
  lanterns: show(157599, 'lanterns', 'Lanterns'),
  paper: show(239158, 'the-paper-2025', 'The Paper'),
  severance: show(154997, 'severance', 'Severance'),
  slowHorses: show(155534, 'slow-horses', 'Slow Horses'),
  bear: show(189717, 'the-bear', 'The Bear'),
  paw: show(57161, 'paw-patrol', 'PAW Patrol'),
  addams: show(13948, 'the-addams-family-1964', 'The Addams Family'),
  community: show(18265, 'community', 'Community'),
  spinCity: show(2345, 'spin-city', 'Spin City'),
  drewCarey: show(96, 'the-drew-carey-show', 'The Drew Carey Show'),
  simpsons: show(455, 'the-simpsons', 'The Simpsons'),
  middle: show(1413, 'the-middle', 'The Middle'),
  roseanne: show(2688, 'roseanne', 'Roseanne'),
  familyMatters: show(2667, 'family-matters', 'Family Matters'),
  bewitched: show(4458, 'bewitched', 'Bewitched'),
  partyDown: show(17209, 'party-down', 'Party Down'),
  mork: show(2537, 'mork-mindy', 'Mork & Mindy'),
  soap: show(3274, 'soap', 'Soap'),
  threes: show(2668, 'three-s-company', "Three's Company"),
  maude: show(2171, 'maude', 'Maude'),
  mtm: show(2942, 'the-mary-tyler-moore-show', 'The Mary Tyler Moore Show'),
  brady: show(2113, 'the-brady-bunch', 'The Brady Bunch'),
  munsters: show(1700, 'the-munsters', 'The Munsters'),
  dickVanDyke: show(2119, 'the-dick-van-dyke-show', 'The Dick Van Dyke Show'),
  happyDays: show(3822, 'happy-days', 'Happy Days'),
  taxi: show(2237, 'taxi', 'Taxi'),
  cheers: show(140, 'cheers', 'Cheers'),
  jeffersons: show(1951, 'the-jeffersons', 'The Jeffersons'),
  allInTheFamily: show(1909, 'all-in-the-family', 'All in the Family'),
  gilligan: show(1908, 'gilligan-s-island', "Gilligan's Island"),
};
const WEAPONS = {
  ids: { trakt: 867094, slug: 'weapons-2025' },
  title: 'Weapons',
  year: 2025,
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
      kind: checkin ? ('checkin' as const) : ('watch' as const),
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
