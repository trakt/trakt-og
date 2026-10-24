<!-- The summary pages' lazy sections with made-up data: People You Follow, the comments and lists previews, related. -->
<script lang="ts">
import { page } from '$app/state';
import MediaTools from '$lib/components/summary/MediaTools.svelte';
import ReportDialog from '$lib/components/summary/ReportDialog.svelte';
import SummaryPoster from '$lib/components/summary/SummaryPoster.svelte';
import TitleTags from '$lib/components/summary/TitleTags.svelte';
import ActivityTabs from '$lib/components/summary/ActivityTabs.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import ActorsStrip from '$lib/components/summary/ActorsStrip.svelte';
import CastCard from '$lib/components/summary/CastCard.svelte';
import ViewToggle from '$lib/components/toolbar/ViewToggle.svelte';
import CommentsPreview from '$lib/components/summary/CommentsPreview.svelte';
import AddCommentLink from '$lib/components/comments/AddCommentLink.svelte';
import { newComment } from '$lib/components/comments/newComment.svelte';
import ListsPreview from '$lib/components/summary/ListsPreview.svelte';
import RelatedItems from '$lib/components/summary/RelatedItems.svelte';
import VideosRail from '$lib/components/summary/VideosRail.svelte';
import SummaryAction from '$lib/components/summary/SummaryAction.svelte';
import SummaryActionTile from '$lib/components/summary/SummaryActionTile.svelte';
import SummaryActionMenu from '$lib/components/summary/SummaryActionMenu.svelte';
import Icon from '$lib/icons/Icon.svelte';
import plus from '$lib/icons/light/circle-plus.svg?raw';
import historyIcon from '$lib/icons/light/clock-rotate-left.svg?raw';
import check from '$lib/icons/trakt/check.svg?raw';
import collection from '$lib/icons/trakt/collection.svg?raw';
import listIcon from '$lib/icons/trakt/list.svg?raw';
import star from '$lib/icons/thin/star.svg?raw';
import type { CommentTab } from '$lib/summary/sectionsClient';
import type { SummaryList } from '$lib/summary/toSummaryList';
import { type ActivityTab, toActivity } from '$lib/summary/toActivity';
import { socialFeedFixture } from '$lib/dashboard/socialFeedFixture';
import type { RelatedCard } from '$lib/summary/toRelatedCard';
import type { VideoCard } from '$lib/videos/toVideoCards';
import { formatting, movie, review, spoiler } from '../comments/fixtures.ts';

// Shows the Add comment buttons, as for a signed-in viewer; the page has no form for them to open.
$effect(() => newComment.mount());
let reporting = $state(false);
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
const reportTarget = {
  type: 'movie' as const,
  id: 1,
  title: 'Fight Club (1999)',
  href: '/movies/fight-club-1999',
  tmdb: 'https://www.themoviedb.org/movie/550',
  fanart: 'https://media.trakt.tv/images/shows/000/099/080/fanarts/medium/a049f455c1.jpg',
};

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
  item: { type: reportTarget.type, id: reportTarget.id },
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

<Specimen title="Poster column"
  note="A list's poster collage, the media tools under a summary poster, and the report dialog.">
  <div class="poster-demo">
    <SummaryPoster alt="List poster collage" posters={[{}, {}, {}, {}]} />
  </div>
  <div class="poster-demo">
    <MediaTools target={reportTarget} />
  </div>
  <button type="button" onclick={() => { reporting = true; }}>Report Movie</button>
  <ReportDialog bind:open={reporting} target={reportTarget} />
</Specimen>

<Specimen title="Title tags"
  note="The bar above a summary or subpage title, on dark art. The slash splits a show from its season.">
  <div class="title-tags-demo">
    <TitleTags links={[{ title: 'Spider-Man (MCU) Collection', href: '/lists/official/spider-man-mcu-collection' }]}
      credits={{ duringCredits: true, afterCredits: true }} />
    <TitleTags label="Stats" links={[{ title: 'TRON Collection', href: '/lists/official/tron-collection' }]} />
    <TitleTags
      links={[{ title: 'American Horror Story', href: '/shows/american-horror-story' }, { title: 'Season 10' }]} />
    <TitleTags
      links={[{ title: 'Ted Lasso', href: '/shows/ted-lasso' }, { title: 'Season 1', href: '/shows/ted-lasso/seasons/1' }]}
      type={{ text: 'Series Premiere', kind: 'series-premiere' }} credits={{ afterCredits: true }} />
    <TitleTags label="People"
      links={[{ title: 'Ted Lasso', href: '/shows/ted-lasso' }, { title: 'Season 1', href: '/shows/ted-lasso/seasons/1' }]}
      type={{ text: 'Season Finale', kind: 'season-finale' }} />
  </div>
</Specimen>

<Specimen title="Action stack"
  note="Not added, each action is one outlined button with its + inside. Added, it fills and the + splits off, with quieter actions under •••. Every button is the same height.">
  <div class="actions-demo">
    <SummaryAction color="var(--brand-tertiary)" icon={check} text="Add to history">
      {#snippet tiles()}<SummaryActionTile icon={plus} label="Pick a watched date" />{/snippet}
    </SummaryAction>
    <SummaryAction color="var(--brand-tertiary)" icon={check} percent="6%" text="watched" selected>
      {#snippet detail()}13/186 eps &mdash; 25 plays <em>(8h 20m)</em>{/snippet}
      {#snippet tiles()}
        <SummaryActionTile icon={plus} label="Add more plays" />
        <SummaryActionMenu>
          <a href="#history"><Icon svg={historyIcon} fixedWidth />View history</a>
        </SummaryActionMenu>
      {/snippet}
    </SummaryAction>
    <SummaryAction color="var(--brand-quaternary)" icon={collection} percent="95%" text="in library" selected
      detail="177/186 episodes">
      {#snippet tiles()}<SummaryActionTile icon={plus} label="Add to library" />{/snippet}
    </SummaryAction>
    <SummaryAction color="var(--brand-secondary)" icon={listIcon} text="Listed on" detail="Personal lists" selected>
      {#snippet tiles()}<SummaryActionTile icon={plus} label="Manage lists" />{/snippet}
    </SummaryAction>
    <SummaryAction color="var(--brand-seventh)" icon={star} text="Add to favorites" />
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

<Specimen title="Activity" note="Watching now and People You Follow, with one followed member watching live.">
  <ActivityTabs tabs={activity} />
</Specimen>

<Specimen title="Videos"
  note="It opens on the trailers, else the teasers, else All, where each card tags its type in the type's color. A plain click plays a video in the popup. OG had none; v3's Extras row is the model.">
  <VideosRail {videos} href="/shows/demo" />
</Specimen>

<Specimen title="Comments and lists previews"
  note="What loads at the bottom of /movies/fight-club-1999 as it scrolls into view.">
  <CommentsPreview
    tabs={comments}
    item={movie}
    viewer={page.data.user ? { slug: page.data.user.slug } : null}
    count={128}
    href="/movies/heat-1995"
    dateOptions={page.data.datePreferences}
  />
  <p>The comments subnav's Add comment: <AddCommentLink /></p>
  <ListsPreview {lists} count={342} href="/movies/heat-1995" />
</Specimen>

<Specimen title="Related" bleed
  note="Eighteen picks, so More opens a second row and a third. Two share Heat's people.">
  <RelatedItems title="Heat" source={relatedSource} load={() => Promise.resolve(related)} loadPeople={relatedPeople}
    datePreferences={page.data.datePreferences} />
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

.title-tags-demo {
  display: flex;
  flex-direction: column;
  align-items: start;
  padding: var(--gutter);
  background-color: var(--color-summary-demo-art);
}

.actions-demo {
  display: flex;
  flex-direction: column;
  gap: var(--summary-action-stack-gap);
  max-inline-size: var(--watch-date-width); /* about the stack's width on a summary page */
}

.poster-demo {
  inline-size: calc(var(--summary-offset) - var(--gutter));
  margin-block-end: var(--gutter);
}
</style>
