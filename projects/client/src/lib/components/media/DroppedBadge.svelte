<!--
  The dropped stamp: a tilted "Dropped" rubber stamp with the drop date, over a poster or fanart the card fades toward
  gray. Put it inside the positioned image box; it sizes itself by the box's shorter side. With a target, the stamp is
  the button that opens the shared restore confirmation, and the art around it still clicks through to its link.
-->
<script lang="ts">
import VisibilityControl from '$lib/components/visibility/VisibilityControl.svelte';
import type { VisibilityTarget } from '$lib/components/visibility/VisibilityTarget';

interface Props {
  target?: VisibilityTarget;
  date?: string;
  /** The last episode watched ("3x02"), on the summary poster. */
  episode?: string;
}

const { target, date, episode }: Props = $props();
const label = $derived(['Dropped', date && `on ${date}`, episode && `after ${episode}`].filter(Boolean).join(' '));
</script>

{#snippet stamp()}
  <span class="stamp">
    <span class="word">Dropped</span>
    {#if date}<span class="line">{date}</span>{/if}
    {#if episode}<span class="line">Last seen {episode}</span>{/if}
  </span>
{/snippet}

<div class="dropped-badge">
  {#if target}
    <VisibilityControl {target} action="restore" variant="badge" tooltip="Undrop this show">{@render stamp()}</VisibilityControl>
  {:else}
    <span role="img" aria-label={label}>{@render stamp()}</span>
  {/if}
</div>

<style>
.dropped-badge {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  container-type: size;
  pointer-events: none;

  & > :global(*) {
    pointer-events: auto;
  }
}

.stamp {
  display: grid;
  justify-items: center;
  gap: 0.15em;
  padding: var(--dropped-stamp-padding);
  border: var(--dropped-stamp-border) solid currentcolor;
  border-radius: var(--radius-dropped-stamp);
  background-color: var(--color-dropped-stamp-bg);
  box-shadow:
    inset 0 0 0 calc(var(--dropped-stamp-border) / 2) var(--color-dropped-stamp-bg),
    inset 0 0 0 var(--dropped-stamp-border) currentcolor;
  color: var(--color-dropped-stamp);
  font-family: var(--font-headings);
  font-size: var(--font-size-dropped-stamp);
  font-weight: var(--font-weight-dropped-stamp);
  line-height: 1;
  white-space: nowrap;
  transform: rotate(var(--dropped-stamp-tilt));
  transition: background-color var(--transition-card), color var(--transition-card);
}

.dropped-badge :global(.visibility-trigger:is(:hover, :focus-visible) .stamp) {
  background-color: var(--color-dropped-stamp-hover-bg);
  color: var(--color-dropped-stamp-hover);
  box-shadow:
    inset 0 0 0 calc(var(--dropped-stamp-border) / 2) var(--color-dropped-stamp-hover-bg),
    inset 0 0 0 var(--dropped-stamp-border) currentcolor;
}

.word {
  padding-inline-start: var(--letter-spacing-dropped-stamp);
  letter-spacing: var(--letter-spacing-dropped-stamp);
  text-transform: uppercase;
}

.line {
  font-size: var(--font-size-dropped-stamp-line);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .stamp {
    transition: none;
  }
}
</style>
