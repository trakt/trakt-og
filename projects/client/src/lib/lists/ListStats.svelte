<!--
  The stats bar on the right of a list page's subnav, each count with a tooltip. The icons carry their meaning color
  (purple watched, teal collected, blue for the rest) and the numbers stand alone, the words left to the tooltip:
  Watched and Collected percentages with "2/10 items" under them on hover (signed in, not on official lists), the
  time to watch, the items, the likes and the comments. The whole-list numbers come in `stats`, a promise when the
  loader streams them; until then the bar shows the page's item count and 0%, as OG did before its script ran.
    <ListStats itemCount={57} stats={data.stats} progress likeCount={3} comments={{ count: 1, href }} />
-->
<script lang="ts">
import ListLikeButton from '$lib/components/lists/ListLikeButton.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import clock from '$lib/icons/regular/clock.svg?raw';
import comment from '$lib/icons/regular/comment.svg?raw';
import file from '$lib/icons/regular/file.svg?raw';
import thumbsUp from '$lib/icons/regular/thumbs-up.svg?raw';
import checkThick from '$lib/icons/trakt/check-thick.svg?raw';
import collectionThick from '$lib/icons/trakt/collection-thick.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import { formatRuntime } from '$lib/utils/formatRuntime';
import { listProgress, type ListProgressStat } from './listProgress.ts';
import type { ListStats } from './toListStats.ts';

interface Props {
  /** The page's own count, shown until `stats` settles. */
  itemCount: number;
  /** Null when the loader couldn't count the whole list: the bar keeps to the counts it has. */
  stats: ListStats | Promise<ListStats | null> | null;
  /** Watched and Collected: a signed-in viewer on a list that isn't official. */
  progress?: boolean;
  /** Left out on the watchlist and favorites, which can't be liked. */
  likeCount?: number;
  likeTarget?: { readonly id: number; readonly ownerSlug?: string; readonly viewer: string | null };
  /** Left out when the list doesn't allow comments. */
  comments?: { readonly count: number; readonly href: string };
  /** The viewer's library. The design demo passes its own. */
  stateOf?: typeof overlay.state;
}

const { itemCount, stats, progress = false, likeCount, likeTarget, comments, stateOf = overlay.state }: Props =
  $props();

const plural = (count: number, word: string) => `${word}${count === 1 ? '' : 's'}`;
const number = (count: number) => count.toLocaleString('en-US');
</script>

{#snippet percentage(label: string, svg: string, value: ListProgressStat, total: number, kind: string)}
  <Tooltip text={label}>
    {#snippet trigger(tooltip)}
      <!-- A focus stop so the tooltip and the count under it show from the keyboard too. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <span class={['stat', kind]} tabindex="0" {...tooltip}>
        <span class="icon-slot"><Icon {svg} /></span><span class="text-wrapper"><span class="hidden">{label} </span
          ><strong>{value.percent}%</strong><span class="under-count">{value.count}<span class="slash">/</span>{number(total)}
            {plural(total, 'item')}</span></span>
      </span>
    {/snippet}
  </Tooltip>
{/snippet}

{#snippet count(label: string, svg: string, value: number, word: string, kind: string)}
  <Tooltip text={label}>
    {#snippet trigger(tooltip)}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <span class={['stat', kind]} tabindex="0" {...tooltip}>
        <span class="icon-slot"><Icon {svg} /></span><strong>{number(value)}</strong><span class="hidden">
          {plural(value, word)}</span>
      </span>
    {/snippet}
  </Tooltip>
{/snippet}

{#snippet bar(resolved: ListStats | null | undefined)}
  {@const items = resolved?.items}
  {@const total = items?.length ?? itemCount}
  <!-- Pending, the percentages read 0% like OG's before its script ran; a failed count drops them. -->
  {#if progress && resolved !== null && (resolved === undefined || items)}
    {@const { watched, collected } = listProgress(items ?? [], stateOf)}
    {@render percentage('Watched', checkThick, watched, total, 'watched')}
    {@render percentage('Collected', collectionThick, collected, total, 'collected')}
  {/if}
  {#if resolved && resolved.runtime > 0}
    <Tooltip text="Time to watch">
      {#snippet trigger(tooltip)}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <span class="stat" tabindex="0" {...tooltip}>
          <span class="icon-slot"><Icon svg={clock} /></span><span class="hidden">Time to watch </span
          ><strong>{formatRuntime(resolved.runtime)}</strong>
        </span>
      {/snippet}
    </Tooltip>
  {/if}
  {@render count('Items', file, resolved?.count ?? itemCount, 'item', 'items')}
  {#if likeCount !== undefined}
    {#if likeTarget}<ListLikeButton {...likeTarget} count={likeCount} />
    {:else}{@render count('Likes', thumbsUp, likeCount, 'like', 'likes')}{/if}
  {/if}
  {#if comments}
    <Tooltip text="Comments">
      {#snippet trigger(tooltip)}
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a class="stat" href={comments.href} {...tooltip}>
          <span class="icon-slot"><Icon svg={comment} /></span><strong>{number(comments.count)}</strong><span class="hidden">
            {plural(comments.count, 'comment')}</span>
        </a>
      {/snippet}
    </Tooltip>
  {/if}
{/snippet}

<div class="list-stats">
  {#await stats}
    {@render bar(undefined)}
  {:then resolved}
    {@render bar(resolved)}
  {:catch}
    {@render bar(null)}
  {/await}
</div>

<style>
/* `.comment-wrapper.interactions` with `a.alt`. */
.list-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-stats);
  /* On a phone the counts wrap instead of pushing the sort off the screen. */
  min-inline-size: 0;
  color: var(--color-stat-noun);
  font-family: var(--font-headings);
  font-size: var(--font-size-stat-noun);
  white-space: nowrap;
}

.stat {
  display: inline-flex;
  align-items: center;
  color: inherit;
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    color: inherit;
  }
}

strong {
  color: var(--color-stat-number);
  font-size: var(--font-size-stat-number);
  font-weight: var(--font-weight-headings-heavy);
}

a.stat:is(:hover, :focus-visible) strong {
  color: var(--color-stat-count);
}

.icon-slot {
  display: inline-flex;
  margin-inline-end: var(--space-stat);
  color: var(--color-stat-count);
  font-size: var(--font-size-stat-icon);
  line-height: 1;

  .watched & {
    color: var(--color-stat-watched);
  }

  .collected & {
    color: var(--color-stat-collected);
  }
}

.text-wrapper {
  display: inline-block;
  position: relative;
}

.under-count {
  position: absolute;
  inset-block-end: var(--list-stat-under-offset);
  inset-inline-start: 0;
  color: var(--color-list-stat-under);
  font-size: var(--font-size-list-stat-under);
  text-transform: none;
  opacity: 0;
  transition: opacity 0.5s;

  .stat:is(:hover, :focus-visible) & {
    opacity: 1;
  }
}

.slash {
  margin-inline: 2px;
}

/* OG showed only the numbers; the words stay for screen readers. */
.hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .under-count {
    transition: none;
  }
}
</style>
