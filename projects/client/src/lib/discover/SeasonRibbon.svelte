<!--
  The year under the season hero, edge to edge: twelve months, each with its theme from the month map and a bar in
  that theme's accent that fills as the month goes by. Today's month is tinted, glows and says how many days are left;
  the months already gone dim back.
-->
<script lang="ts">
import type { SeasonMonth } from './seasonRibbon.ts';

const { months }: { months: readonly SeasonMonth[] } = $props();
const plural = (n: number) => (n === 1 ? 'day' : 'days');
</script>

<ol class="ribbon" aria-label="Themes through the year">
  {#each months as { id, month, title, progress, daysLeft } (month)}
    {@const current = daysLeft !== undefined}
    <li
      class={{ current, past: !current && progress === 1 }}
      style:--month-accent="var(--color-season-{id})"
      style:--progress={progress}
      aria-current={current ? 'date' : undefined}
    >
      <span class="bar"><span class="fill"></span></span>
      <span class="month">{month}</span>
      <span class="title">{title}</span>
      {#if current}<span class="left">{daysLeft} {plural(daysLeft)} left</span>{/if}
    </li>
  {/each}
</ol>

<style>
.ribbon {
  /* Part of the dark top section in both themes. */
  color-scheme: dark;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  border-block: 1px solid var(--color-season-ribbon-line);
  background-color: var(--color-season-ribbon-bg);
  list-style: none;

  @media (width < 992px) {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

li {
  position: relative;
  display: grid;
  align-content: start;
  gap: var(--season-ribbon-label-gap);
  min-inline-size: 0;
  padding: var(--season-ribbon-cell-padding);
  border-inline-end: 1px solid var(--color-season-ribbon-line);

  &:last-child {
    border-inline-end: 0;
  }

  &.past {
    opacity: var(--opacity-season-ribbon-past);
  }
}

.bar {
  position: absolute;
  inset: 0 0 auto;
  block-size: var(--season-ribbon-bar);
  background-color: color-mix(in srgb, var(--month-accent) var(--season-ribbon-track), var(--color-season-ribbon-line));
}

.fill {
  display: block;
  inline-size: calc(var(--progress) * 100%);
  block-size: 100%;
  background-color: var(--month-accent);
}

.month {
  color: var(--month-accent);
  font-size: var(--font-size-season-ribbon-month);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-season-ribbon);
  text-transform: uppercase;
}

.title {
  color: var(--color-discover-muted);
  font-size: var(--font-size-season-ribbon-title);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-headings);
  text-wrap: balance;
}

.left {
  color: var(--month-accent);
  font-size: var(--font-size-season-ribbon-month);
  font-weight: var(--font-weight-headings-heavy);
}

.current {
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--month-accent) var(--season-ribbon-tint), transparent),
    transparent
  );

  & .bar {
    block-size: var(--season-ribbon-bar-current);
  }

  & .fill {
    box-shadow: var(--season-ribbon-glow) var(--month-accent);
  }

  & .title {
    color: var(--color-discover-text);
    font-weight: var(--font-weight-headings-heavy);
  }
}
</style>
