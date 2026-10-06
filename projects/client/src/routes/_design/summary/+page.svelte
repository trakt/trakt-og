<!-- The summary pages' lazy sections with made-up data: People You Follow, the comments and lists previews, related. -->
<script lang="ts">
import { page } from '$app/state';
import MediaTools from '$lib/components/summary/MediaTools.svelte';
import ReportDialog from '$lib/components/summary/ReportDialog.svelte';
import SummaryPoster from '$lib/components/summary/SummaryPoster.svelte';
import Container from '$lib/components/container/Container.svelte';
import ActivityTabs from '$lib/components/summary/ActivityTabs.svelte';
import CommentsPreview from '$lib/components/summary/CommentsPreview.svelte';
import AddCommentLink from '$lib/components/comments/AddCommentLink.svelte';
import { newComment } from '$lib/components/comments/newComment.svelte';
import ListsPreview from '$lib/components/summary/ListsPreview.svelte';
import RelatedItems from '$lib/components/summary/RelatedItems.svelte';
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
import type { CommentTab, ListTab } from '$lib/summary/sectionsClient';
import { type ActivityTab, toActivity } from '$lib/summary/toActivity';
import type { RelatedCard } from '$lib/summary/toRelatedCard';
import { formatting, movie, review, spoiler } from '../comments/fixtures.ts';

// Shows the Add comment buttons, as for a signed-in viewer; the page has no form for them to open.
$effect(() => newComment.mount());
let reporting = $state(false);
const reportTarget = {
  type: 'movie' as const,
  id: 1,
  title: 'Fight Club (1999)',
  href: '/movies/fight-club-1999',
  tmdb: 'https://www.themoviedb.org/movie/550',
};

const AVATAR = 'https://media.trakt.tv/hotlink-ok/placeholders/medium/zoidberg.png';
const watcher = (i: number) => ({
  username: `member_${i}`,
  private: i === 7,
  deleted: false,
  ids: { trakt: i, slug: `member_${i}` },
  images: { avatar: { full: AVATAR } },
});
// Thirty watching now, three of them followed; sixteen followed members with plays, a few with ratings.
const activity: readonly ActivityTab[] = toActivity({
  watching: Array.from({ length: 30 }, (_, i) => watcher(i)),
  following: new Set(['member_2', 'member_5', 'member_11']),
  social: Array.from({ length: 16 }, (_, i) => ({
    user: watcher(i + 40),
    watched: {
      plays: Math.max(1, Math.round(60 / (1 + i * 0.6))),
      rating: i % 2 === 0 ? { rating: [10, 10, 9, 9, 10, 8, 7, 9][i / 2] ?? 9 } : null,
    },
  })),
});

const comments: readonly CommentTab[] = [
  { id: 'likes', label: 'Likes', count: 'All Time', comments: [review, formatting] },
  { id: 'recent', label: 'Recent', comments: [spoiler] },
];

const list = (id: number, name: string, extra: Partial<ListTab['lists'][number]> = {}) => ({
  id,
  kind: 'personal' as const,
  href: `/users/og_tester/lists/${id}`,
  name,
  owner: { slug: 'og_tester', name: 'OG Tester', href: '/users/og_tester', avatar: AVATAR },
  posters: [{}, {}, {}, {}, {}],
  itemCount: 24,
  likeCount: 12,
  commentCount: 2,
  pills: [],
  description: 'Crews, vaults and one last job.',
  ...extra,
});
const lists: readonly ListTab[] = [
  {
    id: 'popular',
    label: 'Popular',
    lists: [
      list(1, 'Heat Collection', {
        kind: 'official',
        href: '/lists/official/heat-collection',
        pills: ['Official List'],
        commentCount: undefined,
      }),
      list(2, 'Heist Night'),
    ],
  },
  { id: 'me', label: 'Me', lists: [list(3, 'Rewatch Soon', { pills: ['Private'], likeCount: 0 })] },
];

const related: readonly RelatedCard[] = Array.from({ length: 6 }, (_, i) => ({
  type: 'movie',
  id: 900 + i,
  href: '/movies/heat-1995',
  title: `Related Movie ${i + 1}`,
  year: 1990 + i,
  released: true,
  rating: 8 - i / 2,
}));
</script>

<section>
  <Container>
    <div class="list-cover-demo">
      <SummaryPoster alt="List poster collage" posters={[{}, {}, {}, {}]} />
    </div>
    <div class="tools-demo">
      <MediaTools target={reportTarget} updatedAt="2026-09-29T12:00:00Z" datasource="TMDB" />
    </div>
    <button type="button" onclick={() => { reporting = true; }}>Report Movie</button>
    <ReportDialog bind:open={reporting} target={reportTarget} />
    <h2>Action stack</h2>
    <p>
      Not added, each action is one outlined button with its + inside. Added, it fills and the + splits off, with
      quieter actions under •••. Every button is the same height.
    </p>
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
    <h1>Summary sections</h1>
    <p>
    What loads under a movie or show summary as it scrolls into view. Local OG: the bottom of
    <code>/movies/fight-club-1999</code>.
  </p>
    <ActivityTabs tabs={activity} />
    <CommentsPreview
      tabs={comments}
      item={movie}
      viewer={page.data.user ? { slug: page.data.user.slug } : null}
      count={128}
      href="/movies/heat-1995"
      dateOptions={page.data.datePreferences}
    />
    <p>The comments subnav's Add comment: <AddCommentLink /></p>
    <ListsPreview tabs={lists} count={342} href="/movies/heat-1995" />
  </Container>
</section>
<RelatedItems title="Heat" load={() => Promise.resolve(related)} datePreferences={page.data.datePreferences} />

<style>
.actions-demo {
  display: flex;
  flex-direction: column;
  gap: var(--summary-action-stack-gap);
  max-inline-size: var(--watch-date-width); /* about the stack's width on a summary page */
  margin-block: var(--gutter);
}

.tools-demo {
  inline-size: calc(var(--summary-offset) - var(--gutter));
  margin-block: var(--gutter);
}

.list-cover-demo {
  inline-size: calc(var(--summary-offset) - var(--gutter));
  margin-block: var(--gutter);
}
</style>
