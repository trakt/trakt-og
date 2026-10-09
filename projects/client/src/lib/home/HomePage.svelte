<!-- `/home`: the OG Redux landing page, dark in both themes. Later it moves to `/`. -->
<script lang="ts">
import HomeHero from './HomeHero.svelte';
import HomePillars from './HomePillars.svelte';
import type { HomeFanart } from './toHomeFanarts.ts';

interface Props {
  data: { fanarts: readonly HomeFanart[]; signedIn: boolean };
}

const { data }: Props = $props();
</script>

<svelte:head>
  <title>OG Redux - Trakt</title>
  <meta
    name="description"
    content="Trakt OG Redux: a rebuild of classic Trakt for desktops and tablets. Built on the Trakt API, and open source."
  />
</svelte:head>

<div class="home">
  <HomeHero fanarts={data.fanarts} signedIn={data.signedIn} />
  <HomePillars />
</div>

<style>
.home {
  color-scheme: dark;
  background-color: var(--color-home-bg);
  color: var(--color-home-text);
}
</style>
