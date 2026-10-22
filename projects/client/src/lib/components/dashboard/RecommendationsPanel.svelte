<!--
  The dashboard's recommendations on their dark band: one list of shows and movies, shows or movies, picked from the
  Type dropdown. The pick in the spotlight fills most of the row, and beside it six posters from the list, the
  spotlighted one ringed. Clicking a poster, or the arrows, moves the spotlight; the posters only page when the
  spotlight leaves them. Pass the unawaited `fetchRecommendations` promise from the loader, so the page streams in.
  Until the first list lands, placeholders hold its size, and while another type loads the last list stays, dimmed, so
  the page never jumps. OG has no page for shows and movies together, so the mix links to both.
-->
<script lang="ts">
import { page } from '$app/state';
import { SvelteSet } from 'svelte/reactivity';
import Container from '$lib/components/container/Container.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import NoData from '$lib/components/empty/NoData.svelte';
import SeeMore from '$lib/components/see-more/SeeMore.svelte';
import type { DashboardRecommendations } from '$lib/dashboard/fetchRecommendations';
import type { Recommendation } from '$lib/dashboard/Recommendation';
import type { DashboardSettings } from '$lib/dashboard/DashboardSettings';
import cameraMovie from '$lib/icons/regular/camera-movie.svg?raw';
import thumbsUp from '$lib/icons/regular/thumbs-up.svg?raw';
import tvRetro from '$lib/icons/regular/tv-retro.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import PanelHeading from './PanelHeading.svelte';
import RecommendationSpotlight from './RecommendationSpotlight.svelte';

type RecommendationType = DashboardSettings['recommendations']['type'];

interface Props {
  recommendations: Promise<DashboardRecommendations>;
  /** The saved pick, for the dropdown while the first list streams in. */
  type: RecommendationType;
  isVip: boolean;
  /** Saves the pick and loads its list. Left out, the dropdown is hidden. */
  onpick?: (type: RecommendationType) => Promise<DashboardRecommendations>;
}

const { recommendations, type, isVip, onpick }: Props = $props();

const TYPES = [
  { id: 'media', label: 'Shows & Movies', icon: thumbsUp },
  { id: 'show', label: 'Shows', icon: tvRetro },
  { id: 'movie', label: 'Movies', icon: cameraMovie },
] as const;
const LINKS = {
  media: [
    { href: '/shows/recommendations', text: 'More shows' },
    { href: '/movies/recommendations', text: 'More movies' },
  ],
  show: [{ href: '/shows/recommendations', text: 'More' }],
  movie: [{ href: '/movies/recommendations', text: 'More' }],
} as const;
/** The posters beside the spotlight: two rows of three, or of four under it on a smaller tablet. */
const PAGE = 6;
const TABLET_PAGE = 8;
/** OG's md container, where the posters move under the spotlight (the container query below matches it). */
const SMALL_TABLET = 940;
/** How long to wait for the watch history before showing the list unfiltered. */
const HISTORY_WAIT = 4000;

let picked = $state<{ type: RecommendationType; list: Promise<DashboardRecommendations> }>();
let landed = $state<DashboardRecommendations | null>(null);
let loading = $state(true);
let focus = $state(0);
let width = $state(0);
// Unmeasured on the server, the desktop page.
const perPage = $derived(width > 0 && width < SMALL_TABLET ? TABLET_PAGE : PAGE);
let historyLate = $state(false);
// Until the viewer's watch history is in, the placeholders stay, so the filter can't swap the spotlight under them.
// Signed out there's none to wait for, and after a few seconds the list shows unfiltered rather than not at all.
const historyKnown = $derived(
  !page.data.user || historyLate || Boolean(overlay.slices().watchedMovies && overlay.slices().watchedShows),
);

$effect(() => {
  if (historyKnown) return;
  const timer = setTimeout(() => (historyLate = true), HISTORY_WAIT);
  return () => clearTimeout(timer);
});
const current = $derived(picked?.type ?? type);
const source = $derived(picked?.list ?? recommendations);
const option = $derived(TYPES.find(({ id }) => id === current) ?? TYPES[0]);

// The last list stays on screen until the next one lands; a newer pick overrides an older one still loading.
$effect(() => {
  const list = source;
  const failed: DashboardRecommendations = { type: current, items: null };
  let live = true;
  loading = true;
  const land = (recs: DashboardRecommendations) => {
    if (!live) return;
    landed = recs;
    loading = false;
    focus = 0;
  };
  list.then(land, () => land(failed));
  return () => {
    live = false;
  };
});

// The fanart either side of the spotlight, and the posters a page either way, load ahead so stepping shows them at once.
$effect(() => {
  const items = landed?.items ? visible(landed.items) : null;
  if (!items || items.length === 0) return;
  for (const by of [-1, 1, 2]) {
    const fanart = items.at((focus + by + items.length) % items.length)?.fanart;
    if (fanart) new Image().src = fanart;
  }
  // The pages of posters either side too, so a new page fills at once instead of box by box.
  const start = Math.floor(Math.min(focus, items.length - 1) / perPage) * perPage;
  for (const first of [start - perPage, start + perPage]) {
    for (const item of items.slice(Math.max(first, 0), Math.max(first, 0) + perPage)) {
      if (item.poster) new Image().src = item.poster;
    }
  }
});

// Posters fade in once loaded rather than popping in; one already cached shows straight away.
const loadedPosters = new SvelteSet<string>();
const whenCached = (src: string) => (image: HTMLImageElement) => {
  if (image.complete && image.naturalWidth > 0) loadedPosters.add(src);
};

function pick(next: RecommendationType) {
  if (!onpick || next === current) return;
  picked = { type: next, list: onpick(next) };
}

// For now the API's watched filters miss some, so anything with a play (a movie, or any episode of a show) goes here.
const visible = (items: readonly Recommendation[]) =>
  items.filter((item) =>
    !overlay.isHidden('recommendations', item.type, item.id) && overlay.state(item.type, item.id).watched !== true
  );

const step = (count: number, by: -1 | 1) => (focus = (focus + by + count) % count);
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet links()}
  <span class="links">{#each LINKS[current] as link (link.href)}<SeeMore {...link} />{/each}</span>
{/snippet}

{#snippet poster(item: Recommendation, index: number, spotlit: boolean)}
  <button type="button" class={['poster', { spotlit }]} aria-label="Spotlight {item.title}"
  aria-current={spotlit ? 'true' : undefined} onclick={() => (focus = index)}>
    {#if item.poster}
      {@const src = item.poster}
      <img class={{ loaded: loadedPosters.has(src) }} {src} alt="" decoding="async" {@attach whenCached(src)}
        onload={() => loadedPosters.add(src)} />
    {/if}
  </button>
{/snippet}

<!-- Six slots always, empty ones too, so the band keeps its height on every page. The slots themselves stay put
     from page to page; only what's in them changes. -->
{#snippet posters(items: readonly Recommendation[], start: number, at: number)}
  <div class="posters">
    {#each Array.from({ length: perPage }, (_, i) => i) as slot (slot)}
      {@const index = start + slot}
      {@const item = items.at(index)}
      {#if item}{@render poster(item, index, index === at)}{:else}<span class="poster empty"></span>{/if}
    {/each}
  </div>
{/snippet}

<!-- The same boxes as a landed list, empty and inert, so nothing moves when it lands. -->
{#snippet placeholders()}
  <div class="layout" inert aria-hidden="true">
    <div class="stage"><div class="spotlight-placeholder"></div></div>
    {@render posters([], 0, -1)}
  </div>
{/snippet}

{#snippet body(recs: DashboardRecommendations | null)}
  {@const items = recs?.items ? visible(recs.items) : null}
  {@const at = items && items.length > 0 ? Math.min(focus, items.length - 1) : 0}
  {@const spotlight = items?.at(at)}
  {@const start = Math.floor(at / perPage) * perPage}
  {#if !recs}
    {@render placeholders()}
  {:else if !items}
    <NoData>Recommendations didn't load. Refresh the page to try again.</NoData>
  {:else if !spotlight}
    <NoData>Start watching some shows and movies to get recommendations!</NoData>
  {:else}
    <div class="layout">
      <div class="stage">
        <RecommendationSpotlight item={spotlight} index={at} total={items.length} mixed={recs.type === 'media'}
          {isVip} onstep={(by) => step(items.length, by)} />
      </div>
      {@render posters(items, start, at)}
    </div>
  {/if}
{/snippet}

<div class="recommendations">
  <Container>
    <section aria-labelledby="recommendations-heading" aria-busy={loading} bind:clientWidth={width}>
      <PanelHeading id="recommendations-heading" title="Recommendations" icon={option.icon} {loading} aside={links} />
      {#if onpick}
        <div class="bar">
          <Dropdown section="Type">
            {#snippet trigger()}{option.label}{/snippet}
            <ul>
              {#each TYPES as row (row.id)}
                <li>
                  <button type="button" aria-current={row.id === current ? 'true' : undefined}
                    onclick={() => pick(row.id)}>{row.label}</button>
                </li>
              {/each}
            </ul>
          </Dropdown>
        </div>
      {/if}
      <div class={['body', { stale: loading && landed }]} inert={loading && landed !== null}>
        {@render body(historyKnown ? landed : null)}
      </div>
    </section>
  </Container>
</div>

<style>
/* OG's `#recommendations-wrapper`, in the page's theme like the Social Feed above it. The spotlight stays dark. */
.recommendations {
  overflow-anchor: none;
  --card-border-width: 0;
  display: flow-root;
  padding-block-end: var(--gutter);
  background-color: var(--color-recommendations-bg);
}

section {
  container: recommendations / inline-size;
  background: none;
}

.links {
  display: flex;
  gap: var(--space-recommendations-links);
}

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-dropdown-row);
  margin-block-start: var(--space-heading-dropdowns);
}

.body {
  padding-block-start: var(--space-recommendations-body);
  transition: opacity var(--transition-card);

  &.stale {
    opacity: var(--opacity-recommendations-stale);
  }
}

.layout {
  display: grid;
  grid-template-columns: var(--recommendations-layout);
  gap: var(--recommendations-layout-gap);

  @container recommendations (width < 1100px) {
    grid-template-columns: var(--recommendations-layout-tablet);
  }

  /* A smaller tablet: the posters go under the spotlight, two rows of four. */
  @container recommendations (width < 940px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.stage {
  display: grid;
  min-inline-size: 0;

  /* Beside the posters, they alone set the row's height, so no spotlight can push the page. */
  @container recommendations (width >= 940px) {
    --recommendations-spotlight-min-height: 0;
    contain: size;
  }
}

.spotlight-placeholder {
  min-block-size: var(--recommendations-spotlight-min-height);
  border-radius: var(--radius-recommendations-spotlight);
  background: var(--color-recommendations-placeholder);
}

.posters {
  display: grid;
  grid-template-columns: repeat(var(--recommendations-side-columns), minmax(0, 1fr));
  gap: var(--space-recommendations-side);
  align-content: start;
  min-inline-size: 0;

  @container recommendations (width < 940px) {
    grid-template-columns: repeat(var(--recommendations-side-columns-tablet), minmax(0, 1fr));
  }
}

/* The 2:3 box alone sets the size; the artwork fills it without a say, even one that isn't quite 2:3. */
.poster {
  position: relative;
  display: block;
  min-block-size: 0;
  aspect-ratio: 2 / 3;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: var(--radius-recommendations-poster);
  background: var(--color-recommendations-placeholder);
  cursor: pointer;
  transition: box-shadow var(--transition-recommendations-poster), transform var(--transition-recommendations-poster);

  & img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity var(--transition-recommendations-poster);

    &.loaded {
      opacity: 1;
    }
  }

  &:hover {
    transform: translateY(var(--recommendations-poster-lift));
  }

  &:focus-visible {
    outline: var(--recommendations-poster-ring) solid var(--color-recommendations-poster-focus);
    outline-offset: var(--recommendations-poster-ring);
  }

  &.spotlit {
    box-shadow: var(--shadow-recommendations-spotlit);
  }

  &.empty {
    background: var(--color-recommendations-poster-empty);
    cursor: default;
  }
}

@media (prefers-reduced-motion: reduce) {
  .body,
  .poster,
  .poster img {
    transition: none;
  }

  .poster:hover {
    transform: none;
  }
}
</style>
