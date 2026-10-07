<!-- "It came back from the archive!": a 1950s B-movie lobby card starring the Trakt mark as Frankenstein's monster. -->
<script lang="ts">
import { fitToParent } from './fitToParent.ts';
import ReanimatedMonster from './ReanimatedMonster.svelte';
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Creepster&family=Oswald:wght@500;700&family=Figtree:ital,wght@1,700&display=swap"
  />
</svelte:head>

<main>
  <article {@attach fitToParent}>
    <div class="art">
      <ReanimatedMonster />
    </div>

    <div class="copy">
      <p class="presents">Trakt Pictures presents</p>
      <p class="kicker">It came back from the archive!</p>
      <h1>OG Reanimated</h1>
      <p class="tagline">It's alive! …and it remembers everything you watched.</p>
      <p class="billing">
        Starring <strong>your watch history</strong> · with <strong>every show you swore you'd finish</strong> · and
        <strong>the classic layout
          <span class="vamp" title="I vant to suck your pixels.">revamped<span class="drip"></span></span></strong>
        as itself
      </p>
      <div class="footer">
        <p class="rating">
          <span class="rating-letter">R</span>
          <span class="rating-note">Rated R for Rewatchable. Contains scenes of intense bingeing.</span>
        </p>
        <p class="release">Coming soon to a<br />browser near you</p>
      </div>
    </div>
  </article>
</main>

<style>
:global(html) {
  color-scheme: dark;
}

:global(body) {
  margin: 0;
  background: var(--reanimated-card);
}

/* The whole viewport is the printed card: red stock, halftone dots, then grain and worn edges over everything. */
main {
  position: relative;
  overflow: hidden;
  block-size: 100dvh;
  box-sizing: border-box;
  padding: var(--reanimated-page-padding);
  display: grid;
  place-items: safe center;
  font-family: var(--font-body);
  color: var(--reanimated-text);
  background-color: var(--reanimated-card);
  background-image: var(--reanimated-halftone);
  background-size: var(--reanimated-halftone-size) var(--reanimated-halftone-size);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--reanimated-wear), var(--reanimated-noise);
    background-size: auto, var(--reanimated-noise-size) var(--reanimated-noise-size);
    mix-blend-mode: multiply;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--reanimated-light);
    mix-blend-mode: soft-light;
    pointer-events: none;
  }
}

article {
  position: relative;
  transform-origin: top center;
  z-index: 1;
  inline-size: 100%;
  max-inline-size: var(--reanimated-card-max);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--reanimated-gap);
}

/* As big as the viewport allows: limited by width, and by height so the head never runs off the bottom. */
.art {
  flex: 1 1 var(--reanimated-art-basis);
  min-inline-size: 0;
  max-inline-size: min(var(--reanimated-art-max), var(--reanimated-art-height) * 480 / 380);
}

.copy {
  flex: 1 1 var(--reanimated-copy-basis);
  min-inline-size: 0;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: var(--reanimated-stack-gap);

  & p {
    margin: 0;
  }
}

.presents {
  font-family: var(--font-reanimated-condensed);
  font-weight: 700;
  font-size: var(--font-size-reanimated-presents);
  letter-spacing: var(--reanimated-presents-tracking);
  text-transform: uppercase;
  color: var(--reanimated-accent);
}

.kicker {
  font-family: var(--font-reanimated-display);
  font-size: var(--font-size-reanimated-kicker);
  line-height: 1;
  white-space: nowrap;
  color: var(--reanimated-accent);
  text-shadow: var(--reanimated-shadow-kicker);
}

h1 {
  margin: 0;
  font-family: var(--font-reanimated-display);
  font-weight: 400;
  font-size: var(--font-size-reanimated-title);
  line-height: 0.9;
  letter-spacing: 0.02em;
  text-shadow: var(--reanimated-shadow-title);
}

.tagline {
  font-size: var(--font-size-reanimated-tagline);
  font-weight: 700;
  font-style: italic;
  white-space: nowrap;
}

.billing {
  padding-block: var(--reanimated-billing-padding);
  border-block: 2px solid var(--reanimated-rule);
  font-family: var(--font-reanimated-condensed);
  font-weight: 500;
  font-size: var(--font-size-reanimated-billing);
  line-height: 1.5;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  & strong {
    font-weight: 700;
    font-size: var(--font-size-reanimated-billing-name);
  }
}

/* The easter egg: hover "revamped" and it bares its fangs and drips. */
.vamp {
  position: relative;
  display: inline-block;
  padding-inline: 3px;
  cursor: help;
  transition:
    color 0.2s,
    background-color 0.2s;

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset-block-start: 100%;
    border-inline: var(--reanimated-fang) solid transparent;
    border-block-start: var(--reanimated-fang-length) solid var(--reanimated-text);
    opacity: 0;
    transform: translateY(-6px);
    transition:
      opacity 0.2s,
      transform 0.2s;
  }

  &::before {
    inset-inline-start: 28%;
  }

  &::after {
    inset-inline-start: 58%;
  }

  &:hover {
    background: var(--reanimated-ink);
    color: var(--reanimated-blood);

    &::before,
    &::after {
      opacity: 1;
      transform: none;
    }

    & .drip {
      block-size: var(--reanimated-drip);
    }
  }
}

.drip {
  position: absolute;
  inset-inline-start: calc(58% + 2px);
  inset-block-start: calc(100% + 8px);
  inline-size: var(--reanimated-fang);
  block-size: 0;
  border-radius: 0 0 3px 3px;
  background: var(--brand-primary);
  transition: block-size 0.7s ease-in 0.2s;
}

.footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--reanimated-footer-gap);
}

.rating {
  display: flex;
  align-items: center;
  gap: var(--reanimated-rating-gap);
  padding: var(--reanimated-rating-padding);
  border: 3px solid var(--reanimated-text);
  background: var(--reanimated-ink);
}

.rating-letter {
  font-family: var(--font-reanimated-condensed);
  font-weight: 700;
  font-size: var(--font-size-reanimated-rating);
  line-height: 1;
}

.rating-note {
  max-inline-size: var(--reanimated-rating-note-max);
  font-size: var(--font-size-reanimated-rating-note);
  line-height: 1.35;
}

.release {
  font-family: var(--font-reanimated-condensed);
  font-weight: 700;
  font-size: var(--font-size-reanimated-release);
  line-height: 1.1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--reanimated-accent);
}

@media (prefers-reduced-motion: reduce) {
  .vamp,
  .vamp::before,
  .vamp::after,
  .drip {
    transition: none;
  }
}
</style>
