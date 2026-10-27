<!--
  The check-in modal, in the art dialogs' look: the whole episode screenshot (or the movie's fanart), like the cover
  image dialog, with "Check In" and the air date over the title, then Cancel and Check In. The page behind blurs to
  the item's fanart, like OG. It opens on the dialog
  itself, so no ring lands on a button. An episode heads with its show, its number and
  title under it. An unwatched episode keeps the viewer's spoiler settings: the show's fanart for a hidden screenshot,
  a blurred title until clicked. OG's message is cut: only the gone X, Mastodon and Tumblr posts used it. Mounted once
  in the root layout; open it with `checkin.open` from `./checkin.svelte.ts`.
-->
<script lang="ts">
import { page } from '$app/state';
import { invalidateAll } from '$app/navigation';
import { rawApiFetch } from '$lib/api/rawApiFetch';
import Dialog from '$lib/components/dialog/Dialog.svelte';
import DialogArtHeader from '$lib/components/dialog/DialogArtHeader.svelte';
import DialogForm from '$lib/components/dialog/DialogForm.svelte';
import type { CardTag } from '$lib/components/media/CardTag';
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import { checkin } from '$lib/components/checkin/checkin.svelte';
import { checkinMedia } from '$lib/components/checkin/checkinMedia';
import { overlay } from '$lib/overlay/overlay';
import { mediaSpoilers } from '$lib/settings/mediaSpoilers';
import trakt from '$lib/icons/trakt/trakt-v2.svg?raw';
import { formatDate } from '$lib/utils/formatDate';
import { viewerFetch } from '../../auth/viewerFetch.ts';

const target = $derived(checkin.target);
let busy = $state(false);

$effect.pre(() => {
  if (target) busy = false;
});

const hideScreenshot = $derived(
  target?.type === 'episode' && page.data.user
    ? mediaSpoilers({
      spoilers: page.data.settings?.browsing?.spoilers,
      type: 'episode',
      watched: overlay.state('episode', target.id).watched,
    }).screenshot
    : false,
);
const art = $derived(target?.episode && !hideScreenshot ? target.episode.screenshot ?? target.fanart : target?.fanart);
const tags = $derived<readonly CardTag[]>([
  { text: 'Check In', icon: trakt, kind: 'primary' },
  ...(target?.episode?.firstAired
    ? [{
      text: formatDate(target.episode.firstAired, { ...page.data.datePreferences, format: 'll', time: true }),
      color: 'var(--color-dialog-art-media-tag)',
    }]
    : []),
]);

const request = (path: string, body?: unknown) =>
  rawApiFetch({
    fetch: viewerFetch(),
    path,
    init: body === undefined
      ? undefined
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  });

async function submit() {
  if (!target || busy) return;
  busy = true;
  const started = await checkinMedia({ target, request, notify: toast });
  checkin.close();
  // The profile's watching-now bar is server-rendered.
  if (started && page.route.id?.startsWith('/users/')) void invalidateAll();
}
</script>

<Dialog open={target !== null || checkin.loading} title="Check in" size="md" variant="art" backdrop={target?.fanart}
  onclose={() => checkin.close()}>
  {#snippet header(id)}
    <DialogArtHeader {id} title={target?.topTitle ?? 'Check in'} fanart={art} loading={!target} {tags} full>
      {#if target?.episode}
        <p class="episode">
          <span class="number">{target.episode.number}</span>
          {#if target.episode.title}
            <MediaSpoiler target={{ type: 'episode', id: target.id }} kind="title" inline>{target.episode.title}</MediaSpoiler>
          {/if}
        </p>
      {/if}
    </DialogArtHeader>
  {/snippet}
  {#if target}
    <DialogForm save={busy ? 'Checking in...' : 'Check In'} verb="check in" {busy} onsubmit={submit}
      oncancel={() => checkin.close()} />
  {/if}
</Dialog>

<style>
.episode {
  margin: calc(var(--checkin-episode-gap) - var(--dialog-art-header-gap)) 0 0;
  font-family: var(--font-headings);
  font-size: var(--font-size-checkin-episode);
  font-weight: var(--font-weight-headings);
  text-shadow: var(--text-shadow-headings);
}

.number {
  font-weight: var(--font-weight-headings-heavy);
}
</style>
