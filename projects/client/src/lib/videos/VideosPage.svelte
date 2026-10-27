<!--
  The videos page of a movie, show, season or episode: the subpage frame with a bar under its header holding the type
  dropdown ("Featurettes 7"), then the picked type's videos as fanart cards, four a row. It opens on the type its link
  names (`?type=featurette`), else the trailers, the teasers or All, and picking a type writes it back to the URL. A plain click plays a video in the
  popup; a middle click or modified click still opens YouTube.
-->
<script lang="ts">
import SeoHead from '$lib/seo/SeoHead.svelte';
import { toSubpageSeo } from '$lib/seo/pages/toSubpageSeo';
import { replaceState } from '$app/navigation';
import { page } from '$app/state';
import VideoPopup from '$lib/components/dialog/VideoPopup.svelte';
import { videoLinkClicks } from '$lib/components/dialog/videoLinkClicks';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import VideoFanartCard from '$lib/components/media/VideoFanartCard.svelte';
import SubpageFrame from '$lib/components/summary/SubpageFrame.svelte';
import SectionToolbar from '$lib/components/toolbar/SectionToolbar.svelte';
import { countLabel } from '$lib/utils/countLabel';
import type { loadVideos } from './loadVideos.ts';
import { defaultVideoTab, toVideoTabs } from './toVideoCards.ts';
import VideoTypeDropdown from './VideoTypeDropdown.svelte';
import { readVideoTab, videosHref, type VideoTabId } from './videoTypes.ts';

const { data }: { data: Awaited<ReturnType<typeof loadVideos>> } = $props();
const tabs = $derived(toVideoTabs(data.videos));

// A new item starts on the type its link names, else its first; picking one writes it back to the URL.
let picks = $state<{ href: string; id?: VideoTabId }>({ href: '' });
const fallback = $derived(defaultVideoTab(tabs));
const own = $derived(picks.href === data.media.href ? picks.id : readVideoTab(page.url.searchParams));
const current = $derived(tabs.find(({ id }) => id === own) ?? fallback);
function pick(id: VideoTabId) {
  picks = { href: data.media.href, id };
  const href = videosHref(data.media.href, id === fallback?.id ? undefined : id);
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same page, with only its query changed
  replaceState(`${href}${page.url.hash}`, page.state);
}

let playing = $state<string>();
const playingTitle = $derived(data.videos.find((video) => video.href === playing)?.title);
</script>

<SeoHead
  {...toSubpageSeo({
    title: data.media.item.title,
    href: data.media.href,
    parents: data.media.parents,
    subpage: 'Videos',
    image: data.media.fanart ?? data.media.poster,
  })}
/>

{#snippet subnav()}
  <SectionToolbar inSummary>
    {#snippet filters()}
      {#if current}
        <VideoTypeDropdown {tabs} {current} onpick={pick} />
      {/if}
    {/snippet}
  </SectionToolbar>
{/snippet}

<SubpageFrame
  {...data}
  label="Videos"
  sections={[{ label: countLabel(data.videos.length, 'Video'), href: '#videos' }]}
  {subnav}
>
  <div id="videos" class="videos" {@attach videoLinkClicks((url) => (playing = url))}>
    {#if current}
      <ul class="grid">
        {#each current.videos as video (video.href)}
          <li><VideoFanartCard {video} tagged={current.id === 'all'} /></li>
        {/each}
      </ul>
    {:else}
      <EmptyState />
    {/if}
  </div>
</SubpageFrame>

{#if playing}
  <VideoPopup bind:url={playing} title={playingTitle} />
{/if}

<style>
.videos {
  container-type: inline-size;
  padding-block-end: var(--gutter);
}

/* As close under the bar as the people page's grid: four a row, like the summary's row, two in a narrow column. */
.grid {
  display: grid;
  grid-template-columns: repeat(var(--videos-visible), minmax(0, 1fr));
  gap: var(--gutter);
  margin: 0;
  padding: 0;
  list-style: none;
}

@container (width < 720px) {
  .grid {
    grid-template-columns: repeat(var(--videos-visible-narrow), minmax(0, 1fr));
  }
}
</style>
