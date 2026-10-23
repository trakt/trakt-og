<!--
  The landing hero: "Trakt" over the OG Redux lockup, where the red Trakt mark rolls in from the left and lands as
  the O, then the red G, the white "Redux" and the copy rise into place. Beside it, the Live now box. Behind it, the
  hand-picked titles' fanart crossfades every six seconds, each settling from a slight zoom, and tints the header's
  glass. The current title is credited bottom right with a link to its page. Under reduced motion nothing rolls, rises
  or rotates.
-->
<script lang="ts">
import { resolve } from '$app/paths';
import TraktMark from '$lib/components/brand/TraktMark.svelte';
import { headerArt } from '$lib/components/header/headerArt';
import { SvelteSet } from 'svelte/reactivity';
import HomeLiveCard from './HomeLiveCard.svelte';
import type { HomeLive } from './live/toHomeLive.ts';
import type { HomeFanart } from './toHomeFanarts.ts';
import { prefersReducedMotion } from 'svelte/motion';

interface Props {
  fanarts: readonly HomeFanart[];
  signedIn: boolean;
  /** Null until the count streams in, and when it fails; `showLive` says whether to keep the box. */
  live: HomeLive | null;
  showLive: boolean;
}

const { fanarts, signedIn, live, showLive }: Props = $props();
const ROTATE_MS = 6000;

let index = $state(0);
// A fanart loads the slide before it shows, so the crossfade never waits on the network.
const shown = new SvelteSet([0, 1]);
const current = $derived(fanarts.at(index));

$effect(() => {
  if (fanarts.length < 2 || prefersReducedMotion.current) return;
  const next = (index + 1) % fanarts.length;
  const timer = setTimeout(() => {
    shown.add((next + 1) % fanarts.length);
    index = next;
  }, ROTATE_MS);
  return () => clearTimeout(timer);
});
</script>

<!-- A fanart's credit links to its media page, a route resolve() can't type from a string. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<section class="hero" aria-labelledby="home-title" {@attach headerArt(current?.image)}>
  {#each fanarts as fanart, slot (fanart.key)}
    {#if shown.has(slot)}
      <img
        class={['backdrop', { current: slot === index }]}
        src={fanart.image}
        alt=""
        decoding="async"
        fetchpriority={slot === 0 ? 'high' : 'auto'}
      />
    {/if}
  {/each}

  <div class="stage">
    <div class="copy">
      <h1 id="home-title" class="lockup" aria-label="Trakt OG Redux">
        <span class="trakt" aria-hidden="true">Trakt</span>
        <span class="name" aria-hidden="true">
          <svg class="mark" viewBox="0 0 98.1 98.1"><TraktMark ink="var(--brand-primary)" /></svg>
          <span class="g">G</span>
          <span class="redux">Redux</span>
        </span>
      </h1>
      <div class="lede">
        <p>A rebuild of classic Trakt for big screens. Built on the Trakt API, and open source.</p>
        <div class="actions">
          {#if signedIn}
            <a class="button primary" href={resolve('/dashboard')}>Dashboard</a>
          {:else}
            <a class="button primary" href={resolve('/auth/signin')}>Sign In</a>
            <!-- Trakt's sign-in page also creates accounts. -->
            <a class="button" href={resolve('/auth/signin')}>Join Trakt</a>
          {/if}
        </div>
      </div>
    </div>
    {#if showLive}
      <div class="live-slot"><HomeLiveCard {live} /></div>
    {/if}
  </div>

  {#if current}
    <div class="credit">
      <span class="label">Now showing</span>
      <a href={current.href}>{current.title}</a>
      {#if fanarts.length > 1}
        <span class="dashes" aria-hidden="true">
          {#each fanarts as fanart, slot (fanart.key)}
            <i class={{ current: slot === index }}></i>
          {/each}
        </span>
      {/if}
    </div>
  {/if}
</section>

<style>
/* Dark in either theme, over its fanart. Its text color is set again so it resolves dark here too. */
.hero {
  color-scheme: dark;
  color: var(--color-home-text);
  position: relative;
  isolation: isolate;
  container-type: inline-size;
  display: grid;
  align-content: center;
  min-block-size: var(--home-hero-min-height);
  overflow: hidden;
  padding-block: calc(var(--header-height) + var(--home-hero-top)) var(--home-hero-bottom);
  padding-inline: max(var(--home-gutter), calc((100% - var(--home-content-width)) / 2));
  background-color: var(--color-home-bg);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--home-hero-shade);
  }
}

.backdrop {
  position: absolute;
  inset: 0;
  z-index: -2;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  object-position: var(--home-hero-image-position);
  opacity: 0;
  scale: var(--home-fanart-zoom);
  transition: opacity var(--home-fanart-fade) ease, scale var(--home-fanart-drift) linear;

  &.current {
    opacity: 1;
    scale: 1;
  }
}

.stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--home-hero-columns-gap);
  align-items: center;
}

.copy {
  display: grid;
  gap: var(--home-hero-gap);
  justify-items: start;
}

.lockup {
  display: grid;
  gap: var(--home-hero-gap);
  margin: 0;
  font-weight: var(--font-weight-home-display);
}

.trakt {
  font-size: var(--font-size-home-trakt);
  letter-spacing: var(--letter-spacing-home-trakt);
  text-transform: uppercase;
  color: var(--color-home-text);
}

.name {
  display: flex;
  align-items: center;
  font-size: var(--font-size-home-wordmark);
  line-height: var(--line-height-home-wordmark);
  letter-spacing: var(--letter-spacing-home-wordmark);
  white-space: nowrap;
  text-shadow: var(--shadow-home-wordmark);
}

.mark {
  flex: none;
  inline-size: var(--home-mark-size);
  block-size: var(--home-mark-size);
  margin-inline-end: var(--home-mark-gap);
  filter: var(--shadow-home-mark);
}

.g {
  color: var(--brand-primary);
}

.redux {
  margin-inline-start: var(--home-redux-gap);
  color: var(--color-home-text);
}

.lede {
  display: grid;
  gap: var(--home-lede-gap);
  justify-items: start;

  & p {
    max-inline-size: var(--home-lede-width);
    margin: 0;
    font-size: var(--font-size-home-lede);
    color: var(--color-home-soft);
  }
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--home-actions-gap);
}

/* og's standard buttons, a size up for the hero: red to sign in, a light outline to join. */
.button {
  display: inline-flex;
  align-items: center;
  block-size: var(--control-height-large);
  padding-inline: var(--home-button-inline);
  border-radius: var(--radius-object);
  box-shadow: inset 0 0 0 1px var(--color-home-button-line);
  color: var(--color-home-text);
  font-size: var(--font-size-home-button);
  font-weight: var(--font-weight-headings-heavy);
  text-decoration: none;
  transition: background-color 0.2s, box-shadow 0.2s;

  &:is(:hover, :focus-visible) {
    background: var(--color-home-button-hover);
    color: var(--color-home-text);
  }

  &.primary {
    background: var(--brand-primary);
    box-shadow: none;

    &:is(:hover, :focus-visible) {
      background: var(--brand-primary-darken);
    }
  }
}

.credit {
  position: absolute;
  inset-inline-end: var(--home-credit-inline);
  inset-block-end: var(--home-credit-block);
  display: grid;
  justify-items: end;
  gap: var(--home-credit-gap);
  text-align: end;

  & a {
    font-size: var(--font-size-home-credit);
    font-weight: var(--font-weight-headings-heavy);
    color: var(--color-home-text);
    text-decoration: none;

    &:hover,
    &:focus-visible {
      color: var(--brand-primary);
    }
  }
}

.label {
  font-size: var(--font-size-home-credit-label);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-home-label);
  text-transform: uppercase;
  color: var(--color-home-muted);
}

.dashes {
  display: flex;
  gap: var(--home-dash-gap);
  margin-block-start: var(--home-dashes-gap);

  & i {
    inline-size: var(--home-dash-width);
    block-size: var(--home-dash-height);
    background: var(--color-home-dash);

    &.current {
      background: var(--brand-primary);
    }
  }
}

@media (prefers-reduced-motion: no-preference) {
  .mark {
    animation: roll var(--home-roll-duration) var(--ease-home) both;
  }

  .g,
  .redux,
  .trakt,
  .lede {
    animation: rise var(--home-rise-duration) var(--ease-home) both;
  }

  .g {
    animation-delay: var(--home-rise-delay-g);
  }

  .redux {
    animation-delay: var(--home-rise-delay-redux);
  }

  .trakt,
  .lede {
    animation-delay: var(--home-rise-delay-copy);
  }
}

@media (prefers-reduced-motion: reduce) {
  .backdrop {
    transition: none;
    scale: 1;
  }
}

@keyframes roll {
  from {
    translate: var(--home-roll-from) 0;
    rotate: var(--home-roll-turns);
  }
}

@keyframes rise {
  from {
    opacity: 0;
    translate: 0 var(--home-rise-from);
  }
}

/* Smaller tablets: a smaller lockup and lede, so the Live now box keeps its place on the right. */
@container (width < 1100px) {
  .name {
    font-size: var(--font-size-home-wordmark-tablet);
  }

  .lede p {
    font-size: var(--font-size-home-lede-tablet);
  }
}

/* The smallest tablet: the copy alone, in from the edge. The width is inside the hero's padding. */
@container (width < 760px) {
  .stage {
    grid-template-columns: minmax(0, 1fr);
    padding-inline-start: var(--home-hero-indent-small);
  }

  .live-slot {
    display: none;
  }

  /* With the box gone, the lockup and lede take their full size again. */
  .name {
    font-size: var(--font-size-home-wordmark);
  }

  .lede p {
    font-size: var(--font-size-home-lede);
  }
}
</style>
