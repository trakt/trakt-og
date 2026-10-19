<!--
  How far a comment is from the API's word minimum, in a box the composer buttons' size that isn't one: its fill and
  outline turn a little greener with every word until the minimum, then settle on the met green. A ring fills beside
  "3/5 words", and once the minimum is met it's a filled check beside the count alone. The textarea points at it, so screen readers hear the rule.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import circleCheck from '$lib/icons/solid/circle-check.svg?raw';

interface Props {
  id: string;
  words: number;
  min: number;
}

const { id, words, min }: Props = $props();
const met = $derived(words >= min);
const progress = $derived(Math.min(words / min, 1));
</script>

<span class={['meter', { met }]} {id} style:--progress={progress}>
  {#if met}<span class="check"><Icon svg={circleCheck} /></span>{:else}<span class="ring" aria-hidden="true"></span>{/if}
  <span class="count"><strong>{met ? words : `${words}/${min}`}</strong> {words === 1 && met ? 'word' : 'words'}</span>
</span>

<style>
.meter {
  --green: var(--color-comment-meter-met);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--comment-meter-gap);
  min-block-size: var(--dialog-art-button-height);
  padding: var(--comment-meter-padding);
  border: 1px solid color-mix(in srgb, var(--green) calc(var(--progress) * var(--comment-meter-line)),
    var(--color-control-border));
  border-radius: var(--radius-control);
  background-color: color-mix(in srgb, var(--green) calc(var(--progress) * var(--comment-meter-tint)),
    var(--color-control-bg));
  color: var(--color-comment-muted);
  font-family: var(--font-headings);
  font-size: var(--font-size-dialog-art-button);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.ring {
  flex: none;
  inline-size: var(--comment-meter-ring);
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(var(--green) calc(var(--progress) * 100%), var(--color-dialog-art-meter-track) 0);
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - var(--comment-meter-ring-thickness)),
    #000 calc(100% - var(--comment-meter-ring-thickness))
  );
}

.check {
  display: inline-flex;
  font-size: var(--comment-meter-ring);
}

strong {
  color: var(--color-control-text);
  font-weight: var(--font-weight-headings-heavy);
}

.met {
  color: var(--green);

  & strong {
    color: inherit;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .meter {
    transition: background-color var(--transition-see-more), border-color var(--transition-see-more);
  }
}
</style>
