<!-- `/` signed out, and `/home`: the OG Redux landing page, dark in both themes. -->
<script lang="ts">
import SeoHead from '$lib/seo/SeoHead.svelte';
import { toOrganizationJsonLd } from '$lib/seo/jsonLd/toOrganizationJsonLd';
import { toWebSiteJsonLd } from '$lib/seo/jsonLd/toWebSiteJsonLd';
import { invalidate } from '$app/navigation';
import { untrack } from 'svelte';
import HomeHero from './HomeHero.svelte';
import HomeTrending from './HomeTrending.svelte';
import HomeWatchingMap from './HomeWatchingMap.svelte';
import type { HomeLive } from './live/toHomeLive.ts';
import type { HomeTrendingTitle } from './live/toHomeTrending.ts';
import type { HomeFanart } from './toHomeFanarts.ts';

interface Props {
  data: {
    fanarts: readonly HomeFanart[];
    signedIn: boolean;
    posters: { shows: readonly HomeTrendingTitle[]; movies: readonly HomeTrendingTitle[] } | null;
    live: Promise<HomeLive | null>;
  };
}

const { data }: Props = $props();
// A refresh reshuffles the fanart on the server; the slideshow keeps the order this visit started with.
const fanarts = untrack(() => data.fanarts);
// The API keeps who's watching for 15 minutes, so the page asks again on that beat.
const REFRESH_MS = 15 * 60 * 1000;

// The last count that arrived stays up while a refresh loads, so the numbers roll instead of blinking out.
let live = $state<HomeLive | null>(null);
let failed = $state(false);

$effect(() => {
  const pending = data.live;
  void pending.then((next) => {
    if (pending !== data.live) return;
    if (next) live = next;
    failed = !next && !live;
  });
});

$effect(() => {
  const timer = setInterval(() => void invalidate('trakt:home'), REFRESH_MS);
  return () => clearInterval(timer);
});
</script>

<!-- `/home` is the same page, so search engines list it once, at `/`. -->
<SeoHead
  title="Classic Trakt, rebuilt for big screens"
  description="Trakt OG Redux: a rebuild of classic Trakt for desktops and tablets. Built on the Trakt API, and open source."
  canonicalPath="/"
  jsonLd={[toOrganizationJsonLd(), toWebSiteJsonLd()]}
/>

<div class="home">
  <HomeHero {fanarts} signedIn={data.signedIn} {live} showLive={!failed} />
  {#if !failed}
    <HomeWatchingMap {live} />
  {/if}
  {#if data.posters}
    <HomeTrending posters={data.posters} />
  {/if}
</div>

<style>
/* The page follows the viewer's theme; the hero stays dark over its fanart. */
.home {
  background-color: var(--color-home-bg);
  color: var(--color-home-text);
}
</style>
