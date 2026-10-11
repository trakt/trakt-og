<!--
  A chart page's title, the sidebar's picker: "Shows" or "Movies" over the chart's name, opening a menu of that type's
  charts. The chart pages and Box Office use it.
    <SidebarTitle>{#snippet heading()}<ChartPicker type="movies" chart="boxoffice" {period} signedIn />{/snippet}</SidebarTitle>
-->
<script lang="ts">
import { page } from '$app/state';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import { chartLinks } from './chartLinks.ts';
import type { ChartName } from './chartNames.ts';
import type { ChartPeriod } from './chartPeriod.ts';
import type { MediaType } from './loadChart.ts';

interface Props {
  type: MediaType;
  chart: ChartName | 'boxoffice';
  /** The period the period charts' links keep. */
  period: ChartPeriod;
  signedIn: boolean;
}

const { type, chart, period, signedIn }: Props = $props();

// Played has no link in the picker, like OG's nav, so its name comes from here.
const CHART_NAMES: Readonly<Record<ChartName | 'boxoffice', string>> = {
  trending: 'Trending',
  recommendations: 'Recommendations',
  anticipated: 'Anticipated',
  popular: 'Popular',
  favorited: 'Favorited',
  watched: 'Watched',
  played: 'Played',
  library: 'Libraries',
  boxoffice: 'Box Office',
};

const links = $derived(chartLinks({ type, current: chart, period, search: page.url.searchParams, signedIn }));
</script>

<!-- The hrefs come built by chartLinks, query included, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<Dropdown variant="title" label="Pick a chart">
  {#snippet trigger()}<span class="eyebrow">{type === 'shows' ? 'Shows' : 'Movies'}</span><span class="name"
    >{CHART_NAMES[chart]}</span>{/snippet}
  <ul>
    {#each links as link (link.href)}
      <li><a href={link.href} aria-current={link.current ? 'page' : undefined}>{link.label}</a></li>
    {/each}
  </ul>
</Dropdown>
