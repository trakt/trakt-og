<!--
  The season hero: this month's theme from the month map as an auto-rotating carousel of up to twenty picks. Each pick
  fills the hero with its fanart, and its logo (or title), details, overview, "More info" and "Trailer" sit on the
  left in a block of fixed height, so nothing jumps between picks. The theme's badge is top-left and the All /
  Trending / Favorites switch top-right. A rail of same-size posters picks a slide and scrolls to keep the current
  one in view: it's full colour with an accent ring and a timer bar, the rest dim. "Trailer" plays the pick's trailer
  in og's video popup. It moves on every six seconds, pausing while the pointer or focus is inside and not at all
  under reduced motion; the arrows, and ← → with focus inside, step through.
-->
<script lang="ts">
import VideoPopup from '$lib/components/dialog/VideoPopup.svelte';
import { youtubeEmbedUrl } from '$lib/components/dialog/youtubeEmbedUrl';
import { isPlainClick } from '$lib/utils/isPlainClick';
import Icon from '$lib/icons/Icon.svelte';
import angleLeft from '$lib/icons/light/angle-left.svg?raw';
import angleRight from '$lib/icons/light/angle-right.svg?raw';
import play from '$lib/icons/solid/play.svg?raw';
import type { Attachment } from 'svelte/attachments';
import { SvelteSet } from 'svelte/reactivity';
import type { SeasonPick } from './toSeasonPicks.ts';

interface Props {
  title: string;
  /** "October on Trakt". */
  eyebrow: string;
  picks: readonly SeasonPick[];
}

const { title, eyebrow, picks }: Props = $props();
const ROTATE_MS = 6000;
const MODES = [
  { id: 'all', label: 'All' },
  { id: 'trending', label: 'Trending' },
  { id: 'favorite', label: 'Favorites' },
] as const;

let mode = $state<(typeof MODES)[number]['id']>('all');
let index = $state(0);
let paused = $state(false);
let video = $state<string>();
let rail = $state<HTMLElement>();
// A slide's fanart loads the first time it's shown.
const shown = new SvelteSet([0]);

const withArt = $derived(picks.filter((pick) => pick.fanart && pick.poster));
const counts = $derived({
  all: withArt.length,
  trending: withArt.filter((pick) => pick.source === 'trending').length,
  favorite: withArt.filter((pick) => pick.source === 'favorite').length,
});
const slides = $derived(mode === 'all' ? withArt : withArt.filter((pick) => pick.source === mode));
const current = $derived(slides.at(index % Math.max(slides.length, 1)));

function show(next: number) {
  if (slides.length === 0) return;
  index = (next + slides.length) % slides.length;
  shown.add(index);
}

function pick(next: (typeof MODES)[number]['id']) {
  mode = next;
  index = 0;
  shown.clear();
  shown.add(0);
}

$effect(() => {
  if (paused || slides.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Reading `index` restarts the timer whenever the slide changes, by the timer or by hand.
  const at = index;
  const timer = setTimeout(() => show(at + 1), ROTATE_MS);
  return () => clearTimeout(timer);
});

// The rail scrolls to keep the current poster in the middle, without moving the page.
$effect(() => {
  const button = rail?.querySelectorAll('button')[index];
  if (!rail || !button) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  rail.scrollTo({
    left: button.offsetLeft - (rail.clientWidth - button.offsetWidth) / 2,
    behavior: reduced ? 'instant' : 'smooth',
  });
});

// Pauses while the pointer or focus is inside, and ← → step through while focus is inside.
const controls: Attachment<HTMLElement> = (node) => {
  const pause = () => (paused = true);
  const resume = () => (paused = node.matches(':hover, :focus-within'));
  const onkeydown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.target instanceof HTMLElement && event.target.closest('input, textarea, [role="menu"], [popover]')) {
      return;
    }
    event.preventDefault();
    show(index + (event.key === 'ArrowLeft' ? -1 : 1));
  };
  const events = [['mouseenter', pause], ['focusin', pause], ['mouseleave', resume], ['focusout', resume]] as const;
  for (const [name, handler] of events) node.addEventListener(name, handler);
  node.addEventListener('keydown', onkeydown);
  return () => {
    for (const [name, handler] of events) node.removeEventListener(name, handler);
    node.removeEventListener('keydown', onkeydown);
  };
};

const details = (item: SeasonPick) =>
  [
    item.year,
    item.type === 'movie' && item.runtime ? `${item.runtime}m` : item.network,
    item.certification,
    item.genres,
  ]
    .filter(Boolean)
    .join(' · ');
</script>

<!-- Media hrefs point at routes resolve() can't type from a string. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if current}
  <section
  class="hero"
  aria-roledescription="carousel"
  aria-labelledby="season-title"
  {@attach controls}
>
    {#each slides as slide, slot (slide.key)}
      {#if shown.has(slot)}
        <img class={['backdrop', { current: slot === index }]} src={slide.fanart} alt="" decoding="async" />
      {/if}
    {/each}

    <div class="inner">
      <div class="top">
        <p class="badge"><span class="dot"></span><b id="season-title">{title}</b><span>{eyebrow}</span></p>
        <div class="modes" role="group" aria-label="Picks">
          {#each MODES as { id, label } (id)}
            <button type="button" aria-pressed={mode === id} disabled={counts[id] === 0} onclick={() => pick(id)}>
              {label}<small>{counts[id]}</small>
            </button>
          {/each}
        </div>
      </div>

      <div class="info" aria-live="polite">
        <span class={['source', current.source]}>
          {current.source === 'trending' ? 'Trending now' : 'All-time favorite'}
        </span>
        <h2 class="name">
          {#if current.logo}<img src={current.logo} alt={current.title} />{:else}{current.title}{/if}
        </h2>
        <p class="details">
          {details(current)}
        </p>
        <p class="overview">{current.overview ?? ''}</p>
        <div class="actions">
          <a class="button primary" href={current.href}>More info</a>
          {#if current.trailer && youtubeEmbedUrl(current.trailer)}
            <a
              class="button secondary"
              href={current.trailer}
              target="_blank"
              rel="noopener noreferrer"
              onclick={(event) => {
                if (!isPlainClick(event)) return;
                event.preventDefault();
                video = current.trailer;
              }}
            ><Icon svg={play} /> Trailer</a>
          {/if}
        </div>
      </div>

      <ul class="posters" aria-label="{title} picks" bind:this={rail}>
        {#each slides as slide, slot (slide.key)}
          <li>
            <button
              type="button"
              class={{ current: slot === index }}
              aria-current={slot === index}
              aria-label={slide.title}
              onclick={() => show(slot)}
            >
              <img src={slide.poster} alt="" loading="lazy" decoding="async" />
              {#key `${slot === index}-${index}`}<span class="timer"></span>{/key}
            </button>
          </li>
        {/each}
      </ul>
    </div>

    <button type="button" class="arrow previous" aria-label="Previous pick" onclick={() => show(index - 1)}>
      <Icon svg={angleLeft} />
    </button>
    <button type="button" class="arrow next" aria-label="Next pick" onclick={() => show(index + 1)}>
      <Icon svg={angleRight} />
    </button>
  </section>
  <VideoPopup bind:url={video} title="{current.title} trailer" />
{/if}

<style>
.hero {
  position: relative;
  isolation: isolate;
  /* Over fanart, so dark in both themes. */
  color-scheme: dark;
  overflow: hidden;
  padding-block: calc(var(--header-height) + var(--season-hero-top)) var(--season-hero-bottom);
  background-color: var(--color-slider-bg);
  color: var(--color-discover-text);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      var(--season-hero-shade),
      radial-gradient(
      circle at 12% 100%,
      color-mix(in srgb, var(--season-accent) var(--season-hero-glow-strength), transparent),
      transparent 50%
    );
  }
}

.backdrop {
  position: absolute;
  inset: 0;
  z-index: -2;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  object-position: var(--season-hero-image-position);
  opacity: 0;

  &.current {
    opacity: 1;
  }
}

.inner {
  display: grid;
  gap: var(--season-hero-gap);
  margin-inline: auto;
  padding-inline: calc(var(--gutter) / 2);

  @media (min-width: 768px) {
    inline-size: var(--container-sm);
  }

  @media (min-width: 992px) {
    inline-size: var(--container-md);
  }

  @media (min-width: 1200px) {
    inline-size: var(--container-lg);
  }
}

.top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--season-hero-gap);
}

.badge,
.modes {
  margin: 0;
  border-radius: var(--radius-season-pill);
  background-color: var(--color-season-hero-chrome);
  backdrop-filter: blur(6px);
}

.badge {
  display: flex;
  align-items: center;
  gap: var(--season-hero-badge-gap);
  padding: var(--season-hero-badge-padding);

  & span {
    color: var(--color-discover-label);
    font-size: var(--font-size-small);
  }
}

.dot {
  inline-size: var(--season-hero-dot);
  block-size: var(--season-hero-dot);
  border-radius: 50%;
  background-color: var(--season-accent);
}

.modes {
  display: inline-flex;
  padding: var(--season-hero-modes-padding);
  box-shadow: inset 0 0 0 1px var(--color-season-hero-chrome-line);

  & button {
    display: inline-flex;
    align-items: center;
    gap: var(--season-hero-badge-gap);
    min-block-size: 0;
    padding: var(--season-hero-mode-padding);
    border: 0;
    border-radius: var(--radius-season-pill);
    background: none;
    color: var(--color-discover-label);
    font: inherit;
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-headings-heavy);
    white-space: nowrap;
    cursor: pointer;

    &:hover:not(:disabled, [aria-pressed='true']) {
      color: var(--color-discover-text);
    }

    &[aria-pressed='true'] {
      background-color: var(--season-accent);
      color: var(--color-discover-on-image);
    }

    &:disabled {
      opacity: var(--opacity-season-ribbon-past);
      cursor: default;
    }
  }

  /* The count as a badge, tinted off the button's text. */
  & small {
    padding: var(--toggle-chip-count-padding);
    border-radius: var(--radius-season-pill);
    background-color: var(--color-toggle-chip-count-bg);
    font-size: var(--font-size-toggle-chip-count);
    font-variant-numeric: tabular-nums;
  }

  & [aria-pressed='true'] small {
    background-color: var(--color-toggle-chip-count-picked-bg);
  }
}

/* A fixed height, so the posters and buttons stay put from one pick to the next. */
.info {
  display: grid;
  grid-template-rows: auto var(--season-hero-name-height) auto auto auto;
  align-content: start;
  gap: var(--season-hero-copy-gap);
  block-size: var(--season-hero-info-height);
  max-inline-size: var(--season-hero-copy-width);
  text-shadow: var(--shadow-season-hero-text);

  & p {
    margin: 0;
  }
}

.source {
  justify-self: start;
  padding: var(--season-source-padding);
  border-radius: var(--radius-season-source);
  background-color: var(--color-season-source-favorite);
  font-size: var(--font-size-season-source);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-season-source);
  text-shadow: none;
  text-transform: uppercase;

  &.trending {
    background-color: var(--color-season-source-trending);
  }
}

.name {
  display: flex;
  align-items: end;
  margin: 0;
  overflow: hidden;
  font-size: var(--font-size-season-title);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-season-title);
  line-height: var(--line-height-season-title);
  text-wrap: balance;

  & img {
    max-inline-size: var(--season-hero-logo-width);
    max-block-size: 100%;
    object-fit: contain;
    object-position: left bottom;
    filter: drop-shadow(var(--shadow-season-hero-logo));
  }
}

.details {
  overflow: hidden;
  color: var(--color-season-hero-blurb);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overview {
  display: -webkit-box;
  block-size: 3lh;
  overflow: hidden;
  color: var(--color-season-hero-blurb);
  font-size: var(--font-size-season-hero-blurb);
  line-height: var(--line-height-base);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.actions {
  display: flex;
  margin-block-start: var(--season-hero-actions-gap);
  align-items: center;
  gap: var(--season-hero-gap);
  text-shadow: none;
}

.button {
  display: inline-flex;
  flex: none;
  align-items: center;
  white-space: nowrap;
  gap: var(--season-hero-badge-gap);
  block-size: var(--season-hero-action);
  padding-inline: var(--season-hero-button-inline);
  border-radius: var(--radius-season-button);
  font-size: var(--font-size-season-button);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-season-eyebrow);
  text-transform: uppercase;

  &:is(:hover, :focus-visible) {
    background-color: var(--season-accent);
    color: var(--color-season-button-text);
    text-decoration: none;
  }
}

.primary {
  background-color: var(--color-season-button-bg);
  color: var(--color-season-button-text);
}

.secondary {
  background-color: var(--color-season-hero-chrome);
  box-shadow: inset 0 0 0 1px var(--color-season-hero-chrome-line);
  color: var(--color-discover-text);
}

/* One row that scrolls sideways, fading out at the end, with room for the current poster's ring. */
.posters {
  position: relative;
  display: flex;
  gap: var(--season-hero-poster-gap);
  margin: 0;
  padding: var(--season-hero-rail-padding);
  overflow-x: auto;
  list-style: none;
  mask-image: var(--season-hero-rail-fade);
  scrollbar-width: none;

  & li {
    flex: none;
  }

  & button {
    position: relative;
    display: block;
    inline-size: var(--season-hero-poster-width);
    min-block-size: 0;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: var(--radius-season-poster);
    background: var(--color-discover-border);
    box-shadow: var(--shadow-season-wall);
    opacity: var(--opacity-season-hero-poster);
    filter: grayscale(var(--season-hero-poster-grayscale));
    cursor: pointer;

    &:hover {
      opacity: 1;
      filter: none;
    }

    &.current {
      opacity: 1;
      filter: none;
      box-shadow: 0 0 0 2px var(--season-accent), var(--shadow-season-wall);
    }
  }

  & img {
    display: block;
    inline-size: 100%;
    aspect-ratio: var(--ratio-poster);
    object-fit: cover;
  }
}

.timer {
  position: absolute;
  inset: auto 0 0;
  block-size: var(--season-hero-timer);
  background-color: var(--color-season-hero-chrome-line);

  .current &::after {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    inline-size: 100%;
    background-color: var(--season-accent);
    transform-origin: left;
    animation: timer var(--season-hero-rotate) linear both;
  }

  .hero:is(:hover, :focus-within) .current &::after {
    animation-play-state: paused;
  }
}

@keyframes timer {
  from {
    transform: scaleX(0);
  }
}

.arrow {
  position: absolute;
  inset-block-start: 50%;
  display: grid;
  place-items: center;
  inline-size: var(--season-hero-arrow);
  block-size: var(--season-hero-arrow);
  min-block-size: 0;
  margin-block-start: calc(var(--season-hero-arrow) / -2);
  padding: 0;
  border: 0;
  border-radius: 50%;
  background-color: var(--color-season-hero-chrome);
  color: var(--color-discover-text);
  font-size: var(--font-size-season-hero-arrow);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background-color: var(--season-accent);
    color: var(--color-season-button-text);
  }

  @media (width < 1300px) {
    display: none;
  }
}

.previous {
  inset-inline-start: var(--season-hero-arrow-inset);
}

.next {
  inset-inline-end: var(--season-hero-arrow-inset);
}

@media (prefers-reduced-motion: no-preference) {
  .backdrop {
    transition: opacity var(--transition-season-hero);
  }

  .posters button {
    transition: opacity var(--transition-season-ribbon), filter var(--transition-season-ribbon),
      box-shadow var(--transition-season-ribbon);
  }
}

@media (prefers-reduced-motion: reduce) {
  .timer {
    display: none;
  }
}
</style>
