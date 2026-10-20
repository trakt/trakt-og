<!--
  A list row in the comments' style, with no box: a fan of the list's first five posters (empty slots filled in, so
  every row lines up), then the list name with its tags across from it (the comment tags), the owner with their VIP
  label, and the description, three lines at most. A footer level with the fan's foot closes it,
  like a comment's stats bar: the Like button ("123 likes") and the items and comments as buttons, then the viewer's
  tools. The watchlist and favorites wear a quiet tag of their own, and an owner the viewer follows a Friend or
  Following tag. Hovering the row washes it, edge to edge, and turns the name red; hovering the fan opens up the
  poster under the pointer. It sizes itself to where it sits: a smaller fan in a
  tablet column, the posters whole across the top in a narrow one.
-->
<script lang="ts">
import ReportDialog from '$lib/components/summary/ReportDialog.svelte';
import ListCount from '$lib/components/lists/ListCount.svelte';
import ListLikeButton from '$lib/components/lists/ListLikeButton.svelte';
import type { Snippet } from 'svelte';
import CommentTag from '$lib/components/comments/CommentTag.svelte';
import { memberRelation } from '$lib/components/comments/memberRelation';
import { overlay } from '$lib/overlay/overlay';
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
import heart from '$lib/icons/solid/heart.svg?raw';
import watchlistIcon from '$lib/icons/trakt/list-thick.svg?raw';
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
  /** The watchlist and favorites wear a quiet tag of their own, set apart from the user's own lists. */
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
const CHIPS: Record<string, { color: string; svg: string }> = {
  Private: { color: 'var(--color-list-chip-private)', svg: lock },
  'Official List': { color: 'var(--color-list-chip-official)', svg: traktIcon },
  Following: { color: 'var(--color-list-chip-following)', svg: userGroup },
};
const BUILT_IN = { watchlist: { text: 'Watchlist', svg: watchlistIcon }, favorites: { text: 'Favorites', svg: heart } };
const builtIn = $derived(kind === 'watchlist' || kind === 'favorites' ? BUILT_IN[kind] : undefined);
// Friend or Following, from the viewer's network, as on comments; never on the viewer's own lists.
const relation = $derived(
  mine || kind === 'official' ? undefined : memberRelation(overlay.slices().network, owner.href.split('/users/')[1]),
);

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

{#snippet chip(text: string, color: string, svg: string, tip?: string)}
  <Tooltip text={tip}>
    {#snippet trigger(tooltip)}<CommentTag {svg} {color} tint {...tooltip}>{text}</CommentTag>{/snippet}
  </Tooltip>
{/snippet}

{#if likeTarget && actions?.report && !actions.report.onclick}<ReportDialog bind:open={reportOpen}
  target={{ type: 'list', id: likeTarget.id, ownerSlug: likeTarget.ownerSlug, title: name, href,
    posters: posters.flatMap(({ image }) => (image ? [image] : [])).slice(0, 5) }} />{/if}

<article class="list-row">
  <div class="card">
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
        {#if relation || builtIn || mine || pills.length > 0 || shareLink || collaborators.length > 0}
          <span class="chips">
            {#if relation}
              <CommentTag svg={relation === 'friend' ? userGroup : user} tone={relation} tint>
                {relation === 'friend' ? 'Friend' : 'Following'}
              </CommentTag>
            {/if}
            {#if builtIn}<CommentTag svg={builtIn.svg} tint>{builtIn.text}</CommentTag>{/if}
            {#if mine}{@render chip('Me', 'var(--color-list-chip-mine)', user, 'Your list')}{/if}
            {#if collaborators.length > 0}
              <CollaboratorsPanel {collaborators} list={{ name, poster: posters.at(0)?.image }} {owner}>
                {#snippet trigger(attrs)}
                  <button type="button" class="chip collaborators" {...attrs}>
                    <strong class="chip-count">{collaborators.length}</strong>{plural(collaborators.length, 'collaborator')}
                  </button>
                {/snippet}
              </CollaboratorsPanel>
            {/if}
            {#each pills as pill (pill)}{@render chip(pill, CHIPS[pill]?.color ?? 'var(--color-list-chip-following)', CHIPS[pill]?.svg ?? listIcon)}{/each}
            {#if shareLink}{@render chip('Link', 'var(--color-list-chip-link)', link, 'Anyone with this link can view the list')}{/if}
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
        <div class="overview"><div class="clamp"><CommentText {blocks} /></div></div>
      {/if}
      <footer class="foot">
        <div class="counts">
          {#if likeCount !== undefined}
            {#if likeTarget}<ListLikeButton {...likeTarget} count={likeCount} button />
            {:else}<ListCount svg={voteYes} value={likeCount} word="like" />{/if}
          {/if}
          <ListCount svg={document} value={itemCount} word="item" {href} />
          {#if commentCount !== undefined}<ListCount svg={comment} value={commentCount} word="comment" href="{href}/comments" />{/if}
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
  position: relative;
  isolation: isolate;
  column-gap: var(--list-card-gap);
  row-gap: var(--list-card-row-gap);
  /* Its own text color, so the row reads on a dark frame too (the search Lists tab). */
  color: var(--color-text);

  /*
    The hover wash: one layer behind the whole row, reaching a little past it, so the fan and the text share a single
    fill with no seam between them.
  */
  &::before {
    content: '';
    position: absolute;
    inset: calc(-1 * var(--list-card-wash-bleed));
    z-index: -1;
    border-radius: var(--radius-list-card);
    background-color: var(--color-list-card-wash);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-list-card);
  }

  &:is(:hover, :focus-within)::before {
    opacity: 1;
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

  /* No box to light up: hovering the row turns the name red. */
  &:is(:hover, :focus-visible),
  .card:hover & {
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
  gap: var(--comment-tags-gap);
  margin-inline-start: auto;
}

/* The collaborators button, drawn as a comment tag with its count on a darker segment. */
.chip {
  --tone: var(--color-list-chip-following);
  display: inline-flex;
  align-items: center;
  gap: var(--list-card-chip-gap);
  block-size: var(--comment-chip-height);
  padding-inline: var(--comment-chip-padding);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--tone) var(--list-card-chip-line), transparent);
  border-radius: var(--radius-list-card-chip);
  background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-tint), transparent);
  color: color-mix(in srgb, var(--tone), var(--color-list-card-chip-lift) var(--list-card-chip-lift));
  font-family: var(--font-headings);
  font-size: var(--font-size-comment-tag);
  font-weight: var(--font-weight-headings);
  white-space: nowrap;
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
  padding-inline: var(--comment-chip-padding);
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

/* The description, three lines at most. */
.overview {
  max-inline-size: 80ch;
  margin-block-start: var(--list-card-bubble-gap);
  color: var(--color-list-card-description);
  overflow-wrap: break-word;
}

.clamp {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--list-card-description-lines);
  line-clamp: var(--list-card-description-lines);

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
  gap: var(--list-counts-gap);
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

  .counts :global(.count-text) {
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
  .card::before,
  .slot,
  .action {
    transition: none;
  }
}
</style>
