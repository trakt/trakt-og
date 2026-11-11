<!--
  A dot map of the world where each country's dots darken with its share of the people watching right now. Hovering a
  country lights its dots and opens a card with its share, rank, shows against movies and what most people there are
  watching; a country with only a few people shows just its share. `lit` is shared with `CountryRanking`, so hovering
  a row lights its country here. A key from fewer to more sits under the map. Until the count arrives a light sweeps
  across the gray dots. `tools` sits on the key's line, and `ambient` keeps pings ringing between counts. When new
  counts arrive, each country's dots fade to their new shade and the countries that grew ping, spread over the next
  few seconds. `night` dims the half of the world where it's night, moving on each minute. `fit` sizes the map to fit
  inside its box instead of filling its width.
    <WorldMap countries={live?.countries ?? null} bind:lit label="World map of where people are watching" />
-->
<script lang="ts">
import EmptyNote from '#lib/components/empty/EmptyNote.svelte';
import TagPills from '#lib/components/labels/TagPills.svelte';
import type { HomeLiveCountry } from '#lib/home/live/toHomeLive.ts';
import { type Snippet, untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';
import { ambientPing } from './ambientPing.ts';
import { countryFlag } from './countryFlag.ts';
import { heatLevel } from './heatLevel.ts';
import { nightOf, toPlace } from './nightOf.ts';
import { pingsFor } from './pingsFor.ts';
import { sharePercent } from './sharePercent.ts';
import { type MapDot, toMapDots, type WorldDots } from './toMapDots.ts';
import worldDots from './worldDots.json' with { type: 'json' };

interface Props {
  /** Most watchers first, as `toHomeLive` ranks them; null until the count arrives. */
  countries: readonly HomeLiveCountry[] | null;
  /** The country lit here and in the ranking, with its card open. */
  lit?: string | null;
  /** Places after the point in the card's share. */
  digits?: number;
  night?: boolean;
  fit?: boolean;
  /** The dot grid; the live page passes `worldDotsFine.json`, about three times as many. */
  world?: WorldDots;
  /**
   * Small pings ring out all the time in countries picked by their share, so the map keeps moving while the API's
   * copy is unchanged, alongside a count's own. The live page sets it.
   */
  ambient?: boolean;
  /** Controls on the key's line, at the right: the live page's toggles. */
  tools?: Snippet;
  label: string;
}

let {
  countries,
  lit = $bindable(null),
  digits = 0,
  night = false,
  fit = false,
  world = worldDots,
  ambient = false,
  tools,
  label,
}: Props = $props();

/** Over the top part of the map the card opens below the pointer, so it stays clear of the heading. */
const FLIP_AT = 0.4;
/** The key's shades, as `heatLevel` steps them. */
const KEY = [1, 2, 3, 4, 5] as const;
const MINUTE_MS = 60_000;
/** How long a card stays open after its country clears, waiting for the next one. */
const HOLD_MS = 150;
/** Night and the loading light fade dots in this many steps, so dots batch into a few fills. */
const ALPHA_STEPS = 20;
const map = $derived(toMapDots(world));
const places = $derived(map.dots.map((dot) => toPlace(dot, world.projection)));
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

const byCode = $derived(new Map((countries ?? []).map((country, i) => [country.code, { country, rank: i + 1 }])));

// The pointer's place on the map, in pixels from the box's corner; null when `lit` came from outside (a ranking row,
// a tour), so the card points at the country's first dot instead.
let pointer = $state<{ x: number; y: number } | null>(null);
let box = $state<HTMLElement>();
let frame = $state({ left: 0, top: 0, width: 0, height: 0 });

const anchor = $derived.by(() => {
  if (!lit) return null;
  if (pointer) return pointer;
  const dot = map.first(lit);
  if (!dot || frame.width === 0) return null;
  return { x: frame.left + (dot.x / world.width) * frame.width, y: frame.top + (dot.y / world.height) * frame.height };
});

// The open card: its country and where it points. It stays a moment after `lit` clears, so moving to the next row or
// country glides it there instead of closing and opening it again.
let card = $state<{ code: string; at: { x: number; y: number } } | null>(null);
$effect(() => {
  const code = lit;
  const at = anchor;
  if (code && at) {
    card = { code, at };
    return;
  }
  const close = setTimeout(() => (card = null), HOLD_MS);
  return () => clearTimeout(close);
});

// Placed in pixels, so the translate itself changes and every browser animates it. The first frame of a card goes
// straight to its place; it glides from the next move on.
let boxSize = $state({ width: 0, height: 0 });
let tipSize = $state({ width: 0, height: 0 });
let tipOffset = $state(0);
let glide = $state(false);
const open = $derived(card !== null);
$effect(() => {
  if (!open) {
    glide = false;
    return;
  }
  let frame = requestAnimationFrame(() => (frame = requestAnimationFrame(() => (glide = true))));
  return () => cancelAnimationFrame(frame);
});
const place = $derived.by(() => {
  if (!card) return null;
  const left = Math.min(Math.max(card.at.x - tipSize.width / 2, 0), Math.max(boxSize.width - tipSize.width, 0));
  const below = card.at.y < boxSize.height * FLIP_AT;
  return { left, top: below ? card.at.y + tipOffset : card.at.y - tipSize.height - tipOffset };
});

const tip = $derived.by(() => {
  if (!card) return null;
  const { code } = card;
  const found = byCode.get(code);
  const shows = found?.country.watching && Math.round(found.country.watching.shows * 100);
  return {
    name: found?.country.name ?? regionNames.of(code) ?? code,
    flag: countryFlag(code),
    split: shows === undefined ? undefined : { shows, movies: 100 - shows },
    ...found,
  };
});

// What the canvas draws, kept outside Svelte's state: it changes every frame while shades fade and pings ring.
type Drawing = { loading: boolean; lit: string | null; night: readonly number[] | null; ambient: boolean };
let drawing: Drawing = { loading: true, lit: null, night: null, ambient: false };
let targets: ReadonlyMap<string, number> = new Map();
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- the canvas's own frame state, never read reactively
const shown = new Map<string, number>();
let pings: { dot: MapDot; at: number; big: boolean; ambient?: boolean }[] = [];
let previous: readonly HomeLiveCountry[] | null = null;
let wake = () => {};

const anyDot = (code: string) => {
  const dots = map.of(code);
  return dots.at(Math.floor(Math.random() * dots.length));
};

function arrive(next: readonly HomeLiveCountry[] | null, spreadMs: number) {
  targets = new Map((next ?? []).map(({ code, share }) => [code, heatLevel(share)]));
  drawing = { ...drawing, loading: next === null };
  const calm = previous === null || next === null || prefersReducedMotion.current;
  if (calm) {
    shown.clear();
    targets.forEach((level, code) => shown.set(code, level));
  } else {
    const now = performance.now();
    const fresh = pingsFor({ before: previous ?? [], after: next, random: Math.random }).flatMap(
      ({ code, delay, big }) => {
        const dot = anyDot(code);
        return dot ? [{ dot, at: now + delay * spreadMs, big }] : [];
      },
    );
    pings = [...pings, ...fresh];
  }
  previous = next;
  wake();
}

let spreadMs = 0;
$effect(() => {
  const next = countries;
  untrack(() => arrive(next, spreadMs));
});

$effect(() => {
  drawing = { ...drawing, lit };
  wake();
});

$effect(() => {
  drawing = { ...drawing, ambient };
});

$effect(() => {
  if (!night) {
    drawing = { ...drawing, night: null };
    wake();
    return;
  }
  const shade = () => {
    drawing = { ...drawing, night: nightOf(places, new Date()) };
    wake();
  };
  shade();
  const timer = setInterval(shade, MINUTE_MS);
  return () => clearInterval(timer);
});

const mapLabel = $derived(
  countries && countries.length > 0
    ? `${label}, in ${countries.length} countries. Most in ${
      countries.slice(0, 3).map(({ name }) => name).join(', ')
    }.`
    : `${label}.`,
);

/**
 * Draws the dots at the canvas's own pixel size, again whenever it resizes, the theme flips or anything moves. Frames
 * run only while a shade is fading, a ping is due or ringing, or the loading light sweeps.
 */
const draw: Attachment<HTMLCanvasElement> = (canvas) => {
  const style = getComputedStyle(canvas);
  const number = (token: string) => Number(style.getPropertyValue(token));
  // The color tokens are light-dark() pairs, which a canvas can't read, so each resolves through the canvas's own
  // color in its current scheme.
  const color = (token: string) => {
    canvas.style.color = `var(${token})`;
    const resolved = style.color;
    canvas.style.color = '';
    return resolved;
  };
  const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  const readTones = () => ({
    // Index 0 is a country nobody watches in.
    shades: ['--color-home-map-dot', ...KEY.map((level) => `--color-home-map-heat-${level}`)].map((token) =>
      rgb(color(token)),
    ),
    hover: color('--color-home-map-hover'),
    shimmer: color('--color-home-map-shimmer'),
    ping: color('--color-home-map-ping'),
    pingHot: color('--color-home-map-ping-hot'),
  });
  let tones = readTones();
  const timing = {
    sweepMs: number('--home-map-shimmer-ms'),
    band: number('--home-map-shimmer-band') * world.width,
    fadeMs: number('--home-map-fade-ms'),
    pingMs: number('--home-map-ping-ms'),
    bigMs: number('--home-map-ping-big-ms'),
    reach: number('--home-map-ping-reach'),
    bigReach: number('--home-map-ping-big-reach'),
    line: number('--home-map-ping-line'),
    dim: number('--home-map-night-dim'),
    dot: number('--home-map-dot'),
    ambientMs: number('--home-map-ambient-ms'),
    glow: number('--home-map-ping-glow'),
    flash: number('--home-map-ping-flash'),
    ambientReach: number('--home-map-ping-ambient-reach'),
    ambientLine: number('--home-map-ping-ambient-line'),
    ambientAlpha: number('--home-map-ping-ambient-alpha'),
    ambientFlash: number('--home-map-ping-ambient-flash'),
  };
  spreadMs = number('--home-map-ping-spread-ms');
  tipOffset = Number.parseFloat(style.getPropertyValue('--home-map-tip-offset')) || 0;
  const context = canvas.getContext('2d');
  let request = 0;
  let last: number | undefined;

  const shadeAt = (level: number) => {
    const low = Math.floor(level);
    const high = Math.min(low + 1, KEY.length);
    const from = tones.shades[low] ?? [];
    const to = tones.shades[high] ?? from;
    const mix = from.map((value, i) => Math.round(value + ((to[i] ?? value) - value) * (level - low)));
    return `rgb(${mix.join(' ')})`;
  };

  /** Moves each shade toward its step; true while any still has a way to go. */
  const fade = (elapsed: number) => {
    const step = prefersReducedMotion.current ? 1 : 1 - Math.exp(-elapsed / timing.fadeMs);
    const codes = new Set([...targets.keys(), ...shown.keys()]);
    return [...codes].reduce((moving, code) => {
      const goal = targets.get(code) ?? 0;
      const now = shown.get(code) ?? 0;
      const next = Math.abs(goal - now) < 0.01 ? goal : now + (goal - now) * step;
      if (next === 0 && goal === 0) shown.delete(code);
      else shown.set(code, next);
      return moving || next !== goal;
    }, false);
  };

  const paint = (time: number) => {
    if (!context) return false;
    const scale = canvas.width / world.width;
    const radius = world.step * timing.dot * scale;
    const sweeping = drawing.loading && !prefersReducedMotion.current;
    const light = sweeping
      ? ((time % timing.sweepMs) / timing.sweepMs) * (world.width + 2 * timing.band) - timing.band
      : undefined;
    // Resizes and theme flips paint with now, frames with their start, which can be earlier: never step backwards.
    const fading = fade(last === undefined ? 0 : Math.max(0, time - last));
    last = time;
    const dotAt = (dot: MapDot, size = radius) => {
      context.beginPath();
      context.arc(dot.x * scale, dot.y * scale, size, 0, Math.PI * 2);
      context.fill();
    };

    // Dots that share a color and fade go into one path and fill together: thousands of dots, a few dozen fills.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- built and thrown away within one frame
    const paths = new Map<string, { fill: string; alpha: number; path: Path2D }>();
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- built and thrown away within one frame
    const shades = new Map<string, string>();
    const add = (dot: MapDot, fill: string, alpha: number) => {
      const step = Math.round(alpha * ALPHA_STEPS) / ALPHA_STEPS;
      if (step <= 0) return;
      const key = `${fill}|${step}`;
      const batch = paths.get(key) ?? { fill, alpha: step, path: new Path2D() };
      paths.set(key, batch);
      batch.path.moveTo(dot.x * scale + radius, dot.y * scale);
      batch.path.arc(dot.x * scale, dot.y * scale, radius, 0, Math.PI * 2);
    };
    const shadeOf = (code: string) => {
      const kept = shades.get(code);
      if (kept) return kept;
      const fill = drawing.lit === code ? tones.hover : shadeAt(shown.get(code) ?? 0);
      shades.set(code, fill);
      return fill;
    };

    context.clearRect(0, 0, canvas.width, canvas.height);
    map.dots.forEach((dot, i) => add(dot, shadeOf(dot.code), 1 - timing.dim * (drawing.night?.[i] ?? 0)));
    if (light !== undefined) {
      map.dots.forEach((dot) => {
        const away = Math.abs(dot.x - light);
        if (away < timing.band) add(dot, tones.shimmer, (1 + Math.cos((Math.PI * away) / timing.band)) / 2);
      });
    }
    paths.forEach(({ fill, alpha, path }) => {
      context.globalAlpha = alpha;
      context.fillStyle = fill;
      context.fill(path);
    });

    pings = pings.filter(({ at, big }) => time - at < (big ? timing.bigMs : timing.pingMs));
    // A ping bursts out fast and slows (ease-out), with a soft disc inside its ring and a bright flash on the dot; an
    // ambient one is the same a size smaller and a little softer. On the hottest shade a red ring would vanish, so it
    // rings in the hot ping color there.
    pings.forEach(({ dot, at, big, ambient }) => {
      const t = (time - at) / (big ? timing.bigMs : timing.pingMs);
      if (t < 0) return;
      const tone = Math.round(shown.get(dot.code) ?? 0) >= KEY.length ? tones.pingHot : tones.ping;
      const eased = 1 - (1 - t) ** 3;
      const reach = ambient ? timing.ambientReach : big ? timing.bigReach : timing.reach;
      const strength = ambient ? timing.ambientAlpha : 1;
      const ring = radius + eased * reach * scale;
      context.globalAlpha = strength * timing.glow * (1 - t);
      context.fillStyle = tone;
      dotAt(dot, ring);
      context.globalAlpha = strength * (1 - t);
      context.strokeStyle = tone;
      context.lineWidth = (ambient ? timing.ambientLine : timing.line) * scale;
      context.beginPath();
      context.arc(dot.x * scale, dot.y * scale, ring, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = strength * Math.max(0, 1 - t * 2);
      context.fillStyle = tones.hover;
      dotAt(dot, radius * (ambient ? timing.ambientFlash : timing.flash));
    });
    context.globalAlpha = 1;
    return sweeping || fading || pings.length > 0;
  };

  const tick = (time: number) => {
    request = paint(time) ? requestAnimationFrame(tick) : 0;
    if (!request) last = undefined;
  };
  wake = () => {
    if (!request) request = requestAnimationFrame(tick);
  };
  // An ambient ping every moment the tab is showing, alongside a count's own.
  const ambience = setInterval(() => {
    if (!drawing.ambient || drawing.loading || document.hidden || prefersReducedMotion.current) return;
    const code = ambientPing(previous ?? [], Math.random);
    const dot = code ? anyDot(code) : undefined;
    if (!dot) return;
    pings = [...pings, { dot, at: performance.now(), big: false, ambient: true }];
    wake();
  }, timing.ambientMs);
  const resized = new ResizeObserver(() => {
    const ratio = globalThis.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const place = { left: canvas.offsetLeft, top: canvas.offsetTop, width, height };
    requestAnimationFrame(() => {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      frame = place;
      paint(performance.now());
    });
  });
  resized.observe(canvas);
  // Dark Knight flips data-theme on <html>; the dots repaint in the new scheme.
  const themed = new MutationObserver(() => {
    tones = readTones();
    paint(performance.now());
  });
  themed.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  // The system theme follows the OS, which flips without touching data-theme.
  const scheme = matchMedia('(prefers-color-scheme: dark)');
  const rescheme = () => {
    tones = readTones();
    paint(performance.now());
  };
  scheme.addEventListener('change', rescheme);
  wake();
  return () => {
    resized.disconnect();
    themed.disconnect();
    scheme.removeEventListener('change', rescheme);
    clearInterval(ambience);
    cancelAnimationFrame(request);
    wake = () => {};
  };
};

function point(event: PointerEvent) {
  const canvas = event.currentTarget;
  if (!(canvas instanceof HTMLCanvasElement) || !box) return;
  const rect = canvas.getBoundingClientRect();
  const outer = box.getBoundingClientRect();
  const dot = map.at(
    ((event.clientX - rect.left) / rect.width) * world.width,
    ((event.clientY - rect.top) / rect.height) * world.height,
  );
  pointer = dot ? { x: event.clientX - outer.left, y: event.clientY - outer.top } : null;
  lit = dot?.code ?? null;
}

function leave() {
  pointer = null;
  lit = null;
}
</script>

<div class={['world-map', { fit }]}>
  <div
    class="map"
    role="img"
    aria-label={mapLabel}
    bind:this={box}
    bind:clientWidth={boxSize.width}
    bind:clientHeight={boxSize.height}
  >
    <canvas
      aria-hidden="true"
      style:aspect-ratio="{world.width} / {world.height}"
      style:--map-ratio={world.width / world.height}
      {@attach draw}
      onpointermove={point}
      onpointerleave={leave}
    ></canvas>
    {#if tip && place}
      <div
        class={['tip', { glide }]}
        aria-hidden="true"
        style:translate="{place.left}px {place.top}px"
        bind:clientWidth={tipSize.width}
        bind:clientHeight={tipSize.height}
      >
        <p class="tip-head">
          <b>{#if tip.flag}<img class="flag" src={tip.flag} alt="" />{/if}{tip.name}</b>
          {#if tip.rank}<TagPills tags={[{ text: `#${tip.rank}` }]} />{/if}
        </p>
        {#if tip.country}
          <div class="tip-body">
            <p class="tip-count"><b>{sharePercent(tip.country.share, digits)}</b> of everyone watching</p>
            {#if tip.split}
              <div class="tip-split">
                <span class="shows" style:flex-grow={tip.split.shows}></span>
                <span class="movies" style:flex-grow={tip.split.movies}></span>
              </div>
              <p class="tip-type">
                <TagPills tags={[{ lead: `${tip.split.shows}%`, text: 'shows', kind: 'primary' }]} />
                <TagPills tags={[{ lead: `${tip.split.movies}%`, text: 'movies' }]} />
              </p>
            {:else}
              <EmptyNote>Just a few people here.</EmptyNote>
            {/if}
          </div>
          {#if tip.country.watching}
            {@const { top } = tip.country.watching}
            <p class="tip-top">
              <span>Most watched {top.type === 'shows' ? 'show' : 'movie'}</span>
              <b>{top.title}{#if top.year}<span class="year">{top.year}</span>{/if}</b>
            </p>
          {/if}
        {:else}
          <div class="tip-none"><EmptyNote>No one is watching here right now.</EmptyNote></div>
        {/if}
      </div>
    {/if}
  </div>
  <div class="foot">
    <p class="key" aria-label="Shades from fewer to more people watching now">
      Fewer
      <span>
        {#each KEY as level (level)}
          <i style:background="var(--color-home-map-heat-{level})"></i>
        {/each}
      </span>
      More
    </p>
    {@render tools?.()}
  </div>
</div>

<style>
.world-map {
  display: grid;
  min-block-size: 0;
}

/* The key, and any controls level with it at the right. A map that reaches past its column sets
   `--world-map-foot-inset` to keep the key in line with the column. */
.foot {
  padding-inline-start: var(--world-map-foot-inset, 0px);
  display: flex;
  flex-wrap: wrap;
  gap: var(--home-map-key-gap);
  align-items: center;
  justify-content: space-between;
  margin-block-start: var(--home-map-key-top);
}

.key {
  display: inline-flex;
  gap: var(--home-map-key-gap);
  align-items: center;
  margin: 0;
  padding: var(--search-pill-padding);
  border-radius: var(--radius-round);
  box-shadow: inset 0 0 0 1px var(--color-tag-pill-line);
  font-size: var(--font-size-home-map-scale);
  color: var(--color-home-muted);
  font-variant-numeric: tabular-nums;

  & span {
    display: inline-flex;
    gap: var(--home-map-scale-gap);
    align-items: center;
  }

  & i {
    inline-size: var(--home-map-key-dot);
    block-size: var(--home-map-key-dot);
    border-radius: 50%;
  }
}

.map {
  position: relative;

  & canvas {
    display: block;
    inline-size: 100%;
    max-inline-size: 100%;
  }
}

/* As big as the box allows at the map's own shape, centered in it. */
.fit {
  grid-template-rows: minmax(0, 1fr) auto;

  & .map {
    display: grid;
    place-items: center;
    min-block-size: 0;
    container-type: size;
  }

  & canvas {
    inline-size: min(100cqi, 100cqb * var(--map-ratio));
  }
}

.flag {
  flex: none;
  inline-size: var(--home-flag-size);
  block-size: var(--home-flag-size);
}

/* Placed by translate alone, so moving from dot to dot or country to country glides instead of jumping. */
.tip {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  z-index: 1;
  display: grid;
  inline-size: var(--home-map-tip-width);
  overflow: hidden;
  border: 1px solid var(--color-tooltip-border);
  border-radius: var(--radius-object);
  background: var(--color-tooltip-bg);
  color: var(--color-tooltip-text);
  pointer-events: none;
  box-shadow: var(--shadow-dropdown);

  & p {
    margin: 0;
  }

  &.glide {
    transition: translate var(--home-map-tip-glide) cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

/* The country and its rank, and Most watched at the foot, on a lighter band than the numbers between them. */
.tip-head,
.tip-top {
  padding: var(--home-map-tip-band-padding);
  background: var(--color-home-map-tip-band);
}

/* The rank tag sits as far from the top, right and bottom edges as from each other. */
.tip-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-sm-inline);
  align-items: center;
  padding-inline-end: var(--home-map-tip-rank-inset);
  padding-block: var(--home-map-tip-rank-inset);

  & b {
    display: inline-flex;
    gap: var(--space-sm-inline);
    align-items: center;
  }
}

.tip-body {
  display: grid;
  gap: var(--home-map-tip-gap);
  padding: var(--home-map-tip-body-padding);
}

.tip-count {
  display: flex;
  gap: var(--space-xs-inline);
  align-items: baseline;
  color: var(--color-tooltip-muted);

  & b {
    font-family: var(--font-box-office-figures);
    font-size: var(--font-size-home-map-tip-count);
    font-stretch: condensed;
    font-variant-numeric: tabular-nums;
    line-height: var(--line-height-home-live);
    color: var(--color-tooltip-text);
  }
}

/* The caption's line runs below the figures; pull the bar up so it sits midway to the tags. */
.tip-body .tip-count {
  margin-block-end: var(--home-map-tip-count-bottom);
}

.tip-split {
  display: flex;
  gap: var(--home-rank-bar-gap);
  block-size: var(--home-rank-bar-height);

  & span {
    border-radius: var(--radius-tag);
  }
}

.tip-type {
  display: flex;
  justify-content: space-between;
  font-variant-numeric: tabular-nums;
}

.tip-top {
  display: grid;
  gap: var(--space-xs-block);

  & > span {
    font-size: var(--font-size-small);
    color: var(--color-tooltip-muted);
  }
}

/* As on the fanart cards: lighter and smaller after the title. */
.year {
  margin-inline-start: 0.25em;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-light);
  color: var(--gray-lightish);
}

.tip-none {
  padding: var(--home-map-tip-body-padding);
  font-size: var(--font-size-small);
}

.shows {
  background: var(--brand-primary);
}

.movies {
  background: var(--color-home-movies);
}
</style>
