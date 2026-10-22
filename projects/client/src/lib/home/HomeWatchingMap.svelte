<!--
  The band under the hero: a dot map of the world where each country's dots darken with how many people there are
  watching the trending titles right now, and beside it the countries with the most, each with its flag. Hovering a
  country, on the map or in the list, lights its dots and its row and shows a card with its count, rank, shows against
  movies and what most people there are watching. A key to the shades sits under the map. Until the count arrives
  a light sweeps across the gray dots and shimmering rows hold the countries' places.
-->
<script lang="ts">
import PanelHeading from '$lib/components/dashboard/PanelHeading.svelte';
import PanelHelp from '$lib/components/dashboard/PanelHelp.svelte';
import TagPills from '$lib/components/labels/TagPills.svelte';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import { flagCountries } from '$lib/components/table/flagCountries';
import globe from '$lib/icons/solid/globe.svg?raw';
import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from 'svelte/motion';
import { heatLevel } from './live/heatLevel.ts';
import type { HomeLive, HomeLiveCountry } from './live/toHomeLive.ts';
import { type MapDot, toMapDots, type WorldDots } from './live/toMapDots.ts';
import worldDots from './live/worldDots.json' with { type: 'json' };

interface Props {
  live: HomeLive | null;
}

const { live }: Props = $props();
const RANKED = 8;
/** Over the top part of the map the card opens below the pointer, so it stays clear of the heading. */
const FLIP_AT = 0.4;
/** The key's shades and the fewest watchers each starts at, as `heatLevel` steps them. */
const KEY = [
  { level: 1, label: '1+' },
  { level: 2, label: '5+' },
  { level: 3, label: '20+' },
  { level: 4, label: '60+' },
  { level: 5, label: '150+' },
] as const;
const world: WorldDots = worldDots;
const map = toMapDots(world);
const flags: ReadonlySet<string> = new Set(flagCountries);
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const count = (n: number) => n.toLocaleString('en-US');
const flagOf = (code: string) => (flags.has(code.toLowerCase()) ? `/flags/${code.toLowerCase()}.svg` : undefined);
const total = (country: HomeLiveCountry) => country.shows + country.movies;

const byCode = $derived(new Map((live?.countries ?? []).map((country, i) => [country.code, { country, rank: i + 1 }])));
const ranked = $derived((live?.countries ?? []).slice(0, RANKED));
const most = $derived(Math.max(1, ...ranked.map(total)));

let hovered = $state<{ code: string; x: number; y: number } | null>(null);
let box = $state<HTMLElement>();
// The map repaints when the lit country changes, not on every pointer move inside it.
const hoveredCode = $derived(hovered?.code);

const tip = $derived.by(() => {
  if (!hovered) return null;
  const found = byCode.get(hovered.code);
  return {
    name: found?.country.name ?? regionNames.of(hovered.code) ?? hovered.code,
    flag: flagOf(hovered.code),
    ...found,
  };
});

const label = $derived(
  live && live.countries.length > 0
    ? `World map of where people are watching right now, in ${live.countries.length} countries. Most in ${
      live.countries.slice(0, 3).map(({ name }) => name).join(', ')
    }.`
    : 'World map of where people are watching right now.',
);

/**
 * Draws the dots at the canvas's own pixel size, again whenever it resizes or the counts or hover change. Until the
 * count arrives a light sweeps across them, west to east, every frame.
 */
const draw: Attachment<HTMLCanvasElement> = (canvas) => {
  const counts = byCode;
  const lit = hoveredCode;
  const sweeping = !live && !prefersReducedMotion.current;
  const style = getComputedStyle(canvas);
  // Index 0 is a country nobody watches in; read once per paint, so a theme switch still shows mid-sweep.
  const shades = () => [
    style.getPropertyValue('--color-home-map-dot'),
    ...KEY.map(({ level }) => style.getPropertyValue(`--color-home-map-heat-${level}`)),
  ];
  const hover = style.getPropertyValue('--color-home-map-hover');
  const shimmer = style.getPropertyValue('--color-home-map-shimmer');
  const sweepMs = Number(style.getPropertyValue('--home-map-shimmer-ms'));
  const band = Number(style.getPropertyValue('--home-map-shimmer-band')) * world.width;
  let frame = 0;

  const paint = (time?: number) => {
    const context = canvas.getContext('2d');
    if (!context) return;
    const scale = canvas.width / world.width;
    const radius = world.step * Number(style.getPropertyValue('--home-map-dot')) * scale;
    const light = time === undefined ? undefined : ((time % sweepMs) / sweepMs) * (world.width + 2 * band) - band;
    const shade = shades();
    const dotAt = (dot: MapDot) => {
      context.beginPath();
      context.arc(dot.x * scale, dot.y * scale, radius, 0, Math.PI * 2);
      context.fill();
    };

    context.clearRect(0, 0, canvas.width, canvas.height);
    map.dots.forEach((dot: MapDot) => {
      const here = counts.get(dot.code)?.country;
      context.fillStyle = lit === dot.code ? hover : shade[here ? heatLevel(total(here)) : 0] ?? '';
      dotAt(dot);
      const away = light === undefined ? band : Math.abs(dot.x - light);
      if (away >= band) return;
      context.globalAlpha = (1 + Math.cos((Math.PI * away) / band)) / 2;
      context.fillStyle = shimmer;
      dotAt(dot);
      context.globalAlpha = 1;
    });
  };
  const sweep = (time: number) => {
    paint(time);
    frame = requestAnimationFrame(sweep);
  };
  const resize = () => {
    const ratio = globalThis.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
    paint(sweeping ? performance.now() : undefined);
  };

  resize();
  if (sweeping) frame = requestAnimationFrame(sweep);
  const resized = new ResizeObserver(resize);
  resized.observe(canvas);
  return () => {
    resized.disconnect();
    cancelAnimationFrame(frame);
  };
};

function point(event: PointerEvent) {
  const canvas = event.currentTarget;
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const rect = canvas.getBoundingClientRect();
  const dot = map.at(
    ((event.clientX - rect.left) / rect.width) * world.width,
    ((event.clientY - rect.top) / rect.height) * world.height,
  );
  hovered = dot ? { code: dot.code, x: event.clientX - rect.left, y: event.clientY - rect.top } : null;
}

function showCountry(code: string) {
  const dot = map.first(code);
  const width = box?.clientWidth ?? world.width;
  hovered = dot ? { code, x: (dot.x / world.width) * width, y: (dot.y / world.width) * width } : null;
}
</script>

<section class="band" aria-labelledby="home-map-title" aria-busy={!live}>
  <div class="inner">
    <div class="world">
      <PanelHeading id="home-map-title" title="Trakt Worldwide" icon={globe} />
      <PanelHelp>
        {#if live}
          Watching right now in {count(live.countries.length)} countries.
        {:else}
          Watching right now…
        {/if}
      </PanelHelp>
      <div class="map" role="img" aria-label={label} bind:this={box}>
        <canvas
          aria-hidden="true"
          style:aspect-ratio="{world.width} / {world.height}"
          {@attach draw}
          onpointermove={point}
          onpointerleave={() => (hovered = null)}
        ></canvas>
        {#if hovered && tip}
          <div
            class={['tip', { below: hovered.y < (box?.clientHeight ?? 0) * FLIP_AT }]}
            aria-hidden="true"
            style:--x="{hovered.x}px"
            style:--y="{hovered.y}px"
            style:--box={box?.clientWidth ?? 0}
          >
            <p class="tip-head">
              <b>{#if tip.flag}<img class="flag" src={tip.flag} alt="" />{/if}{tip.name}</b>
              {#if tip.rank}<TagPills tags={[{ text: `#${tip.rank}` }]} />{/if}
            </p>
            {#if tip.country}
              <div class="tip-body">
                <p class="tip-count"><b>{count(total(tip.country))}</b> watching now</p>
                <div class="tip-split">
                  <span class="shows" style:flex-grow={tip.country.shows}></span>
                  <span class="movies" style:flex-grow={tip.country.movies}></span>
                </div>
                <p class="tip-type">
                  <TagPills tags={[{ lead: count(tip.country.shows), text: 'shows', kind: 'primary' }]} />
                  <TagPills tags={[{ lead: count(tip.country.movies), text: 'movies' }]} />
                </p>
              </div>
              <p class="tip-top">
                <span>Most watched {tip.country.top.type === 'shows' ? 'show' : 'movie'}</span>
                <b>{tip.country.top.title}{#if tip.country.top.year}<span class="year">{tip.country.top.year}</span>{/if}</b>
              </p>
            {:else}
              <p class="tip-none">Nobody watching right now</p>
            {/if}
          </div>
        {/if}
      </div>
      <p class="key" aria-label="Shades by people watching now">
        {#each KEY as { level, label } (level)}
          <span><i style:background="var(--color-home-map-heat-{level})"></i>{label}</span>
        {/each}
      </p>
    </div>

    {#if ranked.length > 0}
      <div class="side">
        <ol class="rank" aria-label="Countries with the most people watching">
          {#each ranked as country (country.code)}
            {@const flag = flagOf(country.code)}
            <li
              class={{ lit: hovered?.code === country.code }}
              onpointerenter={() => showCountry(country.code)}
              onpointerleave={() => (hovered = null)}
            >
              <span class="name">{#if flag}<img class="flag" src={flag} alt="" />{/if}{country.name}</span>
              <span class="number">{count(total(country))}</span>
              <span class="bar" aria-hidden="true">
                <span class="shows" style:inline-size="{(country.shows / most) * 100}%"></span>
                <span class="movies" style:inline-size="{(country.movies / most) * 100}%"></span>
              </span>
            </li>
          {/each}
        </ol>
      </div>
    {:else if !live}
      <div class="side" aria-hidden="true">
        <ol class="rank">
          {#each Array.from({ length: RANKED }, (_, row) => row) as row (row)}
            <li>
              <span class="name">
                <Shimmer inline="var(--home-flag-size)" block="var(--home-flag-size)" round />
                <Shimmer
                  inline="var({row % 2 ? '--home-rank-shimmer-name-short-width' : '--home-rank-shimmer-name-width'})"
                  block="var(--font-size-home-rank-name)"
                />
              </span>
              <span class="number">
                <Shimmer inline="var(--home-rank-shimmer-count-width)" block="var(--font-size-home-rank-count)" />
              </span>
              <span class="bar"><Shimmer inline="100%" block="var(--home-rank-bar-height)" /></span>
            </li>
          {/each}
        </ol>
      </div>
    {/if}
  </div>
</section>

<style>
.band {
  container-type: inline-size;
  padding-block: var(--home-band-padding-block);
  padding-inline: max(var(--home-gutter), calc((100% - var(--home-content-width)) / 2));
  border-block: 1px solid var(--color-home-line);
  background: var(--color-home-band);
  color: var(--color-home-text);
}

.inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--home-band-side);
  gap: var(--home-band-gap);
  align-items: start;
}

@container (width < 900px) {
  .inner {
    grid-template-columns: minmax(0, 1fr);
  }
}

.key {
  display: inline-flex;
  gap: var(--home-map-key-gap);
  align-items: center;
  margin: var(--home-map-key-top) 0 0;
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
  margin-block-start: var(--home-map-top);

  & canvas {
    display: block;
    inline-size: 100%;
    max-inline-size: 100%;
  }
}

.flag {
  flex: none;
  inline-size: var(--home-flag-size);
  block-size: var(--home-flag-size);
}

.tip {
  position: absolute;
  inset-block-end: calc(100% - var(--y) + var(--home-map-tip-offset));
  inset-inline-start: clamp(
    0px,
    calc(var(--x) - var(--home-map-tip-width) / 2),
    calc(var(--box) * 1px - var(--home-map-tip-width))
  );
  z-index: 1;
  display: grid;
  inline-size: var(--home-map-tip-width);
  overflow: hidden;
  border: 1px solid var(--color-chart-tooltip-border);
  border-radius: var(--radius-object);
  background: var(--color-chart-tooltip-bg);
  color: var(--color-chart-tooltip-text);
  pointer-events: none;
  box-shadow: var(--shadow-dropdown);

  & p {
    margin: 0;
  }

  &.below {
    inset-block: calc(var(--y) + var(--home-map-tip-offset)) auto;
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
  padding-inline-end: var(--home-map-tip-rank-inset);
  padding-block: var(--home-map-tip-rank-inset);
}

.tip-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-sm-inline);
  align-items: center;

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
  color: var(--color-chart-tooltip-muted);

  & b {
    font-family: var(--font-box-office-figures);
    font-size: var(--font-size-home-map-tip-count);
    font-stretch: condensed;
    font-variant-numeric: tabular-nums;
    line-height: var(--line-height-home-live);
    color: var(--color-chart-tooltip-text);
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
    color: var(--color-chart-tooltip-muted);
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
  color: var(--color-chart-tooltip-muted);
}

.shows {
  background: var(--brand-primary);
}

.movies {
  background: var(--color-home-movies);
}

.side {
  align-self: center;
}

.rank {
  display: grid;
  gap: var(--home-rank-gap);
  margin: 0;
  padding: 0;
  list-style: none;

  & li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-xs-inline) var(--space-sm-inline);
    padding: var(--home-rank-padding);
    border-radius: var(--radius-object);

    &.lit {
      background: var(--color-home-rank-hover);
    }
  }
}

.name {
  display: inline-flex;
  gap: var(--space-sm-inline);
  align-items: center;
  min-inline-size: 0;
  font-size: var(--font-size-home-rank-name);
  font-weight: var(--font-weight-headings);
}

.number {
  font-family: var(--font-box-office-figures);
  font-size: var(--font-size-home-rank-count);
  font-stretch: condensed;
  font-variant-numeric: tabular-nums;
}

.bar {
  display: flex;
  grid-column: 1 / -1;
  gap: var(--home-rank-bar-gap);
  block-size: var(--home-rank-bar-height);

  & span {
    border-radius: var(--radius-tag);
  }
}
</style>
