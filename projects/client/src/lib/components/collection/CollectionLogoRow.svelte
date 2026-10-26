<!--
  A library item's format and audio in one row: OG's logos, with its resolution, HDR, 3D and channels as small boxed
  tags (and a tag where a format has no logo). The library tooltip's footer and the summary library button's footer.
    <CollectionLogoRow badges={collectionBadges(metadata)} align="start" />
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import type { CollectionBadges, CollectionLogo } from './collectionBadges.ts';
import { collectionLogo } from './collectionLogo.ts';

const { badges, align = 'center' }: { badges: CollectionBadges; align?: 'center' | 'start' } = $props();

const tags = $derived(
  [badges.video?.resolution, badges.video?.hdr, badges.video?.threeD ? '3D' : undefined].filter(Boolean),
);
</script>

{#snippet logo(mark: CollectionLogo | undefined)}
  {#if mark}
    {@const glyph = collectionLogo(mark.name)}
    {#if glyph}<Icon svg={glyph.svg} label={mark.label} />{:else}<span class="chip">{mark.label}</span>{/if}
  {/if}
{/snippet}

<span class={['collection-logo-row', align]}>
  {@render logo(badges.video?.logo)}
  {#each tags as tag (tag)}<span class="chip">{tag}</span>{/each}
  {@render logo(badges.audio?.logo)}
  {#if badges.audio?.channels}<span class="chip">{badges.audio.channels}</span>{/if}
</span>

<style>
.collection-logo-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-collection-row);
  font-size: var(--font-size-collection-row-logo);
  line-height: 1;

  &.center {
    justify-content: center;
  }
}

.chip {
  padding: var(--space-collection-chip);
  border: 1px solid var(--color-collection-chip-border);
  border-radius: var(--radius-collection-chip);
  font-size: var(--font-size-collection-chip);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-collection-chip);
}
</style>
