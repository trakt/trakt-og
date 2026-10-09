<script lang="ts">
import { page } from '$app/state';
import type { ComponentProps } from 'svelte';
import { rawApiFetch } from '$lib/api/rawApiFetch';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { login } from '$lib/auth/login';
import { userManager } from '$lib/auth/userManager';
import { overlay } from '$lib/overlay/overlay';
import { toast } from '$lib/components/toast/toast.svelte';
import RatingPopover from '$lib/components/rating/RatingPopover.svelte';
import { rateMedia } from '$lib/components/rating/rateMedia';
import type { RatingTarget } from '$lib/components/rating/RatingTarget';
import { watchedFirst } from '$lib/components/rating/watchedFirst';

interface Props {
  target: RatingTarget;
  trigger: ComponentProps<typeof RatingPopover>['trigger'];
  variant?: ComponentProps<typeof RatingPopover>['variant'];
}
const { target, trigger, variant }: Props = $props();
let busy = $state(false);
const userState = $derived(overlay.state(target.type, target.id, target.season));
const value = $derived(userState.rating ?? null);
const locked = $derived(watchedFirst(userState, 'rate'));

async function open() {
  if ((await userManager().getUser())?.access_token) return true;
  await login();
  return false;
}

async function rate(rating: number | null) {
  if (busy) return;
  busy = true;
  try {
    await rateMedia({
      target,
      rating,
      overlay,
      notify: toast,
      watchAfterRating: page.data.settings?.browsing?.watch_after_rating,
      request: (path, body) =>
        rawApiFetch({
          fetch: path.startsWith('/search/') ? globalThis.fetch : authenticatedFetch({ manager: userManager() }),
          path,
          init: body === undefined ? undefined : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
        }),
    });
  } finally {
    busy = false;
  }
}
</script>

<RatingPopover label="Rate {target.title}" {value} {busy} {locked} {variant} {trigger} onopen={open} onrate={rate} />
