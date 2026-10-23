<!--
  A starter pick as its poster alone, with the one thing this spot asks for: "Seen it?" to add it to the
  history, or Add to Watchlist. The poster links to the title. A seen or watchlisted pick keeps its button lit.
-->
<script lang="ts">
import posterPlaceholder from '$lib/assets/placeholders/poster.png';
import WatchlistButton from '$lib/components/lists/WatchlistButton.svelte';
import type { PickAction, StarterPick } from '$lib/firstNight/starterPicks';
import { trackedPosters } from '$lib/firstNight/trackedPosters.svelte';
import { overlay } from '$lib/overlay/overlay';
import SeenItButton from './SeenItButton.svelte';

const { pick, action }: { pick: StarterPick; action: PickAction } = $props();
const target = $derived({ type: pick.type, id: pick.id, title: pick.title });

// A pick the member has seen or saved lands on their first-night reel, and leaves it if they undo.
$effect(() => {
  const state = overlay.state(pick.type, pick.id);
  if (state.watched || state.watchlisted) {
    trackedPosters.remember({ key: pick.key, title: pick.title, image: pick.image });
  } else trackedPosters.forget(pick.key);
});
</script>

<!-- A pick links to its media page, a route resolve() can't type from a string. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="pick">
  <a class="art" href={pick.href} title={pick.year ? `${pick.title} (${pick.year})` : pick.title}>
    <img src={pick.image ?? posterPlaceholder} alt={pick.title} loading="lazy" />
  </a>
  <div class="action">
    {#if action === 'seen'}
      <SeenItButton target={{ ...target, airedEpisodes: pick.airedEpisodes, runtime: pick.runtime,
        released: pick.released }} />
    {:else}
      <WatchlistButton {target} />
    {/if}
  </div>
</div>

<style>
.pick {
  display: grid;
  gap: 8px;
  min-inline-size: 0;
}

.art {
  display: block;
  aspect-ratio: 2 / 3;
  max-inline-size: 100%;
  overflow: hidden;
  border-radius: var(--radius-object);
  background: var(--color-first-night-bg);
  box-shadow: var(--pick-shadow);

  img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    transition: scale 0.3s ease;
  }

  &:is(:hover, :focus-visible) img {
    scale: 1.04;
  }
}

/* The one action, as wide as the poster above it. */
.action {
  display: grid;

  & :global(button) {
    justify-content: center;
    inline-size: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .art img {
    transition: none;
  }
}
</style>
