<script lang="ts">
import { page } from '$app/state';
import { ogRepoUrls } from '$lib/about/ogRepoUrls';
import { chartFilters } from '$lib/charts/chartFilters';
import LinkButton from '$lib/components/button/LinkButton.svelte';
import Container from '$lib/components/container/Container.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import NoData from '$lib/components/empty/NoData.svelte';
import NoResults from '$lib/components/empty/NoResults.svelte';
import AdvancedFiltersToggle from '$lib/components/filters/AdvancedFiltersToggle.svelte';
import { type AdvancedFilters, emptyFilters } from '$lib/components/filters/advancedFilters';
import FadeHideItems from '$lib/components/filters/FadeHideItems.svelte';
import FadeHideMenu from '$lib/components/filters/FadeHideMenu.svelte';
import { type FadeHide, type FadeHideOption, fadeHideOptions, matchesFadeHide } from '$lib/components/filters/fadeHide';
import { filterChips } from '$lib/components/filters/filterChips';
import FilterMenu from '$lib/components/filters/FilterMenu.svelte';
import FiltersPanel from '$lib/components/filters/FiltersPanel.svelte';
import TermsFilter from '$lib/components/filters/TermsFilter.svelte';
import GlassAction from '$lib/components/glass-action/GlassAction.svelte';
import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import Pagination from '$lib/components/pagination/Pagination.svelte';
import RatingPopover from '$lib/components/rating/RatingPopover.svelte';
import { RATING_LABELS } from '$lib/components/rating/ratingPrompt';
import { watchedFirst } from '$lib/components/rating/watchedFirst';
import RailGroup from '$lib/components/sidebar/RailGroup.svelte';
import SectionToolbar from '$lib/components/toolbar/SectionToolbar.svelte';
import DemoButton from '$lib/design/DemoButton.svelte';
import DemoToggle from '$lib/design/DemoToggle.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import heartOutline from '$lib/icons/regular/heart.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import { creditHideOptions } from '$lib/people/creditHideOptions';
import { traktUrls } from '$lib/traktUrls';
import { imageUrl } from '$lib/utils/imageUrl';
import { samples } from './fixtures.ts';

const { data } = $props();

const shows = $derived(
  data.trending.map(({ show }) => ({
    id: show.ids.trakt,
    href: `/shows/${show.ids.slug}`,
    title: show.title,
    image: imageUrl(show.images?.poster?.at(0), 'thumb'),
    rating: show.rating ?? undefined,
  })),
);

// Sidebar tools: the eye and the funnel, which opens a trending chart's filters panel.
const panelId = $props.id();
const config = chartFilters({ type: 'shows', chart: 'trending', period: 'weekly', now: new Date() });
let collapsed = $state(false);
let panelOpen = $state(false);
let funnel = $state<HTMLButtonElement>();
let filters = $state<AdvancedFilters>(emptyFilters);
let chartFadeHide = $state<FadeHide>({ fade: [], hide: [] });
const filterCount = $derived(
  filterChips({ filters, sources: new Map(), country: 'us', favorites: [] }).length,
);
function closePanel() {
  panelOpen = false;
  funnel?.focus();
}

// The toolbar over a grid: terms and the eye fade or hide cards by the viewer's state.
let terms = $state('');
let fadeHide = $state<FadeHide>({ fade: ['watched'], hide: [] });
const cards = $derived(
  samples.flatMap((sample, index) => {
    const show = shows.at(index);
    if (!show) return [];
    const fill = quickIconFill({
      state: sample.state,
      airedEpisodes: sample.state.watchedEpisodes === 1 ? 2 : 99,
      datePreferences: data.datePreferences,
    });
    const matches = (ids: readonly FadeHideOption[]) => ids.some((id) => matchesFadeHide(id, sample.state, fill));
    return [{ ...sample, show, fill, faded: matches(fadeHide.fade), hidden: matches(fadeHide.hide) }];
  }).filter((card) => !card.hidden && card.show.title.toLowerCase().includes(terms.trim().toLowerCase())),
);
let media = $state('All');

let vipTerms = $state('');
let memberTerms = $state('');

// A person's credits menu: fade and hide, then the types.
type CreditOption = (typeof creditHideOptions)[number]['id'];
let credits = $state<{ fade: CreditOption[]; hide: CreditOption[]; movies: boolean; shows: boolean }>({
  fade: [],
  hide: [],
  movies: true,
  shows: true,
});
const creditsCount = $derived(
  credits.fade.length + credits.hide.length + Number(!credits.movies) + Number(!credits.shows),
);

const pagination = $derived({ current: Number(page.url.searchParams.get('page') ?? 6), total: 40 });

let rated = $state<number | null>(9);
let unrated = $state<number | null>(null);
const rateHint = (value: number | null) =>
  value ? `Your rating\n${value} · ${RATING_LABELS[value]}` : 'Rate this movie\nWhat did you think?';
const locked = watchedFirst({ watched: false }, 'rate');

let overlayVisible = $state(false);
function showOverlay() {
  overlayVisible = true;
  setTimeout(() => (overlayVisible = false), 2000);
}
</script>

{#snippet tools()}
  <FadeHideMenu value={chartFadeHide} options={fadeHideOptions} cookie="design-shows"
  onchange={(next) => (chartFadeHide = next)} />
  <AdvancedFiltersToggle bind:open={panelOpen} bind:button={funnel} controls="{panelId}-filters"
  active={filterCount > 0} count={filterCount} />
{/snippet}

{#snippet mediaFilter()}
  <Dropdown section="Media">
    {#snippet trigger()}{media}{/snippet}
    <ul>
      {#each ['All', 'Shows', 'Movies'] as option (option)}
        <li><button type="button" aria-current={option === media} onclick={() => (media = option)}>{option}</button></li>
      {/each}
    </ul>
  </Dropdown>
{/snippet}
{#snippet filterIcons()}
  <span class="filter-icons">
  <TermsFilter vip bind:terms />
  <FadeHideMenu value={fadeHide} options={fadeHideOptions} cookie="design-list"
    onchange={(next) => (fadeHide = next)} />
</span>
{/snippet}

{#snippet summaryRate({ value }: { value: number | null })}
  <GlassAction presentational glass icon={value ? heart : heartOutline}
  color={value ? `var(--rating-${value})` : undefined}>{value ?? 'Rate'}</GlassAction>
{/snippet}

<Specimen title="Sidebar tools" bleed
  note="A chart or calendar sidebar's eye and funnel, right of the page title, or stacked in the collapsed rail. The funnel (or the a key) opens the filters panel as a VIP sees it; a field's options shimmer until they load.">
  <div class="knob"><DemoToggle bind:checked={collapsed}>Collapsed rail</DemoToggle></div>
  <div class="frame">
    {#if collapsed}
      <div class="rail"><RailGroup tools>{@render tools()}</RailGroup></div>
    {:else}
      <div class="sidebar"><div class="tools">{@render tools()}</div></div>
    {/if}
    {#if panelOpen}
      <FiltersPanel id="{panelId}-filters" open={panelOpen} {config} {filters} vip country="us" favorites={[]}
        onchange={(next) => (filters = next)} onclose={closePanel} />
    {/if}
  </div>
</Specimen>

<Specimen title="Toolbar filters" bleed
  note="A list toolbar's terms box and eye over its grid. Watched starts faded; try Hide, or type part of a title.">
  <SectionToolbar filters={mediaFilter} summary={filterIcons} />
  <section class="grid">
    <Container>
      <PosterGrid columns={6}>
        {#each cards as card (card.show.id)}
          <PosterCard href={card.show.href} title={card.show.title} image={card.show.image} subtitles={[card.label]}
            userRating={card.state.rating} faded={card.faded} icons={{ fill: card.fill, rating: card.show.rating }} />
        {/each}
      </PosterGrid>
    </Container>
  </section>
</Specimen>

<Specimen title="Terms filter" row note="VIPs search as they type. Everyone else gets the VIP pitch in its place.">
  <Variant label="VIP">
    <div class="toolbar">
      <TermsFilter vip bind:terms={vipTerms} />
    </div>
  </Variant>
  <Variant label="Everyone else">
    <div class="toolbar">
      <TermsFilter vip={false} bind:terms={memberTerms} />
    </div>
  </Variant>
</Specimen>

<Specimen title="Credits filter menu"
  note="A person's credits toolbar: fade and hide by the viewer's state or by release, then the types.">
  <div class="toolbar">
    <FilterMenu active={creditsCount > 0} count={creditsCount}>
      <FadeHideItems value={credits} fadeOptions={fadeHideOptions} hideOptions={creditHideOptions}
        onchange={(next) => (credits = { ...credits, ...next })}
        onreset={() => (credits = { ...credits, movies: true, shows: true })} />
      <hr />
      <ul>
        <li class="header" role="presentation">Types</li>
        <li>
          <button type="button" aria-pressed={credits.movies} onclick={() => (credits.movies = !credits.movies)}>
            Movies
          </button>
        </li>
        <li>
          <button type="button" aria-pressed={credits.shows} onclick={() => (credits.shows = !credits.shows)}>
            Shows
          </button>
        </li>
      </ul>
    </FilterMenu>
  </div>
</Specimen>

<Specimen title="Link buttons" row note="Every one opens another site in a new tab, as the about page uses them.">
  <Variant label="Primary, an ask card">
    <div class="ground panel">
      <LinkButton href={ogRepoUrls.newBug}>Open a bug report</LinkButton>
    </div>
  </Variant>
  <Variant label="Violet, the API band">
    <div class="ground panel">
      <LinkButton href={traktUrls.developer} variant="violet">Developer portal</LinkButton>
    </div>
  </Variant>
  <Variant label="Outline, the commits">
    <div class="ground home">
      <LinkButton href={ogRepoUrls.commits} variant="outline">Full commit history on GitHub</LinkButton>
    </div>
  </Variant>
</Specimen>

<Specimen title="Pagination" bleed
  note="Page 6 of 40, with ellipses between the ends and the pages around the current one. Each link reloads this page on its number.">
  <section class="pages">
    <Container>
      <Pagination meta={pagination} label="Ratings pages" />
    </Container>
  </section>
</Specimen>

<Specimen title="Rating on a summary" row
  note="The ratings strip's Rate button. Arrow keys preview a heart; Enter or Space saves it.">
  <Variant label="Rated">
    <div class="stats-bar">
      <RatingPopover label="Rate Fight Club" value={rated} variant="summary" hint={rateHint}
        onrate={(n) => (rated = n)} trigger={summaryRate} />
    </div>
  </Variant>
  <Variant label="Not rated">
    <div class="stats-bar">
      <RatingPopover label="Rate Fight Club" value={unrated} variant="summary" hint={rateHint}
        onrate={(n) => (unrated = n)} trigger={summaryRate} />
    </div>
  </Variant>
  <Variant label="Locked until watched">
    <div class="stats-bar">
      <RatingPopover label="Rate Fight Club" value={null} variant="summary" {locked} onrate={() => {}}
        trigger={summaryRate} />
    </div>
  </Variant>
  <Variant label="Saving">
    <div class="stats-bar">
      <RatingPopover label="Rate Fight Club" value={rated} variant="summary" busy hint={rateHint} onrate={() => {}}
        trigger={summaryRate} />
    </div>
  </Variant>
</Specimen>

<Specimen title="Rating on a poster"
  note="The percentage on a card's quick-icon bar opens the same meter, with your own rating for this show. Signed out, it starts sign-in.">
  {@const show = shows.at(0)}
  {#if show}
    <div class="poster">
      <PosterGrid columns={6}>
        <PosterCard href={show.href} title={show.title} image={show.image}
          icons={{ fill: quickIconFill({ state: {} }), rating: show.rating,
            ratingTarget: { type: 'show', id: show.id, title: show.title } }} />
      </PosterGrid>
    </div>
  {/if}
</Specimen>

<Specimen title="Empty states"
  note="Each where its page puts it. A chart or search with nothing to show centers the droids in its frame.">
  <Variant label="A list with nothing in it">
    <div class="ground surface">
      <NoData />
    </div>
  </Variant>
  <Variant label="A dashboard panel that failed">
    <div class="ground surface">
      <NoData>Up Next didn't load. Refresh the page to try again.</NoData>
    </div>
  </Variant>
  <Variant label="A chart that failed, in the frame">
    <div class="ground frame-page">
      <NoData inFrame>Recommendations didn't load. Refresh the page to try again.</NoData>
    </div>
  </Variant>
  <Variant label="A chart or search with no results">
    <div class="ground frame-page">
      <NoResults />
    </div>
  </Variant>
</Specimen>

<Specimen title="Page loader" row note="The loader veils the whole window, as while a list saves.">
  <DemoButton onclick={showOverlay}>Show the page loader for 2s</DemoButton>
</Specimen>

<LoadingOverlay visible={overlayVisible} />

<style>
.knob {
  padding: var(--design-canvas-padding);
}

.frame {
  display: flex;
  align-items: start;
  background-color: var(--color-frame-page);
  color: var(--color-frame-ink);
}

.sidebar,
.rail {
  align-self: stretch;
  border-inline-end: 1px solid var(--color-frame-line);
  background-color: var(--color-sidebar-bg);
}

.sidebar {
  inline-size: var(--sidebar-width);
  padding: var(--sidebar-padding-top) var(--sidebar-padding) var(--sidebar-padding);
}

.tools {
  display: flex;
  justify-content: end;
  gap: var(--space-tools);
}

.rail {
  inline-size: var(--sidebar-rail-width);
  padding-block: var(--sidebar-padding-top);
}

.filter-icons {
  display: flex;
  align-items: center;
  gap: var(--list-filter-icon-gap);
}

.grid,
.pages {
  display: flow-root;
  padding-block: var(--space-panel);
}

.toolbar {
  display: flex;
  padding: var(--toolbar-padding) var(--gutter);
  background: var(--color-toolbar-bg);
}

.ground {
  padding: var(--gutter);
}

.panel {
  background: var(--color-panel-gray);
}

.home {
  background: var(--color-home-bg);
  color: var(--color-home-text);
}

.surface {
  background-color: var(--color-surface);
}

.frame-page {
  background-color: var(--color-frame-page);
}

.stats-bar {
  display: flex;
  padding: var(--space-lg-block) var(--gutter);
  background-color: var(--color-stats-bar);
  color-scheme: dark;
  color: var(--color-text-inverse);
}

.poster {
  max-inline-size: var(--container-lg);
}
</style>
