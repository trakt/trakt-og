<script lang="ts">
import { requireSignIn } from '#lib/auth/requireSignIn.ts';
import { page } from '$app/state';
import type { ComponentProps } from 'svelte';
import { rawApiFetch } from '#lib/api/rawApiFetch.ts';
import { overlay } from '#lib/overlay/overlay.ts';
import { toast } from '#lib/components/toast/toast.svelte.ts';
import RatingPopover from '#lib/components/rating/RatingPopover.svelte';
import { rateMedia } from '#lib/components/rating/rateMedia.ts';
import type { RatingTarget } from '#lib/components/rating/RatingTarget.ts';
import { watchedFirst } from '#lib/components/rating/watchedFirst.ts';
import { viewerFetch } from '../../auth/viewerFetch.ts';

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

// The trigger's tooltip. Once rated, the rating already shows on the card or button, so it offers the change.
const hint = (rating: number | null) => (rating ? 'Change your rating' : `Rate this ${target.type}`);

async function open() {
  return requireSignIn();
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
          fetch: path.startsWith('/search/') ? globalThis.fetch : viewerFetch(),
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

<RatingPopover label="Rate {target.title}" {value} {busy} {locked} {variant} {hint} {trigger}
  onopen={open}
  onrate={rate} />
