<!-- "Please adjust your Trakting": a haunted VHS screen with a glitching Trakt mark and a do-not-tape-over cassette. -->
<script lang="ts">
import { fitToParent } from './fitToParent.ts';
import TraktMark from '$lib/components/brand/TraktMark.svelte';

const trackingBars = [true, true, true, true, true, true, false, false];
</script>

<svelte:head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=VT323&family=Permanent+Marker&display=swap" />
</svelte:head>

<main>
  <div class="band" aria-hidden="true"></div>
  <div class="scanlines" aria-hidden="true"></div>

  <div class="screen" {@attach fitToParent}>
    <div class="osd" aria-hidden="true">
      <span class="play">PLAY <svg viewBox="0 0 10 10"><path d="M1 0 L10 5 L1 10Z" fill="currentColor" /></svg></span>
      <span>SP&#160;&#160;-:--:--</span>
    </div>

    <div class="center">
      <div class="logo">
        <svg class="ghost red" aria-hidden="true" viewBox="0 0 98.1 98.1">
          <TraktMark ink="var(--brand-primary)" />
        </svg>
        <svg class="ghost blue" aria-hidden="true" viewBox="0 0 98.1 98.1">
          <TraktMark ink="var(--brand-secondary)" />
        </svg>
        <svg role="img" aria-label="The Trakt logo, glitching on a VHS screen" viewBox="0 0 98.1 98.1">
          <TraktMark ink="var(--vhs-text)" />
        </svg>
      </div>
      <h1>OG REANIMATED</h1>
      <p class="subtitle">PLEASE ADJUST YOUR TRAKTING</p>
      <div class="tracking" aria-hidden="true">
        <span>TRACKING</span>
        <span class="bars">
          {#each trackingBars as filled, index (index)}
            <span class="bar" class:filled></span>
          {/each}
        </span>
      </div>
    </div>

    <div class="bottom">
      <p class="soon">● COMING SOON</p>
      <svg
        class="tape"
        role="img"
        aria-label="A VHS tape labelled OG Reanimated, do not tape over, with stickers reading Be kind, rewatch and Late fees waived for the undead"
        viewBox="0 0 560 260"
      >
        <rect x="10" y="20" width="520" height="220" rx="12" fill="#111" />
        <rect x="40" y="40" width="460" height="92" rx="4" fill="#fff" />
        <rect x="40" y="40" width="460" height="16" fill="#ed1c24" />
        <text x="270" y="102" text-anchor="middle" class="marker" font-size="34" fill="#111">OG REANIMATED</text>
        <text x="270" y="126" text-anchor="middle" class="marker" font-size="16"
          fill="#c61017">DO NOT TAPE OVER!!!</text>
        <rect x="150" y="156" width="240" height="64" rx="6" fill="#292929" />
        <circle cx="210" cy="188" r="24" fill="#3d3d3d" />
        <circle cx="210" cy="188" r="8" fill="#111" />
        <circle cx="330" cy="188" r="24" fill="#3d3d3d" />
        <circle cx="330" cy="188" r="8" fill="#111" />
        <g transform="rotate(14 470 50)">
          <circle cx="470" cy="50" r="48" fill="#f0ad4e" />
          <text x="470" y="44" text-anchor="middle" font-size="20" fill="#111">BE KIND,</text>
          <text x="470" y="66" text-anchor="middle" font-size="20" fill="#111">REWATCH</text>
        </g>
        <g transform="rotate(-6 90 220)">
          <rect x="0" y="196" width="200" height="50" fill="#ed1c24" />
          <text x="100" y="217" text-anchor="middle" font-size="18" fill="#fff">LATE FEES WAIVED</text>
          <text x="100" y="236" text-anchor="middle" font-size="18" fill="#fff">FOR THE UNDEAD</text>
        </g>
      </svg>
    </div>
  </div>
</main>

<style>
:global(html) {
  color-scheme: dark;
}

:global(body) {
  margin: 0;
  background: var(--vhs-ink);
}

main {
  position: relative;
  overflow: hidden;
  block-size: 100dvh;
  font-family: var(--font-vhs);
  color: var(--vhs-text);
  background: var(--vhs-screen);
}

.band {
  position: absolute;
  inset-inline: 0;
  inset-block-start: 0;
  block-size: var(--vhs-band-height);
  background: var(--vhs-band);
  pointer-events: none;
  animation: band 6s linear infinite;
}

.scanlines {
  position: absolute;
  inset: 0;
  background: var(--vhs-scanlines);
  pointer-events: none;
}

.screen {
  position: relative;
  box-sizing: border-box;
  min-block-size: 100%;
  transform-origin: top center;
  max-inline-size: var(--vhs-max);
  margin-inline: auto;
  padding: var(--vhs-padding);
  display: flex;
  flex-direction: column;
  gap: var(--vhs-gap);
}

.osd {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--vhs-gap);
  font-size: var(--font-size-vhs-osd);
  line-height: 1;
  text-shadow: var(--vhs-shadow-osd);
}

.play {
  display: inline-flex;
  align-items: center;
  gap: var(--vhs-osd-gap);

  & svg {
    inline-size: var(--vhs-play-icon);
  }
}

.center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--vhs-center-gap);
  text-align: center;
}

.logo {
  position: relative;
  inline-size: var(--vhs-logo);
  block-size: var(--vhs-logo);
  animation: jitter 0.35s steps(2) infinite;

  & svg {
    position: absolute;
    inset: 0;
  }
}

.ghost {
  mix-blend-mode: screen;
  opacity: 0.9;
}

.red {
  transform: translateX(calc(-1 * var(--vhs-ghost-offset)));
}

.blue {
  transform: translateX(var(--vhs-ghost-offset));
}

h1 {
  margin: 0;
  font-weight: 400;
  font-size: var(--font-size-vhs-title);
  line-height: 0.85;
  letter-spacing: 0.04em;
  text-shadow: var(--vhs-shadow-title);
}

.subtitle {
  margin: 0;
  font-size: var(--font-size-vhs-subtitle);
  letter-spacing: 0.08em;
}

.tracking {
  display: flex;
  align-items: center;
  gap: var(--vhs-osd-gap);
  font-size: var(--font-size-vhs-tracking);
}

.bars {
  display: flex;
  gap: var(--vhs-tracking-gap);
}

.bar {
  box-sizing: border-box;
  inline-size: var(--vhs-tracking-bar-width);
  block-size: var(--vhs-tracking-bar-height);
  border: 2px solid var(--vhs-text);

  &.filled {
    background: var(--vhs-text);
  }
}

.bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--vhs-gap);
}

.soon {
  margin: 0;
  font-size: var(--font-size-vhs-osd);
  line-height: 1;
  animation: blink 1.2s steps(1) infinite;
}

.tape {
  inline-size: var(--vhs-tape-width);
  max-inline-size: 100%;
  transform: rotate(-3deg);
  font-family: var(--font-vhs);
}

.marker {
  font-family: var(--font-vhs-marker);
}

@keyframes band {
  from {
    transform: translateY(-120px);
  }
  to {
    transform: translateY(100dvh);
  }
}

@keyframes jitter {
  0%,
  100% {
    transform: translate(0, 0);
  }
  20% {
    transform: translate(-3px, 1px);
  }
  40% {
    transform: translate(2px, -1px);
  }
  60% {
    transform: translate(-1px, 0);
  }
}

@keyframes blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .band,
  .logo,
  .soon {
    animation: none;
  }
}
</style>
