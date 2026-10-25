<!-- A movie summary's top with real art, then its lazy sections with made-up data: activity, comments, lists, related. -->
<script lang="ts">
import { page } from '$app/state';
import FanartHeader from '$lib/components/media/FanartHeader.svelte';
import ActionButtons from '$lib/components/summary/ActionButtons.svelte';
import MediaTools from '$lib/components/summary/MediaTools.svelte';
import Overview from '$lib/components/summary/Overview.svelte';
import RatingsStrip from '$lib/components/summary/RatingsStrip.svelte';
import SubpageTitle from '$lib/components/summary/SubpageTitle.svelte';
import SummaryFrame from '$lib/components/summary/SummaryFrame.svelte';
import SummaryPoster from '$lib/components/summary/SummaryPoster.svelte';
import SummaryTitle from '$lib/components/summary/SummaryTitle.svelte';
import ActivityTabs from '$lib/components/summary/ActivityTabs.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import SummarySectionShimmer from '$lib/components/loading/SummarySectionShimmer.svelte';
import ActorsStrip from '$lib/components/summary/ActorsStrip.svelte';
import CastCard from '$lib/components/summary/CastCard.svelte';
import ViewToggle from '$lib/components/toolbar/ViewToggle.svelte';
import CommentsPreview from '$lib/components/summary/CommentsPreview.svelte';
import AddCommentLink from '$lib/components/comments/AddCommentLink.svelte';
import NewCommentForm from '$lib/components/comments/NewCommentForm.svelte';
import { newComment } from '$lib/components/comments/newComment.svelte';
import ListsPreview from '$lib/components/summary/ListsPreview.svelte';
import RelatedItems from '$lib/components/summary/RelatedItems.svelte';
import VideosRail from '$lib/components/summary/VideosRail.svelte';
import type { CommentTab } from '$lib/summary/sectionsClient';
import type { SummaryList } from '$lib/summary/toSummaryList';
import { type ActivityTab, toActivity } from '$lib/summary/toActivity';
import { socialFeedFixture } from '$lib/dashboard/socialFeedFixture';
import type { RelatedCard } from '$lib/summary/toRelatedCard';
import type { VideoCard } from '$lib/videos/toVideoCards';
import { formatting, movie, review, spoiler } from '../comments/fixtures.ts';
import { breakingBad, noWayHome, pilot } from './fixtures.ts';

// Shows the Add comment buttons, as for a signed-in viewer; they open the comments preview's form.
$effect(() => newComment.mount());
let view = $state<'grid' | 'list'>('grid');
// Made-up people with no headshots, so each Futurama silhouette shows: Leela, Fry, then Zoidberg.
const person = (name: string, characters: string, gender?: string, episodes?: string) => ({
  name,
  href: `/people/${name.toLowerCase().replace(/ /g, '-')}`,
  characters,
  gender,
  episodes,
});
const regulars = [
  person('Avery Stone', 'Captain Mara Vell', 'female', '24 episodes'),
  person('Jonah Pike', 'Dr. Felix Brandt Jr.', 'male', '24 episodes'),
  person('Sam Okafor', 'The Archivist', 'non_binary', '18 episodes'),
  person('Riley Quinn', 'Officer Dale Hart', undefined, '9 episodes'),
];
const crew = [
  { id: 'directing', label: 'Directing', cast: [person('Noor Haddad', 'Director', 'female', '6 episodes')] },
  { id: 'writing', label: 'Writing', cast: [person('Theo Marsh', 'Writer, Story', 'male', '12 episodes')] },
];
const ratingTarget = { type: 'movie', id: noWayHome.id, title: noWayHome.fullTitle } as const;

const AVATAR = 'https://media.trakt.tv/hotlink-ok/placeholders/medium/zoidberg.png';
const watcher = (i: number) => ({
  username: `member_${i}`,
  private: i === 7,
  deleted: false,
  ids: { trakt: i, slug: `member_${i}` },
  images: { avatar: { full: AVATAR } },
});
// One of the followed members watching now, in the dashboard's live card.
const live = socialFeedFixture.live(new Date()).slice(2, 3).map((watch) => ({
  ...watch,
  member: { ...watch.member, key: 'member_2', name: 'member_2', slug: 'member_2', href: '/users/member_2' },
}));
// Thirty watching now, three of them followed; sixteen followed members with plays, a few with ratings.
const activity: readonly ActivityTab[] = toActivity({
  watching: Array.from({ length: 30 }, (_, i) => watcher(i)),
  following: new Set(['member_2', 'member_5', 'member_11']),
  live,
  item: { type: ratingTarget.type, id: ratingTarget.id },
  social: Array.from({ length: 16 }, (_, i) => ({
    user: watcher(i + 40),
    watched: {
      plays: Math.max(1, Math.round(60 / (1 + i * 0.6))),
      rating: i % 2 === 0 ? { rating: [10, 10, 9, 9, 10, 8, 7, 9][i / 2] ?? 9 } : null,
    },
  })),
});

const comments: readonly CommentTab[] = [
  { id: 'likes', label: 'Popular', comments: [review, formatting] },
  { id: 'recent', label: 'Recent', comments: [spoiler] },
];

const list = (id: number, name: string, extra: Partial<SummaryList> = {}) => ({
  id,
  kind: 'personal' as const,
  href: `/users/og_tester/lists/${id}`,
  name,
  owner: {
    slug: 'og_tester',
    name: 'OG Tester',
    href: '/users/og_tester',
    avatar: AVATAR,
    vip: { kind: 'vip' as const, tag: null, years: null },
  },
  posters: [{}, {}, {}, {}, {}],
  itemCount: 24,
  likeCount: 12,
  commentCount: 2,
  pills: [],
  description: 'Crews, vaults and one last job.',
  ...extra,
});
const lists: readonly SummaryList[] = [
  list(1, 'Heat Collection', {
    kind: 'official',
    href: '/lists/official/heat-collection',
    pills: ['Official List'],
    commentCount: undefined,
  }),
  list(2, 'Heist Night'),
];

// Eighteen picks, so more opens a second row and a third. Heat's crime subgenres spread over them, and two share its people.
const relatedSubgenres = ['heist', 'organized-crime', 'neo-noir', 'police-detective', 'los-angeles'];
const related: readonly RelatedCard[] = Array.from({ length: 18 }, (_, i) => ({
  type: 'movie',
  id: 900 + i,
  href: '/movies/heat-1995',
  title: `Related Movie ${i + 1}`,
  year: 1990 + i,
  released: true,
  rating: 8 - i / 6,
  subgenres: relatedSubgenres.filter((_, j) => (i + j) % 3 !== 0),
}));
const relatedSource = { subgenres: relatedSubgenres, people: [1, 2, 3] };
const relatedPeople = (card: RelatedCard) =>
  Promise.resolve(
    card.id === 901
      ? [{ id: 1, name: 'Al Pacino' }, { id: 2, name: 'Robert De Niro' }, { id: 3, name: 'Michael Mann' }]
      : card.id === 904
      ? [{ id: 3, name: 'Michael Mann' }]
      : [],
  );

// Two real YouTube ids, so the thumbnails load; a start time keeps each card's link its own.
const video = (type: VideoCard['type'], title: string, id: string, start: number): VideoCard => ({
  type,
  title,
  href: `https://youtube.com/watch?v=${id}&t=${start}`,
  image: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
});
const videos: readonly VideoCard[] = [
  video('trailer', 'Official Trailer', 'HhesaQXLuRY', 0),
  video('teaser', 'Teaser', 'dfeUzm6KF4g', 0),
  video('featurette', 'Inside the Episode', 'HhesaQXLuRY', 10),
  video('clip', 'Opening Scene', 'dfeUzm6KF4g', 10),
  video('behind the scenes', 'Making the Show', 'HhesaQXLuRY', 20),
];
</script>

{#snippet newCommentForm()}<NewCommentForm item={movie} />{/snippet}

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Specimen title="Summary top" bleed
  note="A movie's page as it opens: the title tags and ratings strip on the art, the poster rising into it, the overview and the action stack. Each action works for a signed-in viewer.">
  <FanartHeader image={noWayHome.fanart}>
    <SummaryTitle title={noWayHome.title} year={noWayHome.year} certification={noWayHome.certification}
      links={[noWayHome.collection]} credits={noWayHome.credits} />
    {#snippet stats()}
      <RatingsStrip rating={{ value: noWayHome.rating, votes: noWayHome.votes, href: `${noWayHome.href}/stats` }}
        rateLabel="movie" {ratingTarget} external={noWayHome.external}
        counts={[{ count: noWayHome.favorited, label: 'favorited' }]} statsHref="{noWayHome.href}/stats" />
    {/snippet}
  </FanartHeader>
  <SummaryFrame label={noWayHome.title}>
    {#snippet tools()}
      <MediaTools target={{ type: 'movie', id: noWayHome.id, title: noWayHome.title, year: noWayHome.year, href: noWayHome.href, tmdb: noWayHome.tmdb, fanart: noWayHome.fanart }} />
    {/snippet}
    {#snippet sidebar()}
      <SummaryPoster {ratingTarget} image={noWayHome.poster} alt={noWayHome.fullTitle} />
    {/snippet}
    {#snippet details()}
      <Overview tagline={noWayHome.tagline} overview={noWayHome.overview} />
    {/snippet}
    {#snippet actions()}
      <ActionButtons listTarget={ratingTarget} checkin={{ type: 'movie', id: noWayHome.id }} favorites
        favoriteTarget={{ ...ratingTarget, title: noWayHome.title, year: noWayHome.year, fanart: noWayHome.fanart }}
        historyTarget={{ ...ratingTarget, runtime: noWayHome.runtime, released: true }} />
    {/snippet}
  </SummaryFrame>
</Specimen>

<Specimen title="Subpage title" bleed
  note="An episode's Stats page: the page label leads the tag bar, a slash splits the show from its season, then the episode type.">
  <FanartHeader image={pilot.screenshot} slim>
    <SubpageTitle label="Stats" target={{ type: 'episode', id: pilot.id, season: pilot.season }} parents={pilot.parents}
      type={pilot.episodeType} certification={breakingBad.certification} number={pilot.number} title={pilot.title}
      href={pilot.href} />
  </FanartHeader>
</Specimen>

<Specimen title="List poster" note="A list's summary poster: its first four posters, quartered.">
  <div class="poster-demo">
    <SummaryPoster alt="Heist Night"
      posters={[{ image: noWayHome.posterThumb }, { image: breakingBad.posterThumb }, {}, {}]} />
  </div>
</Specimen>

<Specimen title="People"
  note="One dropdown of the actor and crew groups, eight cards across that scroll sideways, and All People linking to the picked group. People without a headshot get a silhouette by gender. Local OG: /shows/breaking-bad.">
  <ActorsStrip groups={[{ id: 'season-regulars', label: 'Series Regulars', cast: regulars }]} {crew}
    creditsHref="/shows/demo/people" />
  <p>The people page's cards: <ViewToggle bind:view /> flips them between the grid card and the list row.</p>
  <ul class={['people-demo', view]}>
    {#each regulars as member (member.href)}
      <li>
        <CastCard name={member.name} href={member.href} gender={member.gender} role={member.characters}
          episodes={member.episodes} layout={view === 'list' ? 'row' : 'card'} />
      </li>
    {/each}
  </ul>
</Specimen>

<Specimen title="Activity"
  note="Watching now and People You Follow, with one followed member watching live. Signed in, shimmering cells hold its place while it loads.">
  <Variant label="Loaded"><ActivityTabs tabs={activity} /></Variant>
  <Variant label="Loading"><SummarySectionShimmer section="activity" /></Variant>
</Specimen>

<Specimen title="Videos"
  note="It opens on the trailers, else the teasers, else All, where each card tags its type in the type's color. A plain click plays a video in the popup. OG had none; v3's Extras row is the model.">
  <Variant label="Loaded"><VideosRail {videos} href="/shows/demo" /></Variant>
  <Variant label="Loading"><SummarySectionShimmer section="videos" /></Variant>
</Specimen>

<Specimen title="Comments and lists previews"
  note="What loads at the bottom of /movies/fight-club-1999 as it scrolls into view, with shimmering comments and list rows in their places until it does.">
  <Variant label="Loaded">
    <CommentsPreview
      form={newCommentForm}
      reload={() => Promise.resolve(comments)}
      tabs={comments}
      item={movie}
      viewer={page.data.user ? { slug: page.data.user.slug } : null}
      count={128}
      href="/movies/heat-1995"
      dateOptions={page.data.datePreferences}
    />
    <p>The comments subnav's Add comment: <AddCommentLink /></p>
    <ListsPreview {lists} count={342} href="/movies/heat-1995" />
  </Variant>
  <Variant label="Loading">
    <SummarySectionShimmer section="comments" />
    <SummarySectionShimmer section="lists" />
  </Variant>
</Specimen>

<Specimen title="Related" bleed
  note="Eighteen picks, so More opens a second row and a third. Two share Heat's people. A row of shimmering posters holds their place while they load.">
  <Variant label="Loaded">
    <RelatedItems title="Heat" source={relatedSource} load={() => Promise.resolve(related)} loadPeople={relatedPeople}
      datePreferences={page.data.datePreferences} />
  </Variant>
  <Variant label="Loading">
    <RelatedItems title="Heat" source={relatedSource} load={() => new Promise(() => {})} loadPeople={relatedPeople}
      datePreferences={page.data.datePreferences} />
  </Variant>
</Specimen>

<style>
.people-demo {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--cast-grid-min), 1fr));
  gap: var(--cast-grid-row-gap) var(--actors-gap);
  margin-block: var(--gutter);
  padding: 0;
  list-style: none;

  &.list {
    grid-template-columns: repeat(var(--cast-list-columns), minmax(0, 1fr));
    gap: var(--cast-list-gap);
  }
}

/* The summary sidebar's width. */
.poster-demo {
  inline-size: calc(var(--summary-offset) - var(--gutter));
}
</style>
