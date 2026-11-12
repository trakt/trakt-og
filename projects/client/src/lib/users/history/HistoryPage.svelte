<!--
  `/users/:id/history(/:type)(/:sort_by/:sort_how)` under the profile frame: the subnav with the type, genre
  and date filters, the counter, sort and filter icons, a band naming the one title it's narrowed to, then every play
  as a poster card under day dividers, or in one grid with the dividers off. Shows, and Movies on any sort but Watched Date, chart one card a title instead, and
  one show's or season's plays chart one card an episode.
-->
<script lang="ts">
import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
import SeoHead from '#lib/seo/SeoHead.svelte';
import { toHistorySeo } from '#lib/users/history/toHistorySeo.ts';
import type { HistoryPlay } from '#lib/components/history/HistoryPlay.ts';
import { removeHistoryCards } from '#lib/users/history/removeHistoryCards.ts';
import { SvelteURLSearchParams } from 'svelte/reactivity';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import Container from '#lib/components/container/Container.svelte';
import Dropdown from '#lib/components/dropdown/Dropdown.svelte';
import SortLabel from '#lib/components/sort/SortLabel.svelte';
import SortMenu from '#lib/components/sort/SortMenu.svelte';
import { withTraktSorts } from '#lib/components/sort/sortMenu.ts';
import SortDirection from '#lib/components/dropdown/SortDirection.svelte';
import EmptyState from '#lib/components/empty/EmptyState.svelte';
import DateRangeFilter from '#lib/components/filters/DateRangeFilter.svelte';
import DividersToggle from '#lib/components/filters/DividersToggle.svelte';
import FadeHideMenu from '#lib/components/filters/FadeHideMenu.svelte';
import { type FadeHide, fadeHideOptions, matchesFadeHide } from '#lib/components/filters/fadeHide.ts';
import DayGroup from '#lib/components/history/DayGroup.svelte';
import PosterCard from '#lib/components/media/PosterCard.svelte';
import PosterGrid from '#lib/components/media/PosterGrid.svelte';
import { quickIconFill } from '#lib/components/media/quickIconFill.ts';
import Pagination from '#lib/components/pagination/Pagination.svelte';
import SectionToolbar from '#lib/components/toolbar/SectionToolbar.svelte';
import SubnavCount from '#lib/components/toolbar/SubnavCount.svelte';
import WatchNowFilter from '#lib/components/watchnow/WatchNowFilter.svelte';
import file from '#lib/icons/regular/file.svg?raw';
import check from '#lib/icons/trakt/check-thick.svg?raw';
import { overlay } from '#lib/overlay/overlay.ts';
import type { ViewerSettings } from '#lib/settings/ViewerSettings.ts';
import type { ProfileUser } from '#lib/users/ProfileUser.ts';
import { findAction } from '#lib/users/findAction.ts';
import { formatRuntime } from '#lib/utils/formatRuntime.ts';
import {
  defaultHistorySort,
  flippable,
  type HistorySort,
  historyPath,
  historySortLabels,
  historySortsFor,
  validHistorySort,
} from './historySort.ts';
import { type HistoryItem, ITEM_TYPES, itemHistoryType } from './historyFilters.ts';
import HistoryItemBand from './HistoryItemBand.svelte';
import { genresFor, historyTypes, isHistoryType } from './historyTypes.ts';
import type { loadHistory } from './loadHistory.ts';
import type { HistoryCard } from './toHistoryCard.ts';
import { watchNowCountry } from '../../settings/watchNowCountry.ts';
import { capitalize } from '../../utils/capitalize.ts';

type Props = {
  data: Awaited<ReturnType<typeof loadHistory>> & {
    profile: ProfileUser;
    isSelf: boolean;
    settings: ViewerSettings | null;
  };
};

const { data }: Props = $props();
let days = $derived(data.days);
// A new loader result clears the journal. It is read when each affected card leaves the grid.
const removal = $derived<{ source: Props['data']; keys: readonly number[] }>({ source: data, keys: [] });
function remove(item: HistoryCard, play?: HistoryPlay) {
  removal.keys = days.flatMap((day) =>
    day.cards.filter((card) => play ? card.key === play.id : card.type === item.type && card.id === item.id).map((
      card,
    ) => card.key)
  );
  days = removeHistoryCards({ days, item, play });
}
const seo = $derived(toHistorySeo({ profile: data.profile, type: data.type }));
const title = $derived(seo.title);
const genres = $derived(genresFor(data.type));
const base = $derived(`/users/${data.profile.slug}/history`);
const plural = (count: number, word: string) => `${word}${count === 1 ? '' : 's'}`;
const filtered = $derived(Object.keys(data.filters).length > 0);

// OG's `history_user_path(type, sort_by, sort_how, link_params)`: the query string without the page, and without
// the genre when the type changes. A sort the new type, or the page without its title, doesn't have falls back to
// Watched Date.
function href(
  type: string,
  changes: Record<string, string | null>,
  sort: HistorySort = data.sort,
  item: HistoryItem | undefined = data.filters.item,
) {
  const query = new SvelteURLSearchParams(page.url.search);
  query.delete('page');
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) query.delete(key);
    else query.set(key, value);
  }
  const path = isHistoryType(type)
    ? historyPath(type, validHistorySort(type, sort.by, item) && flippable(sort, item) ? sort : defaultHistorySort)
    : '';
  return `${base}${path}${query.size ? `?${query}` : ''}`;
}

// Another type, or the band's X, leaves the title behind.
const withoutItem = Object.fromEntries(ITEM_TYPES.map((key) => [key, null]));
const sorts = $derived(historySortsFor(data.type, data.filters.item));
const menuSorts = $derived(withTraktSorts(sorts.map((by) => ({ by, label: historySortLabels[by] }))));
const flipped = $derived(data.sort.how === 'desc');
// OG only divides Watched Date by day.
const dividing = $derived(data.sort.by === 'added');

let dividers = $derived(data.dividers);
let fadeHide = $derived<FadeHide>(data.fadeHide);
const fadeOptions = $derived(fadeHideOptions.filter((option) => data.type === 'shows' || !('showsOnly' in option)));
const country = $derived(watchNowCountry(data.settings));
</script>

<!-- Filter URLs keep the canonical profile slug and the query string. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<SeoHead {...seo} />

{#snippet card(item: HistoryCard)}
  {@const state = overlay.state(item.type, item.id)}
  {@const runtime = item.runtime || undefined}
  {@const fill = quickIconFill({ state, airedEpisodes: item.airedEpisodes, runtime, datePreferences: data.datePreferences })}
  <PosterCard
  href={item.href}
  title={item.title}
  number={item.number}
  showTitle={item.showTitle}
  image={item.image}
  variant={item.variant}
  episodeBadge={item.episodeBadge}
  subtitles={item.subtitles ?? (item.show ? [item.show, item.watchedDate] : [item.watchedDate])}
  userRating={state.rating}
  icons={{
        fill,
        rating: item.rating,
        ratingTarget: { type: item.type, id: item.id, title: item.title },
        watchTarget: { type: item.type, id: item.id, title: item.title, airedEpisodes: item.airedEpisodes, runtime,
          season: item.season },
        historyPlay: data.isSelf && !data.charted ? { id: item.key, watchedAt: item.watchedAt } : undefined,
        onWatchRemove: data.isSelf && !data.charted ? (play) => remove(item, play) : undefined,
        watchNow: 'play',
        listLabel: item.type === 'episode' ? 'Add to list' : 'Add to watchlist',
      }}
  removing={() => removal.keys.includes(item.key)}
  faded={fadeHide.fade.some((id) => matchesFadeHide(id, state, fill))}
/>
{/snippet}
{#snippet grid(items: readonly HistoryCard[])}
  <PosterGrid columns={data.screenshots ? 4 : 6}>
    {#each items as item (item.key)}{@render card(item)}{/each}
  </PosterGrid>
{/snippet}

<SectionToolbar>
  {#snippet filters()}
    <Dropdown section="Media">
      {#snippet trigger()}{historyTypes[data.type]}{/snippet}
      <ul>
        {#each Object.entries(historyTypes) as [type, label] (type)}
          <li><a href={href(type, { genres: null, ...withoutItem }, data.sort, undefined)} aria-current={data.type === type ? 'page' : undefined}>{label}</a></li>
        {/each}
      </ul>
    </Dropdown>
    {#if genres && !data.filters.item}
      <span class="genres">
        <Dropdown section="Genre">
          {#snippet trigger()}{data.filters.genre ? genres[data.filters.genre] : 'All'}{/snippet}
          <ul class="limit-10">
            <li><a href={href(data.type, { genres: null })} aria-current={data.filters.genre ? undefined : 'page'}
              >All Genres</a></li>
            {#each Object.entries(genres) as [slug, label] (slug)}
              <li><a href={href(data.type, { genres: slug })} aria-current={data.filters.genre === slug ? 'page' : undefined}
                >{label}</a></li>
            {/each}
          </ul>
        </Dropdown>
      </span>
    {/if}
    <DateRangeFilter start={data.filters.startAt} end={data.filters.endAt} label="Watched At"
      datePreferences={data.datePreferences} />
  {/snippet}
  {#snippet stats()}
    <span class="counts">
      {#if data.counts.unique}
        {@const { count, noun } = data.counts.unique}
        <SubnavCount svg={file} {count} {noun} tooltip={capitalize(`${noun}s`)} />
      {/if}
      {#if data.counts.plays !== undefined}
        <SubnavCount svg={check} count={data.counts.plays} noun="play" tooltip={plural(data.counts.plays, 'Play')}
          tone="watched" />
      {/if}
    </span>
  {/snippet}
  {#snippet summary()}
    <span class="sort">
      <Dropdown joined section="Sort">
        {#snippet trigger()}<SortLabel sort={menuSorts.find(({ by }) => by === data.sort.by)}
            fallback={historySortLabels[data.sort.by]} />{/snippet}
        <SortMenu sorts={menuSorts} current={data.sort.by} href={({ by }) => href(data.type, {}, { by, how: 'asc' })} />
      </Dropdown>
      <!-- Every sort but Title runs newest, most or longest first; Watched Date only flips for one item. -->
      <SortDirection joined descending={data.sort.by !== 'title'} disabled={!flippable(data.sort, data.filters.item)} bind:flipped={
        () => flipped,
        (next) => goto(href(data.type, {}, { by: data.sort.by, how: next ? 'desc' : 'asc' }))
      } />
    </span>
    <span class="icons">
      {#if dividing}<DividersToggle bind:shown={dividers} />{/if}
      <WatchNowFilter value={data.filters.watchnow} {country}
        favorites={data.settings?.browsing?.watchnow?.favorites ?? []} placeholder={data.type === 'all'} />
      <FadeHideMenu value={fadeHide} options={fadeOptions} cookie="history" hideOptions={[]}
        onchange={(next) => (fadeHide = next)} />
    </span>
  {/snippet}
</SectionToolbar>

{#if data.band}<HistoryItemBand band={data.band} allHref={href(data.type, withoutItem, data.sort, undefined)}
    itemHref={(item) => href(itemHistoryType(item), { ...withoutItem, [item.type]: String(item.id) }, data.sort, item)} />{/if}

<section class="history" aria-label={title} {@attach trackDrilldowns({ source: 'watch-history' })}>
  <Container>
    {#if days.length > 0}
      {#if data.page.type === 'paginated'}<Pagination meta={data.page} label="History pages" />{/if}
      {#if dividers && dividing}
        {#each days as day (day.key)}
          <DayGroup weekday={day.weekday} date={day.date}
            runtime={data.type === 'shows' ? undefined : formatRuntime(day.runtime)}>
            {@render grid(day.cards)}
          </DayGroup>
        {/each}
      {:else}
        {@render grid(days.flatMap((day) => day.cards))}
      {/if}
      {#if data.page.type === 'paginated'}<Pagination meta={data.page} label="History pages" />{/if}
    {:else if filtered}
      <EmptyState action={{ href: page.url.pathname, text: 'Clear filters' }} />
    {:else}
      <div class="empty">
        <EmptyState action={data.isSelf ? findAction(data.type) : undefined} />
      </div>
    {/if}
  </Container>
</section>

<style>
.sort {
  display: flex;
  align-items: center;
}

.counts {
  display: flex;
  gap: var(--history-count-gap);
}

.icons {
  display: flex;
  align-items: center;
  gap: var(--history-icon-gap);
}

.limit-10 {
  max-block-size: var(--dropdown-limit-10-height);
  overflow-y: auto;
}

.history {
  display: flow-root;
  padding-block-end: var(--space-panel);

  /* The top pagination spacing: 20px above, the divider's own 20px below. */
  & :global(nav) {
    margin-block: var(--line-height-computed) var(--history-pagination-end);
  }
}

.empty {
  padding-block-start: var(--empty-state-above);
}

@media (width < 768px) {
  .counts {
    display: none;
  }
}
</style>
