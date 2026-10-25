<script lang="ts">
import type { ReactionType } from '$lib/components/comments/ReactionType';
import { page } from '$app/state';
import CommentCard from '$lib/components/comments/CommentCard.svelte';
import CommentTag from '$lib/components/comments/CommentTag.svelte';
import AddCommentLink from '$lib/components/comments/AddCommentLink.svelte';
import NewCommentForm from '$lib/components/comments/NewCommentForm.svelte';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import ReactionControl from '$lib/components/comments/ReactionControl.svelte';
import type { CommentViewer } from '$lib/components/comments/CommentViewer';
import CommentWithPoster from '$lib/components/comments/CommentWithPoster.svelte';
import DemoChoice from '$lib/design/DemoChoice.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import type { CommentResponse } from '@trakt/api';
import checkThick from '$lib/icons/trakt/check-thick.svg?raw';
import circleCheck from '$lib/icons/solid/circle-check.svg?raw';
import eyeSlash from '$lib/icons/solid/eye-slash.svg?raw';
import commentSolid from '$lib/icons/solid/comment.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import star from '$lib/icons/solid/star.svg?raw';
import userGroup from '$lib/icons/regular/user-group.svg?raw';
import userIcon from '$lib/icons/regular/user.svg?raw';
import {
  client,
  deleted,
  episode,
  formatting,
  gifOnly,
  gifWithText,
  inline,
  movie,
  reply,
  review,
  reviewReplies,
  show,
  spoiler,
  staff,
} from './fixtures.ts';

// Signed out, the signed-in member (from the layout), or the author of every comment here, for edit and delete.
type ViewAs = 'out' | 'member' | 'author';
let viewAs = $state<ViewAs>('member');
const viewers: readonly { value: ViewAs; label: string }[] = [
  { value: 'out', label: 'Signed out' },
  { value: 'member', label: 'Signed-in member' },
  { value: 'author', label: 'The author' },
];
const viewerFor = (comment: CommentResponse): CommentViewer => {
  if (viewAs === 'out') return null;
  if (viewAs === 'author') return { slug: comment.user.ids.slug ?? '' };
  return { slug: page.data.user?.slug ?? 'og_viewer' };
};

let reaction = $state<ReactionType>();
const fanart = 'https://media.trakt.tv/images/shows/000/167/187/fanarts/full/88ea4a00c4.jpg.webp';
</script>

<div class="cards">
  <Specimen title="Viewer"
    note="Who the cards below are shown to. Replying, editing, deleting, blocking and reporting all stay on this page.">
    <DemoChoice label="View as" options={viewers} bind:value={viewAs} />
  </Specimen>

  <Specimen title="Comment tags"
    note="Top right on a comment: Friend or Following, OP on a reply by the thread's author, the author's plays (solid once they've watched every episode) and rating, which join into one tag, Review, Spoilers, then Parent and Blocked.">
    <div class="tag-demo">
      <CommentTag svg={userGroup} tone="friend" tint>Friend</CommentTag>
      <CommentTag svg={userIcon} tone="following" tint>Following</CommentTag>
      <CommentTag svg={commentSolid} tone="op" tint solid>OP</CommentTag>
      <CommentTag svg={checkThick} glyph tone="watched" tint>2 plays</CommentTag>
      <CommentTag svg={checkThick} glyph tone="watched" tint>62% Watched</CommentTag>
      <CommentTag svg={circleCheck} tone="watched" tint solid>100% Watched</CommentTag>
      <CommentTag svg={heart} tone="rated" tint>8</CommentTag>
      <CommentTag svg={star} tone="review" tint>Review</CommentTag>
      <CommentTag svg={eyeSlash} tone="spoiler" tint>Spoilers</CommentTag>
      <CommentTag tint>Parent</CommentTag>
      <CommentTag tint>Blocked</CommentTag>
    </div>
  </Specimen>

  <Specimen title="Reaction picker"
    note="Choose an emoji, replace it, or choose the selected one again to remove it. This one stays on the page.">
    <div class="reaction-demo">
      <ReactionControl value={reaction} onopen={() => Promise.resolve(true)}
        onselect={(type) => (reaction = reaction === type ? undefined : type)} />
    </div>
  </Specimen>

  <Specimen title="New comment form"
    note="A summary's form, for members who may comment: Add comment opens it with the field focused. The meter turns green at 5 words; Cancel asks first when there's text.">
    {#if page.data.settings}
      <p><AddCommentLink /></p>
      <NewCommentForm item={movie} />
    {:else}
      <p>Sign in to see the form. Signed out, the page has no form and no Add comment button.</p>
    {/if}
  </Specimen>

  <Specimen title="Featured review"
    note="A review in a comment list: featured and wide. N replies opens the replies inline on a rail.">
    <CommentCard comment={review} item={movie} viewer={viewerFor(review)} {client}
      dateOptions={page.data.datePreferences} featured wide />
  </Specimen>

  <Specimen title="Formatting" note="Every formatting rule, and an edit more than a day after posting.">
    <CommentCard comment={formatting} item={show} viewer={viewerFor(formatting)} {client}
      dateOptions={page.data.datePreferences} wide />
  </Specimen>

  <Specimen title="Spoilers" note="Click a blurred spoiler to reveal it.">
    <Variant label="Whole comment">
      <CommentCard comment={spoiler} item={episode} viewer={viewerFor(spoiler)} {client}
        dateOptions={page.data.datePreferences} featured wide />
    </Variant>
    <Variant label="Inline spoiler">
      <CommentCard comment={inline} item={episode} viewer={viewerFor(inline)} {client}
        dateOptions={page.data.datePreferences} wide />
    </Variant>
  </Specimen>

  <Specimen title="GIFs">
    <Variant label="On its own">
      <CommentCard comment={gifOnly} item={episode} viewer={viewerFor(gifOnly)} {client}
        dateOptions={page.data.datePreferences} wide />
    </Variant>
    <Variant label="Under text">
      <CommentCard comment={gifWithText} item={episode} viewer={viewerFor(gifWithText)} {client}
        dateOptions={page.data.datePreferences} wide />
    </Variant>
  </Specimen>

  <Specimen title="Staff and deleted members">
    <Variant label="Staff">
      <CommentCard comment={staff} item={episode} viewer={viewerFor(staff)} {client}
        dateOptions={page.data.datePreferences} wide />
    </Variant>
    <Variant label="Deleted member">
      <CommentCard comment={deleted} item={show} viewer={viewerFor(deleted)} {client}
        dateOptions={page.data.datePreferences} wide />
    </Variant>
  </Specimen>

  <Specimen title="Reply with its parent" note="A reply shown out of its thread.">
    <CommentCard comment={reply} item={movie} parent={review} viewer={viewerFor(reply)} {client}
      dateOptions={page.data.datePreferences} wide />
  </Specimen>

  <Specimen title="Thread root"
    note="On its own page: the replies open on one rail under it. N replies folds them away, and Reply opens the box at the end.">
    <CommentCard comment={review} item={movie} viewer={viewerFor(review)} {client}
      dateOptions={page.data.datePreferences} wide read>
      {#snippet replies()}
        <div class="page-replies">
          {#each reviewReplies as answer (answer.id)}
            <CommentCard comment={answer} item={movie} viewer={viewerFor(answer)} {client}
              dateOptions={page.data.datePreferences} opSlug={review.user.ids.slug ?? undefined} nested />
          {/each}
        </div>
      {/snippet}
    </CommentCard>
  </Specimen>

  <Specimen title="Spotlight" bleed
    note="Discover's trending comments: one comment at a time beside its title's poster, the text large under a quote mark.">
    <div class="spotlight">
      <img class="backdrop" src={fanart} alt="" />
      <div class="slide">
        <PosterCard href="/movies/heat-1995" title="Heat" subtitles={['1995']} />
        <div class="quote">
          <CommentCard comment={review} item={movie} viewer={viewerFor(review)} {client}
            dateOptions={page.data.datePreferences} spotlight />
        </div>
      </div>
    </div>
  </Specimen>

  <Specimen title="Beside its poster" note="On a user's comments page.">
    <CommentWithPoster poster={{ href: '/movies/heat-1995', title: movie.title }} inlineTitle={movie.title}>
      <CommentCard comment={review} item={movie} viewer={viewerFor(review)} {client}
        dateOptions={page.data.datePreferences} featured wide />
    </CommentWithPoster>
  </Specimen>
</div>

<style>
.cards {
  display: grid;
  gap: var(--design-stage-gap);
}

/* Space between the comment cards a section stacks. */
.cards :global(.comment-wrapper:not(.nested)) {
  margin-block-end: var(--gutter);
}

.page-replies {
  display: grid;
  gap: var(--comment-thread-gap);
}

.tag-demo {
  display: flex;
  flex-wrap: wrap;
  gap: var(--list-card-chip-gap);
}

.reaction-demo {
  color: var(--color-comment-muted);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  font-size: var(--font-size-comment-meta);
}

/* Discover's trending comments section: the title's fanart under its shade. */
.spotlight {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  color-scheme: dark;
  padding: var(--trending-comments-top) var(--design-canvas-padding) var(--trending-comments-bottom);
  background-color: var(--color-trending-comments-bg);
  color: var(--color-discover-text);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--trending-comments-shade);
  }
}

.backdrop {
  position: absolute;
  inset: 0;
  z-index: -2;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  opacity: var(--opacity-trending-comments-backdrop);
}

.slide {
  display: grid;
  grid-template-columns: var(--trending-comments-poster) minmax(0, 1fr);
  gap: var(--trending-comments-gap);
  align-items: center;
  min-block-size: var(--trending-comments-height);
}

.quote {
  min-inline-size: 0;
}

</style>
