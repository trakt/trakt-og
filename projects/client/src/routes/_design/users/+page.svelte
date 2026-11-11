<!--
  The profile frame in every state, on sample data: covers, labels, follow states, the request banner, the lock screen
  and the watching-now bar. Real profiles only show the states the signed-in viewer is actually in. Under it, the taste
  match pill at each level, with its breakdown dialog, the favorites panel, the welcome hero, the charts, the most watched columns (OG's defaults, then a saved sort and tab),
  and the network page's user cards in each follow state, watching now and checked in. The stat boxes have their own
  demo.
-->
<script lang="ts">
import DashboardPanel from '#lib/components/dashboard/DashboardPanel.svelte';
import Specimen from '#lib/design/Specimen.svelte';
import Variant from '#lib/design/Variant.svelte';
import star from '#lib/icons/regular/star.svg?raw';
import FavoriteCard from '#lib/components/users/FavoriteCard.svelte';
import GhostProfile from '#lib/components/users/GhostProfile.svelte';
import MostWatched from '#lib/components/users/MostWatched.svelte';
import ProfileCharts from '#lib/components/users/ProfileCharts.svelte';
import ProfileSectionShimmer from '#lib/components/loading/ProfileSectionShimmer.svelte';
import MatchBadge from '#lib/components/users/MatchBadge.svelte';
import MatchPill from '#lib/components/users/MatchPill.svelte';
import ProfileFrame from '#lib/components/users/ProfileFrame.svelte';
import UserCard from '#lib/components/users/UserCard.svelte';
import WelcomeHero from '#lib/components/users/WelcomeHero.svelte';
import { liveTiles } from '#lib/dashboard/liveTiles.ts';
import { socialFeedFixture } from '#lib/dashboard/socialFeedFixture.ts';
import { profileTabs } from '#lib/users/profileTabs.ts';
import { toUserMatch } from '#lib/users/match/toUserMatch.ts';
import type { UserMatch } from '#lib/users/match/UserMatch.ts';
import type { FavoriteCard as Favorite } from '#lib/users/profile/toProfileSummary.ts';
import { toGenreBar } from '#lib/users/profile/toGenreBar.ts';
import { toProfileRatings } from '#lib/users/profile/toProfileRatings.ts';
import type { ProfileUser } from '#lib/users/ProfileUser.ts';
import type { ViewerRelation } from '#lib/users/ViewerRelation.ts';
import type { WatchingNow } from '#lib/users/WatchingNow.ts';

const vip: ProfileUser = {
  slug: 'leela',
  username: 'leela',
  displayName: 'Turanga Leela',
  firstName: 'Turanga',
  avatarUrl: 'https://media.trakt.tv/hotlink-ok/placeholders/medium/leela.png',
  isPrivate: true,
  isLocked: false,
  vip: { kind: 'vip', tag: { text: 'OG', title: 'Original VIP Member' }, years: 15 },
  location: 'Planet Express',
  coverUrl: 'https://media.trakt.tv/images/shows/000/099/080/fanarts/full/a049f455c1.jpg.webp',
  about: null,
  joinedAt: '2010-09-25T17:49:25.000Z',
};

const free: ProfileUser = {
  ...vip,
  slug: 'bender',
  username: 'bender',
  displayName: 'bender',
  firstName: 'bender',
  avatarUrl: 'https://media.trakt.tv/hotlink-ok/placeholders/medium/zoidberg.png',
  isPrivate: false,
  vip: { kind: 'vip', tag: { text: 'EP', title: 'Executive Producer' }, years: null },
  location: 'Omicron Persei 8',
  coverUrl: null,
};

const endsIn = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();
const watching: WatchingNow = {
  action: 'checkin',
  title: 'The Boys',
  episode: { number: '1x05', title: 'Good for the Soul' },
  href: '/shows/the-boys-2019/seasons/1/episodes/5',
  fanartUrl: null,
  stillUrl: null,
  endsAt: endsIn(25),
  runtime: 60,
};
const scrobbling: WatchingNow = {
  action: 'scrobble',
  title: "Futurama: Bender's Big Score",
  episode: null,
  href: '/movies/futurama-bender-s-big-score-2007',
  fanartUrl: vip.coverUrl,
  stillUrl: 'https://media.trakt.tv/images/shows/000/099/080/fanarts/medium/a049f455c1.jpg.webp',
  endsAt: endsIn(73),
  runtime: 89,
};

// A taste match at `score`, sharing the three sample favorites and a few sub-genres, one of them rare.
const sampleMatch = (score: number): UserMatch | null =>
  toUserMatch({
    score,
    breakdown: { subgenres: Math.max(0, score - 8), favorites: Math.round(score / 2) },
    shared: {
      subgenres: [
        { name: 'anthropomorphism', slug: 'anthropomorphism', rarity: 0.62 },
        { name: 'space opera', slug: 'space-opera', rarity: 0.3 },
        { name: 'time travel', slug: 'time-travel', rarity: 0.2 },
        { name: 'cyborg', slug: 'cyborg' },
        { name: 'magic', slug: 'magic', rarity: 0.1 },
        { name: 'hero', slug: 'hero', rarity: 0.05 },
      ].slice(0, Math.ceil(score / 16)),
      favorites: { movies: score >= 45 ? [4, 5, 6, 7, 8, 9] : [], shows: score >= 25 ? [1, 2, 3] : [] },
    },
  });
const matchScores = [94, 81, 62, 47, 31, 12];

const relation = (value: Partial<ViewerRelation>) =>
  Promise.resolve({ follow: 'none', followsYou: false, blocked: false, requestId: null, ...value } as const);

const listCover = 'https://media.trakt.tv/images/shows/000/167/187/fanarts/full/88ea4a00c4.jpg.webp';

const tabs = (slug: string, section = '') => profileTabs({ slug, pathname: `/users/${slug}/${section}`, isSelf: true });

const states = [
  {
    title: 'Tall cover, their request, following each other',
    props: { user: vip, large: true, relation: relation({ follow: 'following', followsYou: true, requestId: 1 }) },
  },
  {
    title: 'Tall cover, your taste match streamed in',
    props: {
      user: free,
      large: true,
      relation: relation({ follow: 'following' }),
      match: Promise.resolve(sampleMatch(62)),
    },
  },
  {
    title: 'Tall cover, someone else scrobbling a movie',
    props: { user: vip, large: true, watching: scrobbling, relation: relation({ follow: 'pending' }) },
  },
  {
    title: 'Slim, your own check-in, under a minute left',
    props: {
      user: vip,
      tab: 'history',
      watching: { ...watching, fanartUrl: vip.coverUrl, endsAt: endsIn(0.7) },
      isSelf: true,
    },
  },
  {
    title: 'Slim, over time: finished, then gone five minutes past the end',
    props: { user: vip, tab: 'history', watching: { ...scrobbling, endsAt: endsIn(-2) } },
  },
  {
    title: 'Slim, no fanart, someone else scrobbling an episode',
    props: { user: free, tab: 'history', watching: { ...watching, action: 'scrobble' as const, endsAt: endsIn(20) } },
  },
  {
    title: 'Slim cover (subpage), pending',
    props: { user: vip, tab: 'history', relation: relation({ follow: 'pending' }) },
  },
  { title: 'Default cover, blocked', props: { user: free, large: true, relation: relation({ blocked: true }) } },
  { title: 'Slim, your own check-in, no fanart', props: { user: free, tab: 'network', watching, isSelf: true } },
  { title: 'Signed out', props: { user: free, large: true, signedIn: false } },
  {
    title: "Private profile the viewer can't see",
    props: { user: { ...free, isPrivate: true, isLocked: true }, large: true, relation: relation({}) },
  },
  {
    title: 'Private profile, request sent',
    props: { user: { ...free, isPrivate: true, isLocked: true }, large: true, relation: relation({ follow: 'pending' }) },
  },
  {
    title: 'Private profile, signed out',
    props: { user: { ...free, isPrivate: true, isLocked: true }, large: true, signedIn: false },
  },
  {
    title: "A VIP owner's list page, on its first item's fanart",
    props: { user: free, tab: 'lists/sci-fi-club', coverUrl: listCover, relation: relation({}) },
  },
  { title: 'Follow permission disabled', props: { user: free, large: true, canFollow: false, relation: relation({}) } },
  {
    title: 'Loading: the follow state still streaming in',
    props: { user: free, large: true, relation: new Promise<ViewerRelation | null>(() => {}) },
  },
  {
    title: 'Incoming request from someone who does not follow you yet',
    props: { user: { ...free, slug: 'requester' }, relation: relation({ requestId: 2 }) },
  },
];

// [name, shows, movies]: titles a genre, all time, most first, like the profile's call returns them.
const genreRows: readonly (readonly [string, number, number])[] = [
  ['Drama', 240, 380],
  ['Comedy', 190, 170],
  ['Science fiction', 70, 150],
  ['Crime', 80, 100],
  ['Action', 20, 120],
  ['Thriller', 25, 95],
  ['Animation', 45, 35],
  ['Documentary', 22, 38],
  ['Fantasy', 18, 30],
  ['Mystery', 26, 18],
  ['Adventure', 6, 30],
  ['Romance', 8, 20],
  ['Horror', 4, 20],
  ['Reality', 12, 0],
];
const ids = (length: number) => Array.from({ length }, (_, n) => n);
const genreBars = (rows: typeof genreRows) => {
  const total = rows.reduce((sum, [, shows, movies]) => sum + shows + movies, 0);
  const top = Math.max(...rows.map(([, shows, movies]) => shows + movies));
  return rows.map(([name, shows, movies]) =>
    toGenreBar({
      play_count: shows + movies,
      genre: { slug: name.toLowerCase().replace(' ', '-'), name },
      percentage: ((shows + movies) / total) * 100,
      percentage_row: ((shows + movies) / top) * 100,
      episodes: { play_count: 0, ids: [] },
      shows: { play_count: shows, ids: ids(shows) },
      movies: { play_count: movies, ids: ids(movies) },
    }, { slug: 'leela' })
  );
};
const genres = genreBars(genreRows);
const ratings = toProfileRatings({
  distribution: {
    '1': 8,
    '2': 2,
    '3': 4,
    '4': 6,
    '5': 14,
    '6': 14,
    '7': 17,
    '8': 43,
    '9': 48,
    '10': 105,
  },
  types: { movies: 142, shows: 37, seasons: 4, episodes: 78 },
});
// A generous rater: an average past 9 puts the line's label before it, and the empty ratings get a 0.
const generous = toProfileRatings({
  distribution: { '1': 1, '7': 3, '8': 9, '9': 22, '10': 61 },
  types: { movies: 60, shows: 12, seasons: 0, episodes: 24 },
});
const unrated = toProfileRatings({ distribution: {} });
const card = (id: number, title: string, time: string, plays: string) =>
  ({ type: 'show', id, href: '/shows/the-boys-2019', title, time, plays }) as const;
const mostWatched = {
  shows: {
    lastMonth: [card(1, 'The Boys', '18h 26m', '21 plays'), card(2, 'Futurama', '12h 47m', '16 plays')],
    allTime: [card(3, 'Futurama', '3d 4h 12m', '140 plays')],
    sortBy: 'plays',
    tab: 'lastMonth',
  },
  movies: { lastMonth: [], allTime: [], sortBy: 'time', tab: 'lastMonth' },
} as const;
// Your saved settings: shows by time watched on All Time, movies by plays.
const savedMostWatched = {
  shows: { ...mostWatched.shows, sortBy: 'time', tab: 'allTime' },
  movies: { ...mostWatched.movies, sortBy: 'plays' },
} as const;
const cardRelation = (value: Partial<ViewerRelation>): ViewerRelation => ({
  follow: 'none',
  followsYou: false,
  blocked: false,
  requestId: null,
  ...value,
});
const cards = [
  { key: 'follow', user: free, relation: cardRelation({}) },
  {
    key: 'friends',
    user: { ...vip, isPrivate: false },
    relation: cardRelation({ follow: 'following', followsYou: true }),
  },
  { key: 'pending', user: vip, relation: cardRelation({ follow: 'pending' }) },
  {
    key: 'follows-you',
    user: { ...free, slug: 'fry', displayName: 'Philip J. Fry', vip: null },
    relation: cardRelation({ followsYou: true }),
  },
  {
    key: 'no-follow',
    user: { ...free, slug: 'hermes', displayName: 'Hermes Conrad', vip: null },
    relation: cardRelation({}),
    canFollow: false,
  },
  { key: 'self', user: { ...free, slug: 'self', displayName: 'You (or signed out)' }, relation: null },
  {
    key: 'loading',
    user: { ...free, slug: 'zoidberg', displayName: 'Loading: John Zoidberg', vip: null },
    relation: null,
    pending: true,
  },
];
const favorite = (
  id: number,
  title: string,
  slug: string,
  year: number,
  gradient: readonly [string, string],
): Favorite => ({
  type: 'show',
  id,
  href: `/shows/${slug}`,
  title,
  typeLabel: 'Show',
  year,
  gradient,
  notes: null,
});
const movie = (id: number, title: string, slug: string, year: number, gradient: readonly [string, string]): Favorite => ({
  ...favorite(id, title, slug, year, gradient),
  type: 'movie',
  href: `/movies/${slug}`,
  typeLabel: 'Movie',
});
// The taste match dialog's shared favorites: the sample shows and six movies, taking turns like the real list.
const sharedFavorites = (match: UserMatch) => {
  const shows = favorites.filter(({ id }) => match.sharedFavorites.shows.includes(id));
  const movies = [
    movie(4, 'Alien', 'alien-1979', 1979, ['#3E5C4A', '#0F1A14']),
    movie(5, 'Heat', 'heat-1995', 1995, ['#4A6FA5', '#1C2A44']),
    movie(6, 'Tron', 'tron-1982', 1982, ['#2BB3EE', '#0B2A44']),
    movie(7, 'Arrival', 'arrival-2016', 2016, ['#8A94A6', '#2B3140']),
    movie(8, 'Jaws', 'jaws-1975', 1975, ['#1F6FA8', '#0B2338']),
    movie(9, 'Up', 'up-2009', 2009, ['#F2A65A', '#B5482B']),
  ].filter(({ id }) => match.sharedFavorites.movies.includes(id));
  return Array.from({ length: Math.max(shows.length, movies.length) }, (_, n) => [shows[n], movies[n]])
    .flat()
    .filter((card): card is Favorite => card !== undefined);
};
const favorites = [
  { ...favorite(1, 'The Boys', 'the-boys-2019', 2019, ['#FBB91E', '#A74B2B']), notes: 'Rewatch every year.' },
  favorite(2, 'Futurama', 'futurama', 1999, ['#4FA3D1', '#2B3F7A']),
  favorite(3, 'The Wire', 'the-wire', 2002, ['#6BBF59', '#1F5130']),
];
const demoNow = new Date();
const tiles = liveTiles(socialFeedFixture.live(demoNow), demoNow);
const liveCards = [
  {
    key: 'watching',
    user: { ...free, slug: 'bender', displayName: 'Bender' },
    relation: cardRelation({ follow: 'following', followsYou: true }),
    watch: tiles.find(({ watch }) => watch.kind === 'watch') ?? null,
  },
  {
    key: 'checked-in',
    user: { ...vip, slug: 'amy', displayName: 'Amy Wong' },
    relation: cardRelation({ follow: 'following' }),
    watch: tiles.find(({ watch }) => watch.kind === 'checkin') ?? null,
  },
];
</script>

<Specimen title="Profile frame" bleed
  note="Covers, labels, follow states (shimmering until they load), the request banner and the watching-now bar. Real profiles only show the states the viewer is actually in. On a private profile, ships cross the sky every few seconds, and following launches one from the hologram.">
  <div class="states">
    {#each states as { title, props } (title)}
      <Variant label={title}>
        <ProfileFrame
          user={props.user}
          watching={props.watching ?? null}
          tabs={tabs(props.user.slug, props.tab)}
          large={props.large}
          isSelf={props.isSelf ?? false}
          signedIn={props.signedIn ?? true}
          canFollow={props.canFollow ?? true}
          relation={props.relation ?? null}
          match={props.match ?? null}
          coverUrl={props.coverUrl}
        />
      </Variant>
    {/each}
  </div>
</Specimen>

<Specimen title="Taste match" bleed
  note="The cover's match pill at each of v3's six levels, on the cover's glass, its level in a slashed segment of the level's color. Click one for its breakdown: you VS them over the same pill, large. Soulmates' hearts and Co-stars' stars fall through the header, and hold still (hidden) with reduced motion on. The pill hides for yourself, signed out, a Standard app, a private profile you can't see, or too little history to compare.">
  <div class="match-pills">
    {#each matchScores as score (score)}
      {@const match = sampleMatch(score)}
      {#if match}
        <Variant label={match.level.label}>
          <MatchPill {match} owner={vip} loadFavorites={() => Promise.resolve(sharedFavorites(match))} />
        </Variant>
      {/if}
    {/each}
  </div>
  <div class="match-pills">
    {#each matchScores as score (score)}
      {@const match = sampleMatch(score)}
      {#if match}
        <Variant label="{match.level.label}, large"><MatchBadge {match} large /></Variant>
      {/if}
    {/each}
  </div>
</Specimen>

<Specimen title="Favorites" bleed
  note="The profile's Favorites panel, only when there are some, with up to three cards.">
  <DashboardPanel --panel-bg="var(--color-favorites-bg)" title="Favorites" icon={star}
    seeMore={{ href: '/users/leela/favorites', text: 'All Favorites' }} drilldown={{ source: 'favorites' }}>
    <div class="favorites">
      {#each favorites as favorite (favorite.id)}<FavoriteCard {favorite} />{/each}
    </div>
  </DashboardPanel>
</Specimen>

<Specimen title="Welcome hero" bleed note="For a member who hasn't set a name yet.">
  <WelcomeHero displayName="leela" named={false} slug="leela" />
</Specimen>

<Specimen title="Ghost profile" bleed
  note="Someone else's public profile with no history, favorites, genres or comments. It replaces every section under the frame. The outlines stay still so it never looks like it's loading.">
  <GhostProfile name="Themlethem" />
</Specimen>

<Specimen title="Charts" bleed
  note="Genres and ratings; a generous rater, whose average past 9 puts the line's label before it; then no ratings at all.">
  <div class="states">
    <Variant label="Genres and ratings">
      <ProfileCharts {genres} {ratings} slug="leela" />
    </Variant>
    <Variant label="A generous rater">
      <ProfileCharts genres={genreBars(genreRows.slice(0, 4))} ratings={generous} slug="leela" />
    </Variant>
    <Variant label="No ratings">
      <ProfileCharts genres={genreBars(genreRows.slice(0, 4))} ratings={unrated} slug="leela" />
    </Variant>
  </div>
</Specimen>

<Specimen title="Most watched" bleed
  note="Your own profile on OG's defaults, then your saved sort and tab: shows on All Time by time watched. It streams in after the rest of the page, so it loads as ProfileSectionShimmer, in the loaded columns' size.">
  <div class="states">
    <Variant label="OG's defaults">
      <MostWatched
        {...mostWatched}
        slug="leela"
        windowStart="2026-08-30T00:00:00.000Z"
        datePreferences={{ order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 }}
      />
    </Variant>
    <Variant label="Saved sort and tab">
      <MostWatched
        {...savedMostWatched}
        slug="leela"
        windowStart="2026-08-30T00:00:00.000Z"
        datePreferences={{ order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 }}
      />
    </Variant>
    <Variant label="Loading">
      <ProfileSectionShimmer section="most-watched" />
    </Variant>
  </div>
</Specimen>

<Specimen title="User cards"
  note="The network page's cards: watching now, checked in, each follow state, a viewer who isn't allowed to follow, yourself or signed out, then a card whose follow state is still loading.">
  <ul class="user-cards">
    {#each liveCards as card (card.key)}
      <li><UserCard user={card.user} relation={card.relation} watch={card.watch} since="2014-03-02T10:00:00.000Z" /></li>
    {/each}
    {#each cards as card, i (card.key)}
      <li>
        <UserCard user={card.user} relation={card.relation} pending={'pending' in card && card.pending}
          canFollow={'canFollow' in card ? card.canFollow : true}
          veteran={i === 1 ? 'Legend' : i === 2 ? 'Veteran' : null}
          since="2012-06-11T10:00:00.000Z" />
      </li>
    {/each}
  </ul>
</Specimen>

<style>
.user-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--gutter);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* The cover's dark glass, behind the match pills. */
.match-pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gutter);
  padding: var(--gutter) var(--design-canvas-padding);
  background: var(--gradient-profile-shadow), var(--color-profile-boxes-bg);
}

/* ProfilePage's favorites row. */
.favorites {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--gutter);
  margin-block: var(--gutter) var(--space-lg-block);
}

.states {
  display: grid;
  gap: var(--gutter);
  padding-block-start: var(--gutter);

  & :global(figcaption) {
    padding-inline: var(--design-canvas-padding);
  }
}
</style>
