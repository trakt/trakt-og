<script lang="ts">
import WatchedKeys from '$lib/components/dashboard/WatchedKeys.svelte';
import SubpageFrame from '$lib/components/summary/SubpageFrame.svelte';
import ProfileRatingsChart from '$lib/components/users/ProfileRatingsChart.svelte';
import globe from '$lib/icons/regular/globe.svg?raw';
import heart from '$lib/icons/regular/heart.svg?raw';
import userGroup from '$lib/icons/regular/user-group.svg?raw';
import CommunityStats from './CommunityStats.svelte';
import type { loadStats } from './loadStats.ts';
import SiteScores from './SiteScores.svelte';
import StatsSection from './StatsSection.svelte';

const { data }: { data: Awaited<ReturnType<typeof loadStats>> } = $props();
const title = $derived(`Stats for ${data.media.item.title}`);
const view = $derived(data.stats);
const sections = $derived([
  { label: 'Trakt', href: '#trakt' },
  { label: 'Community', href: '#community' },
  ...(view.sites.length > 0 ? [{ label: 'Second Opinions', href: '#second-opinions' }] : []),
]);
</script>

<svelte:head>
  <title>{title} - Trakt</title>
  <meta name="description" content={title} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={title} />
  {#if data.media.poster}<meta property="og:image" content={data.media.poster} />{/if}
</svelte:head>

<SubpageFrame {...data} strip={view.strip} label="Stats" {sections}>
  <div class="stats">
    <StatsSection id="trakt" title="Trakt" icon={heart} hideHeading>
      {#if view.ratings.chart}
        <div class="chart"><ProfileRatingsChart chart={view.ratings.chart} /></div>
        <WatchedKeys keys={view.ratings.keys} />
      {/if}
    </StatsSection>
    <StatsSection id="community" title="Community" icon={userGroup}>
      <CommunityStats tiles={view.community} />
    </StatsSection>
    {#if view.sites.length > 0}
      <StatsSection id="second-opinions" title="Second Opinions" icon={globe}>
        <SiteScores trakt={view} sites={view.sites} />
      </StatsSection>
    {/if}
  </div>
</SubpageFrame>

<style>
.stats {
  padding-block-end: var(--space-stats-section);
}

/* The chart sits on the page, not on the profile's chart band. */
.chart {
  --color-ratings-chart-bg: var(--color-surface);
  padding-block-end: var(--space-ratings-keys);
}
</style>
