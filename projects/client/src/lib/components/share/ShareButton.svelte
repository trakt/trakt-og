<!--
  OG's share icon (`global.js:6158-6210`): the Web Share API where the browser has one ("Share Link"), otherwise it
  copies the link and says so in a toast ("Copy Link"). A signed-in member's link carries their share code, so a
  friend who opens it credits them. `tile` is a ghost square like a summary's links out.
-->
<script lang="ts">
import type { ComponentProps } from 'svelte';
import { page } from '$app/state';
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import Icon from '$lib/icons/Icon.svelte';
import arrowUpFromBracket from '$lib/icons/regular/arrow-up-from-bracket.svg?raw';
import { toShareUrl } from '$lib/share/toShareUrl';
import Tooltip from '../tooltip/Tooltip.svelte';
import { copyLink } from './copyLink.ts';

interface Props {
  url: string;
  title?: string;
  /** List title rows use the unscaled icon; rows and summaries keep OG's fa-lg size. */
  large?: boolean;
  /** A summary's links out: the ghost square beside the site logos. */
  tile?: boolean;
  /** Where the tooltip shows. */
  placement?: ComponentProps<typeof Tooltip>['placement'];
}

const { url, title, large = true, tile = false, placement }: Props = $props();

// The server can't know, so it renders the copy tooltip and the browser corrects it.
let canShare = $state(false);
const detectShare = () => {
  canShare = typeof navigator.share === 'function';
};

const link = $derived(toShareUrl({ url, shareCode: page.data.settings?.account?.share_code }));

const share = async () => {
  if (!canShare) return copyLink(link);
  // A dismissed share sheet rejects with AbortError; there's nothing to tell the user.
  await navigator.share({ title, url: link }).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    return copyLink(link);
  });
};

const label = $derived(canShare ? 'Share Link' : 'Copy Link');
</script>

<Tooltip text={label} {placement}>
  {#snippet trigger(tooltip)}
    {#if tile}
      <GlassAction card glass ghost square icon={arrowUpFromBracket} aria-label={label} onclick={share}
        {@attach detectShare} {...tooltip} />
    {:else}
      <button type="button" class={['share', { normal: !large }]} aria-label={label} onclick={share} {@attach detectShare} {...tooltip}>
        <Icon svg={arrowUpFromBracket} />
      </button>
    {/if}
  {/snippet}
</Tooltip>

<style>
/* fa-lg: a third larger, nudged down a little. */
.share {
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font-size: 1.3333em;
  line-height: 0.75em;
  vertical-align: -0.0667em;

  &.normal {
    font-size: inherit;
    line-height: inherit;
    vertical-align: baseline;
  }
}
</style>
