<script lang="ts">
import EmptyState from '#lib/components/empty/EmptyState.svelte';
import SubpageFrame from '#lib/components/summary/SubpageFrame.svelte';
import earth from '#lib/icons/regular/earth-americas.svg?raw';
import shield from '#lib/icons/regular/shield-halved.svg?raw';
import SeoHead from '#lib/seo/SeoHead.svelte';
import { toSubpageSeo } from '#lib/seo/pages/toSubpageSeo.ts';
import StatsSection from '#lib/stats/StatsSection.svelte';
import CertificationGroups from './CertificationGroups.svelte';
import type { loadParentalGuidePage } from './loadParentalGuidePage.ts';
import ParentalGuideTiles from './ParentalGuideTiles.svelte';

const { data }: { data: Awaited<ReturnType<typeof loadParentalGuidePage>> } = $props();
const ratings = $derived(data.certifications);
const sections = $derived([
  ...(data.guide.length > 0 ? [{ label: 'Parental Guide', href: '#parental-guide' }] : []),
  ...(ratings.count > 0 ? [{ label: 'Certifications', href: '#certifications' }] : []),
]);
</script>

<SeoHead
  {...toSubpageSeo({
    title: data.media.item.title,
    href: data.media.href,
    parents: data.media.parents,
    subpage: 'Parental Guide',
    image: data.media.preview,
  })}
/>

<SubpageFrame {...data} label="Parental Guide" {sections}>
  <div class="parental">
    {#if data.guide.length > 0}
      <StatsSection id="parental-guide" title="Parental Guide" icon={shield}>
        <ParentalGuideTiles guide={data.guide} />
      </StatsSection>
    {/if}
    {#if ratings.count > 0}
      <StatsSection id="certifications" title="Certifications" icon={earth}>
        <CertificationGroups featured={ratings.featured} groups={ratings.groups} />
      </StatsSection>
    {/if}
    {#if sections.length === 0}<EmptyState />{/if}
  </div>
</SubpageFrame>

<style>
.parental {
  padding-block-end: var(--space-stats-section);
}
</style>
