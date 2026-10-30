<!--
  The recap strip's hover card for a month or the year: its name in the month's accent beside the plays over a bar split
  into episode plays (solid) and movie plays (striped), then a footer with a row for each and the shows or movies they
  came from. The rows shimmer while the split loads, and a failed one offers Try again. Over a cell of `RecapRibbon`, it
  takes the cell's `--month-accent`.
    <RecapSplitTip heading="October 2026 so far" plays={52} state={…} onretry={…} />
-->
<script lang="ts">
import EmptyNote from '$lib/components/empty/EmptyNote.svelte';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import TooltipFooter from '$lib/components/tooltip/TooltipFooter.svelte';
import type { RecapSplitState, RecapTally } from '$lib/dashboard/RecapSplit';
import Icon from '$lib/icons/Icon.svelte';
import cameraMovie from '$lib/icons/regular/camera-movie.svg?raw';
import tvRetro from '$lib/icons/regular/tv-retro.svg?raw';

interface Props {
  heading: string;
  plays: number;
  state: RecapSplitState;
  onretry: () => void;
}

const { heading, plays, state, onretry }: Props = $props();
const split = $derived(state.status === 'loaded' ? state.split : null);
const exact = (n: number) => n.toLocaleString('en-US');
const count = (n: number, one: string, many: string) => `${exact(n)} ${n === 1 ? one : many}`;
</script>

{#snippet row(svg: string, kind: string, tally: RecapTally | undefined, one: string, many: string)}
  <span class="row">
    <Icon {svg} fixedWidth />
    {#if tally}
      <span><b>{exact(tally.plays)}</b> {kind} {tally.plays === 1 ? 'play' : 'plays'}</span>
      {#if tally.titles !== null}<span class="titles">{count(tally.titles, one, many)}</span>{/if}
    {:else}
      <Shimmer inline="var(--dashboard-recaps-tip-shimmer)" block="1em" />
    {/if}
  </span>
{/snippet}

<span class="recap-tip" aria-busy={state.status === 'loading'}>
  <span class="top">
    <span class="head"><span class="heading">{heading}</span><span class="plays">{count(plays, 'play', 'plays')}</span></span>
    <span class="meter">
      {#if split?.episodes.plays}<span class="episodes" style:flex-grow={split.episodes.plays}></span>{/if}
      {#if split?.movies.plays}<span class="movies" style:flex-grow={split.movies.plays}></span>{/if}
    </span>
  </span>
  <TooltipFooter>
    {#if state.status === 'failed'}
      <EmptyNote action={{ onclick: onretry, text: 'Try again' }}>The split didn't load.</EmptyNote>
    {:else}
      {@render row(tvRetro, 'episode', split?.episodes, 'show', 'shows')}
      {@render row(cameraMovie, 'movie', split?.movies, 'movie', 'movies')}
    {/if}
  </TooltipFooter>
</span>

<style>
/* Dark in both themes, like every tooltip, so the shimmer takes its dark colors too. */
.recap-tip {
  color-scheme: dark;
  display: grid;
  min-inline-size: var(--dashboard-recaps-tip-width);
  text-align: start;
}

.top {
  display: grid;
  gap: var(--dashboard-recaps-tip-gap);
  padding: var(--dashboard-recaps-tip-top);
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--dashboard-recaps-tip-gap);
}

.heading {
  color: var(--month-accent, var(--color-tooltip-text));
  font-size: var(--font-size-season-ribbon-month);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-season-ribbon);
  text-transform: uppercase;
}

.plays,
.titles {
  color: var(--color-tooltip-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.meter {
  display: flex;
  block-size: var(--dashboard-recaps-tip-meter);
  overflow: hidden;
  border-radius: var(--dashboard-recaps-tip-meter);
  background-color: var(--color-tooltip-progress-track);
}

.episodes {
  background-color: var(--month-accent);
}

/* Movies stripe in a lighter accent, split from the episodes by a sliver of the box. */
.movies {
  border-inline-start: var(--dashboard-recaps-tip-stripe) solid var(--color-tooltip-bg);
  background: repeating-linear-gradient(
    135deg,
    color-mix(in srgb, var(--month-accent) var(--dashboard-recaps-tip-stripe-tint), var(--color-tooltip-text)) 0
      var(--dashboard-recaps-tip-stripe),
    transparent var(--dashboard-recaps-tip-stripe) calc(2 * var(--dashboard-recaps-tip-stripe))
  );
}

.row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--dashboard-recaps-tip-gap);
  /* A shimmering row holds a loaded row's height, so the card doesn't grow when the split lands. */
  min-block-size: 1lh;
  font-variant-numeric: tabular-nums;

  & :global(.icon) {
    color: var(--month-accent);
  }

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }
}
</style>
