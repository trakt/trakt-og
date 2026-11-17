<!--
  The summary strip on the right of the progress subnav, each icon in its meaning color with the number in white, the
  words left to the tooltips as on a list's stats bar: the percent watched with "133 / 154 episodes" under it on hover
  and the time left with its episode count, then the show count. Until the rows are computed the strip keeps to the show
  count. The time left reads "~" while it's an estimate from show runtimes.
-->
<script lang="ts">
import Stat from '#lib/components/stats/Stat.svelte';
import tvRetro from '#lib/icons/regular/tv-retro.svg?raw';
import hourglass from '#lib/icons/regular/hourglass-half.svg?raw';
import { pieSvg } from '#lib/icons/pieSvg.ts';
import { formatRuntime } from '#lib/utils/formatRuntime.ts';
import type { ProgressTotals } from './ProgressTotals.ts';

interface Props {
  /** Every show on every page. */
  shows: number;
  totals: ProgressTotals | null;
}

const { shows, totals }: Props = $props();

const number = (n: number) => n.toLocaleString('en-US');
const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`;
</script>

<div class="progress-summary">
  {#if totals}
          <Stat label="Watched" svg={pieSvg(totals.percent / 100)} tone="watched" value="{totals.percent}%"
        noun="watched" under="{number(totals.completed)} / {number(totals.aired)} {plural(totals.aired, 'episode')}"
        bare />
      <Stat label="Time left to watch" svg={hourglass} iconScale="var(--stat-hourglass-scale)"
        value="{totals.exact ? '' : '~'}{formatRuntime(totals.minutesLeft)}" noun="left"
        under="{number(totals.left)} {plural(totals.left, 'episode')}" bare />
  {/if}
  <Stat label={plural(shows, 'Show')} svg={tvRetro} value={number(shows)} noun={plural(shows, 'show')} bare
    iconShift="var(--stat-tv-icon-shift)" />
</div>

<style>
/* `.comment-wrapper.interactions` with `a.alt`. */
.progress-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-stats);
  min-inline-size: 0;
  white-space: nowrap;
}
</style>
