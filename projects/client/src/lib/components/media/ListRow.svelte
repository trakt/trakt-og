<!--
  A list row as one card: a stack of the list's first five posters on the left, then the owner's avatar beside the
  list name, the privacy and collaborator pills and the owner with their VIP label. The description sits under that,
  rendered like a comment and clamped with a read-more shade, or the first titles when there's none and they're known.
  A footer holds the counts on the left and the viewer's icons on the right. Hovering the stack opens up the poster
  under the pointer; short lists stretch their posters to fill it.
-->
<script lang="ts">
import ReportDialog from '$lib/components/summary/ReportDialog.svelte';
import ListLikeButton from '$lib/components/lists/ListLikeButton.svelte';
import type { Snippet } from 'svelte';
import CommentText from '$lib/components/comments/CommentText.svelte';
import { parseComment } from '$lib/components/comments/text/parseComment';
import VipLabel from '$lib/components/labels/VipLabel.svelte';
import ReadMore from '$lib/components/readmore/ReadMore.svelte';
import ShareButton from '$lib/components/share/ShareButton.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import userXmark from '$lib/icons/regular/user-xmark.svg?raw';
import barsProgress from '$lib/icons/regular/bars-progress.svg?raw';
import comment from '$lib/icons/regular/comment.svg?raw';
import ManageConfirm from '$lib/components/comments/ManageConfirm.svelte';
import deleteIcon from '$lib/icons/regular/trash-can.svg?raw';
import document from '$lib/icons/regular/file.svg?raw';
import flag from '$lib/icons/regular/flag.svg?raw';
import pencil from '$lib/icons/regular/pen.svg?raw';
import voteYes from '$lib/icons/regular/thumbs-up.svg?raw';
import type { VipBadge } from '$lib/users/VipBadge';
import type { ListRowActions } from './ListRowActions.ts';
import RankPill from './RankPill.svelte';
import { externalLink } from '$lib/externalLink';

type Owner = { name: string; href: string; avatar?: string; vip?: VipBadge | null };

interface Props {
  href: string;
  name: string;
  owner: Owner;
  /** The list's first items, in list order. Only five show. The title is the poster's tooltip, where it's known. */
  posters: readonly { title?: string; image?: string }[];
  itemCount: number;
  /** Left out for the watchlist and favorites, which can't be liked. */
  likeCount?: number;
  likeTarget?: { readonly id: number; readonly ownerSlug?: string; readonly viewer: string | null };
  /** Left out when comments are off. */
  commentCount?: number;
  /** Grey pills before the owner: "Private", "Official List", "Following". */
  pills?: readonly string[];
  /** The blue "Link" pill after "Private", on a list shared by link. */
  shareLink?: boolean;
  /** Approved collaborators' names: the orange "N collaborators" pill, with the names in its tooltip. */
  collaborators?: readonly string[];
  /** Markdown, like a comment. */
  description?: string;
  /** Position on a ranked page, shown as a pill over the posters on hover. */
  rank?: number;
  /** The viewer's icons. Left out, the row shows only the counts. */
  actions?: ListRowActions;
  /** Reorder controls over the poster stack, including its editable rank. */
  reorderControls?: Snippet;
}

const {
  href,
  name,
  owner,
  posters,
  itemCount,
  likeCount,
  likeTarget,
  commentCount,
  pills = [],
  shareLink = false,
  collaborators = [],
  description,
  rank,
  actions,
  reorderControls,
}: Props = $props();

let reportOpen = $state(false);
const reportScope = $derived(`${likeTarget?.id}:${likeTarget?.viewer}`);
$effect(() => {
  void reportScope;
  reportOpen = false;
});
const shown = $derived(posters.slice(0, 5));
const blocks = $derived(parseComment(description?.trim() ?? ''));
const plural = (count: number, word: string) => `${word}${count === 1 ? '' : 's'}`;
const titles = $derived(shown.flatMap(({ title }) => (title ? [title] : [])).slice(0, 3));
const more = $derived(itemCount - titles.length);
</script>

<!-- Hrefs come in as props pointing at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet action(label: string, svg: string, kind: string, target: { onclick?: () => void })}
  <Tooltip text={label}>
    {#snippet trigger(tooltip)}
      <button
        type="button"
        class={['action', kind]}
        aria-label={label}
        aria-disabled={target.onclick ? undefined : 'true'}
        onclick={() => target.onclick?.()}
        {...tooltip}
      >
        <Icon {svg} />
      </button>
    {/snippet}
  </Tooltip>
{/snippet}

{#snippet count(label: string, svg: string, value: number, word: string)}
  <Tooltip text={label}>
    {#snippet trigger(tooltip)}
      <span class="count-icon" {...tooltip}><Icon {svg} /></span>
    {/snippet}
  </Tooltip><strong>{value.toLocaleString('en-US')}</strong>
  <span class="count-text">{plural(value, word)}</span>
{/snippet}

{#if likeTarget && actions?.report && !actions.report.onclick}<ReportDialog bind:open={reportOpen}
  target={{ type: 'list', id: likeTarget.id, ownerSlug: likeTarget.ownerSlug, title: name, href }} />{/if}

<article class="list-row">
  <div class="posters">
    {#if rank !== undefined && !reorderControls}
      <span class="rank"><RankPill {rank} /></span>
    {/if}
    <!-- The list name link is the one in the tab order; this is the same link for the mouse. -->
    <a class="poster-items" {href} tabindex="-1" aria-hidden="true">
      {#each shown as poster, i (i)}
        <Tooltip text={poster.title}>
          {#snippet trigger(tooltip)}
            <span class="poster-item" {...tooltip}>
              {#if poster.image}
                <img class="poster" src={poster.image} alt="" loading="lazy" decoding="async" />
              {:else}
                <span class="poster"></span>
              {/if}
            </span>
          {/snippet}
        </Tooltip>
      {/each}
    </a>
    {#if reorderControls}{@render reorderControls()}{/if}
  </div>
  <div class="info">
    <header class="above">
      <a class="avatar" href={owner.href} tabindex="-1" aria-hidden="true">
        {#if owner.avatar}<img src={owner.avatar} alt="" />{/if}
      </a>
      <div class="user-name">
        <a class="name-link" {href}><h3>{name}</h3></a>
        <p class="by">
          {#each pills as pill (pill)}<span class="pill">{pill}</span>{/each}
          {#if shareLink}
            <Tooltip text="Anyone with this link can view the list">
              {#snippet trigger(tooltip)}<span class="pill share-link" {...tooltip}>Link</span>{/snippet}
            </Tooltip>
          {/if}
          {#if collaborators.length > 0}
            <Tooltip text={collaborators.join('\n')}>
              {#snippet trigger(tooltip)}
                <span class="pill collaborators" {...tooltip}>
                  <span class="pill-title">{collaborators.length}</span>{plural(collaborators.length, 'collaborator')}
                  <span class="count-text">: {collaborators.join(', ')}</span>
                </span>
              {/snippet}
            </Tooltip>
          {/if}
          by <a class="username" href={owner.href}>{owner.name}</a>{#if owner.vip}<VipLabel badge={owner.vip} pill />{/if}
        </p>
      </div>
    </header>
    {#if blocks.length > 0}
      <div class="overview"><ReadMore><CommentText {blocks} /></ReadMore></div>
    {:else if titles.length > 0}
      <p class="preview">
        Starts with {#each titles as title, i (i)}{#if i > 0}, {/if}<span class="title">{title}</span>{/each}{#if more > 0}
          and {more.toLocaleString('en-US')} more{/if}.
      </p>
    {/if}
    <footer class="below">
      <div class="counts">
        <span class="count">{@render count('Items', document, itemCount, 'item')}</span>
        {#if likeCount !== undefined}
          <span class="count">
            {#if likeTarget}<ListLikeButton {...likeTarget} count={likeCount} words />
            {:else}{@render count('Likes', voteYes, likeCount, 'like')}{/if}
          </span>
        {/if}
        {#if commentCount !== undefined}
          <a class="count" href="{href}/comments">{@render count('Comments', comment, commentCount, 'comment')}</a>
        {/if}
      </div>
      {#if actions}
        <div class="actions">
          {#if actions.report}{@render action('Report List', flag, 'report', actions.report.onclick ? actions.report : { onclick: likeTarget?.viewer ? () => { reportOpen = true; } : undefined })}{/if}
          {#if actions.progress}{@render action('View watched progress', barsProgress, 'progress', actions.progress)}{/if}
          {#if actions.progressHref}
            <Tooltip text="View watched progress">
              {#snippet trigger(tooltip)}
                <a class="action progress" href={actions.progressHref} {...externalLink(actions.progressHref)} aria-label="View watched progress" {...tooltip}>
                  <Icon svg={barsProgress} />
                </a>
              {/snippet}
            </Tooltip>
          {/if}
          {#if actions.shareUrl}<span class="share"><ShareButton url={actions.shareUrl} title={name} /></span>{/if}
          {#if actions.edit}{@render action('Edit', pencil, 'edit', actions.edit)}{/if}
          {#if actions.leave}{@render action('Stop collaborating on this list', userXmark, 'leave', actions.leave)}{/if}
          {#if actions.delete?.onclick}<span class="delete" style:--confirm-icon-size="var(--font-size-list-row-action)"><ManageConfirm name="delete" svg={deleteIcon} label="Delete" yes="Yes, delete it!" warning={actions.delete.warning} disabled={actions.delete.busy} onconfirm={actions.delete.onclick}>Delete this list?</ManageConfirm></span>{:else if actions.delete}{@render action('Delete', deleteIcon, 'delete', actions.delete)}{/if}
        </div>
      {/if}
    </footer>
  </div>
</article>

<style>
/* One card: the stack on the left, the info beside it. Narrower than the stack plus 300px, the info drops under it. */
.list-row {
  display: flex;
  flex-wrap: wrap;
  margin-block-start: var(--gutter);
  background-color: var(--color-list-row-header);
  /* Its own text color, so the card reads on a dark frame too (the search Lists tab). */
  color: var(--color-text);
}

.posters {
  position: relative;
  display: flex;
  flex: none;
  align-self: flex-start;
  inline-size: var(--list-row-stack-width);

  &:hover .rank {
    opacity: 1;
  }
}

/* OG only showed the rank while the pointer is over the posters. */
.rank {
  opacity: 0;
  transition: opacity var(--transition-card);
}

/* Left-aligned stack: the first poster is open, the rest share the width that's left. Hovering one opens it instead. */
.poster-items {
  display: flex;
  flex: 1;
  block-size: var(--list-row-poster-height);
  overflow: hidden;
  background-color: var(--color-card-bg);

  &:hover .poster-item {
    flex: 1 1 0;
  }
}

.poster-item {
  position: relative;
  flex: 1 1 0;
  min-inline-size: 0;
  overflow: hidden;
  box-shadow: var(--shadow-list-poster);
  transition: flex var(--transition-card);

  &:first-child,
  .poster-items &:hover {
    flex: 0 0 var(--list-row-poster-width);
  }

  /* Its shadow only reaches left, where the stack's edge clips it into a stripe. */
  &:first-child {
    box-shadow: none;
  }
}

/* Anchored right, so a closed poster shows its right edge; at least the open width, so a wide one leaves no gap. */
.poster {
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  display: block;
  inline-size: max(var(--list-row-poster-width), 100%);
  max-inline-size: none;
  block-size: 100%;
  background-color: var(--color-card-bg);
  object-fit: cover;
}

span.poster {
  background-image: var(--image-placeholder-poster);
  background-size: cover;
}

.info {
  display: flex;
  flex: 1 1 300px;
  flex-direction: column;
  gap: var(--list-row-footer-gap);
  min-inline-size: 0;
  padding: var(--list-row-padding);
}

.above {
  display: flex;
}

.avatar {
  flex: none;
  inline-size: 40px;
  block-size: 40px;
  border-radius: 50%;
  background-color: var(--color-avatar-border);

  & img {
    display: block;
    inline-size: 100%;
    border: 2px solid var(--color-avatar-border);
    border-radius: 50%;
    background-color: var(--color-avatar-border);
  }
}

.user-name {
  flex: 1;
  min-inline-size: 0;
  padding-inline-start: 12px;
}

.name-link {
  color: var(--color-text);

  &:is(:hover, :focus-visible) {
    color: var(--color-link);
  }
}

h3 {
  margin: 2px 0 0;
  font-weight: var(--font-weight-headings);
  font-size: var(--font-size-h4);
}

.by {
  margin: 2px 0 0;
  font-family: var(--font-headings);
  font-size: var(--font-size-list-row-meta);
}

.username {
  color: var(--color-text);
}

.pill {
  margin-inline-end: 5px;
  padding: 1px 4px;
  border-radius: 2px;
  background-color: var(--color-pill);
  color: var(--color-card-text);
  font-weight: var(--font-weight-headings);
  font-size: var(--font-size-card-tag);
  text-transform: uppercase;
}

.share-link {
  background-color: var(--color-list-pill-link);
}

.collaborators {
  background-color: var(--color-list-pill-collaborators);
}

/* The count at the pill's start, a shade darker. */
.pill-title {
  display: inline-block;
  margin: 0 4px 0 -4px;
  padding: 2px 4px 1px;
  border-radius: 2px 0 0 2px;
  background-color: var(--color-list-pill-collaborators-count);
}

.overview {
  --read-more-shade: var(--color-list-row-header);
}

/* With no description, the first titles fill the space. */
.preview {
  margin: 0;
  color: var(--color-text-muted);

  & .title {
    color: var(--color-text);
  }
}

/* Pinned to the card's foot, so every row's counts and icons line up whatever sits above. */
.below {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--list-row-footer-gap);
  margin-block-start: auto;
  padding-block-start: var(--list-row-footer-gap);
  border-block-start: 1px solid var(--color-list-row-divider);
  font-family: var(--font-headings);
  font-size: var(--font-size-list-row-meta);
  white-space: nowrap;
}

.counts {
  display: flex;
  align-items: center;
  gap: var(--list-row-count-gap);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--list-row-action-gap);
}

.action {
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font-size: var(--font-size-list-row-action);
  line-height: 1;
  transition: opacity 0.5s;

  &[aria-disabled='true'] {
    cursor: default;
  }
}

/* OG faded the flag in while the pointer was over the row. */
.report {
  opacity: 0;

  .list-row:hover &,
  &:focus-visible {
    opacity: 1;
  }
}

.edit {
  color: var(--color-list-edit);
}

.delete,
.leave {
  color: var(--color-list-delete);
}

.leave {
  font-size: var(--font-size-list-row-leave);
}

.progress {
  color: var(--color-list-progress);

  &:is(:hover, :focus-visible) {
    color: var(--color-list-progress);
  }
}

.share {
  color: var(--color-action-share);
}

/* A stat: the icon in blue, the number in white, the word for screen readers. */
.count {
  display: inline-flex;
  align-items: center;
  color: var(--color-stat-noun);
  font-size: var(--font-size-stat-noun);

  & strong {
    color: var(--color-stat-number);
    font-size: var(--font-size-stat-number);
    font-weight: var(--font-weight-headings-heavy);
  }
}

.count-icon {
  display: inline-flex;
  margin-inline-end: var(--space-stat);
  color: var(--color-stat-count);
  font-size: var(--font-size-stat-icon);
  line-height: 1;
}

a.count:is(:hover, :focus-visible) {
  color: var(--color-stat-noun);

  & strong {
    color: var(--color-stat-count);
  }
}

/* OG showed only the numbers on desktop; the words stay for screen readers. */
.count-text {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .rank,
  .poster-item,
  .action {
    transition: none;
  }
}
</style>
