<!--
  "Add to Watchlist" as a labelled glass button: one click adds the title to the watchlist (or takes it off), with no
  list picker, whatever other lists it's on. Signed out, it asks to sign in first.
-->
<script lang="ts">
import { rawApiFetch } from '$lib/api/rawApiFetch';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { login } from '$lib/auth/login';
import { userManager } from '$lib/auth/userManager';
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import type { ListTarget } from '$lib/components/lists/ListTarget';
import { toggleListItem } from '$lib/components/lists/toggleListItem';
import { toast } from '$lib/components/toast/toast.svelte';
import listThick from '$lib/icons/trakt/list-thick.svg?raw';
import { overlay } from '$lib/overlay/overlay';

const { target }: { target: ListTarget } = $props();
let busy = $state(false);
const watchlisted = $derived(Boolean(overlay.state(target.type, target.id).watchlisted));

const request = (path: string, body: unknown) =>
  rawApiFetch({
    fetch: authenticatedFetch({ manager: userManager() }),
    path,
    init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  });

async function toggle() {
  if (busy) return;
  if (!(await userManager().getUser())?.access_token) {
    await login();
    return;
  }
  busy = true;
  try {
    await toggleListItem({ target, list: null, remove: watchlisted, overlay, request, notify: toast });
  } finally {
    busy = false;
  }
}
</script>

<GlassAction icon={listThick} color="var(--brand-secondary)" selected={watchlisted}
  busy={busy ? 'Saving watchlist' : undefined} aria-pressed={watchlisted} onclick={toggle}>
  {watchlisted ? 'On Watchlist' : 'Add to Watchlist'}
</GlassAction>
