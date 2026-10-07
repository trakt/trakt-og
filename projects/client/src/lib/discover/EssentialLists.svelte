<!--
  Discover's essential lists as an accordion across the page's full width: eight tall slices of OG's list art, each
  closed one showing its number, its logo on its side (square logos stay upright) and its item count. Hovering a
  slice, or tabbing to it, opens it: the art brightens, and the logo, title, the IMDB lists' green label, two lines of
  description, the counts, its first posters (rising in one by one) and "View list" come in over a shade, with an
  accent bar along the bottom. The first starts open, and the last one opened stays open. Under reduced motion
  nothing slides.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import comment from '$lib/icons/regular/comment.svg?raw';
import file from '$lib/icons/regular/file.svg?raw';
import thumbsUp from '$lib/icons/regular/thumbs-up.svg?raw';
import type { EssentialList } from './toEssentialList.ts';

const { lists }: { lists: readonly EssentialList[] } = $props();
// A pointer passing over a slice on its way somewhere else doesn't open it.
const HOVER_DELAY_MS = 70;

let open = $state(0);
let timer: ReturnType<typeof setTimeout> | undefined;

const hover = (index: number) => {
  clearTimeout(timer);
  timer = setTimeout(() => (open = index), HOVER_DELAY_MS);
};
const pad = (n: number) => String(n).padStart(2, '0');
const count = (n: number) => n.toLocaleString('en-US');
const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);
</script>

<!-- List hrefs are built from ids, which resolve() can't type. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if lists.length > 0}
  <section id="essentials" class="essentials" aria-labelledby="essentials-heading">
  <h2 id="essentials-heading" class="visually-hidden">Essential Lists</h2>
  <ul onpointerleave={() => clearTimeout(timer)}>
      {#each lists as list, index (list.id)}
        {@const name = list.title.join(' ')}
        <li class={{ open: open === index }}>
          <a
            href={list.href}
            aria-label={name}
            aria-current={open === index}
            onpointerenter={() => hover(index)}
            onfocus={() => (open = index)}
          >
            <img class="art" src={list.background} alt="" loading="lazy" decoding="async" />
            <span class="shade"></span>
            <span class="spine" aria-hidden="true">
              <span class="number">{pad(index + 1)}</span>
              <img class={['side', { upright: list.upright }]} src={list.logo} alt="" loading="lazy" />
              {#if list.counts}<span class="items">{count(list.counts.items)} items</span>{/if}
            </span>
            <span class="kicker" aria-hidden="true"><b>{pad(index + 1)}</b> / {pad(lists.length)} · Essential Lists</span>
            <span class="body">
              <img class="logo" src={list.logo} alt="" loading="lazy" />
              <span class="name">{name}</span>
              {#if list.label}<span class="label">{list.label}</span>{/if}
              {#if list.description}<span class="description">{list.description}</span>{/if}
              {#if list.counts}
                <span class="counts">
                  <span class="stat"><Icon svg={file} /><strong>{count(list.counts.items)}</strong>
                    {plural(list.counts.items, 'item')}</span>
                  <span class="stat"><Icon svg={thumbsUp} /><strong>{count(list.counts.likes)}</strong>
                    {plural(list.counts.likes, 'like')}</span>
                  {#if list.counts.comments !== undefined}
                    <span class="stat"><Icon svg={comment} /><strong>{count(list.counts.comments)}</strong>
                      {plural(list.counts.comments, 'comment')}</span>
                  {/if}
                </span>
              {/if}
              <span class="row">
                {#each list.posters as poster, slot (poster)}
                  <img class="poster" src={poster} alt="" loading="lazy" style:--slot={slot} />
                {/each}
                <span class="button">View list</span>
              </span>
            </span>
          </a>
        </li>
      {/each}
    </ul>
</section>
{/if}

<style>
.essentials {
  /* Over the art in both themes. */
  color-scheme: dark;
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

ul {
  display: flex;
  gap: var(--essential-gap);
  block-size: var(--essential-height);
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  position: relative;
  flex: 1 1 0;
  min-inline-size: 0;
  overflow: hidden;
  background-color: var(--color-slider-bg);

  &.open {
    flex-grow: var(--essential-open-grow);
  }

  /* The accent bar along the open slice's foot. */
  &::after {
    content: '';
    position: absolute;
    inset: auto 0 0;
    block-size: var(--essential-bar);
    background-color: var(--season-accent);
    transform: scaleX(0);
    transform-origin: left;
    pointer-events: none;
  }

  &.open::after {
    transform: none;
  }
}

a {
  display: block;
  block-size: 100%;
  color: var(--color-discover-on-image);

  &:is(:hover, :focus-visible) {
    color: var(--color-discover-on-image);
    text-decoration: none;
  }

  &:focus-visible {
    outline-offset: calc(var(--essential-bar) * -1);
  }
}

.art {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  filter: var(--filter-essential-closed);
  transform: scale(var(--essential-closed-zoom));

  li:not(.open) a:hover & {
    filter: var(--filter-essential-hover);
  }

  .open & {
    filter: var(--filter-essential-open);
    transform: none;
  }
}

.shade {
  position: absolute;
  inset: 0;
  background: var(--essential-shade);
  opacity: 0;

  .open & {
    opacity: 1;
  }
}

.spine {
  position: absolute;
  inset: 0;

  .open & {
    opacity: 0;
  }
}

.number,
.kicker {
  font-size: var(--font-size-essential-small);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-essential);
}

.number {
  position: absolute;
  inset: var(--essential-edge) 0 auto;
  color: var(--season-accent);
  text-align: center;
}

/* The logo on its side, along the slice. */
.side {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: var(--essential-side-length);
  max-inline-size: none;
  block-size: var(--essential-side-height);
  object-fit: contain;
  filter: drop-shadow(var(--shadow-essential-logo));
  translate: -50% -50%;
  rotate: -90deg;

  &.upright {
    inline-size: var(--essential-upright-size);
    block-size: var(--essential-upright-size);
    rotate: none;
  }
}

.items {
  position: absolute;
  /* Physical sides: in its vertical writing mode, the logical ones turn with the text. */
  inset: auto auto var(--essential-edge) 50%;
  color: var(--color-essential-spine-text);
  font-size: var(--font-size-essential-small);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-essential);
  text-transform: uppercase;
  white-space: nowrap;
  writing-mode: vertical-rl;
  translate: -50% 0;
  rotate: 180deg;
}

.kicker {
  position: absolute;
  inset: var(--essential-edge) auto auto var(--essential-inset);
  color: var(--color-essential-spine-text);
  text-shadow: var(--shadow-season-hero-text);
  text-transform: uppercase;
  white-space: nowrap;
  opacity: 0;

  & b {
    color: var(--season-accent);
  }

  .open & {
    opacity: 1;
  }
}

.body {
  position: absolute;
  inset: auto auto var(--essential-body-bottom) var(--essential-inset);
  display: grid;
  justify-items: start;
  gap: var(--essential-body-gap);
  inline-size: min(var(--essential-body-width), calc(100% - var(--essential-inset) * 2));
  opacity: 0;
  transform: translateY(var(--essential-rise));
  visibility: hidden;

  .open & {
    opacity: 1;
    transform: none;
    visibility: visible;
  }
}

.logo {
  max-inline-size: var(--essential-logo-width);
  max-block-size: var(--essential-logo-height);
  object-fit: contain;
  filter: drop-shadow(var(--shadow-essential-logo));
}

.name {
  font-family: var(--font-headings);
  font-size: var(--font-size-essential-name);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-headings);
  text-shadow: var(--shadow-season-hero-text);
}

.label {
  padding: var(--featured-list-label-padding);
  border-radius: var(--radius-featured-list-label);
  background-color: var(--color-featured-list-label);
  font-family: var(--font-headings);
  font-size: var(--font-size-featured-list-label);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-featured-list-label);
  line-height: 1;
  text-transform: uppercase;
}

.description {
  display: -webkit-box;
  max-inline-size: var(--essential-copy-width);
  overflow: hidden;
  color: var(--color-season-hero-blurb);
  line-height: var(--line-height-base);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.counts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--list-tile-counts-gap);
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: var(--list-tile-stat-gap);
  color: var(--color-season-hero-blurb);
  font-size: var(--font-size-list-tile-meta);
  white-space: nowrap;

  & :global(svg) {
    color: var(--brand-secondary);
    font-size: var(--font-size-list-tile-stat-icon);
  }

  & strong {
    color: var(--color-discover-on-image);
    font-size: var(--font-size-list-tile-stat);
    font-weight: var(--font-weight-headings-heavy);
    font-variant-numeric: tabular-nums;
  }
}

.row {
  display: flex;
  align-items: end;
  gap: var(--essential-poster-gap);
  margin-block-start: var(--essential-row-gap);
}

.poster {
  inline-size: var(--essential-poster);
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-essential-poster);
  object-fit: cover;
  box-shadow: var(--shadow-essential-poster);
  opacity: 0;
  transform: translateY(var(--essential-rise));

  .open & {
    opacity: 1;
    transform: none;
  }
}

.button {
  align-self: center;
  margin-inline-start: var(--essential-button-gap);
  padding: var(--essential-button-padding);
  border-radius: var(--radius-season-button);
  background-color: var(--color-season-button-bg);
  color: var(--color-season-button-text);
  font-size: var(--font-size-season-button);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-season-eyebrow);
  text-transform: uppercase;
  white-space: nowrap;

  a:hover & {
    background-color: var(--season-accent);
  }
}

@media (prefers-reduced-motion: no-preference) {
  li {
    transition: flex-grow var(--transition-essential-open);

    &::after {
      transition: transform var(--transition-essential-open);
    }
  }

  .art {
    transition: filter var(--transition-essential-fade), transform var(--transition-essential-zoom);
  }

  .shade,
  .spine,
  .kicker {
    transition: opacity var(--transition-essential-fade);
  }

  .body {
    transition: opacity var(--transition-essential-quick), transform var(--transition-essential-quick),
      visibility var(--transition-essential-quick);

    .open & {
      transition: opacity var(--transition-essential-fade) var(--essential-body-delay),
        transform var(--transition-essential-open) var(--essential-body-delay), visibility 0s;
    }
  }

  .poster {
    transition: opacity var(--transition-essential-quick), transform var(--transition-essential-quick);

    .open & {
      transition: opacity var(--transition-essential-fade)
        calc(var(--essential-poster-delay) + var(--slot) * var(--essential-poster-stagger)),
        transform var(--transition-essential-open)
        calc(var(--essential-poster-delay) + var(--slot) * var(--essential-poster-stagger));
    }
  }
}
</style>
