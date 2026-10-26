<!--
  The dashboard's recap strip, edge to edge under the all-time band: Discover's year ribbon with a Year to Date cell in
  front, then the twelve months in Discover's month colors. Each month's top bar fills as it goes by, and a plays bar
  rises against the busiest month. Tags beside the month name mark the Year to Date, the latest Month in Review (an
  icon) and this month's days left. Months gone by open their Month in Review on v3, this month opens the history, and
  months to come dim. In January it's last year, all twelve months gone by under its Year in Review. A hovered month lifts, tints and fills its bars. Below 992px the twelve months fold into two rows
  and the year leaves. Pass the unawaited promise from the loader: the strip holds its height until the counts land,
  and leaves the page if they don't.
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import type { RecapMonth, RecapRibbon, RecapTag } from '$lib/dashboard/RecapRibbon';
import Icon from '$lib/icons/Icon.svelte';
import chartSimple from '$lib/icons/regular/chart-simple.svg?raw';
import { readableStat } from '$lib/utils/readableStat';

type CellTag = RecapTag | { readonly kind: 'year'; readonly title: string };

const { recaps }: { recaps: Promise<RecapRibbon> } = $props();
const leaves = (href: string) => href.startsWith('http');
</script>

{#snippet cell({ month, caption, tag }: Pick<RecapMonth, 'month' | 'caption'> & { tag: CellTag | null })}
  <span class="bar"><span class="fill"></span></span>
  <span class="head"><span class="month">{month}</span>{#if tag}{@render label(tag)}{/if}</span>
  {#if caption}<span class="caption">{caption}</span>{/if}
  <span class="plays"><span></span></span>
{/snippet}

{#snippet label(tag: CellTag)}
  {#if tag.kind === 'year'}
    <Tooltip text={tag.title}>
      {#snippet trigger(tooltip)}
        <span class="tag" {...tooltip}><Icon svg={chartSimple} /><span class="word">{tag.title}</span></span>
      {/snippet}
    </Tooltip>
  {:else if tag.kind === 'review'}
    <Tooltip text="Month in Review">
      {#snippet trigger(tooltip)}<span class="tag" {...tooltip}><Icon svg={chartSimple} /></span>{/snippet}
    </Tooltip>
  {:else}
    <span class="tag"><b>{tag.days}d</b><span class="word"> left</span></span>
  {/if}
{/snippet}

<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#await recaps}
  <div class="ribbon" aria-hidden="true"></div>
{:then ribbon}
  <nav class="ribbon loaded" aria-label="Your {ribbon.year} recaps">
  <ol>
      <li class="year" style:--progress="1" style:--share="0">
        <a href={ribbon.href} target="_blank" rel="noopener"
          aria-label="{ribbon.year} {ribbon.title}: {ribbon.plays.toLocaleString('en-US')} plays">
          {@render cell({
            month: String(ribbon.year),
            caption: `${readableStat(ribbon.plays)} ${ribbon.plays === 1 ? 'play' : 'plays'}`,
            tag: { kind: 'year', title: ribbon.title },
          })}
        </a>
      </li>
      {#each ribbon.months as month (month.number)}
        <li
          class={month.state}
          style:--month-accent="var(--color-season-{month.theme})"
          style:--progress={month.progress}
          style:--share={month.share}
          aria-current={month.state === 'current' ? 'date' : undefined}
        >
          {#if month.href}
            <a href={month.href} aria-label={month.label} target={leaves(month.href) ? '_blank' : undefined}
              rel={leaves(month.href) ? 'noopener' : undefined}>{@render cell(month)}</a>
          {:else}
            <span class="cell" aria-hidden="true">{@render cell({ ...month, tag: null })}</span><span class="sr">{month.label}</span>
          {/if}
        </li>
      {/each}
    </ol>
</nav>
{:catch}
  <!-- Without the counts the strip would read as an empty year, so it stays out. -->
{/await}

<style>
.ribbon {
  /* Part of the dark top section in both themes, like Discover's ribbon. */
  color-scheme: dark;
  min-block-size: var(--dashboard-recaps-height);
  border-block: 1px solid var(--color-season-ribbon-line);
  background-color: var(--color-season-ribbon-bg);
}

ol {
  display: grid;
  grid-template-columns: var(--dashboard-recaps-year-share) repeat(12, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;

  @media (width < 992px) {
    grid-template-columns: repeat(6, minmax(0, 1fr));

    & .year {
      display: none;
    }
  }
}

.loaded {
  animation: fade-in var(--transition-card) ease-out;
}

li {
  position: relative;
  container-type: inline-size;
  min-inline-size: 0;
  border-inline-end: 1px solid var(--color-season-ribbon-line);
  --month-accent: var(--color-dashboard-recaps-year);

  &:last-child {
    border-inline-end: 0;
  }

  & > a,
  & > .cell {
    display: grid;
    align-content: start;
    gap: var(--season-ribbon-label-gap);
    block-size: 100%;
    box-sizing: border-box;
    /* The bottom keeps the plays bar's room, so a tag that wraps grows the row instead of meeting the bar. */
    padding: var(--dashboard-recaps-cell-padding)
      calc(var(--dashboard-recaps-plays-inset) + var(--dashboard-recaps-plays-height) +
      var(--dashboard-recaps-plays-gap));
    color: inherit;
    text-decoration: none;
  }

  & > a {
    position: relative;
    transition: translate var(--transition-season-ribbon) ease-out, box-shadow var(--transition-season-ribbon),
      background-color var(--transition-season-ribbon);
  }

  /* The hover belongs to the cell, which stays put, so a month lifted from under the pointer stays lifted. */
  &:hover > a,
  & > a:focus-visible {
    z-index: 1;
    translate: 0 var(--dashboard-recaps-hover-lift);
    background-color: color-mix(in srgb, var(--month-accent) var(--dashboard-recaps-hover-tint),
      var(--color-season-ribbon-bg));
    box-shadow: var(--shadow-dashboard-recaps-hover);

    & .bar {
      block-size: var(--season-ribbon-bar-current);
    }

    & .plays span {
      background-color: color-mix(in srgb, var(--month-accent) var(--dashboard-recaps-plays-tint-hover), transparent);
    }

    & .caption {
      color: var(--color-dashboard-recaps-text);
    }
  }

  & > a:focus-visible {
    outline: 2px solid var(--month-accent);
    outline-offset: -2px;
  }
}

.bar {
  position: absolute;
  inset: 0 0 auto;
  block-size: var(--season-ribbon-bar);
  transition: block-size var(--transition-season-ribbon);
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

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--season-ribbon-label-gap);
  min-block-size: var(--dashboard-recaps-tag-height);
}

/* og's tag pill, tinted with the month's accent. */
.tag {
  display: inline-flex;
  align-items: center;
  gap: var(--dashboard-recaps-tag-gap);
  padding: var(--dashboard-recaps-tag-padding);
  border-radius: var(--radius-search-pill);
  background-color: color-mix(in srgb, var(--month-accent) var(--dashboard-recaps-tag-tint), transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--month-accent) var(--dashboard-recaps-tag-line), transparent);
  color: var(--color-dashboard-recaps-text);
  font-size: var(--font-size-dashboard-recaps-tag);
  font-weight: var(--font-weight-headings-light);
  line-height: var(--line-height-search-pill);
  white-space: nowrap;

  & :global(.icon) {
    color: var(--month-accent);
  }

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.year .tag {
  font-weight: var(--font-weight-headings);
}

/* A narrow cell keeps its tag beside the month: the days left lose "left", and the year's tag keeps only its icon. */
@container (width < 104px) {
  .tag .word {
    display: none;
  }
}

@container (width < 152px) {
  .year .tag .word {
    display: none;
  }
}

.caption {
  color: var(--color-dashboard-recaps-muted);
  font-size: var(--font-size-season-ribbon-title);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-headings);
  text-wrap: balance;
}

.plays {
  position: absolute;
  inset: auto var(--dashboard-recaps-plays-inset) var(--dashboard-recaps-plays-inset);
  display: flex;
  align-items: end;
  block-size: var(--dashboard-recaps-plays-height);

  & span {
    inline-size: 100%;
    block-size: calc(var(--share) * 100%);
    border-radius: var(--radius-dashboard-recaps-plays);
    background-color: color-mix(in srgb, var(--month-accent) var(--dashboard-recaps-plays-tint), transparent);
    transition: background-color var(--transition-season-ribbon);
  }
}

.year {
  background: linear-gradient(to bottom, var(--color-dashboard-recaps-year-wash), transparent);
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

  & .caption {
    color: var(--color-dashboard-recaps-text);
  }
}

.future {
  opacity: var(--opacity-dashboard-recaps-future);
}

.sr {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loaded {
    animation: none;
  }

  li > a,
  li:hover > a,
  li > a:focus-visible {
    translate: none;
    transition: none;
  }
}
</style>
