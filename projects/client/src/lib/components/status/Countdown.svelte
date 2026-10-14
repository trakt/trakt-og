<!--
  The time left on something being watched now, ticking down every second like the watching-now player's (once a
  minute under reduced motion, without the seconds): "−4:12". A screen reader hears the minutes left, not each tick.
  Pass `children` to draw it differently, a tag pill say; it gets the ticking text.
    <Countdown startedAt={watch.startedAt} endsAt={watch.expiresAt} />
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import { prefersReducedMotion } from 'svelte/motion';
import { watchingProgress } from '$lib/users/watchingProgress';

interface Props {
  startedAt: string;
  endsAt: string;
  children?: Snippet<[string]>;
}

const { startedAt, endsAt, children }: Props = $props();

let now = $state(Date.now());
const reducedMotion = $derived(prefersReducedMotion.current);
const runtime = $derived((Date.parse(endsAt) - Date.parse(startedAt)) / 60_000);
const progress = $derived(watchingProgress({ endsAt, runtime, action: 'scrobble', now, reducedMotion }));
const text = $derived(`−${progress.remaining}`);
const minutesLeft = $derived(Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 60_000)));

$effect(() => {
  now = Date.now();
  const timer = setInterval(() => (now = Date.now()), reducedMotion ? 60_000 : 1000);
  return () => clearInterval(timer);
});
</script>

<time class="countdown" role="timer" datetime={endsAt}
  aria-label="{minutesLeft} {minutesLeft === 1 ? 'minute' : 'minutes'} left"
>{#if children}{@render children(text)}{:else}{text}{/if}</time>

<style>
.countdown {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
