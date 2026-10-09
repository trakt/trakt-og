<!--
  The collapsed calendar rail's month: a bar per week, redder the more airs that week, the week in view outlined.
  Picking one jumps the page to that week without changing the view.
    <WeekBars weeks={[{ start: '2026-10-04', count: 52, label: 'Oct 4 – 10' }]} marked="2026-10-04" onpick={jump} />
-->
<script lang="ts">
type Week = { readonly start: string; readonly count: number; readonly label: string };

interface Props {
  weeks: readonly Week[];
  /** The start of the week in view. */
  marked?: string;
  onpick: (start: string) => void;
}

const { weeks, marked, onpick }: Props = $props();
const max = $derived(Math.max(1, ...weeks.map(({ count }) => count)));
</script>

<ul class="week-bars" aria-label="Weeks">
  {#each weeks as week (week.start)}
    <li>
      <button type="button" class={{ marked: week.start === marked }} title="{week.label}: {week.count}"
        aria-label="Jump to {week.label}, {week.count} {week.count === 1 ? 'item' : 'items'}"
        style:--heat="calc(var(--mini-month-heat-max) * {week.count / max})" onclick={() => onpick(week.start)}
      ></button>
    </li>
  {/each}
</ul>

<style>
.week-bars {
  display: grid;
  gap: var(--space-xs-inline);
  margin: 0;
  padding: 0;
  list-style: none;
}

button {
  display: block;
  inline-size: var(--rail-week-width);
  block-size: var(--rail-week-height);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-sm);
  background-color: color-mix(in srgb, var(--color-mini-month-heat) var(--heat), var(--color-mini-month-cell));
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    outline: 2px solid var(--color-frame-text);
    outline-offset: 1px;
  }

  &.marked {
    outline: 2px solid var(--color-mini-month-marked);
    outline-offset: 1px;
  }
}
</style>
