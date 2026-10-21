<!--
  The sidebar tools, stacked as the outlined buttons comments and list rows use: Set as cover image (movies, shows and
  episodes), Report, and for directors Moderate, which opens the page in Trakt's admin.
-->
<script lang="ts">
import { page } from '$app/state';
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import ReportDialog from '$lib/components/summary/ReportDialog.svelte';
import type { ReportTarget } from '$lib/components/summary/ReportTarget';
import gear from '$lib/icons/regular/gear.svg?raw';
import image from '$lib/icons/regular/image.svg?raw';
import flag from '$lib/icons/solid/flag.svg?raw';
import { traktUrls } from '$lib/traktUrls';
import CoverDialog from './CoverDialog.svelte';
import { type CoverType, isCoverOf } from './coverImage.ts';

interface Props {
  target: ReportTarget;
}
const { target }: Props = $props();
let reporting = $state(false);
let covering = $state(false);
let chosen = $state(false);

const COVER_TYPES: readonly string[] = ['movie', 'show', 'episode'] satisfies CoverType[];
const settings = $derived(page.data.settings?.user);
const cover = $derived(
  typeof target.id === 'number' && COVER_TYPES.includes(target.type)
    ? { type: target.type as CoverType, id: target.id, title: target.title, year: target.year, fanart: target.fanart }
    : undefined,
);
const isCover = $derived(
  chosen || (!!cover && isCoverOf(settings?.vip_cover_image ?? page.data.settings?.account.cover_image, cover)),
);
</script>

<!-- Trakt's admin is another site, and resolve() only takes this app's routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if page.data.user}
  <ul class="media-tools" aria-label="{target.title} tools">
    {#if cover}
      <li>
        <GlassAction card glass icon={image} disabled={isCover} onclick={() => (covering = true)}>
          {isCover ? 'Your cover image' : 'Set as cover image'}
        </GlassAction>
      </li>
    {/if}
    <li><GlassAction card glass icon={flag} onclick={() => (reporting = true)}>Report {target.type}</GlassAction></li>
    {#if settings?.director}
      <li>
        <GlassAction card glass icon={gear} href="{traktUrls.admin}{page.url.pathname}" target="_blank"
          rel="noopener">Moderate</GlassAction>
      </li>
    {/if}
  </ul>
{/if}
<ReportDialog bind:open={reporting} {target} />
{#if cover}
  <CoverDialog bind:open={covering} item={cover} onset={() => (chosen = true)} />
{/if}

<style>
.media-tools {
  display: grid;
  gap: var(--media-tools-gap);
  margin: 0;
  padding: var(--media-tools-padding);
  border-block-start: 1px solid var(--color-summary-separator);
  list-style: none;

  & :global(.glass-action) {
    inline-size: 100%;
  }

  /* Like `fixedWidth`, so the labels line up whatever the icon's width. */
  & :global(.icon) {
    min-inline-size: 1.25em;
  }

  /* Already the cover. */
  & :global(.glass-action:disabled) {
    opacity: var(--opacity-action-disabled);
    pointer-events: none;
  }
}
</style>
