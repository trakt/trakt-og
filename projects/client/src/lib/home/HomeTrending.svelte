<!--
  Trending shows and movies side by side under the map: each a section heading with its watermark and View all link,
  then two rows of four posters, artwork only: two rows of three on a smaller tablet, and stacked in two rows of five
  on the smallest. The title shows as the poster's tooltip.
-->
<script lang="ts">
import posterPlaceholder from '$lib/assets/placeholders/poster.png';
import PanelHeading from '$lib/components/dashboard/PanelHeading.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import fire from '$lib/icons/solid/fire.svg?raw';
import type { HomeMediaType } from './live/toHomeLive.ts';
import type { HomeTrendingTitle } from './live/toHomeTrending.ts';

interface Props {
  posters: Readonly<Record<HomeMediaType, readonly HomeTrendingTitle[]>>;
}

const { posters }: Props = $props();

const SECTIONS = [
  { type: 'shows', title: 'Trending Shows' },
  { type: 'movies', title: 'Trending Movies' },
] as const;
</script>

<!-- A poster links to its media page, a route resolve() can't type from a string. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class="frame">
  <div class="trending">
    {#each SECTIONS as { type, title } (type)}
      <section aria-labelledby="home-trending-{type}">
        <PanelHeading
          id="home-trending-{type}"
          {title}
          icon={fire}
          seeMore={{ href: `/${type}/trending`, text: 'View all' }}
        />
        <ul class="posters">
          {#each posters[type] as poster (poster.key)}
            <li>
              <Tooltip text={poster.year ? `${poster.title} (${poster.year})` : poster.title}>
                {#snippet trigger(tooltip)}
                  <a href={poster.href} {...tooltip}>
                    <img src={poster.poster ?? posterPlaceholder} alt={poster.title} loading="lazy" decoding="async" />
                  </a>
                {/snippet}
              </Tooltip>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
</div>

<style>
.frame {
  container-type: inline-size;
}

.trending {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--home-trending-columns-gap);
  padding-block: var(--home-trending-padding-block);
  padding-inline: max(var(--home-gutter), calc((100% - var(--home-content-width)) / 2));
  color: var(--color-home-text);
}

/* Sections take the page surface by default; these sit on the home page's own dark. */
section {
  background-color: transparent;
}

.posters {
  --poster-columns: 4;
  display: grid;
  grid-template-columns: repeat(var(--poster-columns), minmax(0, 1fr));
  gap: var(--gutter);
  margin: 0;
  padding: var(--gutter) 0 0;
  list-style: none;

  & a {
    display: block;
    overflow: hidden;
    border-radius: var(--radius-object);
    box-shadow: 0 0 0 1px var(--color-home-line);

    @media (prefers-reduced-motion: no-preference) {
      transition: translate var(--transition-see-more), box-shadow var(--transition-see-more);
    }

    &:is(:hover, :focus-visible) {
      translate: 0 calc(var(--space-xs-inline) * -1);
      box-shadow: 0 0 0 1px var(--brand-primary), var(--shadow-dropdown);
    }
  }

  /* Two full rows: the last two of ten only when there are five columns. */
  & li:nth-child(n + 9) {
    display: none;
  }

  & img {
    display: block;
    inline-size: 100%;
    aspect-ratio: var(--ratio-poster);
    object-fit: cover;
    background: var(--color-card-bg);
  }
}

/* One step up from the smallest tablet: still side by side, two rows of three. */
@container (800px <= width < 1000px) {
  .posters {
    --poster-columns: 3;

    & li:nth-child(n + 7) {
      display: none;
    }
  }
}

/* The smallest tablet: shows over movies, two rows of five. */
@container (width < 800px) {
  .trending {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--home-trending-stack-gap);
    padding-block: var(--home-trending-stack-padding-block);
  }

  .posters {
    --poster-columns: 5;

    & li:nth-child(n + 9) {
      display: revert;
    }
  }
}
</style>
