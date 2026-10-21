<!--
  The sidebar's links out: logos four across, each named by a tooltip, that only get the outlined button's fill under
  the pointer, where a branded logo turns its site's color. A site without a logo comes last, as text. Every link
  opens a new tab.
-->
<script lang="ts">
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import type { ExternalLink } from './ExternalLink.ts';
import { withSiteLogos } from './withSiteLogos.ts';

const { links }: { links: readonly ExternalLink[] } = $props();
const buttons = $derived(withSiteLogos(links));
</script>

{#if buttons.length > 0}
  <ul class="external-links">
    {#each buttons as link (link.href)}
      <li style:--glass-action-ghost-hover-icon={link.color}>
        <Tooltip text={link.title ?? (link.icon ? link.label : undefined)}>
          {#snippet trigger(tooltip)}
            <GlassAction card glass ghost square={!!link.icon} icon={link.icon} href={link.href} target="_blank" rel="noopener"
              aria-label={link.icon ? link.label : undefined} {...tooltip}>
              {#if !link.icon}{link.label}{/if}
            </GlassAction>
          {/snippet}
        </Tooltip>
      </li>
    {/each}
  </ul>
{/if}

<style>
.external-links {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--external-links-gap);
  margin: var(--external-links-margin);
  padding: 0;
  list-style: none;

  & :global(.glass-action) {
    inline-size: 100%;
  }

  & :global(.icon) {
    max-inline-size: var(--external-links-logo-max-width);
  }
}
</style>
