<!--
  The sidebar's links out: logos four across, each named by a tooltip, that only get the outlined button's fill under
  the pointer, where a branded logo turns its site's color. A site without a logo comes last, as text. Every link
  opens a new tab. With `share`, the page's share tile ends the links.
-->
<script lang="ts">
import { page } from '$app/state';
import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
import { useTrack } from '#lib/analytics/useTrack.ts';
import ShareButton from '#lib/components/share/ShareButton.svelte';
import GlassAction from '#lib/components/glass-action/GlassAction.svelte';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import type { ExternalLink } from './ExternalLink.ts';
import { toLinkTracking, toShareTracking } from './linkTracking.ts';
import { withSiteLogos } from './withSiteLogos.ts';

interface Props {
  links: readonly ExternalLink[];
  /** The item this page is about: its path and full title. */
  share?: { href: string; title: string };
}

const { links, share }: Props = $props();
const buttons = $derived(withSiteLogos(links));
const person = $derived(page.route.id?.startsWith('/people/') ?? false);
const { track } = useTrack(AnalyticsEvent.Link);
const trackLink = (label: string) => {
  const tracking = toLinkTracking(label, person);
  if (tracking) track(tracking);
};
</script>

{#if buttons.length > 0 || share}
  <ul class="external-links">
    {#each buttons as link (link.href)}
      <li style:--glass-action-ghost-hover-icon={link.color}>
        <Tooltip text={link.title ?? (link.icon ? link.label : undefined)}>
          {#snippet trigger(tooltip)}
            <GlassAction card glass ghost square={!!link.icon} icon={link.icon} href={link.href} target="_blank" rel="noopener"
              onclick={() => trackLink(link.label)}
              aria-label={link.icon ? link.label : undefined} {...tooltip}>
              {#if !link.icon}{link.label}{/if}
            </GlassAction>
          {/snippet}
        </Tooltip>
      </li>
    {/each}
    {#if share}
      <li><ShareButton tile url={new URL(share.href, page.url.origin).href} title={share.title}
        tracking={toShareTracking(share.href)} /></li>
    {/if}
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
