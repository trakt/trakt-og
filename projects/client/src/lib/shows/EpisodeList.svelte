<!--
  A show's episode list (OG's `#seasons-episodes-sortable` of `.row.fanarts`): "N Episodes" with the sort dropdown,
  then a row per episode. The framed fanart card with quick icons sits on the left; on the right "1x02 Title", tag
  pills for the air date (red), the runtime and the type (Season Premiere, in its own color), the overview cut to a few lines under Read More, and
  the community stats as number-only count buttons along the card's foot, shimmering until the row's stats load.
-->
<script lang="ts">
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import MediaSpoiler from '$lib/components/summary/MediaSpoiler.svelte';
import FadeHideMenu from '$lib/components/filters/FadeHideMenu.svelte';
import { type FadeHide, fadeHideOptions, matchesFadeHide } from '$lib/components/filters/fadeHide';
import { replaceState } from '$app/navigation';
import { page } from '$app/state';
import { SvelteURLSearchParams } from 'svelte/reactivity';
import TermsFilter from '$lib/components/filters/TermsFilter.svelte';
import ReadMore from '$lib/components/readmore/ReadMore.svelte';
import TagPills from '$lib/components/labels/TagPills.svelte';
import type { TagPill } from '$lib/components/labels/TagPill';
import FanartCard from '$lib/components/media/FanartCard.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import SortHeading from '$lib/components/summary/SortHeading.svelte';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import ItemStatIcons from '$lib/components/media/ItemStatIcons.svelte';
import { lazyItemStats } from '$lib/shows/lazyItemStats.svelte';
import { expireHideCookie } from '$lib/components/filters/expireHideCookie';
import { EPISODE_SORTS, type EpisodeRow, type EpisodeSort, sortEpisodes } from './toShowEpisodes.ts';

interface Props {
  rows: readonly EpisodeRow[];
  showId: number;
  signedIn?: boolean;
  initialFilters?: FadeHide;
  datePreferences: DatePreferences;
  season?: boolean;
  search?: boolean;
  vip?: boolean;
  initialTerms?: string;
  initialSort?: string;
}

const {
  rows,
  showId,
  signedIn = false,
  initialFilters = { fade: [], hide: [] },
  datePreferences,
  season = false,
  search = false,
  vip = false,
  initialTerms = '',
  initialSort = 'aired,asc',
}: Props = $props();

const sorts = $derived(season ? EPISODE_SORTS.filter(({ by }) => by !== 'aired') : EPISODE_SORTS);
const initial = () => sorts.find(({ by }) => by === initialSort.split(',').at(0));
const startBy = () => initial()?.by ?? (season ? 'number' : 'aired');
const startFlipped = () => initial() ? initial()?.desc !== (initialSort.split(',').at(1) === 'desc') : false;
const startTerms = () => initialTerms;
// Props are initial values; the page keys this component on the item and URL query.
let by = $state<EpisodeSort>(startBy());
let flipped = $state(startFlipped());
let terms = $state(startTerms());
let filters = $derived(initialFilters);
const options = fadeHideOptions.filter((option) => !('showsOnly' in option));
const view = (row: EpisodeRow) => {
  const state = overlay.state('episode', row.id, { show: showId, number: row.season, episode: row.episode });
  const fill = quickIconFill({ state, datePreferences });
  const matches = (id: (typeof options)[number]['id']) => matchesFadeHide(id, state, fill);
  return { state, fill, hidden: signedIn && filters.hide.some(matches), faded: signedIn && filters.fade.some(matches) };
};
// The search looks through each episode's title and overview.
const matching = $derived.by(() => {
  const term = terms.trim().toLocaleLowerCase();
  return rows.filter(({ title, overview }) =>
    title.toLocaleLowerCase().includes(term) || (overview?.toLocaleLowerCase().includes(term) ?? false)
  );
});
const filtered = $derived(matching.filter((row) => !view(row).hidden));
const stats = lazyItemStats({
  items: () => filtered.map((row) => ({ id: row.id, show: showId, season: row.season, episode: row.episode })),
  sort: () => by,
  fallback: () => season ? 'number' : 'aired',
});
const sorted = $derived(sortEpisodes({ rows: filtered, by: stats.by, flipped, stats: stats.counts }));

function saveFilters(next: FadeHide) {
  filters = next;
  const params = new SvelteURLSearchParams(page.url.search);
  for (const section of ['fade', 'hide'] as const) {
    if (filters[section].length) params.set(section, filters[section].join(','));
    else params.delete(section);
  }
  if (terms.trim()) params.set('terms', terms.trim());
  else params.delete('terms');
  const natural = sorts.find((sort) => sort.by === by)?.desc ?? false;
  params.set('sort', `${by},${natural !== flipped ? 'desc' : 'asc'}`);
  const search = params.toString().replaceAll('%2C', ',');
  if (`?${search}` === page.url.search) return;
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- only this page's query changes
  replaceState(`${page.url.pathname}?${search}${page.url.hash}`, page.state);
}

function clearHide() {
  expireHideCookie('season');
  saveFilters({ ...filters, hide: [] });
}

// The air date in red, the runtime, then the episode's type (Season Premiere) in its own color.
const metaTags = (row: EpisodeRow): readonly TagPill[] => [
  row.aired ? { text: row.aired, kind: 'primary' } : { text: 'No air date' },
  ...(row.runtime ? [{ text: row.runtime }] : []),
  ...(row.type ? [{ text: row.type.text, color: `var(--episode-${row.type.kind})` }] : []),
];
</script>

<!-- Hrefs are built from API slugs, and resolve() only takes literal routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if rows.length > 0}
  <section class="episodes" aria-labelledby="episodes">
    <SortHeading id="episodes" count={filtered.length} noun="Episode" {sorts} bind:by bind:flipped loading={stats.loading}>
      {#snippet controls()}{#if search}<TermsFilter bind:terms {vip} help="Only display episodes with a title or overview matching your search term." />{/if}{#if signedIn}<FadeHideMenu value={filters} {options} cookie="season" onchange={saveFilters} />{/if}{/snippet}
    </SortHeading>
    {#if filtered.length === 0}
      <div class="empty" role="status">
        {#if matching.length === 0}
          <EmptyState action={{ text: 'Clear search', onclick: () => (terms = '') }} />
        {:else}
          <EmptyState action={{ text: 'Show hidden episodes', onclick: clearHide }} />
        {/if}
      </div>
    {/if}
    {#each sorted as row (row.id)}
      {@const item = view(row)}
      {@const state = item.state}
      {@const season = { show: showId, number: row.season, episode: row.episode }}
      <article class={["row", { faded: item.faded }]} aria-labelledby="episode-{row.id}" {@attach stats.observe({ id: row.id, show: showId, season: row.season, episode: row.episode })}>
        <FanartCard
          framed
          href={row.href}
          title={row.title}
          number={row.number}
          image={row.image}
          spoilerImage={row.spoilerImage}
          titles={false}
          userRating={state.rating}
          icons={{
            fill: item.fill,
            ratingTarget: { type: 'episode', id: row.id, title: row.title, season },
            watchTarget: { type: 'episode', id: row.id, title: row.title, season },
            collectionTarget: { type: 'episode', id: row.id, title: row.title, season },
            rating: row.rating,
            released: row.released,
            listLabel: 'Add to list',
            watchNow: 'play',
          }}
        />
        <div class="info">
          <div class="titles">
            <h3 id="episode-{row.id}"><a href={row.href}><span class="number">{row.number}</span></a> <MediaSpoiler target={{type:"episode",id:row.id}} kind="title" inline><a href={row.href}>{row.title}</a></MediaSpoiler></h3>
            <div class="meta"><TagPills tags={metaTags(row)} /></div>
          </div>
          {#if row.overview}
            <div class="overview">
              <MediaSpoiler target={{ type: 'episode', id: row.id }} kind="overview"><ReadMore>{row.overview}</ReadMore></MediaSpoiler>
            </div>
          {/if}
          <div class="stats">
            <ItemStatIcons href={row.href} stats={stats.counts.get(row.id)} comments={row.comments} released={row.released}
              loading={!stats.counts.has(row.id)} />
          </div>
        </div>
      </article>
    {/each}
  </section>
{/if}

<style>
/* Room under the last episode before the next section, like a poster grid's. */
.episodes {
  margin-block-end: var(--gutter);
}

/* OG's col-md-4 / col-md-8 (col-sm-5 / col-sm-7), stacked on phones. */
.row {
  transition: opacity var(--transition-card);
  &.faded:not(:hover, :focus-within) {
    opacity: var(--opacity-faded);
    --faded-art-filter: var(--filter-faded);
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
  display: grid;
  grid-template-columns: calc((100% + var(--gutter)) * 4 / 12 - var(--gutter)) minmax(0, 1fr);
  column-gap: var(--gutter);
  margin-block-start: var(--gutter);

  @media (width < 992px) {
    grid-template-columns: calc((100% + var(--gutter)) * 5 / 12 - var(--gutter)) minmax(0, 1fr);
  }

  @media (width < 768px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.info {
  display: flex;
  flex-direction: column;
  gap: var(--episode-info-gap);
  min-inline-size: 0;
}

.titles {
  display: grid;
  gap: var(--episode-titles-gap);
}

h3 {
  margin: 0;
  font-family: var(--font-headings);
  font-size: var(--font-size-episode-title);
  font-weight: var(--font-weight-headings);

  line-height: var(--line-height-headings);

  & a {
    color: var(--color-episode-title);
    text-decoration: none;

    &:hover {
      color: var(--brand-primary);
      text-decoration: none;
    }
  }
}

.number {
  color: var(--brand-primary);
}

.meta {
  margin-block-start: var(--episode-meta-gap);
}

.empty {
  margin-block-start: var(--gutter);
}

/* Level with the card's foot; a longer, opened overview pushes it down. */
.stats {
  margin-block-start: auto;
}

/* A few lines, under a short fade in the page's color. */
.overview {
  --comment-collapsed-height: var(--episode-overview-collapsed-height);
  --comment-shade-height: var(--episode-overview-shade-height);
  --read-more-shade: var(--color-surface);
  font-size: var(--font-size-episode-overview);
}
</style>
