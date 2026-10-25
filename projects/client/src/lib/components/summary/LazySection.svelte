<!--
  The wrapper OG put around each lazy summary section (`#activity`, `#recent-comments-wrapper`, `#popular-lists-wrapper`,
  `#related-items`): an empty placeholder with the section's id, so the sidebar's anchors work, that loads its data
  once it nears the viewport and fades the section in, or at once while `eager` (the comments, when "Add comment"
  opens their form). `pending` holds the section's place with shimmers until then, and it's busy meanwhile. Nothing
  renders when the load fails or comes back empty (`null`), like OG's empty responses.
    <LazySection id="activity" load={() => client.activity(media)}>
      {#snippet pending()}<SummarySectionShimmer section="activity" />{/snippet}
      {#snippet children(activity)}<ActivityTabs {activity} />{/snippet}
    </LazySection>
-->
<script lang="ts" generics="T">
import type { Snippet } from 'svelte';
import { nearViewport } from '../../utils/nearViewport.ts';

interface Props {
  /** The anchor the section nav jumps to. */
  id?: string;
  load: () => Promise<T | null>;
  /** Loads now, without waiting for the viewport. */
  eager?: boolean;
  /** Its place until it loads. Drawn from the start, so keep it cheap: the sections far down wait for the viewport. */
  pending?: Snippet;
  children: Snippet<[T]>;
}

const { id, load, eager = false, pending, children }: Props = $props();

let data = $state<T | null>(null);
let settled = $state(false);
let started = false;

const start = () => {
  if (started) return;
  started = true;
  load()
    .then((loaded) => (data = loaded))
    .catch(() => (data = null))
    .finally(() => (settled = true));
};

$effect(() => {
  if (eager) start();
});
</script>

<div {id} class="lazy-section" aria-busy={!settled} {@attach nearViewport(start)}>
  {#if data !== null}
    <div class="loaded">{@render children(data)}</div>
  {:else if !settled}
    {@render pending?.()}
  {/if}
</div>

<style>
/* jQuery's fadeIn, 400ms. */
.loaded {
  animation: fade-in 0.4s ease-in-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loaded {
    animation: none;
  }
}
</style>
