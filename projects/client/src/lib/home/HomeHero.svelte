<!--
  The landing hero: "Trakt" over a giant OG Redux lockup, where the red Trakt mark rolls in from the left and lands as
  the O, then the red G, the white "Redux" and the copy rise into place. Behind it, the hand-picked titles' fanart
  crossfades every six seconds, each settling from a slight zoom, and tints the header's glass. The current title is
  credited bottom right with a link to its page. Under reduced motion nothing rolls, rises or rotates.
-->
<script lang="ts">
import { resolve } from '$app/paths';
import TraktMark from '$lib/components/brand/TraktMark.svelte';
import { headerArt } from '$lib/components/header/headerArt';
import { SvelteSet } from 'svelte/reactivity';
import type { HomeFanart } from './toHomeFanarts.ts';

interface Props {
  fanarts: readonly HomeFanart[];
  signedIn: boolean;
}

const { fanarts, signedIn }: Props = $props();
const ROTATE_MS = 6000;

let index = $state(0);
// A fanart loads the slide before it shows, so the crossfade never waits on the network.
const shown = new SvelteSet([0, 1]);
const current = $derived(fanarts.at(index));

$effect(() => {
  if (fanarts.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
      <a class="sign-in" href={signedIn ? resolve('/dashboard') : resolve('/auth/signin')}>
        {signedIn ? 'Dashboard' : 'Sign in'} ➟
      </a>
    </div>
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
.hero {
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

.sign-in {
  display: inline-flex;
  align-items: center;
  block-size: var(--home-sign-in-height);
  padding-inline: var(--home-sign-in-inline);
  border-radius: var(--radius-home-pill);
  background: var(--brand-primary);
  color: var(--color-home-text);
  font-size: var(--font-size-home-sign-in);
  font-weight: var(--font-weight-headings-heavy);
  text-decoration: none;

  &:hover,
  &:focus-visible {
    background: var(--brand-primary-darken);
    color: var(--color-home-text);
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
</style>
