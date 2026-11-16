<script lang="ts">
import SeoHead from '#lib/seo/SeoHead.svelte';
import { page } from '$app/state';
import { toSubpageSeo } from '#lib/seo/pages/toSubpageSeo.ts';
import WatchedKeys from '#lib/components/dashboard/WatchedKeys.svelte';
import SubpageFrame from '#lib/components/summary/SubpageFrame.svelte';
import ProfileRatingsChart from '#lib/components/users/ProfileRatingsChart.svelte';
import chartSimple from '#lib/icons/regular/chart-simple.svg?raw';
import globe from '#lib/icons/regular/globe.svg?raw';
import heart from '#lib/icons/regular/heart.svg?raw';
import userGroup from '#lib/icons/regular/user-group.svg?raw';
import CommunityStats from './CommunityStats.svelte';
import type { loadStats } from './loadStats.ts';
import QualityStats from './QualityStats.svelte';
import SiteScores from './SiteScores.svelte';
import StatsSection from './StatsSection.svelte';

const { data }: { data: Awaited<ReturnType<typeof loadStats>> } = $props();
const view = $derived(data.stats);
const quality = $derived(data.quality);
// Only a season page has per-episode IMDb and TMDB ratings to read, and only when the viewer hasn't hidden other sites.
const sites = $derived(
  data.media.item.type === 'season' && data.settings?.browsing?.other_site_ratings !== false
    ? { show: page.params.id ?? '', season: Number(page.params.season) }
    : undefined,
);
const sections = $derived([
  { label: 'Community', href: '#community' },
  ...(view.ratings.chart ? [{ label: 'Trakt', href: '#trakt' }] : []),
  ...(quality ? [{ label: 'Quality', href: '#quality' }] : []),
  ...(view.sites.length > 0 ? [{ label: 'Second Opinions', href: '#second-opinions' }] : []),
]);
</script>

<SeoHead
  {...toSubpageSeo({
    title: data.media.item.title,
    href: data.media.href,
    parents: data.media.parents,
    subpage: 'Stats',
    image: data.media.preview,
  })}
/>

<SubpageFrame {...data} strip={view.strip} label="Stats" {sections}>
  <div class="stats">
    <StatsSection id="community" title="Community" icon={userGroup}>
      <CommunityStats tiles={view.community} />
    </StatsSection>
    {#if view.ratings.chart}
      <StatsSection id="trakt" title="Trakt Ratings" icon={heart}>
        <div class="chart"><ProfileRatingsChart chart={view.ratings.chart} /></div>
        <WatchedKeys keys={view.ratings.keys} />
      </StatsSection>
    {/if}
    {#if quality}
      <StatsSection id="quality" title="Quality Over Time" icon={chartSimple}>
        {#key data.media.href}<QualityStats {quality} {sites} />{/key}
      </StatsSection>
    {/if}
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
