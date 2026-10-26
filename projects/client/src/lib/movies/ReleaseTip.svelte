<!--
  A release mark's tooltip, as plain as the library's: the date in bold over its type in gray, then in the footer any
  disc formats' logos and its tags (a limited run, a rating that differs from the country's, each part of its note) as
  the library's boxed chips.
    <Tooltip toggles>{#snippet trigger(tooltip)}…{/snippet}<ReleaseTip {release} /></Tooltip>
-->
<script lang="ts">
import TooltipFooter from '$lib/components/tooltip/TooltipFooter.svelte';
import ReleaseFormats from './ReleaseFormats.svelte';
import { releasePills } from './releasePills.ts';
import type { ReleaseDate } from './toMovieReleases.ts';

const { release }: { release: ReleaseDate } = $props();
const tags = $derived(releasePills(release).flatMap((pill) => ('text' in pill ? [pill.text] : [])));
</script>

<span class="release-tip">
  <span class="lines"><b>{release.dateText}</b><span class="type">{release.type}</span></span>
  {#if release.formats.length > 0 || tags.length > 0}
    <TooltipFooter><ReleaseFormats formats={release.formats} {tags} /></TooltipFooter>
  {/if}
</span>

<style>
.release-tip {
  display: grid;
}

.lines {
  display: grid;
  padding: var(--space-tooltip-library);

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.type {
  color: var(--color-tooltip-muted);
}
</style>
