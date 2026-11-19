<!--
  Featured List: the watchlist over its first item's fanart, a fanned poster stack over its name, then its item count
  and what's next up in the band, cut with an ellipsis when the titles run long, each with a tooltip. Empty, a plain card with its name.
-->
<script lang="ts">
import Stat from '#lib/components/stats/Stat.svelte';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import BoxPosterFan from '#lib/components/users/profile-box/BoxPosterFan.svelte';
import BoxTitle from '#lib/components/users/profile-box/BoxTitle.svelte';
import ProfileBox from '#lib/components/users/profile-box/ProfileBox.svelte';
import Icon from '#lib/icons/Icon.svelte';
import forward from '#lib/icons/regular/forward.svg?raw';
import postersIcon from '#lib/icons/regular/rectangle-vertical-history.svg?raw';
import type { FeaturedListView } from './FeaturedListView.ts';

const { view }: { view: FeaturedListView } = $props();
const items = $derived(view.items.toLocaleString('en-US'));
</script>

{#snippet foot()}
  <p class="meta">
    <Stat svg={postersIcon} value={items} noun={view.items === 1 ? 'item' : 'items'} label="Items" bare />
    {#if view.next.length > 0}
      <Tooltip text="Next up: {view.next.join(', ')}">
        {#snippet trigger(tooltip)}
          <!-- A focus stop so the tooltip, with the titles the ellipsis cut, shows from the keyboard too. -->
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <span class="next" tabindex="0" {...tooltip}><Icon svg={forward} /><span class="visually-hidden">Next up:</span>
            <span class="titles">{view.next.join(', ')}</span></span>
        {/snippet}
      </Tooltip>
    {/if}
  </p>
{/snippet}

<ProfileBox label="Featured List" image={view.items ? view.image : null} foot={view.items ? foot : undefined}>
  <BoxPosterFan posters={view.posters} />
  <BoxTitle title={{ text: view.name, href: view.href }} />
</ProfileBox>

<style>
.meta {
  --font-size-stat-number: var(--font-size-profile-box-stat);
  --font-size-stat-icon: var(--font-size-profile-box-stat);
  display: flex;
  align-items: center;
  gap: var(--profile-box-stats-gap);
  margin: 0;
  font-size: var(--font-size-profile-box-stat);
}

/* Up Next's forward icon, then the titles, cut with an ellipsis. */
.next {
  display: flex;
  align-items: center;
  gap: var(--space-stat);
  min-inline-size: 0;
  color: var(--color-profile-ink-soft);

  :global(svg) {
    flex: none;
    color: var(--color-stat-count);
  }
}

.titles {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
