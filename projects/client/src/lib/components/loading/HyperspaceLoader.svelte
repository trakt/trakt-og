<!--
  The full-screen loader while og signs in or out: stars stream out from behind TraktLoader as og jumps to
  auth.trakt.tv, and fall back into it in `reverse` as it signs out. They ease from a drift up to a slow cruise. The
  mark sits dead center, with a `quote` and its `credit` under it; screen readers hear `label` instead. Anything passed
  as children (a notice) goes under the credit. Under reduced motion the stars hold still and the mark breathes.
    <HyperspaceLoader label="Signing out" quote="May the Force be with you." credit="Han Solo, Star Wars" reverse />
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import { hyperspace } from './hyperspace.ts';
import TraktLoader from './TraktLoader.svelte';

interface Props {
  label: string;
  quote: string;
  credit: string;
  reverse?: boolean;
  children?: Snippet;
}

const { label, quote, credit, reverse = false, children }: Props = $props();
</script>

<div class="hyperspace">
  <canvas aria-hidden="true" {@attach hyperspace({ reverse })}></canvas>
  <div class="mark">
    <TraktLoader size={96} {label} />
    <div class="below">
      <figure aria-hidden="true">
        <blockquote>{quote}</blockquote>
        <figcaption>{credit}</figcaption>
      </figure>
      {@render children?.()}
    </div>
  </div>
</div>

<style>
.hyperspace {
  position: fixed;
  inset: 0;
  z-index: var(--z-loading);
  display: grid;
  place-items: center;
  background-color: var(--color-hyperspace-bg);
  color: var(--color-text-inverse);
  animation: arrive var(--transition-hyperspace-arrive) ease-out;
}

canvas {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
}

/* Only the mark is centered; the line and any notice hang under it. The glow clears the stars behind them. */
.mark {
  position: relative;
  isolation: isolate;
  line-height: 0;

  &::before {
    content: '';
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    z-index: -1;
    inline-size: calc(2 * var(--hyperspace-glow-fade));
    aspect-ratio: 1;
    translate: -50% -50%;
    background: radial-gradient(
      circle,
      var(--color-hyperspace-glow) var(--hyperspace-glow-clear),
      transparent var(--hyperspace-glow-fade)
    );
  }
}

.below {
  position: absolute;
  inset-block-start: calc(100% + var(--space-hyperspace-message));
  inset-inline-start: 50%;
  display: grid;
  justify-items: center;
  gap: var(--space-hyperspace-notice);
  inline-size: var(--hyperspace-text-width);
  translate: -50% 0;
  line-height: var(--line-height-base);
  text-align: center;
}

figure {
  display: grid;
  gap: var(--space-hyperspace-credit);
  margin: 0;
}

blockquote {
  margin: 0;
  font-size: var(--font-size-large);
  font-weight: var(--font-weight-headings);
}

figcaption {
  color: var(--color-hyperspace-credit);
  font-size: var(--font-size-small);
}

@keyframes arrive {
  from {
    opacity: 0;
  }
}
</style>
