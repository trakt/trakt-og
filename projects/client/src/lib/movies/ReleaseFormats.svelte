<!--
  A physical release's disc formats as the library's logos, at their sizes: Blu-ray runs wide. Each logo names its
  format for screen readers.
    <ReleaseFormats formats={[{ logo: 'bluray', label: 'Blu-ray' }, { logo: 'dvd', label: 'DVD' }]} />
-->
<script lang="ts">
import { collectionLogo } from '$lib/components/collection/collectionLogo';
import Icon from '$lib/icons/Icon.svelte';

const { formats }: { formats: readonly { readonly logo: string; readonly label: string }[] } = $props();
</script>

<span class="formats">
  {#each formats as format (format.logo)}
    {@const glyph = collectionLogo(format.logo)}
    {#if glyph}<span class={['logo', glyph.size]}><Icon svg={glyph.svg} label={format.label} /></span>{/if}
  {/each}
</span>

<style>
.formats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
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
</style>
