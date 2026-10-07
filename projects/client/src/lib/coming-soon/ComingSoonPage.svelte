<!-- The coming-soon placeholder at `/`: one of the "OG Reanimated" Halloween designs, picked by loadComingSoon. -->
<script lang="ts">
import LobbyCard from './LobbyCard.svelte';
import SeanceTeaser from './SeanceTeaser.svelte';
import TabloidTeaser from './TabloidTeaser.svelte';
import type { Teaser } from './teasers.ts';
import VhsTeaser from './VhsTeaser.svelte';

const { teaser }: { teaser: Teaser } = $props();
</script>

<svelte:head>
  <title>OG Reanimated - Trakt</title>
  <meta name="description" content="The classic Trakt is clawing its way back from the archive. Coming soon." />
</svelte:head>

<!-- No design ever scrolls: each one fits the viewport (see fitToParent). -->
{#if teaser === 'vhs'}
  <VhsTeaser />
{:else if teaser === 'seance'}
  <SeanceTeaser />
{:else if teaser === 'tabloid'}
  <TabloidTeaser />
{:else}
  <LobbyCard />
{/if}

<style>
/* The placeholder is one screen. Nothing scrolls, even before fitToParent has measured. */
:global(html),
:global(body) {
  overflow: hidden;
  block-size: 100%;
}
</style>
