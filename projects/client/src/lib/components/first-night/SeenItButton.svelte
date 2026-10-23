<!--
  "Add to History" as a labelled glass button, the watched twin of WatchlistButton: one click marks a movie, or every aired
  episode of a show, watched on its release date, with no date prompt. Clicking a seen title takes it back off.
-->
<script lang="ts">
import { rawApiFetch } from '$lib/api/rawApiFetch';
import { viewerFetch } from '$lib/auth/viewerFetch';
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import { loadWatchEpisodes } from '$lib/components/history/loadWatchEpisodes';
import { watchMedia } from '$lib/components/history/watchMedia';
import type { WatchTarget } from '$lib/components/history/WatchTarget';
import { toast } from '$lib/components/toast/toast.svelte';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import { refreshSoon } from '$lib/overlay/refreshSoon';

const { target }: { target: WatchTarget } = $props();
let busy = $state(false);
const seen = $derived(Boolean(overlay.state(target.type, target.id).watched));

const request = (path: string, body?: unknown) =>
  rawApiFetch({
    fetch: path.startsWith('/search/') ? globalThis.fetch : viewerFetch(),
    path,
    init: body === undefined
      ? undefined
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  });

async function toggle() {
  if (busy) return;
  busy = true;
  try {
    const saved = await watchMedia({
      target,
      watchedAt: seen ? null : 'released',
      overlay,
      request,
      notify: toast,
      episodes: () => loadWatchEpisodes({ target, fetch: viewerFetch() }),
      // Saying "seen it" about a whole show is the confirmation.
      confirm: () => Promise.resolve(true),
    });
    if (saved) refreshSoon();
  } finally {
    busy = false;
  }
}
</script>

<GlassAction icon={check} color="var(--brand-tertiary)" selected={seen} busy={busy ? 'Saving to history' : undefined}
  aria-pressed={seen} disabled={target.released === false} onclick={toggle}>
  {seen ? 'In History' : 'Add to History'}
</GlassAction>
