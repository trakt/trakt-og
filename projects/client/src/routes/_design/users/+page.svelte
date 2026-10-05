<!--
  The profile frame in every state, on sample data: covers, labels, follow states, the request banner and the
  watching-now bar. Real profiles only show the states the signed-in viewer is actually in. Under it, a favorite
  card, the welcome hero, the charts, the most watched columns (OG's defaults, then a saved sort and tab), and the
  network page's user cards in each follow state. The stat boxes have their own page, `/_design/profile-boxes`.
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import FavoriteCard from '$lib/components/users/FavoriteCard.svelte';
import MostWatched from '$lib/components/users/MostWatched.svelte';
import ProfileCharts from '$lib/components/users/ProfileCharts.svelte';
import ProfileFrame from '$lib/components/users/ProfileFrame.svelte';
import UserCard from '$lib/components/users/UserCard.svelte';
import WelcomeHero from '$lib/components/users/WelcomeHero.svelte';
import { profileTabs } from '$lib/users/profileTabs';
import { toGenreBar } from '$lib/users/profile/toGenreBar';
import { toRatingsChart } from '$lib/users/profile/toRatingsChart';
import type { ProfileUser } from '$lib/users/ProfileUser';
import type { ViewerRelation } from '$lib/users/ViewerRelation';
import type { WatchingNow } from '$lib/users/WatchingNow';

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
  gender: { icon: 'venus', title: 'Female' },
  age: 28,
  coverUrl: 'https://media.trakt.tv/images/shows/000/099/080/fanarts/full/a049f455c1.jpg',
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
  gender: { icon: 'genderless', title: 'Unknown' },
  age: null,
  coverUrl: null,
};

const watching: WatchingNow = {
  action: 'checkin',
  title: 'The Boys',
  episode: { number: '1x05', title: 'Good for the Soul' },
  href: '/shows/the-boys-2019/seasons/1/episodes/5',
  fanartUrl: null,
  endsAt: new Date(Date.now() + 25 * 60_000).toISOString(),
  runtime: 60,
};

const relation = (value: Partial<ViewerRelation>) =>
  Promise.resolve({ follow: 'none', followsYou: false, blocked: false, requestId: null, ...value } as const);

const counts = { followers: 12_468, following: 1 };
const tabs = (slug: string, section = '') => profileTabs({ slug, pathname: `/users/${slug}/${section}`, isSelf: true });

const states = [
  {
    title: 'Tall cover, their request, following each other',
    props: { user: vip, large: true, relation: relation({ follow: 'following', followsYou: true, requestId: 1 }) },
  },
  {
    title: 'Tall cover, watching now',
    props: { user: vip, large: true, watching, relation: relation({ follow: 'pending' }) },
  },
  {
    title: 'Slim cover (subpage), pending',
    props: { user: vip, tab: 'history', relation: relation({ follow: 'pending' }) },
  },
  { title: 'Default cover, blocked', props: { user: free, large: true, relation: relation({ blocked: true }) } },
  { title: 'Slim, watching, your own profile', props: { user: free, tab: 'network', watching, isSelf: true } },
  { title: 'Signed out', props: { user: free, large: true, signedIn: false } },
  { title: 'Follow permission disabled', props: { user: free, large: true, canFollow: false, relation: relation({}) } },
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
const ratings = toRatingsChart({
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
});
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
  { key: 'self', user: { ...free, slug: 'self', displayName: 'You (or signed out)' }, relation: null },
];
</script>

<svelte:head>
  <title>Profile frame: og</title>
</svelte:head>

{#each states as { title, props } (title)}
  <h2 class="state">{title}</h2>
  <ProfileFrame
  user={props.user}
  counts={counts}
  watching={props.watching ?? null}
  tabs={tabs(props.user.slug, props.tab)}
  large={props.large}
  isSelf={props.isSelf ?? false}
  signedIn={props.signedIn ?? true}
  canFollow={props.canFollow ?? true}
  relation={props.relation ?? null}
/>
{/each}

<h2 class="state">Favorite card</h2>
<Container>
  <div class="favorite">
    <FavoriteCard
      favorite={{
        type: 'show',
        id: 1,
        href: '/shows/the-boys-2019',
        title: 'The Boys',
        typeLabel: 'Show',
        year: 2019,
        gradient: ['#FBB91E', '#A74B2B'],
        notes: 'Rewatch every year.',
      }}
    />
  </div>
</Container>

<h2 class="state">Welcome hero</h2>
<WelcomeHero />

<h2 class="state">Charts</h2>
<ProfileCharts {genres} {ratings} slug="leela" />

<h2 class="state">Charts, no ratings</h2>
<ProfileCharts genres={genreBars(genreRows.slice(0, 4))} ratings={toRatingsChart({})} slug="leela" />

<h2 class="state">Most watched, your own profile</h2>
<MostWatched
  {...mostWatched}
  slug="leela"
  windowStart="2026-08-30T00:00:00.000Z"
  hasnt={(rest) => `You haven't ${rest}`}
  datePreferences={{ order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 }}
/>

<h2 class="state">Most watched, your saved sort and default tab (shows on All Time by time watched)</h2>
<MostWatched
  {...savedMostWatched}
  slug="leela"
  windowStart="2026-08-30T00:00:00.000Z"
  hasnt={(rest) => `You haven't ${rest}`}
  datePreferences={{ order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 }}
/>

<h2 class="state">User cards: follow, friends, pending and private, follows you, yourself or signed out</h2>
<Container>
  <ul class="user-cards">
    {#each cards as card (card.key)}<li><UserCard user={card.user} relation={card.relation} /></li>{/each}
  </ul>
</Container>

<style>
.user-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--gutter);
  margin: 0;
  padding: var(--gutter) 0;
  list-style: none;
}

.favorite {
  inline-size: calc(100% / 3);
  background-color: var(--color-favorites-bg);
  padding-block: var(--gutter);
}

.state {
  margin: 0;
  padding: var(--space-lg-block) var(--gutter);
  background-color: var(--color-surface);
  font-size: var(--font-size-h4);
}
</style>
