<!--
  An item's community stats as a list row's count buttons, numbers only: watchers, plays, in libraries, lists and
  comments, each with the ratings strip's icon and color (the stats page's), a short number ("204k") and a tooltip
  with the full count ("204,312 watchers"). Each links on: lists and comments to their pages, the rest to the stats page.
  Zeros are left out. While `loading`, a shimmering button holds the place of each count the stats bring.
-->
<script lang="ts">
import ListCount from '$lib/components/lists/ListCount.svelte';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import { stripStatIcons } from '$lib/components/summary/stripStatIcons';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { readableStat } from '$lib/utils/readableStat';

interface Props {
  href: string;
  stats?: { watchers: number; plays: number; collectors: number; lists: number } | null;
  comments?: number;
  /** False before it airs: only the list count shows, since the rest would come from people gaming the stats. */
  released?: boolean;
  /** The stats are on their way. */
  loading?: boolean;
}
const { href, stats, comments = 0, released = true, loading = false }: Props = $props();
const shown = (count: number | undefined) => (released ? count ?? 0 : 0);

type Entry = {
  word: string;
  plural?: string;
  icon: string;
  count: number;
  color?: string;
  href: string;
  /** It comes with the stats, so it shimmers while they load. */
  fromStats: boolean;
};
const entries = $derived<readonly Entry[]>([
  {
    word: 'watcher',
    fromStats: released,
    icon: stripStatIcons.watchers,
    count: shown(stats?.watchers),
    color: 'var(--color-strip-watchers)',
    href: `${href}/stats`,
  },
  {
    word: 'play',
    fromStats: released,
    icon: stripStatIcons.plays,
    count: shown(stats?.plays),
    color: 'var(--color-strip-plays)',
    href: `${href}/stats`,
  },
  {
    word: 'in libraries',
    fromStats: released,
    plural: 'in libraries',
    icon: stripStatIcons.libraries,
    count: shown(stats?.collectors),
    color: 'var(--color-strip-libraries)',
    href: `${href}/stats`,
  },
  {
    word: 'list',
    fromStats: true,
    icon: stripStatIcons.lists,
    count: stats?.lists ?? 0,
    color: 'var(--color-strip-lists)',
    href: `${href}/lists`,
  },
  {
    word: 'comment',
    fromStats: false,
    icon: stripStatIcons.comments,
    count: shown(comments),
    color: 'var(--color-stat-comments)',
    href: `${href}/comments`,
  },
]);
const label = ({ count, word, plural = `${word}s` }: Entry) =>
  `${count.toLocaleString('en-US')} ${count === 1 ? word : plural}`;
</script>

<!-- Item URLs come from the media mappers. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class="item-stats" role="group" aria-label="Community stats" aria-busy={loading}>
  {#each entries.filter(({ count, fromStats }) => count > 0 || (loading && fromStats)) as entry (entry.word)}
    {#if loading && entry.fromStats}
      <Shimmer inline="var(--item-stats-shimmer-width)" block="var(--control-height)" />
    {:else}
      <Tooltip text={label(entry)}>
        {#snippet trigger(tooltip)}
          <ListCount svg={entry.icon} value={entry.count} shown={readableStat(entry.count)} word={entry.word}
            plural={entry.plural} iconColor={entry.color} href={entry.href} {...tooltip} />
        {/snippet}
      </Tooltip>
    {/if}
  {/each}
</div>

<style>
.item-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--item-stats-gap);

  /* The number only; the word stays for screen readers, and the tooltip says it in full. */
  & :global(.count-text) {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
}
</style>
