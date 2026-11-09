<!--
  The page's shared Watch Now dialog, opened by `openWatchNow` from a quick icon's play button. The viewer's country
  and favorites come from their settings, as in the sidebar; mounted once in the root layout. Opened without art (a
  poster card's), it builds the movie's or show's fanart URL for the header.
-->
<script lang="ts">
import { page } from '$app/state';
import type { WatchNowButton } from './watchNow.ts';
import { watchNowArt } from './watchNowArt.ts';
import { watchNowLauncher } from './watchNowLauncher.svelte';
import { watchNowCountry } from '../../settings/watchNowCountry.ts';

const settings = $derived(page.data.settings?.browsing?.watchnow);
const fanart = $derived(watchNowLauncher.item && (watchNowLauncher.item.fanart ?? watchNowArt(watchNowLauncher.item.path)));
const button = $derived<WatchNowButton | undefined>(
  watchNowLauncher.item && {
    path: watchNowLauncher.item.path,
    tiles: [],
    count: 0,
    favorites: 0,
    cinemaOnly: false,
    hidden: false,
    country: watchNowCountry(page.data.settings),
    favoriteKeys: settings?.favorites ?? [],
  },
);
</script>

{#if watchNowLauncher.item && button}
  {#key watchNowLauncher.item}
    {#await import('./WatchNowDialog.svelte') then { default: WatchNowDialog }}
      <WatchNowDialog bind:open={watchNowLauncher.open} {button} title={watchNowLauncher.item.title}
  year={watchNowLauncher.item.year} {fanart} />
    {/await}
  {/key}
{/if}
