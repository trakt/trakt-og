<!--
  The calendar sidebar's month line, a SidebarPager: back, the month as a menu (Today first, then nearby months by
  year), forward.
    <MonthPager label="October 2026" {prevHref} {nextHref} {todayHref} {years} />
-->
<script lang="ts">
import SidebarPager from '$lib/components/sidebar/SidebarPager.svelte';

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

<SidebarPager unit="month" {label} menuLabel="Pick a month" {prevHref} {nextHref}>
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
</SidebarPager>

<style>
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
</style>
