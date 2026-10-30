<script lang="ts">
import SeoHead from '$lib/seo/SeoHead.svelte';
import { toSubpageSeo } from '$lib/seo/pages/toSubpageSeo';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import FanartHeader from '$lib/components/media/FanartHeader.svelte';
import ExternalLinks from '$lib/components/summary/ExternalLinks.svelte';
import MediaTools from '$lib/components/summary/MediaTools.svelte';
import SubpageTitle from '$lib/components/summary/SubpageTitle.svelte';
import SummaryFrame from '$lib/components/summary/SummaryFrame.svelte';
import SummaryPoster from '$lib/components/summary/SummaryPoster.svelte';
import CountryFlag from '$lib/components/table/CountryFlag.svelte';
import SectionToolbar from '$lib/components/toolbar/SectionToolbar.svelte';
import SubnavCount from '$lib/components/toolbar/SubnavCount.svelte';
import WatchNow from '$lib/components/watchnow/WatchNow.svelte';
import globe from '$lib/icons/regular/globe.svg?raw';
import type { loadMovieReleases } from '$lib/movies/loadMovieReleases';
import { filterReleaseCountries } from './filterReleaseCountries.ts';
import ReleaseRows from './ReleaseRows.svelte';
import ReleaseTrack from './ReleaseTrack.svelte';

const { data }: { data: Awaited<ReturnType<typeof loadMovieReleases>> } = $props();
const movie = $derived(data.movie);
const releases = $derived(data.releases);

let country = $state('all');
let column = $state('all');
const shown = $derived(
  filterReleaseCountries({ countries: releases.countries, columns: releases.columns, country, column }),
);
const pickedCountry = $derived(releases.countries.find(({ code }) => code === country));
const pickedColumn = $derived(releases.columns.find(({ id }) => id === column));
const clear = () => {
  country = 'all';
  column = 'all';
};
</script>

<!-- The movie link is the canonical API slug. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<SeoHead {...toSubpageSeo({
    title: movie.fullTitle,
    href: movie.href,
    subpage: 'Release Dates',
    image: movie.fanart ?? movie.poster,
  })} />

{#snippet subnav()}
  <SectionToolbar inSummary>
    {#snippet filters()}
      <Dropdown section="Country">
        {#snippet trigger()}{pickedCountry?.name ?? 'All'}{/snippet}
        <ul>
          <li>
            <button type="button" aria-current={country === 'all'} onclick={() => (country = 'all')}
              ><span>All</span><span class="tag">{releases.countries.length}</span></button>
          </li>
        </ul>
        {#if releases.featured}
          <hr />
          <ul>
            <li class="header">{releases.featured.tag}</li>
            {@render countryOption(releases.featured)}
          </ul>
        {/if}
        <hr />
        <ul>
          <li class="header">Countries</li>
          {#each releases.countries as option (option.code)}{@render countryOption(option)}{/each}
        </ul>
      </Dropdown>
      {#if releases.columns.length > 1}
        <Dropdown section="Type">
          {#snippet trigger()}{pickedColumn?.label ?? 'All'}{/snippet}
          <ul>
            <li>
              <button type="button" aria-current={column === 'all'} onclick={() => (column = 'all')}
                ><span>All</span><span class="tag">{releases.countries.length}</span></button>
            </li>
            {#each releases.columns as option (option.id)}
              <li>
                <button type="button" aria-current={column === option.id} onclick={() => (column = option.id)}
                  ><span>{option.label}</span><span class="tag">{option.count}</span></button>
              </li>
            {/each}
          </ul>
        </Dropdown>
      {/if}
    {/snippet}
    {#snippet stats()}
      <SubnavCount svg={globe} count={shown.length} noun="country" plural="countries" tooltip="Countries" />
    {/snippet}
  </SectionToolbar>
{/snippet}

{#snippet countryOption(option: { code: string; name: string; dates: readonly unknown[] })}
  <li>
    <button type="button" aria-current={country === option.code} onclick={() => (country = option.code)}
      ><span class="country-option"><CountryFlag code={option.code} holdSpace />{option.name}</span><span class="tag"
        >{option.dates.length}</span></button>
  </li>
{/snippet}

<FanartHeader image={movie.fanart} slim subnav={releases.countries.length > 0}>
  <SubpageTitle label="Release Dates" title={movie.title} year={movie.year} href={movie.href} />
</FanartHeader>
<SummaryFrame label={movie.title} fullWidth subnav={releases.countries.length > 0 ? subnav : undefined}>
  {#snippet tools()}
    <MediaTools target={{ type: 'movie', id: movie.id, title: movie.title, year: movie.year, href: movie.href, tmdb: movie.links.find((link) => link.label === 'TMDB')?.href, fanart: movie.fanart }} />
  {/snippet}

  {#snippet sidebar()}
    <a href={movie.href}><SummaryPoster image={movie.poster} alt={movie.fullTitle} /></a>
    <WatchNow button={data.watchNow} title={movie.title} year={movie.year} fanart={movie.fanart} />
    <ExternalLinks links={movie.links} />
  {/snippet}
  {#snippet details()}
    {#if releases.countries.length === 0}
      <EmptyState />
    {:else}
      <div class="releases">
        {#if releases.featured}<ReleaseTrack country={releases.featured} />{/if}
        {#if shown.length > 0}
          <ReleaseRows columns={releases.columns} ticks={releases.ticks} today={releases.today} countries={shown} />
        {:else}
          <EmptyState action={{ onclick: clear, text: 'Clear filters' }} />
        {/if}
      </div>
    {/if}
  {/snippet}
</SummaryFrame>

<style>
/* `minmax(0, 1fr)` holds the track and the rows to the column, so they scroll instead of running past it. */
.releases {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--gutter);
  margin-block-end: var(--gutter);
}

.country-option {
  display: flex;
  align-items: center;
  gap: var(--space-release-cell);
}
</style>
