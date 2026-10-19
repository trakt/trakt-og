<!--
  A list row, as one card: a fan of the list's first five posters (empty slots filled in, so every row lines up), then
  the list name with its status chips across from it, the owner with their VIP label, and the description, rendered
  like a comment in as many of two lines as fit. A footer level with the fan's foot closes the card: the Like button
  and the counts, then the viewer's tools. Hovering the fan opens up the poster under
  the pointer. The card sizes itself to where it sits: a smaller fan in a tablet column, the posters whole across the
  top in a narrow one.
-->
<script lang="ts">
import ReportDialog from '$lib/components/summary/ReportDialog.svelte';
import ListLikeButton from '$lib/components/lists/ListLikeButton.svelte';
import type { Snippet } from 'svelte';
import CommentText from '$lib/components/comments/CommentText.svelte';
import { parseComment } from '$lib/components/comments/text/parseComment';
import VipLabel from '$lib/components/labels/VipLabel.svelte';
import ShareButton from '$lib/components/share/ShareButton.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import userXmark from '$lib/icons/regular/user-xmark.svg?raw';
import barsProgress from '$lib/icons/regular/bars-progress.svg?raw';
import comment from '$lib/icons/regular/comment.svg?raw';
import ManageConfirm from '$lib/components/comments/ManageConfirm.svelte';
import deleteIcon from '$lib/icons/regular/trash-xmark.svg?raw';
import document from '$lib/icons/regular/file.svg?raw';
import flag from '$lib/icons/regular/flag.svg?raw';
import listIcon from '$lib/icons/regular/list.svg?raw';
import lock from '$lib/icons/regular/lock.svg?raw';
import pencil from '$lib/icons/regular/pen.svg?raw';
import user from '$lib/icons/regular/user.svg?raw';
import userGroup from '$lib/icons/regular/user-group.svg?raw';
import voteYes from '$lib/icons/regular/thumbs-up.svg?raw';
import link from '$lib/icons/solid/link.svg?raw';
import traktIcon from '$lib/icons/trakt/trakt-v2.svg?raw';
import ogLogo from '$lib/assets/trakt-logo-red.png';
import type { VipBadge } from '$lib/users/VipBadge';
import type { ListKind } from '$lib/lists/toListRow';
import CollaboratorsPanel from '$lib/components/lists/CollaboratorsPanel.svelte';
import type { Collaborator } from '$lib/users/lists/Collaborator';
import type { ListRowActions } from './ListRowActions.ts';
import RankPill from './RankPill.svelte';
import { externalLink } from '$lib/externalLink';

type Owner = { name: string; href: string; avatar?: string; vip?: VipBadge | null };

interface Props {
  /** The watchlist and favorites get a slightly different card, set apart from the user's own lists. */
  kind?: ListKind;
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
  /** Status chips across from the name, after the collaborators: "Private", "Official List", "Following". */
  pills?: readonly string[];
  /** The blue "Link" chip, on a list shared by link. */
  shareLink?: boolean;
  /** Approved collaborators: the orange "N collaborators" chip, which opens the collaborators panel. */
  collaborators?: readonly Collaborator[];
  /** Markdown, like a comment. */
  description?: string;
  /** The viewer's own list, away from their own lists page: a "Me" chip leads. */
  mine?: boolean;
  /** Position on a ranked page, in the glass rank pill over the fan's top edge. */
  rank?: number;
  /** The viewer's icons. Left out, the row shows only the counts. */
  actions?: ListRowActions;
  /** Reorder controls over the poster fan, including its editable rank. */
  reorderControls?: Snippet;
}

const {
  kind = 'personal',
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
  mine = false,
  rank,
  actions,
  reorderControls,
}: Props = $props();

const FAN_SIZE = 5;
const DESCRIPTION_LINES = 2;
const CHIPS: Record<string, { tone: string; svg: string }> = {
  Private: { tone: 'private', svg: lock },
  'Official List': { tone: 'official', svg: traktIcon },
  Following: { tone: 'following', svg: userGroup },
};

let reportOpen = $state(false);
const reportScope = $derived(`${likeTarget?.id}:${likeTarget?.viewer}`);
$effect(() => {
  void reportScope;
  reportOpen = false;
});
// An empty list shows one striped panel; any other fills its missing slots, so every fan has the same width.
// Official lists are Trakt's own, so their owner wears the site's logo.
const avatar = $derived(kind === 'official' ? ogLogo : owner.avatar);
const slots = $derived(itemCount === 0 ? [] : Array.from({ length: FAN_SIZE }, (_, i) => posters.at(i)));
const blocks = $derived(parseComment(description?.trim() ?? ''));
const plural = (count: number, word: string) => `${word}${count === 1 ? '' : 's'}`;

// The description takes the room between the byline and the footer, and shows as many whole lines as fit there.
let lines = $state(DESCRIPTION_LINES);
const fitLines = (element: HTMLElement) => {
  let frame = 0;
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
      if (lineHeight > 0) lines = Math.min(DESCRIPTION_LINES, Math.floor(element.clientHeight / lineHeight));
    });
  });
  observer.observe(element);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  };
};
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

{#snippet chip(text: string, tone: string, svg: string, tip?: string)}
  <Tooltip text={tip}>
    {#snippet trigger(tooltip)}<span class={['chip', tone]} {...tooltip}><Icon {svg} />{text}</span>{/snippet}
  </Tooltip>
{/snippet}

{#if likeTarget && actions?.report && !actions.report.onclick}<ReportDialog bind:open={reportOpen}
  target={{ type: 'list', id: likeTarget.id, ownerSlug: likeTarget.ownerSlug, title: name, href }} />{/if}

<article class="list-row">
  <div class={['card', { 'built-in': kind === 'watchlist' || kind === 'favorites' }]}>
    <div class="fan-frame">
      {#if rank !== undefined && !reorderControls}<span class="rank-anchor"><RankPill {rank} /></span>{/if}
      <!-- The list name link is the one in the tab order; this is the same link for the mouse. -->
      <a class={['fan', { empty: slots.length === 0 }]} {href} tabindex="-1" aria-hidden="true">
        {#each slots as poster, i (i)}
          <Tooltip text={poster?.title}>
            {#snippet trigger(tooltip)}
              <span class="slot" {...tooltip}>
                {#if poster?.image}
                  <img class="poster" src={poster.image} alt="" loading="lazy" decoding="async" />
                {:else}
                  <span class={['poster', 'placeholder', { empty: !poster }]}></span>
                {/if}
              </span>
            {/snippet}
          </Tooltip>
        {/each}
      </a>
      {#if itemCount === 0}<span class="no-items"><Icon svg={listIcon} />No items yet</span>{/if}
      {#if reorderControls}{@render reorderControls()}{/if}
    </div>
    <div class="body">
      <div class="head">
        <a class="name-link" {href}><h3>{name}</h3></a>
        {#if mine || pills.length > 0 || shareLink || collaborators.length > 0}
          <span class="chips">
            {#if mine}{@render chip('Me', 'mine', user, 'Your list')}{/if}
            {#if collaborators.length > 0}
              <CollaboratorsPanel {collaborators} list={{ name, poster: posters.at(0)?.image }} {owner}>
                {#snippet trigger(attrs)}
                  <button type="button" class="chip collaborators" {...attrs}>
                    <strong class="chip-count">{collaborators.length}</strong>{plural(collaborators.length, 'collaborator')}
                  </button>
                {/snippet}
              </CollaboratorsPanel>
            {/if}
            {#each pills as pill (pill)}{@render chip(pill, CHIPS[pill]?.tone ?? 'following', CHIPS[pill]?.svg ?? listIcon)}{/each}
            {#if shareLink}{@render chip('Link', 'link', link, 'Anyone with this link can view the list')}{/if}
          </span>
        {/if}
      </div>
      <p class="by">
        <a class="owner" href={owner.href}>
          <span class="avatar">{#if avatar}<img src={avatar} alt="" />{/if}</span>{owner.name}
        </a>
        {#if owner.vip}<VipLabel badge={owner.vip} pill />{/if}
      </p>
      {#if blocks.length > 0}
        <div class="overview" {@attach fitLines}>
          <div class={['clamp', { hidden: lines === 0 }]} style:--lines={lines}><CommentText {blocks} /></div>
        </div>
      {/if}
      <footer class="foot">
        <div class="counts">
          {#if likeCount !== undefined}
            {#if likeTarget}<ListLikeButton {...likeTarget} count={likeCount} button />
            {:else}<span class="count">{@render count('Likes', voteYes, likeCount, 'like')}</span>{/if}
          {/if}
          <span class="count">{@render count('Items', document, itemCount, 'item')}</span>
          {#if commentCount !== undefined}
            <a class="count" href="{href}/comments">{@render count('Comments', comment, commentCount, 'comment')}</a>
          {/if}
        </div>
        {#if actions}
          <div class="tools">
            {#if actions.report}{@render action('Report List', flag, 'report', actions.report.onclick ? actions.report : { onclick: likeTarget?.viewer ? () => { reportOpen = true; } : undefined })}{/if}
            {#if actions.edit}{@render action('Edit', pencil, 'edit', actions.edit)}{/if}
            {#if actions.delete?.onclick}<span class="delete" style:--confirm-icon-size="var(--font-size-list-row-action)"><ManageConfirm name="delete" svg={deleteIcon} label="Delete" yes="Yes, delete it!" warning={actions.delete.warning} disabled={actions.delete.busy} onconfirm={actions.delete.onclick}>Delete this list?</ManageConfirm></span>{:else if actions.delete}{@render action('Delete', deleteIcon, 'delete', actions.delete)}{/if}
            {#if actions.leave}{@render action('Stop collaborating on this list', userXmark, 'leave', actions.leave)}{/if}
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
            {#if actions.shareUrl}<span class="share"><ShareButton url={actions.shareUrl} title={name} large={false} /></span>{/if}
          </div>
        {/if}
      </footer>
    </div>
  </div>
</article>

<style>
.list-row {
  container-type: inline-size;
  padding-block-start: var(--list-card-spacing);
}

.card {
  --poster-width: var(--list-card-poster-width);
  --poster-height: var(--list-card-poster-height);
  --sliver: var(--list-card-sliver);
  display: grid;
  grid-template-columns: calc(var(--poster-width) + (var(--sliver) * 4)) minmax(0, 1fr);
  column-gap: var(--list-card-gap);
  row-gap: var(--list-card-padding);
  padding: var(--list-card-padding);
  border: 1px solid var(--color-list-card-border);
  border-radius: var(--radius-list-card);
  background-color: var(--color-list-card-bg);
  /* Its own text color, so the card reads on a dark frame too (the search Lists tab). */
  color: var(--color-text);
  transition:
    background-color var(--transition-list-card),
    border-color var(--transition-list-card);

  &:is(:hover, :focus-within) {
    border-color: var(--color-list-card-border-hover);
    background-color: var(--color-list-card-bg-hover);
  }

  &.built-in {
    background-color: var(--color-list-card-bg-built-in);

    &:is(:hover, :focus-within) {
      background-color: var(--color-list-card-bg-built-in-hover);
    }
  }
}

/* The reorder controls cover it, so a click while reordering doesn't open the list. */
.fan-frame {
  position: relative;
  align-self: start;
}

.fan {
  display: flex;
  block-size: var(--poster-height);
  overflow: hidden;
  border-radius: var(--radius-list-card-fan);
  background-color: var(--color-list-card-placeholder);
}

.slot {
  position: relative;
  flex: none;
  inline-size: var(--sliver);
  overflow: hidden;
  transition: inline-size var(--transition-list-card-fan);

  &:not(:first-child) {
    box-shadow: var(--shadow-list-card-sliver);
  }

  &:first-child {
    inline-size: var(--poster-width);
  }
}

@container (width >= 520px) {
  .fan:hover .slot {
    inline-size: var(--sliver);

    &:hover {
      inline-size: var(--poster-width);
    }
  }
}

.poster {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  display: block;
  inline-size: var(--poster-width);
  block-size: var(--poster-height);
  background-color: var(--color-card-bg);
  object-fit: cover;
}

.placeholder {
  background-image: var(--image-placeholder-poster);
  background-size: cover;
}

/* Past the list's end, or the whole fan of an empty list: striped. */
.placeholder.empty,
.fan.empty {
  background:
    repeating-linear-gradient(135deg, var(--color-list-card-placeholder-line) 0 6px, transparent 6px 12px),
    var(--color-list-card-placeholder);
}

/* The rank pill centres over the first, whole poster. */
.rank-anchor {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: var(--poster-width);
}

.no-items {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: var(--list-card-body-gap);
  color: var(--color-stat-noun);
  font-family: var(--font-headings);
  font-size: var(--font-size-list-card-empty);
  font-weight: var(--font-weight-headings);
  pointer-events: none;

  & :global(svg) {
    font-size: var(--font-size-list-card-empty-icon);
  }
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--list-card-body-gap);
  min-inline-size: 0;
}

/* The name on the left, its chips across from it on the right. */
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--list-card-body-gap) var(--list-card-foot-gap);
}

.name-link {
  min-inline-size: 0;
  color: var(--color-text);

  &:is(:hover, :focus-visible) {
    color: var(--color-link);
  }
}

h3 {
  margin: 0;
  font-weight: var(--font-weight-headings);
  font-size: var(--font-size-h4);
  text-wrap: balance;
}

.chips {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--list-card-chip-gap);
  margin-inline-start: auto;
}

.chip {
  --tone: var(--color-list-chip-following);
  display: inline-flex;
  align-items: center;
  gap: var(--list-card-chip-gap);
  block-size: var(--list-card-chip-height);
  padding-inline: var(--list-card-chip-padding);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--tone) var(--list-card-chip-line), transparent);
  border-radius: var(--radius-list-card-chip);
  background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-tint), transparent);
  color: color-mix(in srgb, var(--tone), var(--color-list-card-chip-lift) var(--list-card-chip-lift));
  font-family: var(--font-headings);
  font-size: var(--font-size-list-card-chip);
  font-weight: var(--font-weight-headings);
  white-space: nowrap;

  & :global(svg) {
    font-size: var(--font-size-list-card-chip-icon);
  }
}

.private {
  --tone: var(--color-list-chip-private);
}

.official {
  --tone: var(--color-list-chip-official);
}

.mine {
  --tone: var(--color-list-chip-mine);
}

.link {
  --tone: var(--color-list-chip-link);
}

/* A button: it opens the collaborators panel. */
.collaborators {
  --tone: var(--color-list-chip-collaborators);
  /* Off the global button's height, padding and line height, so it sits like the other chips. */
  min-block-size: 0;
  margin: 0;
  padding-block: 0;
  padding-inline-start: 0;
  line-height: 1;
  cursor: pointer;
  transition: background-color var(--transition-list-card);

  &:is(:hover, :focus-visible) {
    background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-count-tint), transparent);
  }
}

/* The count leads, on a darker segment of the chip. */
.chip-count {
  display: inline-grid;
  place-items: center;
  align-self: stretch;
  padding-inline: var(--list-card-chip-padding);
  background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-count-tint), transparent);
  color: var(--color-text);
  font-weight: var(--font-weight-headings-heavy);
}

/* The VIP label brings its own space after the name. */
.by {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  row-gap: var(--list-card-body-gap);
  margin: 0;
  color: var(--color-stat-noun);
  font-family: var(--font-headings);
  font-size: var(--font-size-list-row-meta);
}

.owner {
  display: inline-flex;
  align-items: center;
  gap: var(--space-stat);
  color: var(--color-text);
  font-weight: var(--font-weight-headings);

  &:is(:hover, :focus-visible) {
    color: var(--color-link);
  }
}

.avatar {
  flex: none;
  inline-size: var(--list-card-avatar-size);
  block-size: var(--list-card-avatar-size);
  overflow: hidden;
  border-radius: 50%;
  background-color: var(--color-avatar-border);

  & img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}

/* Fills the room between the byline and the footer; the clamp shows the lines that fit. */
.overview {
  flex: 1 1 0;
  min-block-size: 0;
  max-inline-size: 80ch;
  margin-block-start: var(--list-card-body-gap);
  overflow: hidden;
  color: var(--color-list-card-description);
}

.clamp {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--lines);
  line-clamp: var(--lines);

  &.hidden {
    visibility: hidden;
  }

  /* One run of text, so the clamp counts every line. */
  & :global(p) {
    margin: 0;
  }
}

.foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--list-card-foot-gap) var(--space-stats);
  margin-block-start: auto;
  padding-block-start: var(--list-card-foot-gap);
  font-family: var(--font-headings);
  font-size: var(--font-size-list-row-meta);
  white-space: nowrap;
}

.counts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--list-card-foot-gap) var(--space-stats);
}

/* A stat: the icon in blue, the number in white, then the word in gray. */
.count {
  display: inline-flex;
  align-items: center;
  color: var(--color-stat-noun);
  font-size: var(--font-size-stat-noun);

  & strong {
    color: var(--color-stat-number);
    font-size: var(--font-size-stat-number);
    font-weight: var(--font-weight-headings-heavy);
    font-variant-numeric: tabular-nums;
  }
}

.count-icon {
  display: inline-flex;
  margin-inline-end: var(--space-stat);
  color: var(--color-stat-count);
  font-size: var(--font-size-stat-icon);
  line-height: 1;
}

.count .count-text {
  margin-inline-start: var(--space-stat-noun);
}

a.count:is(:hover, :focus-visible) {
  color: var(--color-stat-noun);

  & strong {
    color: var(--color-stat-count);
  }
}

.tools {
  display: flex;
  align-items: center;
  gap: var(--space-stat);
}

/* Each tool in a rounded box that fills on hover, like a comment's or a note's. */
.action,
.delete :global(.confirm > button),
.share :global(button) {
  display: inline-grid;
  place-items: center;
  inline-size: var(--comment-tool-size);
  block-size: var(--comment-tool-size);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-comment-tool);
  background: none;
  color: inherit;
  font-size: var(--font-size-list-row-action);
  line-height: 1;
  transition: opacity var(--transition-list-card), background-color var(--transition-comment-quiet);

  &:hover:not([aria-disabled='true']) {
    background-color: var(--color-comment-chip);
  }

  &[aria-disabled='true'] {
    cursor: default;
  }
}

.action {
  color: var(--color-stat-noun);
}

/* OG faded the flag in while the pointer was over the row. */
.report {
  opacity: 0;

  .card:hover &,
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
  font-size: var(--font-size-list-row-action);
}

/* A tablet column: a smaller fan, and only the numbers. */
@container (width < 760px) {
  .card {
    --poster-width: var(--list-card-poster-width-tablet);
    --poster-height: var(--list-card-poster-height-tablet);
    --sliver: var(--list-card-sliver-tablet);
    column-gap: var(--list-card-gap-tablet);
  }

  .count .count-text {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
}

/* A narrow column: the posters whole, side by side across the top, and the text under them. */
@container (width < 520px) {
  .card {
    grid-template-columns: minmax(0, 1fr);
  }

  .overview {
    flex: none;
  }

  .fan {
    gap: var(--list-card-poster-gap-narrow);
    block-size: auto;
    overflow: visible;
    background: none;

    &.empty {
      block-size: var(--poster-height);
    }
  }

  .slot,
  .slot:first-child {
    flex: 1;
    inline-size: auto;
    border-radius: var(--radius-list-card-poster-narrow);
    box-shadow: none;
  }

  .poster {
    position: relative;
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: var(--ratio-poster);
  }

  .rank-anchor {
    inline-size: calc((100% - 4 * var(--list-card-poster-gap-narrow)) / 5);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .slot,
  .action {
    transition: none;
  }
}
</style>
