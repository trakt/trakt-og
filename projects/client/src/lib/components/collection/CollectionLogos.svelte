<!--
  Library metadata as a small stack of OG's logos: the format over the audio codec, for the right edge of the
  summary's library button. Without a logo (only a resolution, say), the row shows that tag as text. It's
  decorative: the button's tooltip spells the metadata out.
    <CollectionLogos badges={collectionBadges(metadata)} />
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import type { CollectionBadges, CollectionLogo } from './collectionBadges.ts';
import { collectionLogo } from './collectionLogo.ts';

const { badges }: { badges: CollectionBadges } = $props();
const video = $derived(badges.video);
const audio = $derived(badges.audio);
</script>

{#snippet row(logo: CollectionLogo | undefined, tag: string | undefined)}
  {@const glyph = logo && collectionLogo(logo.name)}
  {#if glyph}
    <span class={['logo', glyph.size]}><Icon svg={glyph.svg} /></span>
  {:else if tag}
    <span class="tag">{tag}</span>
  {/if}
{/snippet}

<span class="collection-logos" aria-hidden="true">
  {#if video}{@render row(video.logo, video.resolution ?? video.hdr ?? (video.threeD ? '3D' : undefined))}{/if}
  {#if audio}{@render row(audio.logo, audio.channels)}{/if}
</span>

<style>
.collection-logos {
  display: grid;
  justify-items: end;
  gap: var(--collection-logos-gap);
  line-height: 1;
}

.logo {
  display: grid;
  font-size: var(--font-size-collection-logos);

  &.wide {
    font-size: var(--font-size-collection-logos-wide);
  }

  &.small {
    font-size: var(--font-size-collection-logos-small);
  }
}

.tag {
  font-family: var(--font-headings);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-heavy);
}
</style>
