<!--
  The caught up bar: in a poster or fanart card's quick-icon place (its `bar`), a purple check and Caught Up, centred,
  or 100% (`short`) for a poster's narrow bar. With `next`, the next movie's release date (`YYYY-MM-DD`) takes the
  bar's right end on a slanted block a shade off the bar's, Next movie over the date, and the check moves left, its
  label dropped when the bar is too narrow for it. It carries the `quick-icons` class so the cards frame it like their
  icon bar.
    <PosterCard ...>{#snippet bar()}<CaughtUpBar next="2027-06-18" {datePreferences} short small />{/snippet}</PosterCard>
-->
<script lang="ts">
import Icon from '#lib/icons/Icon.svelte';
import check from '#lib/icons/trakt/check-thick.svg?raw';
import type { DatePreferences } from '#lib/settings/DatePreferences.ts';
import { formatDate } from '#lib/utils/formatDate.ts';

interface Props {
  /** The next movie's release date. Left out, nothing is announced and Caught Up stands alone. */
  next?: string;
  datePreferences?: DatePreferences;
  /** 100% for Caught Up, for a poster's narrow bar. */
  short?: boolean;
  /** The small quick-icon bar's height, as on a poster card. */
  small?: boolean;
}

const { next, datePreferences, short = false, small = false }: Props = $props();
const date = $derived(next && formatDate(next, { ...datePreferences, timeZone: 'UTC' }));
</script>

<div class={['quick-icons', 'caught-up-bar', { small, split: date }]}>
  <span class="done">
    <span class="check"><Icon svg={check} /></span>
    <span>{#if short}100%<span class="visually-hidden"> watched, caught up</span>{:else}Caught Up{/if}</span>
  </span>
  {#if date}<span class="next"><span>Next movie</span><span class="date">{date}</span></span>{/if}
</div>

<style>
.caught-up-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  block-size: 40px;
  padding-inline: var(--caught-up-bar-padding);
  overflow: hidden;
  background-color: light-dark(var(--color-quick-icons-light-bg), var(--color-card-bg));
  color: light-dark(var(--color-quick-icons-light-text), var(--color-card-text));
  font-size: var(--font-size-caught-up);
  font-weight: var(--font-weight-caught-up);
  white-space: nowrap;

  &.small {
    block-size: 35px;
  }

  &.split {
    justify-content: space-between;
    padding-inline-end: 0;
  }
}

.done {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Beside the date, a label with no room wraps under the check, out of the clipped line, leaving the check alone. */
.split .done {
  flex: 1;
  flex-wrap: wrap;
  min-inline-size: 0;
  block-size: var(--size-caught-up-check);
  overflow: hidden;
  line-height: 1; /* a label line no taller than the check, or Safari centres the check lower and clips it */
}

.check {
  display: grid;
  flex: none;
  place-items: center;
  inline-size: var(--size-caught-up-check);
  aspect-ratio: 1;
  border-radius: 50%;
  background-color: var(--color-caught-up);
  color: var(--color-caught-up-text);

  & :global(.icon) {
    --icon-shift: var(--caught-up-check-shift);

    font-size: 0.7em;
  }
}

.next {
  display: grid;
  flex: none;
  align-content: center;
  justify-items: end;
  align-self: stretch;
  padding-inline: calc(var(--caught-up-next-slant) + var(--caught-up-next-inset)) var(--caught-up-next-padding-end);
  background-color: var(--color-caught-up-next-bg);
  clip-path: polygon(var(--caught-up-next-slant) 0, 100% 0, 100% 100%, 0 100%);
  font-size: var(--font-size-caught-up-next-label);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  line-height: 1.15;
}

.date {
  font-size: var(--font-size-caught-up-next);
  font-weight: var(--font-weight-caught-up);
}
</style>
