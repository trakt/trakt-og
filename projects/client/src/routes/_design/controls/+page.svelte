<script lang="ts">
import FadeHideMenu from '$lib/components/filters/FadeHideMenu.svelte';
import { type FadeHide, fadeHideOptions } from '$lib/components/filters/fadeHide';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import ActionButtons from '$lib/components/summary/ActionButtons.svelte';
import NoData from '$lib/components/empty/NoData.svelte';
import NoResults from '$lib/components/empty/NoResults.svelte';
import LoadingBar from '$lib/components/loading/LoadingBar.svelte';
import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
import Pagination from '$lib/components/pagination/Pagination.svelte';
import RatingPopover from '$lib/components/rating/RatingPopover.svelte';
import { ninja } from '$lib/components/easter/ninja.svelte';
import FilterMenu from '$lib/components/filters/FilterMenu.svelte';
import TermsFilter from '$lib/components/filters/TermsFilter.svelte';
import AdvancedFiltersToggle from '$lib/components/filters/AdvancedFiltersToggle.svelte';
import MultiSelect from '$lib/components/filters/MultiSelect.svelte';
import RangeSlider from '$lib/components/filters/RangeSlider.svelte';
import { filterRanges } from '$lib/components/filters/filterRanges';
import PillTabs from '$lib/components/tabs/PillTabs.svelte';
import LinkButton from '$lib/components/button/LinkButton.svelte';
import Specimen from '$lib/design/Specimen.svelte';

let filters = $state<FadeHide>({ fade: [], hide: [] });
let current = $state(1);
let total = $state(2);
const href = (n: number) => `?page=${n}`;

const tabs = [
  { id: 'likes-30', label: 'Likes 30 Days' },
  { id: 'likes-all', label: 'Likes All Time' },
  { id: 'recent', label: 'Recent', count: 12 },
  { id: 'me', label: 'Me' },
];
let tab = $state('likes-30');

let terms = $state('');
let movies = $state(true);

let rating = $state<number | null>(9);

let funnelOpen = $state(false);
const genreOptions = ['Action', 'Comedy', 'Drama', 'Science Fiction', 'Thriller'].map((label) => ({
  value: label.toLowerCase().replace(' ', '-'),
  label,
}));
let genres = $state<readonly string[]>(['drama']);
const scales = filterRanges({ now: new Date() });
let years = $state<readonly [number, number]>([1990, 2010]);
let imdb = $state<readonly [number, number]>([7, 10]);

let overlay = $state(false);
let bar = $state(false);
function showOverlay() {
  overlay = true;
  setTimeout(() => (overlay = false), 2000);
}
</script>

<Specimen title="Media fade and hide" note="The menu fades or hides watched items; the poster fades as you pick.">
  <div class="media-filters">
    <FadeHideMenu value={filters} options={fadeHideOptions} cookie="design-media"
      onchange={(next) => (filters = next)} />
    <PosterCard title="Season 1" href="/shows/breaking-bad/seasons/1" faded={filters.fade.includes('watched')}
      subtitles={['7 episodes']} />
    <ActionButtons history={false} library={false} comment={false}
      progress={{ watched: 1, collected: 0, visible: 3, total: 3 }} />
  </div>
</Specimen>

<Specimen title="Link buttons" note="Primary, external and outline, on the home page's ground.">
  <div class="link-buttons" id="link-buttons">
    <LinkButton href="#link-buttons">Primary</LinkButton>
    <LinkButton href="https://github.com/trakt/trakt-og/issues/new?labels=bug" external>Open a bug report</LinkButton>
    <LinkButton href="https://developer.trakt.tv" variant="outline" external>Developer portal</LinkButton>
  </div>
</Specimen>

<Specimen title="Pagination">
  <div class="knobs">
    <label>Page <input type="number" min="1" max={total} bind:value={current} /></label>
    <label>Pages <input type="number" min="1" bind:value={total} /></label>
  </div>
  <div id="pagination">
    <Pagination meta={{ current, total }} {href} />
  </div>
</Specimen>

<Specimen title="Pill tabs">
  <div id="tabs">
    <PillTabs label="Comments" {tabs} bind:selected={tab}>
      {#snippet panel(id)}<p class="panel">Panel for <code>{id}</code></p>{/snippet}
    </PillTabs>
  </div>
</Specimen>

<Specimen title="Filter controls" note="The search terms box, for a VIP and everyone else, and the funnel menu.">
  <div class="filters" id="sortable">
    <TermsFilter bind:terms vip />
    <TermsFilter bind:terms vip={false} />
    <FilterMenu active={!movies || terms !== ''} count={movies ? 0 : 1}>
      <ul>
        <li><button type="button" onclick={() => ((movies = true), (terms = ''))}>Show All</button></li>
      </ul>
      <hr />
      <ul>
        <li class="header" role="presentation">Types</li>
        <li><button type="button" aria-pressed={movies} onclick={() => (movies = !movies)}>Movies</button></li>
      </ul>
    </FilterMenu>
    <p>{terms ? `"${terms}"` : 'no terms'}{movies ? '' : ', no movies'}</p>
  </div>
</Specimen>

<Specimen title="Advanced filter controls"
  note="In a sidebar frame: the funnel toggle, a multi-select and range sliders.">
  <div class="frame advanced" id="advanced">
    <AdvancedFiltersToggle bind:open={funnelOpen} controls="advanced" active={genres.length > 0}
      count={genres.length} />
    <MultiSelect bind:value={genres} options={[{ options: genreOptions }]} label="Genres"
      placeholder="Choose genres..." />
    <p>Released in {years[0]} to {years[1]}</p>
    <RangeSlider bind:value={years} scale={scales.years} label="Released" />
    <p>IMDb</p>
    <RangeSlider labeled bind:value={imdb} scale={scales.imdb_ratings} label="IMDb rating"
      format={(v) => v.toFixed(1)} />
  </div>
</Specimen>

<Specimen title="Rating meter"
  note="Arrow keys preview a heart; Enter or Space saves it. The trash button removes the rating. A 10 brings out the Totally Ninja guy.">
  <div class="rating" id="rating">
    <RatingPopover label="Rate the demo item" value={rating} onrate={(n) => (rating = n)}>
      {#snippet trigger()}<span>Rate this item: {rating ?? 'unrated'}</span>{/snippet}
    </RatingPopover>
    <RatingPopover label="Rate the demo item from its summary" variant="summary" value={rating}
      onrate={(n) => (rating = n)}>
      {#snippet trigger()}<span>From a summary, it opens above: {rating ?? 'unrated'}</span>{/snippet}
    </RatingPopover>
    <button type="button" onclick={() => ninja.show()}>Send the Totally Ninja guy</button>
  </div>
</Specimen>

<Specimen title="Empty states" note="No data in a box, then no results in a frame.">
  <div id="no-data">
    <NoData />
  </div>
  <div class="frame" id="no-results">
    <NoResults />
  </div>
</Specimen>

<Specimen title="Loading states" note="The page loader over everything, and the bar along the top.">
  <div class="knobs">
    <button type="button" onclick={showOverlay}>Show the page loader for 2s</button>
    <label class="check"><input type="checkbox" bind:checked={bar} /> Loading bar</label>
  </div>
</Specimen>

<LoadingOverlay visible={overlay} />
<LoadingBar visible={bar} />

<style>
.media-filters {
  max-inline-size: var(--dropdown-min-width);
}

.link-buttons {
  display: flex;
  gap: var(--gutter);
  padding: var(--gutter);
  background: var(--color-home-bg);
  color: var(--color-home-text);
}

.knobs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gutter);
  align-items: end;
  margin-block-end: var(--gutter);

  & label:not(.check) {
    display: inline-grid;
    gap: var(--space-sm-block);
  }
}

.filters,
.rating {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gutter);

  & p {
    margin: 0;
  }
}

.panel {
  margin-block-start: var(--space-lg-block);
}

.frame {
  background-color: var(--color-frame);
}

#no-results {
  margin-block-start: var(--gutter);
}

.advanced {
  display: grid;
  gap: var(--space-lg-block);
  max-inline-size: var(--sidenav-width);
  padding: var(--gutter);
  color: var(--color-frame-text);
}
</style>
