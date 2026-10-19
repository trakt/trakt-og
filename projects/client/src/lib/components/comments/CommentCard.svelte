<!--
  The comment card every comment list renders, in the list row's card: the author's avatar in a column, then the name,
  VIP label and date with tinted tags top right (OP, the author's rating, Review, Spoilers), the text with read more
  and spoiler blur, and a stats bar like a list row's footer: React and the reaction pill, Reply, the plays, then the
  tools at its end, report and block hidden until the card is hovered or focused.

  The replies bar across the card's foot opens the replies on a band under it, on a rail, with the OP's replies on a
  red stretch of it. Reply opens a reply box at the end of the thread, and a posted reply goes to the top of it. The pen swaps the text for an edit form, and the trash can asks
  before deleting. The flag opens the report dialog, and the block icon asks before blocking the member's comments. A
  blocked member's card collapses to its faded name row until clicked, and their replies are dropped from the inline
  thread. Reactions share the viewer's choices and totals.

  On the comment's own page (`read`) it looks the same, as the thread's root: the page lists the replies under it
  (`replies`), open, and "N replies" folds them away. Reply opens the box at the thread's end.
-->
<script lang="ts">
import { page } from '$app/state';
import { fade } from 'svelte/transition';
import { type Snippet, untrack } from 'svelte';
import ReactionControl from '$lib/components/comments/ReactionControl.svelte';
import { commentReactions } from '$lib/components/comments/commentReactions';
import type { reactionOptions } from '$lib/components/comments/reactionOptions';
import Icon from '$lib/icons/Icon.svelte';
import arrowsRotate from '$lib/icons/solid/arrows-rotate.svg?raw';
import eyeSlash from '$lib/icons/solid/eye-slash.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import caretDown from '$lib/icons/solid/caret-down.svg?raw';
import circleCheck from '$lib/icons/solid/circle-check.svg?raw';
import commentSolid from '$lib/icons/solid/comment.svg?raw';
import linkIcon from '$lib/icons/solid/link.svg?raw';
import commentIcon from '$lib/icons/regular/comment.svg?raw';
import userGroup from '$lib/icons/regular/user-group.svg?raw';
import userIcon from '$lib/icons/regular/user.svg?raw';
import replyIcon from '$lib/icons/solid/reply.svg?raw';
import star from '$lib/icons/solid/star.svg?raw';
import checkThick from '$lib/icons/trakt/check-thick.svg?raw';
import flag from '$lib/icons/regular/flag.svg?raw';
import deleteIcon from '$lib/icons/regular/trash-xmark.svg?raw';
import pencil from '$lib/icons/regular/pen.svg?raw';
import userBlock from '$lib/icons/regular/user-xmark.svg?raw';
import type { CommentResponse } from '@trakt/api';
import { overlay } from '../../overlay/overlay.ts';
import type { FormatDateOptions } from '../../utils/formatDate.ts';
import VideoPopup from '../dialog/VideoPopup.svelte';
import GlassAction from '../glass-action/GlassAction.svelte';
import ReadMore from '../readmore/ReadMore.svelte';
import ShareButton from '../share/ShareButton.svelte';
import ReportDialog from '$lib/components/summary/ReportDialog.svelte';
import { toast } from '../toast/toast.svelte.ts';
import Tooltip from '../tooltip/Tooltip.svelte';
import VipLabel from '../labels/VipLabel.svelte';
import { authorOf, PLACEHOLDER_AVATAR } from './authorOf.ts';
import { blockedMembers } from './blockedMembers.svelte.ts';
import { browserCommentsClient } from './browserCommentsClient.ts';
import CommentAvatar from './CommentAvatar.svelte';
import CommentCard from './CommentCard.svelte';
import CommentGif from './CommentGif.svelte';
import CommentComposer from './CommentComposer.svelte';
import { commentDates } from './commentDates.ts';
import { commentSettings } from './commentSettings.ts';
import type { CommentItem } from './CommentItem.ts';
import type { CommentsClient } from './commentsClient.ts';
import CommentTag from './CommentTag.svelte';
import CommentText from './CommentText.svelte';
import { focusComment } from './focusComment.ts';
import { commentType } from './commentType.ts';
import type { CommentViewer } from './CommentViewer.ts';
import type { ViewerSettings } from '../../settings/ViewerSettings.ts';
import ManageConfirm from '$lib/components/comments/ManageConfirm.svelte';
import { manageLinks } from './manageLinks.ts';
import ReactionSummary from './ReactionSummary.svelte';
import { gifQueryOf } from './gif/gifQueryOf.ts';
import { memberRelation } from './memberRelation.ts';
import { reactionSummary } from './reactionSummary.ts';
import { spoilerRevealed } from './spoilerRevealed.ts';
import { parseComment } from './text/parseComment.ts';
import { watchedIndicator } from './watchedIndicator.ts';
import { withoutBlocked } from './withoutBlocked.ts';

interface Props {
  comment: CommentResponse;
  /** What it's about. Left out, there's no watched state, no spoiler reveal and no share title. */
  item?: CommentItem;
  viewer?: CommentViewer;
  /** The comment a reply answers, shown collapsed above the text where replies appear outside their thread. */
  parent?: CommentResponse;
  /** OG's `.wider`, for a card across the page's full width. */
  wide?: boolean;
  /** OG's featured style for reviews in comment lists. */
  featured?: boolean;
  /** The item and season or episode title above the text, where a list mixes items. */
  titles?: { readonly item: string; readonly episode?: string };
  /** The under-comment row is left out, like replies next to a poster. */
  hideInteractions?: boolean;
  /** The member's date order, clock and time zone. The time zone keeps the server and browser dates the same. */
  dateOptions?: Pick<FormatDateOptions, 'order' | 'hour24' | 'timeZone'>;
  client?: CommentsClient;
  /** Inline under the comment it replies to. */
  nested?: boolean;
  /** The replied-to author, for the OP pill. */
  opSlug?: string;
  /** Replies under a spoiler comment are blurred too. */
  inheritSpoiler?: boolean;
  /** Collapsed inside a reply as its parent, until clicked. */
  asParent?: boolean;
  /** The comment on its own page (OG's `#read`): the thread's root, scaled up, with the reply box at the thread's end. */
  read?: boolean;
  /** On the comment's own page, the replies the page lists, on the card's rail above the reply box. */
  replies?: Snippet;
  /**
   * Discover's Recent Comments (OG's `#recent-comments .comment-outer-wrapper`): no bubble over the column's veil, the
   * text in full, and the avatar and name row pinned to the bottom of the nearest positioned ancestor.
   */
  veiled?: boolean;
  /** Takes a posted reply where the page lists the thread itself. Left out, it goes into the card's inline thread. */
  onreply?: (reply: CommentResponse) => void;
  /** After the comment is deleted. */
  ondelete?: () => void;
}

const {
  comment: loaded,
  item,
  viewer = null,
  parent,
  wide = false,
  featured = false,
  titles,
  hideInteractions = false,
  dateOptions = { timeZone: 'UTC' },
  client,
  nested = false,
  opSlug,
  inheritSpoiler = false,
  asParent = false,
  read = false,
  replies: pageReplies,
  veiled = false,
  onreply,
  ondelete,
}: Props = $props();

// Edits, and a reply's count going up, land here.
let comment = $derived(loaded);
// The root layout's `/users/settings`: whether the viewer may comment, and their avatar for the reply box.
const settings: ViewerSettings | null = $derived(page.data.settings ?? null);
// The comment spoiler setting and the blocked members.
const prefs = $derived(commentSettings(settings));
const member = $derived(
  viewer && { ...viewer, commentingBanned: viewer.commentingBanned ?? settings?.permissions.commenting === false },
);

const author = $derived(authorOf(comment.user));
const type = $derived(commentType(comment, item));
const dates = $derived(commentDates({ createdAt: comment.created_at, updatedAt: comment.updated_at }, dateOptions));
const blocks = $derived(parseComment(comment.comment));
const manage = $derived(manageLinks({ comment, viewer: member }));
const isReply = $derived(comment.parent_id > 0);
// A thread's root: every comment but a reply in its thread, a reply's parent and Discover's veiled columns.
const standalone = $derived(!nested && !asParent && !veiled);
const isOp = $derived(opSlug !== undefined && author.slug === opSlug);
// The comment a link pointed at (`#comment-ID`), washed blue and tagged, like the comment page's linked reply.
const linked = $derived(page.url.hash === `#comment-${comment.id}`);
// Friend or Following, from the viewer's network; never on their own comments.
const relation = $derived(
  viewer && author.slug !== viewer.slug ? memberRelation(overlay.slices().network, author.slug) : undefined,
);
const rating = $derived(comment.user_stats.rating ?? comment.user_rating);
// Discover's veiled columns keep it on the avatar's corner.
const shownRating = $derived(veiled ? null : rating);
const watched = $derived(
  viewer && author.slug && item ? watchedIndicator({ stats: comment.user_stats, slug: author.slug, item }) : undefined,
);
const permalink = $derived(`/comments/${comment.id}`);
const canReply = $derived(member !== null && !member.commentingBanned && author.href !== undefined);
// Replies go to the top-level comment.
const threadId = $derived(isReply ? comment.parent_id : comment.id);

const viewerState = $derived.by(() => {
  if (!item || item.type === 'list') return {};
  if (item.type === 'season') return overlay.state('season', item.id, { show: item.show, number: item.number });
  if (item.type === 'episode') return overlay.state('episode', item.id, { show: item.show, number: item.season });
  return overlay.state(item.type, item.id);
});
let clicked = $state(false);
const blurred = $derived(
  (comment.spoiler || inheritSpoiler || prefs.hideSpoilers) && !clicked && !spoilerRevealed(item, viewerState),
);

// Blocked before the page loaded, or from a card on it .
const blocked = $derived(prefs.blocked.has(comment.user.ids.trakt) || blockedMembers.has(comment.user.ids.trakt));
let blockedShown = $state(false);
const showBlocked = () => {
  blockedShown = true;
  card?.setAttribute('tabindex', '-1');
  card?.focus({ preventScroll: true });
};

let parentOpen = $state(false);
let video = $state<string>();
const reactions = $derived(commentReactions.state(comment.id));
const summary = $derived(reactionSummary(reactions.summary));
let inView = $state(false);
$effect(() => {
  // A viewer switch clears pending patches, so visible cards load fresh public totals.
  const session = commentReactions.session;
  if (!inView || asParent) return;
  untrack(() => commentReactions.loadSummary(comment.id, comment.likes, (id) => api().reactionSummary(id), session));
});

let card = $state<HTMLElement>();
let repliesOpen = $state(false);
let replies = $state<readonly CommentResponse[]>();
// Posted from this card or its thread, newest first, above the loaded ones.
let posted = $state<readonly CommentResponse[]>([]);
const thread = $derived([
  ...posted,
  ...withoutBlocked(replies ?? [], prefs.blocked).filter(({ id }) => !posted.some((reply) => reply.id === id)),
]);
const repliesId = $props.id();

let replying = $state(false);
// The comment's own page lists its replies open; "N replies" folds them away.
let pageRepliesShown = $state(true);
let editing = $state(false);
// The rail runs down the thread while the replies or the reply box are open, and always on the comment's own page.
const threadOpen = $derived(repliesOpen || replying || (read && pageRepliesShown));
const repliesShown = $derived(read ? pageRepliesShown : repliesOpen);
// The same open or shut: the chevron flips, and aria-expanded says which.
let replyButton = $state<HTMLButtonElement>();
let deleted = $state(false);
let reporting = $state(false);

const api = () => client ?? browserCommentsClient();

// From the picker or the summary's breakdown: the same reaction again takes it back.
const react = (type: typeof reactionOptions[number]['type']) =>
  commentReactions.change({
    id: comment.id,
    type,
    likes: comment.likes,
    read: (id, fresh) => api().reactionSummary(id, fresh),
  });

// A reaction also counts as a like, so a comment without likes has no reactions and needs no request.
const loadSummary = (element: HTMLElement) => {
  if (asParent) return;
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    inView = true;
  }, { rootMargin: '200px' });
  observer.observe(element);
  return () => observer.disconnect();
};

const loadReplies = async () => {
  if (replies) return;
  replies = await api().replies(comment.id).catch(() => {
    toast.error('Doh! We ran into some sort of error.');
    repliesOpen = false;
    return undefined;
  });
};

const toggleReplies = (event: MouseEvent) => {
  event.preventDefault();
  if (comment.replies <= 0) return;
  if (read) {
    pageRepliesShown = !pageRepliesShown;
    return;
  }

  repliesOpen = !repliesOpen;
  if (!repliesOpen) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  card?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  void loadReplies();
};

// A reply posted here or in the thread: on top of the thread, which opens (`create.js.coffee:2-8`).
const addReply = (reply: CommentResponse) => {
  comment = { ...comment, replies: comment.replies + 1 };
  posted = [reply, ...posted];
  repliesOpen = true;
  void loadReplies();
};

// The create response leaves out images unless asked, and the member is the viewer.
const withAvatar = (reply: CommentResponse): CommentResponse =>
  reply.user.images || !settings ? reply : { ...reply, user: { ...reply.user, images: settings.user.images } };

// Cancel takes the focus back to the button that opened the box.
const closeReply = () => {
  replying = false;
  replyButton?.focus();
};

const closeEdit = () => {
  editing = false;
  card?.querySelector<HTMLElement>(':scope > .main > .under-comment .edit')?.focus();
};

const replied = (reply: CommentResponse | null) => {
  replying = false;
  if (!reply) return;
  pageRepliesShown = true;
  (onreply ?? addReply)(withAvatar(reply));
  void focusComment(reply.id);
};

// The saved text and flag; the member, their stats and the reply count stay as loaded.
const edited = (saved: CommentResponse | null, text: string, spoiler: boolean) => {
  editing = false;
  comment = saved
    ? { ...comment, comment: saved.comment, spoiler: saved.spoiler, review: saved.review, updated_at: saved.updated_at }
    : { ...comment, comment: text, spoiler };
  void focusComment(comment.id);
};

// OG fades the card out as the request starts (`comments.js:263-267`) and doesn't say when it fails; og brings it back
// with a toast. Focus moves on to the next card.
const remove = async () => {
  const cards = [...document.querySelectorAll<HTMLElement>('article.comment-wrapper')];
  const next = cards[cards.findIndex((element) => element === card) + 1];
  deleted = true;
  next?.setAttribute('tabindex', '-1');
  next?.focus({ preventScroll: true });
  const result = await api().remove(comment.id);
  if (!result.ok) {
    deleted = false;
    toast.error(result.message);
    return;
  }
  ondelete?.();
};

// Then every card by the member on the page collapses (`commentBlockUsers`).
const block = async () => {
  if (!author.slug) return;
  const result = await api().block(author.slug);
  if (!result.ok) {
    toast.error(result.message);
    return;
  }
  toast.success(`You blocked all comments by ${author.name}.`);
  blockedMembers.add(comment.user.ids.trakt);
};

const vanish = (node: Element) =>
  fade(node, { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1000 });
</script>

{#snippet manageIcon(name: string, svg: string, label: string, onclick: () => void, expanded?: boolean)}
  <Tooltip text={label}>
    {#snippet trigger(tooltip)}
      <button type="button" class="manage-icon {name}" aria-label={label} aria-expanded={expanded} {onclick}
        {...tooltip}>
        <Icon {svg} />
      </button>
    {/snippet}
  </Tooltip>
{/snippet}

{#snippet avatar()}
  <CommentAvatar src={author.avatar} rating={veiled ? rating : undefined} small={nested || asParent} />
{/snippet}

<!-- Profile, history and comment hrefs point at og routes that resolve() only takes once they exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if !deleted}
<article
  out:vanish
  bind:this={card}
  id="comment-{comment.id}"
  class={[
    'comment-wrapper',
    {
      wide,
      featured,
      standalone,
      op: isOp,
      linked,
      nested,
      read,
      veiled,
      reply: isReply,
      'has-thread': threadOpen,
      'as-parent': asParent,
      collapsed: asParent && !parentOpen,
      blocked,
      enabled: blocked && blockedShown,
    },
  ]}
  aria-label="{type} by {author.name}"
  {@attach loadSummary}
>
  {#if blocked && !blockedShown}
    <Tooltip text="Display blocked comment">
      {#snippet trigger(tooltip)}
        <button
          type="button"
          class="display-overlay"
          aria-label="Display blocked comment"
          aria-expanded="false"
          onclick={showBlocked}
          {...tooltip}
        ></button>
      {/snippet}
    </Tooltip>
  {:else if asParent && !parentOpen}
    <Tooltip text="Display parent comment">
      {#snippet trigger(tooltip)}
        <button
          type="button"
          class="display-overlay"
          aria-label="Display parent comment"
          aria-expanded="false"
          onclick={() => (parentOpen = true)}
          {...tooltip}
        ></button>
      {/snippet}
    </Tooltip>
  {/if}

  <div class="rail">
    {#if author.href}
      <a class="avatar" href={author.href} tabindex="-1" aria-hidden="true">{@render avatar()}</a>
    {:else}
      <span class="avatar">{@render avatar()}</span>
    {/if}
  </div>

  <div class="main">
    <header class="above-comment">
      <p class="byline">
        {#if author.href}
          <a class="username" href={author.href}>{author.name}</a>
          {#if author.badge}<VipLabel badge={author.badge} quiet />{/if}
        {:else}
          <strong class="username">{author.name}</strong>
        {/if}
      </p>
      <p class="when">
        <a class="date" href={permalink}><time datetime={comment.created_at}>{dates.posted}</time></a>
        {#if dates.updated}
          <span class="updated-at">edited <time datetime={comment.updated_at}>{dates.updated}</time></span>
        {/if}
      </p>
      <p class="tags">
        {#if relation}
          <CommentTag svg={relation === 'friend' ? userGroup : userIcon} tone={relation} tint>
            {relation === 'friend' ? 'Friend' : 'Following'}
          </CommentTag>
        {/if}
        {#if linked}<CommentTag svg={linkIcon} tone="linked" tint>Linked</CommentTag>{/if}
        {#if isOp}<CommentTag svg={commentSolid} tone="op" tint solid>OP</CommentTag>{/if}
        <!-- Watched and rated join into one tag, a segment each. -->
        {#if watched || shownRating}
          <span class={['joined', { both: watched && shownRating }]}>
            {#if watched}
              <span class="segment watched-segment">
                <Tooltip text={watched.title}>
                  {#snippet trigger(tooltip)}
                    <a class="watched-at" href={watched.href} target="_blank" {...tooltip}>
                      <CommentTag svg={watched.complete ? circleCheck : checkThick} glyph={!watched.complete}
                        tone="watched" tint solid={watched.complete}>{watched.count} {watched.label}</CommentTag>
                    </a>
                  {/snippet}
                </Tooltip>
              </span>
            {/if}
            {#if shownRating}
              <span class="segment rated-segment">
                <CommentTag svg={heart} tone="rated" tint><span class="visually-hidden">Rated </span>{shownRating}</CommentTag>
              </span>
            {/if}
          </span>
        {/if}
        {#if type === 'Review'}<CommentTag svg={star} tone="review" tint>Review</CommentTag>{/if}
        {#if comment.spoiler}<CommentTag svg={eyeSlash} tone="spoiler" tint>Spoilers</CommentTag>{/if}
        {#if asParent}<CommentTag tint>Parent</CommentTag>{/if}
        {#if blocked}<CommentTag tint>Blocked</CommentTag>{/if}
      </p>
    </header>

    <div class="comment">
      {#if parent}
        <blockquote class="parent-inline">
          <CommentCard comment={parent} {item} {viewer} {dateOptions} {client} wide asParent />
        </blockquote>
      {/if}
      {#if editing}
        <CommentComposer
          text={comment.comment}
          label="Edit your {isReply ? 'reply' : 'comment'}"
          placeholder={isReply ? 'Write a reply...' : 'What do you think?'}
          submit="Save"
          posting="Saving your {isReply ? 'reply' : 'comment'}"
          spoiler={isReply ? undefined : comment.spoiler}
          minWords={comment.review ? 0 : undefined}
          oncancel={closeEdit}
          save={(text, spoiler) => api().edit(comment.id, { comment: text, spoiler })}
          onsaved={edited}
        />
      {:else}
        {#snippet gif()}{#if comment.gif}<CommentGif gif={comment.gif} />{/if}{/snippet}
        <div class="bubble">
          {#if titles}
            <p class="item-title">{titles.item}</p>
            {#if titles.episode}<p class="episode-title">{titles.episode}</p>{/if}
          {/if}
          {#if blurred}
            <!-- The text blurred under a Reveal Spoilers button, centred over it. -->
            <div class="spoiler">
              <div class="blur" aria-hidden="true" inert>
                <ReadMore><CommentText {blocks} />{@render gif()}</ReadMore>
              </div>
              <div class="reveal">
                <GlassAction card glass icon={eyeSlash} onclick={() => (clicked = true)}>Reveal Spoilers</GlassAction>
              </div>
            </div>
          {:else}
            <ReadMore><CommentText {blocks} onvideo={(id) => (video = id)} />{@render gif()}</ReadMore>
          {/if}
        </div>
      {/if}
    </div>

    <!-- The stats bar, like a list row's footer: React and the reactions, Reply, the plays, then the tools. -->
    <footer class="under-comment">
      {#if !hideInteractions}
        {#if viewer}
          <ReactionControl
            value={reactions.reaction}
            busy={reactions.busy}
            onopen={() => commentReactions.ready()}
            onselect={react}
          />
        {/if}
        {#if summary}
          <ReactionSummary
            {summary}
            mine={reactions.reaction}
            busy={reactions.busy}
            onready={viewer ? () => commentReactions.ready() : undefined}
            onselect={viewer ? react : undefined}
          />
        {/if}
        {#if canReply}
          <button
            bind:this={replyButton}
            type="button"
            class="add-reply"
            aria-expanded={replying}
            onclick={() => (replying ? closeReply() : (replying = true))}
          >
            <GlassAction presentational card glass icon={replyIcon} iconColor="var(--color-comment-reply-icon)">
              Reply
            </GlassAction>
          </button>
        {/if}
        <!-- The replies load when opened; the comment's own page lists them open. -->
        {#if !isReply && comment.replies > 0}
          <a
            class="comment-count"
            href={permalink}
            aria-expanded={repliesShown}
            aria-controls={repliesId}
            onclick={toggleReplies}
          >
            <Icon svg={commentIcon} /><span><strong>{comment.replies.toLocaleString('en-US')}</strong>
              {comment.replies === 1 ? 'reply' : 'replies'}</span><span class="chevron"><Icon svg={caretDown} /></span>
          </a>
        {/if}
      {/if}

      <div class="tools">
        {#if manage.block && author.slug && !blocked}
          <ManageConfirm name="block" svg={userBlock} label="Block Member" yes="Yes, block them!"
            onconfirm={block}>
            Block all comments from <b>{author.name}</b>?
          </ManageConfirm>
        {/if}
        {#if manage.report}
          {@render manageIcon('report', flag, 'Report Comment', () => (reporting = true), reporting)}
        {/if}
        {#if manage.edit && !asParent}
          {@render manageIcon('edit', pencil, 'Edit', () => (editing ? closeEdit() : (editing = true)), editing)}
        {/if}
        {#if manage.delete && !asParent}
          <ManageConfirm name="delete" svg={deleteIcon} label="Delete" yes="Yes, delete it!"
            onconfirm={remove}>
            Delete your comment?
          </ManageConfirm>
        {/if}
        <ShareButton url={new URL(permalink, page.url.origin).href} title={item?.title} large={false} />
      </div>
    </footer>
  </div>

  {#if threadOpen}
    <div class="thread" id={repliesId}>
      {#if repliesOpen}
        {#each thread as reply (reply.id)}
          <CommentCard
            comment={reply}
            {item}
            {viewer}
            {dateOptions}
            {client}
            nested
            opSlug={author.slug}
            inheritSpoiler={comment.spoiler || inheritSpoiler}
            onreply={addReply}
          />
        {/each}
        {#if !replies}
          <p class="loading" role="status"><Icon svg={arrowsRotate} /> <span class="text">Loading replies</span></p>
        {/if}
      {/if}
      {#if read && pageRepliesShown}{@render pageReplies?.()}{/if}
      {#if replying}
        <CommentComposer
          text="@{author.slug}  "
          label="Your reply"
          placeholder="Reply to {author.name}..."
          submit="Reply"
          posting="Posting your reply"
          avatar={settings?.user.images.avatar.full ?? PLACEHOLDER_AVATAR}
          small
          oncancel={closeReply}
          gifs={page.data.gifs}
          gifQuery={gifQueryOf(item)}
          save={(text, _spoiler, gif) => api().reply(threadId, text, gif)}
          onsaved={replied}
        />
      {/if}
    </div>
  {/if}
</article>
{/if}

{#if video}
  <VideoPopup bind:url={video} />
{/if}

{#if reporting}
  <ReportDialog bind:open={reporting} target={{ type: 'comment', id: comment.id, title: '', href: permalink }} />
{/if}

<style>
/*
  Two columns: the avatar, and everything else. `--avatar`, `--gap` and `--bubble` are the card's own, so a reply in
  the thread (smaller) or a featured review (darker bubble) only swaps them.
*/
.comment-wrapper {
  --avatar: var(--comment-avatar);
  --gap: var(--comment-column-gap);
  --bubble: var(--color-comment-bg);
  position: relative;
  display: grid;
  grid-template-columns: var(--avatar) minmax(0, 1fr);
  column-gap: var(--gap);
  scroll-margin-block-start: calc(var(--header-height) + var(--gutter));
  transition: opacity var(--transition-comment-fade);
}

.nested,
.as-parent {
  --avatar: var(--comment-avatar-nested);
  --gap: var(--comment-column-gap-nested);
}

.featured {
  --bubble: var(--color-comment-featured-bg);
}

/* The rail a reply's own box hangs off, from under the avatar to the card's end. */
.has-thread:not(.standalone)::before {
  content: '';
  position: absolute;
  inset-block: calc(var(--avatar) + var(--comment-rail-gap)) 0;
  inset-inline-start: calc((var(--avatar) - var(--comment-rail-width)) / 2);
  inline-size: var(--comment-rail-width);
  background-color: var(--color-comment-rail);
}

/* The OP's reply takes the OP tag's red on its stretch of the rail, and a matching ring. */
.nested.op::after {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: calc((var(--avatar) - var(--comment-rail-width)) / 2 + var(--linked-pad, 0px));
  inline-size: var(--comment-rail-width);
  background-color: var(--color-comment-rail-op);
}

.nested.op > .rail :global(.user-avatar) {
  --ring: var(--color-comment-rail-op);
}

/* The linked comment: a blue wash reaching a little past its edges, so its content stays where it was. */
.linked {
  --linked-pad: var(--comment-linked-padding);
  margin: calc(-1 * var(--linked-pad));
  padding: var(--linked-pad);
  border-radius: var(--radius-comment-linked);
  background-color: var(--color-comment-linked);
}

.rail {
  position: relative;
  z-index: 1;
}

.avatar {
  display: block;
}

.main {
  min-inline-size: 0;
  padding-block-end: var(--comment-main-padding-end);
}

/*
  The name and VIP label, then the date, centred against the avatar, and the tags across from them at the top right,
  like a list row's chips.
*/
.above-comment {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-content: center;
  gap: var(--comment-head-line-gap) var(--comment-head-gap-inline);
  min-block-size: var(--avatar);
}

.byline,
.when {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  min-inline-size: 0;
  margin: 0;
  line-height: var(--line-height-headings);
}

.byline {
  gap: var(--comment-head-gap);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-self: start;
  gap: var(--comment-tags-gap);
  grid-area: 1 / 2 / span 2;
  margin: 0;

  &:empty {
    display: none;
  }
}

/* Watched and rated as one tag: the segments meet on a shared edge. */
.joined {
  display: inline-flex;
}

.segment {
  display: inline-flex;
}

.both > .watched-segment :global(.tag) {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}

.both > .rated-segment {
  margin-inline-start: -1px;

  & :global(.tag) {
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  }
}

.username {
  color: var(--color-comment-name);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
  text-decoration: none;

  &:is(a):hover {
    color: var(--color-link);
  }
}

/* The date, then "edited", after a middle dot screen readers skip. */
.when {
  grid-column: 1;
  color: var(--color-comment-muted);
  font-size: var(--font-size-comment-meta);

  & > * + *::before {
    content: '·' / '';
    margin-inline: var(--comment-meta-separator-gap);
    color: var(--color-comment-faint);
    font-style: normal;
  }
}

.date {
  color: inherit;
  text-decoration: none;

  &:hover {
    color: var(--color-text);
    text-decoration: underline;
  }
}

.updated-at {
  font-style: italic;
  white-space: nowrap;
}

/* The tools at the stats bar's end, each in a rounded box that fills on hover, like a list row's. */
.tools {
  display: flex;
  align-items: center;
  gap: var(--comment-tools-gap);
  margin-inline-start: auto;
}

/* Report and block stay out of the way until the card is hovered or has the focus. Touch screens always show them. */
.tools > .manage-icon.report,
.tools > :global(.confirm.block) {
  opacity: 0;
  transition: opacity var(--transition-comment-quiet);

  @media (hover: none) {
    opacity: 1;
  }
}

.comment-wrapper:is(:hover, :focus-within) > .main > .under-comment > .tools > .manage-icon.report,
.comment-wrapper:is(:hover, :focus-within) > .main > .under-comment > .tools > :global(.confirm.block) {
  opacity: 1;
}

.tools > .manage-icon,
.tools :global(.share),
.tools :global(.confirm > button) {
  display: inline-grid;
  place-items: center;
  inline-size: var(--comment-tool-size);
  block-size: var(--comment-tool-size);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-comment-tool);
  background: none;
  color: var(--color-comment-muted);
  font-size: var(--font-size-comment-tool);
  line-height: 1;
  vertical-align: middle;
  transition: background-color var(--transition-comment-quiet), color var(--transition-comment-quiet);

  &:hover {
    background-color: var(--color-comment-chip);
    color: var(--color-text);
  }
}

/* Share, edit and delete carry their colors, like everywhere else they appear; report and block stay gray. */
.tools :global(.share) {
  color: var(--color-action-share);
}

.tools > .manage-icon.edit {
  color: var(--color-comment-edit);
}

.tools :global(.confirm.delete > button) {
  color: var(--color-comment-delete);
}

.bubble {
  --read-more-shade: var(--bubble);
  margin-block-start: var(--comment-bubble-gap);
  padding: var(--comment-bubble-padding);
  border: 1px solid var(--color-comment-bubble-border);
  border-radius: var(--radius-comment-bubble-round);
  background-color: var(--bubble);
  overflow-wrap: break-word;
}

/*
  A reply's header is as tall as its smaller avatar, so its bubble drops by half the difference to sit as far under the
  date as a comment's does.
*/
.nested > .main > .comment > .bubble {
  margin-block-start: calc(var(--comment-bubble-gap) + (var(--comment-avatar) - var(--avatar)) / 2);
  padding: var(--comment-bubble-padding-nested);
}

.comment > :global(.composer) {
  margin-block-start: var(--comment-bubble-gap);
}

.item-title,
.episode-title {
  margin: 0 0 var(--space-lg-block);
  border-block-end: 1px solid var(--color-comment-rule);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-headings);
  font-size: 120%;
}

.episode-title {
  font-size: 110%;
}

/*
  The blurred text and Reveal Spoilers share one cell, both centred, and the cell is at least the button's height and
  some, so a one-line spoiler doesn't push the button past the bubble's edge.
*/
.spoiler {
  display: grid;
  align-items: center;
  min-block-size: calc(var(--control-height) + 2 * var(--comment-spoiler-room));
}

.spoiler > * {
  grid-area: 1 / 1;
}

.reveal {
  display: grid;
  place-items: center;
}

.blur {
  filter: var(--blur-spoiler-text);
  pointer-events: none;
}

/*
  The stats bar: the React button and the reaction pill, Reply, the plays, and the tools at its end. Discover's veiled
  columns keep the quiet text actions.
*/
.under-comment {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--comment-stats-gap);
  padding-block-start: var(--comment-stats-space);
  color: var(--color-comment-muted);
  font-family: var(--font-headings);
  font-size: var(--font-size-comment-meta);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-base);

  /* Signed out, a comment without replies has no actions. */
  &:not(:has(*)) {
    display: none;
  }
}

.add-reply {
  display: inline-flex;
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;

  & :global(.icon) {
    font-size: var(--font-size-comment-reply-icon);
  }
}

/* The author's plays, as a tag that links to their history. */
.watched-at {
  display: inline-flex;
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }
}

/* "12 replies" beside Reply, as the page's outlined control, like View seasons: open, it stays lit. */
.comment-count {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--glass-action-gap-card);
  block-size: var(--control-height);
  padding-inline: var(--glass-action-padding-card);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font-family: var(--font-body);
  font-size: var(--font-size-glass-action);
  font-weight: var(--font-weight-glass-action-card);
  text-decoration: none;
  white-space: nowrap;
  transition: background-color var(--transition-comment-quiet), border-color var(--transition-comment-quiet);

  & > :global(.icon) {
    color: var(--color-comment-reply-icon);
    font-size: var(--font-size-comment-replies-icon);
  }

  & strong {
    font-weight: var(--font-weight-headings-heavy);
    font-variant-numeric: tabular-nums;
  }

  &:is(:hover, :focus-visible, [aria-expanded='true']) {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-hover-bg);
    color: var(--color-control-text);
    text-decoration: none;
  }
}

.chevron {
  display: inline-flex;
  font-size: var(--font-size-comment-replies-caret);
  transition: rotate var(--transition-comment-quiet);

  [aria-expanded='true'] > & {
    rotate: var(--comment-replies-chevron-turn);
  }
}

.thread {
  display: grid;
  gap: var(--comment-thread-gap);
  grid-column: 2;
  padding-block-start: var(--comment-thread-gap);
}

/* The replies under the comment's text, on one rail through their avatars. */
.standalone > .thread {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset-block: var(--comment-thread-gap) var(--comment-thread-gap);
    inset-inline-start: calc((var(--comment-avatar-nested) - var(--comment-rail-width)) / 2);
    inline-size: var(--comment-rail-width);
    background-color: var(--color-comment-rail);
  }
}

.loading {
  margin: 0;
  color: var(--color-comment-muted);
  font-size: var(--font-size-comment-meta);
  font-weight: var(--font-weight-headings);

  & :global(.icon) {
    margin-inline-end: var(--comment-action-icon-gap);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .loading :global(.icon) {
    animation: spin 2s linear infinite;
  }
}

@media (prefers-reduced-motion: reduce) {
  .comment-wrapper,
  .tools,
  .chevron {
    transition: none;
  }
}

@keyframes spin {
  to {
    rotate: 360deg;
  }
}

/*
  Discover's Recent Comments: the text in full over the column's veil, and the avatar and the name row pinned to the
  bottom of the column. OG swapped the comment in after read more had run, so its text never collapsed.
*/
.veiled {
  --comment-collapsed-height: none;
  --comment-quote-bg: var(--color-recent-comments-quote-bg);
  --comment-pre-bg: var(--color-recent-comments-quote-bg);
  --bubble: transparent;
  position: static;
  display: block;

  & > .rail {
    position: absolute;
    inset-block-end: var(--comment-padding);
    inset-inline-start: var(--comment-padding);
    z-index: 1;
  }

  & > .main > .above-comment {
    position: absolute;
    inset-block-end: 0;
    inset-inline: 0;
    min-block-size: calc(var(--avatar) + 2 * var(--comment-padding));
    padding: var(--comment-padding);
    padding-inline-start: calc(var(--comment-padding) + var(--avatar) + var(--gap));
    /* Clear of the share button pinned at its end. */
    padding-inline-end: calc(var(--comment-padding) + var(--comment-tool-size) + var(--comment-head-gap-inline));
    background-color: var(--color-recent-comments-author-bg);
  }

  & > .main > .above-comment > .tags {
    align-self: center;
  }

  & .bubble {
    margin: 0;
    padding: var(--recent-comments-comment-padding);
    border-radius: 0;

    @media (width < 768px) {
      padding: var(--recent-comments-comment-padding-phone);
    }
  }

  /* Only the share button, at the end of the name row. */
  & > .main > .under-comment {
    position: absolute;
    inset-block-end: calc(var(--comment-padding) + (var(--avatar) - var(--comment-tool-size)) / 2);
    inset-inline-end: var(--comment-padding);
    z-index: 1;
    padding: 0;
  }
}

/* The parent comment of a reply shown out of its thread: faded to its name row until clicked. */
.parent-inline {
  margin: var(--comment-bubble-gap) 0 0;
  padding: var(--comment-parent-padding);
  border-inline-start: var(--comment-parent-border) solid var(--color-comment-quote-border);
  border-radius: var(--radius-comment-parent);
  background-color: var(--color-comment-parent-bg);
}

.as-parent {
  --comment-quote-bg: var(--color-comment-parent-quote-bg);
}

.as-parent.collapsed {
  opacity: var(--opacity-comment-parent);

  & > .main > :is(.comment, .under-comment) {
    display: none;
  }
}

.display-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  cursor: row-resize;
}

/* A blocked member's card: its name row faded, until clicked. */
.comment-wrapper.blocked:not(.enabled) {
  opacity: var(--opacity-comment-blocked);

  & > .main > :is(.comment, .under-comment),
  & > .thread {
    display: none;
  }

  &:hover {
    opacity: var(--opacity-comment-blocked-hover);
  }
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
