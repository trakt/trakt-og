<!--
  The person summary (`/people/:id`): the media frame with a bio, the Known For posters, then the credits by department,
  as rows or posters under their years. The sidebar's career chart narrows the credits to five years.
-->
<script lang="ts">
import SeoHead from '$lib/seo/SeoHead.svelte';
import { toPersonSeo } from '$lib/seo/pages/toPersonSeo';
import { afterNavigate, replaceState } from '$app/navigation';
import { tick } from 'svelte';
import { page } from '$app/state';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import SortDirection from '$lib/components/dropdown/SortDirection.svelte';
import FanartHeader from '$lib/components/media/FanartHeader.svelte';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import FadeHideItems from '$lib/components/filters/FadeHideItems.svelte';
import { fadeHideOptions } from '$lib/components/filters/fadeHide';
import FilterMenu from '$lib/components/filters/FilterMenu.svelte';
import TermsFilter from '$lib/components/filters/TermsFilter.svelte';
import ViewToggle from '$lib/components/toolbar/ViewToggle.svelte';
import ActionButtons from '$lib/components/summary/ActionButtons.svelte';
import AdditionalStat from '$lib/components/summary/AdditionalStat.svelte';
import AdditionalStats from '$lib/components/summary/AdditionalStats.svelte';
import ExternalLinks from '$lib/components/summary/ExternalLinks.svelte';
import MediaTools from '$lib/components/summary/MediaTools.svelte';
import NameList from '$lib/components/summary/NameList.svelte';
import Overview from '$lib/components/summary/Overview.svelte';
import PrivateNotes from '$lib/components/summary/PrivateNotes.svelte';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import RatingsStrip from '$lib/components/summary/RatingsStrip.svelte';
import SectionNav from '$lib/components/summary/SectionNav.svelte';
import SummaryFrame from '$lib/components/summary/SummaryFrame.svelte';
import SummaryPoster from '$lib/components/summary/SummaryPoster.svelte';
import { personPlaceholder } from '$lib/components/summary/personPlaceholder';
import SummaryTitle from '$lib/components/summary/SummaryTitle.svelte';
import TitleTags from '$lib/components/summary/TitleTags.svelte';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import { countLabel } from '$lib/utils/countLabel';
import { afterVisibleFor } from '$lib/utils/afterVisibleFor';
import { ordinal } from '$lib/utils/ordinal';
import Icon from '$lib/icons/Icon.svelte';
import cake from '$lib/icons/solid/cake-candles.svg?raw';
import sparkles from '$lib/icons/solid/sparkles.svg?raw';
import BirthdayGuest from '$lib/extras/birthday-guest.svelte';
import BirthdayHat from '$lib/extras/birthday-hat.svelte';
import { birthdayBurst } from '$lib/extras/birthdayBurst';
import { toAgeDigits } from './toAgeDigits.ts';
import { formatDate } from '$lib/utils/formatDate';
import CareerEras from './CareerEras.svelte';
import { creditHideOptions } from './creditHideOptions.ts';
import CreditRow from './CreditRow.svelte';
import { eraAccent } from './eraAccent.ts';
import { groupCreditsByYear } from './groupCreditsByYear.ts';
import { matchesCreditFilter } from './matchesCreditFilter.ts';
import { creditSorts } from './creditSorts.ts';
import type { CreditsQuery } from './CreditsQuery.ts';
import type { loadPerson } from './loadPerson.ts';
import type { PersonCredit } from './PersonCredit.ts';
import { toCareerEras } from './toCareerEras.ts';
import { toCreditsSearch } from './toCreditsSearch.ts';
import { visibleCredits } from './visibleCredits.ts';
import { prefersReducedMotion } from 'svelte/motion';

type Props = {
  data: Awaited<ReturnType<typeof loadPerson>> & { datePreferences: DatePreferences; user: HeaderUser | null };
};

const { data }: Props = $props();
const person = $derived(data.person);
const facts = $derived(person.facts);

// Birthdays are calendar days, so they format in UTC or they'd slip a day west of Greenwich.
const day = (date: string) => formatDate(date, { ...data.datePreferences, format: 'LL', timeZone: 'UTC' });

// The loader parsed the URL once; after that the controls own the view and write it back to the URL.
// svelte-ignore state_referenced_locally
let query = $state<CreditsQuery>({ ...data.query });
// svelte-ignore state_referenced_locally
let tab = $state(person.defaultDepartment);

const tabs = $derived(
  person.departments.map((department) => {
    const credits = visibleCredits(department.credits, query).filter((credit) =>
      !query.hide.some((option) =>
        matchesCreditFilter({ option, credit, state: data.user ? overlay.state(credit.type, credit.id) : {} })
      )
    );

    return { id: department.id, label: department.label, count: credits.length.toLocaleString('en-US'), credits };
  }),
);
const current = $derived(tabs.find(({ id }) => id === tab) ?? tabs[0]);

let view = $state<'grid' | 'list'>('list');
// The sidebar chart's pick: the first year of five.
let era = $state<number | null>(null);
// Appearances as themselves (archive footage, talk shows) would stretch the chart back before the career began.
const eras = $derived(
  toCareerEras({
    credits: current?.credits ?? [],
    span: (current?.credits ?? []).filter((credit) => !matchesCreditFilter({ option: 'self', credit, state: {} })),
  }),
);
const picked = $derived(eras.find(({ start }) => start === era));
const shown = $derived(
  (current?.credits ?? []).filter(({ year }) =>
    !picked || (year !== undefined && year >= picked.start && year <= picked.end)
  ),
);
// Years only read as a timeline under the released sort.
const years = $derived(query.sort === 'released' ? groupCreditsByYear(shown) : undefined);

function yearAccent(year: number | undefined) {
  const index = eras.findIndex(({ start, end }) => year !== undefined && year >= start && year <= end);
  return index < 0 ? 'var(--color-text-muted)' : eraAccent(index);
}

// Acting credits are named by the character, crew credits by the title.
const eraName = (credit: PersonCredit) =>
  tab === 'acting' && credit.characters ? credit.characters.split(', ')[0] ?? credit.title : credit.title;
const sortName = $derived(creditSorts.find(({ id }) => id === query.sort)?.label);
// The fanart's source as a tag bar: the department, then the title, its year and who they played, tinted.
const fanartSource = $derived.by(() => {
  const source = person.fanart?.caption;
  if (!source) return undefined;
  const who = source.characters?.split(', ')[0];
  return {
    label: source.role,
    links: [
      { title: source.title, href: source.href },
      ...(source.year ? [{ title: String(source.year) }] : []),
      ...(who ? [{ title: who, tint: 'var(--color-person-fanart-character)' }] : []),
    ],
  };
});
const textLinks = $derived(person.links.filter(({ icon }) => !icon));
const filtered = $derived(
  !query.movies || !query.shows || query.terms !== '' || query.fade.length > 0 || query.hide.length > 0,
);
function clearFilters() {
  query = { ...query, terms: '', hide: [], movies: true, shows: true };
  era = null;
}
// Their birthday: the gold tag, the party hat, the confetti, and after a long while in view, a Known For character.
const birthday = $derived(data.birthday);
const firstName = $derived(person.name.split(' ')[0] ?? person.name);
// Long after the confetti, so only someone who stayed on the page finds it.
const SURPRISE_AFTER_MS = 60000;
let surprise = $state(false);
let announced = $state('');
let headshot = $state<HTMLElement>();
const crasher = $derived.by(() => {
  const cast = person.knownFor.filter((credit) => credit.image && credit.characters);
  return cast.at(Math.floor(Math.random() * cast.length));
});
$effect(() => {
  if (!birthday) return;
  announced = `Happy ${ordinal(birthday.age)} birthday, ${person.name}`;
  return afterVisibleFor({
    ms: SURPRISE_AFTER_MS,
    callback: () => {
      surprise = !prefersReducedMotion.current;
    },
  });
});

const progress = $derived.by(() => {
  const credits = tabs.find(({ id }) => id === tab)?.credits ?? [];
  const fills = credits.map((credit) =>
    quickIconFill({ state: overlay.state(credit.type, credit.id), airedEpisodes: credit.airedEpisodes })
  );
  return {
    watched: fills.filter((fill) => fill.watched === 1).length,
    collected: fills.filter((fill) => fill.collected === 1).length,
    visible: credits.length,
    total: person.departments.find(({ id }) => id === tab)?.credits.length ?? 0,
  };
});

// URL canonicalization runs after the router starts, including when a shared link uses a different param order.
let ready = $state(false);
afterNavigate(() => (ready = true));
$effect(() => {
  if (!ready) return;
  const search = toCreditsSearch(query);
  if (search === page.url.search) return;
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same page, with only its query changed
  replaceState(`${page.url.pathname}${search}${page.url.hash}`, page.state);
});

const episodesLabel = (credit: PersonCredit) =>
  credit.episodeCount > 0 && !data.hideEpisodeCounts ? countLabel(credit.episodeCount, 'episode') : undefined;

function cardIcons(credit: PersonCredit, state: ReturnType<typeof overlay.state>) {
  return {
    fill: quickIconFill({
      state,
      airedEpisodes: credit.airedEpisodes,
      runtime: credit.runtime,
      datePreferences: data.datePreferences,
    }),
    ratingTarget: { type: credit.type, id: credit.id, title: credit.title },
    watchTarget: {
      type: credit.type,
      id: credit.id,
      title: credit.title,
      airedEpisodes: credit.airedEpisodes,
      runtime: credit.runtime,
    },
    rating: credit.rating,
    // ponytail: OG showed watch now only with sources in the viewer's country. Until #60 brings
    // sources, anything not out yet is taken to have none, like the chart pages.
    watchNow: credit.released ? ('play' as const) : undefined,
  };
}

// A picked era swaps the list under the chart, so bring the list's top into view, once the new list is drawn: aimed at
// the old one, a smooth scroll from far down the page would stop short as the page shrinks under it.
async function showCredits() {
  await tick();
  document.getElementById('credits')?.scrollIntoView({
    block: 'start',
    behavior: prefersReducedMotion.current ? 'instant' : 'smooth',
  });
}

const watchedCredit = (credit: PersonCredit) =>
  quickIconFill({ state: overlay.state(credit.type, credit.id), airedEpisodes: credit.airedEpisodes }).watched === 1;

const isFaded = (credit: PersonCredit, state: ReturnType<typeof overlay.state>) =>
  !!data.user && query.fade.some((option) => matchesCreditFilter({ option, credit, state }));

// OG's under-title: year, then the status of an unreleased movie or a show's episode count, in italics.
function yearLine(credit: PersonCredit) {
  const episodes = episodesLabel(credit);
  const parts = [
    credit.year ? String(credit.year) : undefined,
    credit.status ? { em: credit.status } : undefined,
    episodes ? { em: episodes } : undefined,
  ].filter((part) => part !== undefined);
  if (parts.length === 0) return ' ';
  return parts.flatMap((part, i) => (i === 0 ? [part] : [' — ', part]));
}
</script>

<SeoHead {...toPersonSeo(person)} />

{#snippet card(credit: PersonCredit, faded: boolean)}
  {@const state = overlay.state(credit.type, credit.id)}
  <PosterCard
  faded={faded && isFaded(credit, state)}
  href={credit.href}
  title={credit.title}
  fullTitle={credit.year ? `${credit.title} (${credit.year})` : credit.title}
  image={credit.image}
  subtitles={[yearLine(credit), credit.characters || ' ']}
  userRating={state.rating}
  dropped={state.dropped}
  icons={cardIcons(credit, state)}
/>
{/snippet}

{#snippet row(credit: PersonCredit)}
  {@const state = overlay.state(credit.type, credit.id)}
  <CreditRow {credit} episodes={episodesLabel(credit)} userRating={state.rating} faded={isFaded(credit, state)}
  icons={cardIcons(credit, state)} />
{/snippet}

{#snippet credits(list: readonly PersonCredit[], columns: number)}
  {#if view === 'list'}
    <div class="rows">
      {#each list as credit (`${credit.type}-${credit.id}`)}{@render row(credit)}{/each}
    </div>
  {:else}
    <PosterGrid {columns}>
      {#each list as credit (`${credit.type}-${credit.id}`)}{@render card(credit, true)}{/each}
    </PosterGrid>
  {/if}
{/snippet}

<!-- OG's person ratings bar only ever counted lists, and it collapsed with none (`.no-stats`). -->
{#snippet lists()}
  <RatingsStrip
  counts={[{ count: person.listCount, label: person.listCount === 1 ? 'list' : 'lists', href: `${person.href}/lists` }]}
/>
{/snippet}

{#snippet fanartTags()}{#if fanartSource}<TitleTags {...fanartSource} />{/if}{/snippet}

<FanartHeader image={person.fanart?.image} caption={fanartSource ? fanartTags : undefined} slim
  position="var(--person-fanart-position)"
  stats={person.listCount > 0 ? lists : undefined}>
  <div {@attach birthday ? birthdayBurst : undefined}>
    <SummaryTitle title={person.name}
      highlight={birthday ? { text: `${ordinal(birthday.age)} Birthday`, svg: sparkles } : undefined} />
  </div>
</FanartHeader>

{#if birthday}
  <p class="visually-hidden" aria-live="polite">{announced}</p>
  <!-- Out here, not in the sidebar: the sticky sidebar's layer would keep the hat under the header. -->
  {#if headshot}<BirthdayHat anchor={headshot} />{/if}
  {#if surprise && crasher?.image}
    <BirthdayGuest image={crasher.image} name={firstName} from={crasher.characters.split(', ')[0] ?? crasher.title}
  ondone={() => (surprise = false)} />
  {/if}
{/if}

<SummaryFrame label={person.name}>
  {#snippet tools()}
    <MediaTools target={{ type: 'person', id: person.id, title: person.name, href: person.href, tmdb: person.links.find((link) => link.label === 'TMDB')?.href, fanart: person.fanart?.image }} />
  {/snippet}

  {#snippet sidebar()}
    <div bind:this={headshot}>
      <SummaryPoster image={person.headshot ?? personPlaceholder(person.genderId)} alt={person.name} />
    </div>
    <SectionNav
      sections={[
        { label: 'Biography', href: '#overview' },
        ...(person.knownFor.length > 0 ? [{ label: 'Known For', href: '#known-for' }] : []),
        { label: 'Credits', href: '#credits' },
      ]}
      label="{person.name} sections"
    />
    {#if eras.length > 1}
      <CareerEras {eras} bind:selected={era} name={eraName} onpick={showCredits}
        watched={data.user ? watchedCredit : undefined} />
    {/if}
    <ExternalLinks links={person.links} />
  {/snippet}

  {#snippet details()}
    <AdditionalStats>
      {#if facts.age !== undefined}
        <AdditionalStat label="Age">
          {#if birthday}
            <span class="birthday-age"><Icon svg={cake} /><span class="age-roll" aria-label={String(birthday.age)}
              >{#each toAgeDigits(birthday.age - 1, birthday.age) as digit, i (i)}{#if digit.from === digit.to}<span
                    class="digit" aria-hidden="true">{digit.to}</span>{:else}<span class="digit rolling" aria-hidden="true"
                    ><span class="reel"><span>{digit.from}</span><span>{digit.to}</span></span></span>{/if}{/each}</span
              > today</span>
          {:else}
            {facts.age}
          {/if}
        </AdditionalStat>
      {/if}
      {#if facts.gender}
        <AdditionalStat label="Gender">{facts.gender}</AdditionalStat>
      {/if}
      {#if facts.birthday}
        <AdditionalStat label="Birthday">{day(facts.birthday)}</AdditionalStat>
      {/if}
      {#if facts.death}
        <AdditionalStat label="Died">{day(facts.death)}</AdditionalStat>
      {/if}
      {#if facts.birthplace}
        <AdditionalStat label="Birthplace">{facts.birthplace}</AdditionalStat>
      {/if}
      {#if facts.knownFor}
        <AdditionalStat label="Known For">{facts.knownFor}</AdditionalStat>
      {/if}
      {#if textLinks.length > 0}
        <AdditionalStat label="Links" phoneOnly>
          <NameList names={textLinks.map(({ label, href }) => ({ name: label.replace(' Site', ''), href }))} />
        </AdditionalStat>
      {/if}
    </AdditionalStats>
    <Overview overview={person.biography} />
    <PrivateNotes {...data.privateNotes} />
  {/snippet}

  {#snippet actions()}
    <ActionButtons progress={data.user ? progress : undefined} history={false} library={false} comment={false} list={false} />
  {/snippet}

  {#if person.knownFor.length > 0}
    <section class="known-for" id="known-for" aria-labelledby="known-for-heading">
      <h2 id="known-for-heading"><strong>Known</strong> For</h2>
      <PosterGrid columns={5}>
        {#each person.knownFor as credit (`${credit.type}-${credit.id}`)}{@render card(credit, false)}{/each}
      </PosterGrid>
    </section>
  {/if}

  <section class="credits" id="credits" aria-labelledby="credits-heading">
    <h2 id="credits-heading"><strong>Credits</strong></h2>
    <div class="toolbar">
      {#if current}
        <Dropdown section="Department">
          {#snippet trigger()}{current.label}<span class="tag">{current.count}</span>{/snippet}
          <ul>
            {#each tabs as department (department.id)}
              <li>
                <button type="button" aria-current={department.id === current.id}
                  onclick={() => ((tab = department.id), (era = null))}
                  ><span>{department.label}</span><span class="tag">{department.count}</span></button>
              </li>
            {/each}
          </ul>
        </Dropdown>
      {/if}
      <div class="controls">
        <span class="sort">
          <Dropdown joined section="Sort">
            {#snippet trigger()}{sortName}{/snippet}
            <ul>
              {#each creditSorts as sort (sort.id)}
                <li>
                  <button type="button" aria-current={sort.id === query.sort}
                    onclick={() => (query = { ...query, sort: sort.id, reversed: false })}>{sort.label}</button>
                </li>
              {/each}
            </ul>
          </Dropdown>
          <SortDirection joined descending={creditSorts.find(({ id }) => id === query.sort)?.descending}
            bind:flipped={query.reversed} />
        </span>
        <span class="filter-icons">
          <ViewToggle bind:view />
          <TermsFilter bind:terms={query.terms} />
          <FilterMenu active={filtered} count={query.fade.length + query.hide.length + Number(!query.movies) + Number(!query.shows)}>
            <FadeHideItems value={query} fadeOptions={data.user ? fadeHideOptions : []} hideOptions={data.user ? creditHideOptions : creditHideOptions.filter(({ id }) => ['released', 'unreleased', 'noreleasedate', 'self'].includes(id))}
              onchange={(next) => (query = { ...query, fade: next.fade.filter((id): id is (typeof fadeHideOptions)[number]['id'] => fadeHideOptions.some((option) => option.id === id)), hide: next.hide })}
              onreset={() => (query = { ...query, terms: '', movies: true, shows: true })} />
            <hr />
            <ul>
              <li class="header" role="presentation">Types</li>
              <li><button type="button" aria-pressed={query.movies} onclick={() => (query = { ...query, movies: !query.movies })}>
                  Movies
                </button></li>
              <li><button type="button" aria-pressed={query.shows} onclick={() => (query = { ...query, shows: !query.shows })}>
                  Shows
                </button></li>
            </ul>
          </FilterMenu>
        </span>
      </div>
    </div>

    {#if !current}
      <EmptyState />
    {:else if shown.length === 0}
      <EmptyState action={{ onclick: clearFilters, text: 'Clear filters' }} />
    {:else if years}
      {#each years as group, i (`${group.year}-${i}`)}
        <section class={['year', view]} style:--era-accent={yearAccent(group.year)}
          aria-label={group.year ? String(group.year) : 'No release date'}>
          <p class="year-label" aria-hidden="true">
            <span class={['figure', { undated: !group.year }]}>{group.year ?? 'TBA'}</span>
            <span class="count">{countLabel(group.credits.length, 'credit')}</span>
          </p>
          {#if view === 'list'}
            {@render credits(group.credits, 4)}
          {:else}
            <div class="year-posters">
              {#each group.credits as credit (`${credit.type}-${credit.id}`)}{@render card(credit, true)}{/each}
            </div>
          {/if}
        </section>
      {/each}
    {:else}
      {@render credits(shown, 5)}
    {/if}
  </section>
</SummaryFrame>

<style>
.credits {
  --year-slots: 5;
  scroll-margin-block-start: calc(var(--header-height) + var(--gutter));
  --year-posters: 4;
  container-type: inline-size;
  margin-block-start: var(--gutter);
}

/* The grid's columns by width, as PosterGrid drops them: the year takes one poster's slot. */
@container (width < 940px) {
  .credits {
    --year-slots: 4;
    --year-posters: 3;
  }
}

@container (width < 720px) {
  .credits {
    --year-slots: 3;
    --year-posters: 2;
  }
}

.sort,
.filter-icons {
  display: flex;
  align-items: center;
}

/* Like the list toolbar: the search and the eye sit close, the sort a toolbar gap away. */
.filter-icons {
  gap: var(--list-filter-icon-gap);
}

h2 {
  margin: 0;
}

.birthday-age {
  display: inline-flex;
  align-items: center;
  gap: var(--birthday-age-gap);
  color: var(--color-birthday);
  font-weight: var(--font-weight-headings-heavy);
}

/*
  The age rolls over like an odometer as the confetti settles: each digit that changes scrolls up from the old one to
  the new one, overshooting a touch before it settles; the ones that don't change stay put.
*/
.age-roll {
  display: inline-flex;
  font-variant-numeric: tabular-nums;
}

.rolling {
  display: inline-block;
  block-size: 1lh;
  overflow: hidden;
  vertical-align: bottom;
}

.reel {
  display: flex;
  flex-direction: column;
  animation: roll var(--birthday-roll-duration) var(--ease-birthday-roll) var(--birthday-flip-delay) both;

  & > span {
    block-size: 1lh;
  }
}

@keyframes roll {
  to {
    translate: 0 -50%;
  }
}

.known-for {
  margin-block-start: var(--gutter);
}

/* A year's credits beside its figure, in Box Office's trade-paper numbers under its era's color. */
.year {
  display: grid;
  grid-template-columns: var(--person-credits-year-width) minmax(0, 1fr);
  gap: var(--person-credits-year-gap);
  align-items: start;
  /* Even above and below, so a year's credits sit centered between its rules. */
  padding-block: var(--person-credits-year-padding);

  & + & {
    border-block-start: 1px solid var(--color-separator);
  }

  /* One poster's width for the year, so its posters match the five-across grid. */
  &.grid {
    grid-template-columns: calc((100% - (var(--year-slots) - 1) * var(--gutter)) / var(--year-slots)) minmax(0, 1fr);
    column-gap: var(--gutter);
  }
}

.year-posters {
  display: grid;
  grid-template-columns: repeat(var(--year-posters), minmax(0, 1fr));
  gap: var(--gutter);
  /* A row's padding, so the posters sit as far from the rules as the rows do. */
  padding-block: var(--person-credit-row-padding);
}

.year-label {
  /* Pinned under the site header while its year scrolls by, until the next year's section takes over. */
  position: sticky;
  inset-block-start: calc(var(--header-height) + var(--person-credits-year-sticky-gap));
  display: grid;
  margin: 0;
  padding-block-start: var(--person-credit-row-padding);

  &::before {
    content: '';
    inline-size: var(--person-credits-year-mark-width);
    block-size: var(--person-credits-year-mark-height);
    margin-block-end: var(--person-credits-year-mark-gap);
    border-radius: var(--radius-person-eras-bar);
    background-color: var(--era-accent);
  }
}

.figure {
  font-family: var(--font-person-credits-year);
  font-size: var(--font-size-person-credits-year);
  font-weight: var(--font-weight-headings);
  font-variant-numeric: tabular-nums;
  line-height: var(--line-height-person-credits-year);

  &.undated {
    font-size: var(--font-size-person-credits-year-undated);
  }
}

.count {
  margin-block-start: var(--person-credits-year-mark-gap);
  color: var(--color-text-muted);
  font-size: var(--font-size-person-credits-year-count);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-person-eras-years);
  text-transform: uppercase;
}

.rows {
  position: relative;
  z-index: 0;
}

/* The department dropdown under the heading, with the sort and the filter tools on its line, pushed right. */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--toolbar-gap);
  padding-block-start: var(--space-heading-dropdowns);
}

.controls {
  display: flex;
  align-items: center;
  /* The list toolbar's spacing between the sort and the filter tools. */
  gap: var(--toolbar-gap);
  margin-inline-start: auto;
}
</style>
