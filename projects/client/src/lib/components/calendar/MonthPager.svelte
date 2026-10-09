<!--
  The calendar sidebar's month line: back, the month as a menu (Today first, then nearby months by year), forward. The
  carets and menu rows are links, so paging is plain navigation and `p`/`n` keep working through the page.
    <MonthPager label="October 2026" {prevHref} {nextHref} {todayHref} {years} />
-->
<script lang="ts">
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import Icon from '$lib/icons/Icon.svelte';
import angleLeft from '$lib/icons/light/angle-left.svg?raw';
import angleRight from '$lib/icons/light/angle-right.svg?raw';

type Month = { readonly label: string; readonly href: string; readonly current: boolean; readonly note?: string };

interface Props {
  label: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  /** "Oct 9", after Today in the menu. */
  todayLabel: string;
  years: readonly { readonly year: string; readonly months: readonly Month[] }[];
}

const { label, prevHref, nextHref, todayHref, todayLabel, years }: Props = $props();
</script>

<!-- The hrefs keep the current path and query, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<nav class="month-pager" aria-label="Month">
  <a class="step" href={prevHref} rel="prev"><Icon svg={angleLeft} label="Previous month" /></a>
  <Dropdown block label="Pick a month">
    {#snippet trigger()}{label}{/snippet}
    <ul>
      <li><a href={todayHref}><span class="label">Today<span class="pill today">{todayLabel}</span></span></a></li>
    </ul>
    {#each years as { year, months } (year)}
      <hr />
      <ul>
        <li class="header">{year}</li>
        {#each months as month (month.href)}
          <li><a href={month.href} aria-current={month.current ? 'page' : undefined}><span class="label"
              >{month.label}{#if month.note}<span class="pill">{month.note}</span>{/if}</span></a></li>
        {/each}
      </ul>
    {/each}
  </Dropdown>
  <a class="step" href={nextHref} rel="next"><Icon svg={angleRight} label="Next month" /></a>
</nav>

<style>
.month-pager {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-xs-inline);

  & :global(.trigger) {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm-inline);
}

/* A small note beside a month: "this month", and today's date beside Today. */
.pill {
  padding: 1px 7px;
  border-radius: var(--radius-menu-pill);
  background-color: var(--color-control-raised-hover-bg);
  color: var(--color-control-text);
  font-size: var(--font-size-menu-pill);
  font-weight: var(--font-weight-menu-header);
  line-height: 1.5;

  &.today {
    background-color: var(--brand-primary);
    color: var(--color-text-inverse);
  }
}

.step {
  display: grid;
  place-items: center;
  inline-size: var(--control-height);
  block-size: var(--control-height);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font-size: var(--font-size-base);

  &:is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-hover-bg);
  }
}
</style>
