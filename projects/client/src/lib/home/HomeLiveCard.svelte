<!--
  The hero's Live now box: how many people are watching right now, Trending's own count, then shows against movies as a
  bar and a pill for each that links to its trending chart, as on Trending's Live now. When the page refreshes the numbers, they roll to the new ones.
  Until the first count arrives, shimmering bars hold the count's, its caption's, the bar's and the pills' places,
  each where its letters will be.
-->
<script lang="ts">
import { resolve } from '$app/paths';
import TagPills from '$lib/components/labels/TagPills.svelte';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import StatusDot from '$lib/components/status/StatusDot.svelte';
import { compactCount } from '$lib/utils/compactCount';
import { cubicOut } from 'svelte/easing';
import { prefersReducedMotion, Tween } from 'svelte/motion';
import type { HomeLive } from './live/toHomeLive.ts';

interface Props {
  live: HomeLive | null;
}

const { live }: Props = $props();
const ROLL_MS = 1400;

const options = () => ({ duration: prefersReducedMotion.current ? 0 : ROLL_MS, easing: cubicOut });
const shows = new Tween(0, { duration: 0 });
const movies = new Tween(0, { duration: 0 });
let counted = false;

$effect(() => {
  if (!live) return;
  const roll = counted ? options() : { duration: 0 };
  counted = true;
  void shows.set(live.shows, roll);
  void movies.set(live.movies, roll);
});

// Whole thousands (245K), short enough to keep the caption on the figures' line.
const short = new Intl.NumberFormat('en-US', { notation: 'compact' });
const count = (n: number) => short.format(Math.round(n));
</script>

<section class="live" aria-labelledby="home-live-title" aria-busy={!live}>
  <h2 id="home-live-title" class="label"><StatusDot kind="live" />Live now on Trakt</h2>
  {#if live}
    <div class="meter">
      <p class="count"><b>{count(shows.current + movies.current)}</b> watching right now</p>
      <div class="split" aria-hidden="true">
        <span class="shows" style:flex-grow={shows.current}></span>
        <span class="movies" style:flex-grow={movies.current}></span>
      </div>
    </div>
    <p class="key">
      <a href={resolve('/shows/[chart=chart]', { chart: 'trending' })}>
        <TagPills tags={[{ lead: compactCount(Math.round(shows.current)), text: 'shows', kind: 'primary' }]} />
      </a>
      <a href={resolve('/movies/[chart=chart]', { chart: 'trending' })}>
        <TagPills tags={[{ lead: compactCount(Math.round(movies.current)), text: 'movies' }]} />
      </a>
    </p>
  {:else}
    <p class="counting">Counting everyone watching…</p>
    <div class="meter" aria-hidden="true">
      <p class="count">
        <span class="figures">
          <Shimmer inline="var(--home-live-shimmer-count-width)" block="var(--home-live-shimmer-count-height)" />
        </span>
        <Shimmer inline="var(--home-live-shimmer-caption-width)" block="var(--home-live-shimmer-caption-height)" />
      </p>
      <Shimmer inline="100%" block="var(--home-live-split-height)" />
    </div>
    <p class="key" aria-hidden="true">
      <Shimmer inline="var(--home-live-shimmer-pill-width)" block="var(--home-live-shimmer-pill-height)" />
      <Shimmer inline="var(--home-live-shimmer-pill-width)" block="var(--home-live-shimmer-pill-height)" />
    </p>
  {/if}
</section>

<style>
.live {
  display: grid;
  gap: var(--home-live-gap);
  align-content: start;
  inline-size: var(--home-live-width);
  max-inline-size: 100%;
  padding: var(--home-live-padding);
  border: 1px solid var(--color-home-line);
  border-radius: var(--radius-container);
  background: var(--color-home-glass);
  backdrop-filter: blur(var(--home-live-blur));
}

.label {
  display: flex;
  gap: var(--space-sm-inline);
  align-items: center;
  margin: 0;
  font-size: var(--font-size-home-live-label);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-home-live-label);
  line-height: 1;
  text-transform: uppercase;
  color: var(--color-home-text);
}

.meter {
  display: grid;
  gap: var(--home-live-meter-gap);
}

.count {
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--home-live-caption-gap);
  align-items: baseline;
  /* The figures' line box leaves room for descenders they don't have: pull the bar up under them. */
  margin: var(--home-live-count-top) 0 var(--home-live-count-bottom);
  font-size: var(--font-size-home-live-caption);
  color: var(--color-home-soft);

  & b {
    font-family: var(--font-box-office-figures);
    font-size: var(--font-size-home-live);
    font-stretch: condensed;
    font-weight: var(--font-weight-headings-heavy);
    font-variant-numeric: tabular-nums;
    line-height: var(--line-height-home-live);
    color: var(--color-home-text);
  }
}

.split {
  display: flex;
  gap: var(--home-live-split-gap);
  block-size: var(--home-live-split-height);

  & span {
    border-radius: var(--radius-tag);
  }
}

.shows {
  background: var(--brand-primary);
}

.movies {
  background: var(--color-home-movies);
}

.key {
  /* Trending's Live now pills, a size up for the hero. */
  --font-size-search-pill: var(--font-size-home-live-key);
  --search-pill-padding: var(--home-live-pill-padding);
  display: flex;
  justify-content: space-between;
  margin: 0;

  & a {
    border-radius: var(--radius-search-pill);
    text-decoration: none;

    &:is(:hover, :focus-visible) {
      opacity: var(--opacity-live-now-key-hover);
    }
  }
}

/* Where the figures' ink sits on their line, so their bar sits where they will. */
.figures {
  display: flex;
  margin-block: var(--home-live-shimmer-count-margin);
}

/* Said to screen readers only; the shimmer shows it. */
.counting {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
