<!--
  A physical release's disc formats as the library's logos, spaced and sized like the library tooltip's footer row, then
  any `tags` as its small boxed chips, centered for the release tooltip's footer. Each logo names its format for
  screen readers.
    <ReleaseFormats formats={[{ logo: 'bluray', label: 'Blu-ray' }, { logo: 'dvd', label: 'DVD' }]} tags={['Limited']} />
-->
<script lang="ts">
import { collectionLogo } from '$lib/components/collection/collectionLogo';
import Icon from '$lib/icons/Icon.svelte';

const { formats, tags = [] }: {
  formats: readonly { readonly logo: string; readonly label: string }[];
  tags?: readonly string[];
} = $props();
</script>

<span class="formats">
  {#each formats as format (format.logo)}
    {@const glyph = collectionLogo(format.logo)}
    {#if glyph}<Icon svg={glyph.svg} label={format.label} />{/if}
  {/each}
  {#each tags as tag, i (i)}<span class="chip">{tag}</span>{/each}
</span>

<style>
.formats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-collection-row);
  font-size: var(--font-size-collection-row-logo);
  line-height: 1;
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
