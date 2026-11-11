<script lang="ts">
import StatusDot from '#lib/components/status/StatusDot.svelte';
import WatchingNowBar from '#lib/components/users/WatchingNowBar.svelte';
import type { WatchingNow } from '#lib/users/WatchingNow.ts';
import { watchingProgress } from '#lib/users/watchingProgress.ts';
import HeaderMenu from './HeaderMenu.svelte';

const { watching }: { watching: WatchingNow } = $props();

// The dot only changes when the item ends and when it goes away, so a slow clock is enough.
let now = $state(Date.now());
$effect(() => {
  void watching;
  now = Date.now();
  const timer = setInterval(() => (now = Date.now()), 15_000);
  return () => clearInterval(timer);
});

const progress = $derived(watchingProgress({ ...watching, now, reducedMotion: true }));
const label = $derived(
  `You are watching ${watching.title}${watching.episode ? ` ${watching.episode.number}` : ''}`,
);
</script>

<!--
  The header's watching-now dot, left of Help, while you're checked in or scrobbling: OG's live dot, red and pulsing,
  then still green once it has ended, until the watching-now bar would go away. Hovering it, or a click, tap or Enter,
  opens the profile's watching-now player as a card under it.
-->
{#if !progress.gone}
  <div class="watching">
    <HeaderMenu {label} card>
      {#snippet trigger()}<StatusDot kind={progress.finished ? 'done' : 'live'} />{/snippet}
      <WatchingNowBar {watching} owner="self" card />
    </HeaderMenu>
  </div>
{/if}

<style>
  /* Beside Help like the links beside each other, not the account controls' wider gap. */
  .watching {
    margin-inline-end: calc(var(--gap-header-links) - var(--space-header-user));
  }

  .watching :global(.trigger) {
    justify-content: center;
    inline-size: var(--header-pill-height);
    block-size: var(--header-pill-height);
    padding: 0;
    border-radius: var(--radius-header-pill);

    &:hover {
      background-color: var(--color-header-pill);
    }
  }

  .watching :global(.header-menu:has(.menu:popover-open) .trigger) {
    background-color: var(--color-header-pill);
  }
</style>
