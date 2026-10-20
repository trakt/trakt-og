<!--
  The library control while adding is off (`LIBRARY_ADDING`) and the item isn't in the library: faded, it links to v3's
  sync settings, where a Plex or Jellyfin media center fills the library. The card says why in a tooltip, the summary
  button as its helper line. Sizes match MediaCollection.
    <LibrarySyncLink variant="summary" />
-->
<script lang="ts">
import SummaryAction from '$lib/components/summary/SummaryAction.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import collection from '$lib/icons/trakt/collection.svg?raw';
import collectionThick from '$lib/icons/trakt/collection-thick.svg?raw';
import external from '$lib/icons/light/arrow-up-right-from-square.svg?raw';
import { traktUrls } from '$lib/traktUrls';
import { LIBRARY_SYNC_HINT } from './librarySyncHint.ts';

interface Props {
  variant?: 'summary' | 'card';
  small?: boolean;
}
const { variant = 'card', small = false }: Props = $props();
const label = `Add to library: ${LIBRARY_SYNC_HINT.toLowerCase()} (opens in a new tab)`;
</script>

<!-- v3's sync settings live outside og. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#if variant === 'summary'}
  <div class="sync-link">
  <SummaryAction color="var(--brand-quaternary)" icon={collection} text="Add to library" detail={LIBRARY_SYNC_HINT}
    href={traktUrls.syncSettings} target="_blank" rel="noopener" aria-label={label}>
    {#snippet trailing()}<Icon svg={external} />{/snippet}
  </SummaryAction>
</div>
{:else}
  <Tooltip text={LIBRARY_SYNC_HINT} placement="bottom">
    {#snippet trigger(tip)}
      <a class={['sync-link', 'card', { small }]} href={traktUrls.syncSettings} target="_blank" rel="noopener"
        aria-label={label} {...tip}><Icon svg={collectionThick} /></a>
    {/snippet}
  </Tooltip>
{/if}

<style>
.sync-link {
  opacity: var(--opacity-action-disabled);
  transition: opacity var(--transition-card);
  &:is(:hover, :focus-visible, :focus-within) {
    opacity: 1;
  }
}
.card {
  display: grid;
  place-items: center;
  inline-size: var(--watch-card-width);
  block-size: var(--watch-card-height);
  color: var(--brand-quaternary);
  font-size: var(--font-size-quick-icon);
  --icon-shift: var(--quick-icon-trakt-shift);
  &.small {
    inline-size: var(--watch-card-small-width);
    block-size: var(--watch-card-small-height);
    font-size: var(--font-size-quick-icon-small);
  }
  &:focus-visible {
    outline: var(--watch-focus) solid var(--color-input-border-focus);
    outline-offset: calc(-1 * var(--watch-focus));
  }
}
@media (prefers-reduced-motion: reduce) {
  .sync-link {
    transition: none;
  }
}
</style>
