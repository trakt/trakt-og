<!--
  The page's shared Watch Now dialog, opened by `openWatchNow` from a quick icon's play button. The viewer's country
  and favorites come from their settings, as in the sidebar; mounted once in the root layout. Opened without art (a
  poster card's), it fetches the movie's or show's fanart for the header.
-->
<script lang="ts">
import { page } from '$app/state';
import WatchNowDialog from './WatchNowDialog.svelte';
import type { WatchNowButton } from './watchNow.ts';
import { fetchWatchNowArt } from './fetchWatchNowArt.ts';
import { watchNowLauncher } from './watchNowLauncher.svelte';

const settings = $derived(page.data.settings?.browsing?.watchnow);
let fetched = $state<{ path: string; fanart?: string }>();
$effect(() => {
  const item = watchNowLauncher.item;
  if (!item || item.fanart) return;
  void fetchWatchNowArt(item.path).then((fanart) => {
    if (watchNowLauncher.item === item) fetched = { path: item.path, fanart };
  });
});
const fanart = $derived(
  watchNowLauncher.item?.fanart ?? (fetched?.path === watchNowLauncher.item?.path ? fetched?.fanart : undefined),
);
const button = $derived<WatchNowButton | undefined>(
  watchNowLauncher.item && {
    path: watchNowLauncher.item.path,
    tiles: [],
    count: 0,
    favorites: 0,
    cinemaOnly: false,
    hidden: false,
    country: settings?.country?.toLowerCase() || 'us',
    favoriteKeys: settings?.favorites ?? [],
  },
);
</script>

{#if watchNowLauncher.item && button}
  {#key watchNowLauncher.item}
    <WatchNowDialog bind:open={watchNowLauncher.open} {button} title={watchNowLauncher.item.title}
  year={watchNowLauncher.item.year} {fanart} />
  {/key}
{/if}
