<!--
  The header search: a magnifier in the bar that grows into a glass panel over it, its field landing where the icon
  was and the panel covering the links (a manual popover, so it draws in the top layer, and its ::backdrop dims and
  blurs the page). The panel holds the field, the type chips (the ID lookups sit in their own menu at the end of the
  row), the autocomplete rows and a strip of keyboard hints.
  Typing waits 300ms, then shows up to 5 results and a "View all" row. Arrows move the highlight (a combobox with
  `aria-activedescendant`), Enter opens it or submits the form, Esc or the close button shuts the panel and hands focus back
  to the magnifier, and a click outside (on the dimmed page) closes it, keeping what was typed. A bare `/` anywhere else
  opens it.
  The type picks the form's `/search/<type>` action and is kept in the `search_type` cookie so SSR renders it.
  Before anything is typed, the rows are the type's starting list: the most searched shows and movies, the trending
  lists, or this month's birthdays for People (none for the other types), with shimmering rows until it lands.
  The viewer's recent searches go under the results, with Clear all on their heading.
-->
<script lang="ts">
import { afterNavigate } from '$app/navigation';
import { page } from '$app/state';
import EmptyNote from '$lib/components/empty/EmptyNote.svelte';
import Icon from '$lib/icons/Icon.svelte';
import TooltipBox from '$lib/components/tooltip/TooltipBox.svelte';
import { untrack } from 'svelte';
import HeaderTint from '$lib/components/header/HeaderTint.svelte';
import clockRotateLeft from '$lib/icons/light/clock-rotate-left.svg?raw';
import arrowTurnDownLeft from '$lib/icons/light/arrow-turn-down-left.svg?raw';
import magnifyingGlass from '$lib/icons/regular/magnifying-glass.svg?raw';
import xmark from '$lib/icons/regular/xmark.svg?raw';
import angleDown from '$lib/icons/solid/angle-down.svg?raw';
import { isSearchShortcut } from './isSearchShortcut.ts';
import { recentSearchType } from './recentSearchType.ts';
import type { SearchAutocompleteResult } from './searchAutocomplete.ts';
import type { SearchTrending } from './searchTrending.ts';
import TagPills from '$lib/components/labels/TagPills.svelte';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import SearchTermRow from './SearchTermRow.svelte';
import RecentClearAll from './RecentClearAll.svelte';
import { searchTypes } from './searchTypes.ts';
import { viewerRecentSearches } from './viewerRecentSearches.ts';
import type { RecentSearch } from './createRecentSearches.svelte.ts';
import type { SearchRow } from './toSearchRow.ts';
import { dayIn } from '../../utils/dayIn.ts';

const { savedType = '', viewer = null }: { savedType?: string; viewer?: string | null } = $props();

let recent = $state.raw<ReturnType<typeof viewerRecentSearches>>();
$effect(() => {
  recent = viewer ? viewerRecentSearches(viewer) : undefined;
});

const id = $props.id();
const DEBOUNCE_MS = 300;
const ONE_YEAR_S = 60 * 60 * 24 * 365;
const empty: SearchAutocompleteResult = { rows: [], count: null };
// Where a typed `/` belongs to the page, not the shortcut.
const EDITABLE = 'input, textarea, select, [contenteditable], dialog';

const findType = (slug: string | undefined) => searchTypes.find((type) => type.slug === slug);
const textTypes = searchTypes.filter((type) => !('idType' in type));
const idTypes = searchTypes.filter((type) => 'idType' in type);

// On a results page (`/search/<type>?query=`) the page's type and query win over the cookie.
const fromUrl = (url: URL) => {
  const [section, slug = ''] = url.pathname.split('/').slice(1);
  if (section !== 'search') return null;
  return { slug: findType(slug)?.slug ?? '', query: url.searchParams.get('query') ?? url.searchParams.get('q') ?? '' };
};

const initial = fromUrl(page.url);
// The cookie only seeds the picker; after that the user's pick lives here.
let typeSlug = $state<string>(initial?.slug ?? findType(untrack(() => savedType))?.slug ?? '');
let query = $state(initial?.query ?? '');
let active = $state(false);
// On a results page the magnifier is the current section, solid red like the current nav link.
const current = $derived(page.url.pathname === '/search' || page.url.pathname.startsWith('/search/'));
let result = $state(empty);
// The query `result` answers, so an answer to an older query doesn't say this one has no matches.
let answered = $state('');
let highlight = $state(-1);
let input = $state<HTMLInputElement>();
let toggle = $state<HTMLButtonElement>();
let panel = $state<HTMLElement>();
let idMenu = $state<HTMLElement>();
// The new-tab hint names the platform's modifier. Set after hydration, so SSR and the first render agree.
let modifier = $state('Ctrl');
$effect(() => {
  if (navigator.userAgent.includes('Mac')) modifier = '⌘';
});

const type = $derived(findType(typeSlug) ?? searchTypes[0]);
const idType = $derived(idTypes.find((option) => option.slug === type.slug));
const action = $derived(type.slug ? `/search/${type.slug}` : '/search');
const allHref = $derived(`${action}?${new URLSearchParams({ query })}`);
const terms = $derived(recent?.terms ?? []);
// Typed, the results; empty, the type's starting list, fetched once a type per visit (null while it loads).
let trending = $state<Readonly<Record<string, SearchTrending | null>>>({});
// The types searchTrending has a starting list for, which shimmer in its place while it loads.
const STARTING_LISTS: ReadonlySet<string> = new Set(['', 'shows', 'movies', 'people', 'lists']);
const SHIMMER_ROWS = 5;
const typed = $derived(query.trim() !== '');
const startingSoon = $derived(!typed && trending[type.slug] === null && STARTING_LISTS.has(type.slug));
const rows = $derived<readonly SearchRow[]>(typed ? result.rows : (trending[type.slug]?.rows ?? []));
const resultOptionCount = $derived(rows.length + (result.count ? 1 : 0));
const options = $derived([
  ...rows.map((row, index) => ({ id: `${id}-option-${index}`, href: row.href })),
  ...(result.count ? [{ id: `${id}-option-all`, href: allHref }] : []),
  ...terms.map((_, index) => ({ id: `${id}-term-${index}`, href: '' })),
]);
const expanded = $derived(active && (options.length > 0 || startingSoon));
const noMatches = $derived(
  typed && answered === query.trim() && rows.length === 0 && !result.count,
);
const activeId = $derived(expanded && highlight >= 0 ? options.at(highlight)?.id : undefined);

let timer: ReturnType<typeof setTimeout> | undefined;
let inflight: AbortController | undefined;

// OG never cancelled a slow request, so a late answer could replace newer results. Aborting the last one drops it.
const runSearch = () => {
  clearTimeout(timer);
  inflight?.abort();
  highlight = -1;
  answered = '';

  const text = query.trim();
  if (!text) {
    result = empty;
    return;
  }

  const searched = type;
  timer = setTimeout(async () => {
    const controller = new AbortController();
    inflight = controller;
    const next = await import('./searchAutocomplete.ts')
      .then(({ searchAutocomplete }) =>
        searchAutocomplete({
          type: searched,
          query: text,
          dates: page.data.datePreferences,
          today: viewerToday(),
          signal: controller.signal,
        })
      )
      .catch(() => null);
    if (!next || controller.signal.aborted) return;
    result = next;
    answered = text;
    highlight = -1;
  }, DEBOUNCE_MS);
};

// The viewer's date, for People's birthdays and ages.
const viewerToday = () => dayIn(new Date(), page.data.datePreferences?.timeZone);

const loadTrending = (picked: (typeof searchTypes)[number]) => {
  if (picked.slug in trending) return;
  trending = { ...trending, [picked.slug]: null };
  void import('./searchTrending.ts')
    .then(({ searchTrending }) =>
      searchTrending({ type: picked, today: viewerToday(), order: page.data.datePreferences?.order })
    )
    .then((found) => (trending = { ...trending, [picked.slug]: found }))
    // Rate limited or offline: forget it, so the next open asks again.
    .catch(() => (trending = Object.fromEntries(Object.entries(trending).filter(([slug]) => slug !== picked.slug))));
};

const close = (clear: boolean) => {
  active = false;
  highlight = -1;
  if (panel?.matches(':popover-open')) panel.hidePopover();
  if (!clear) return;
  clearTimeout(timer);
  inflight?.abort();
  query = '';
  result = empty;
};

// The field only exists inside the panel, so the type chips and recent searches are there before anything is typed.
const openSearch = () => {
  active = true;
  highlight = -1;
  if (!panel?.matches(':popover-open')) panel?.showPopover();
  input?.focus();
  loadTrending(type);
};

// Closing from inside the panel hands focus back to the magnifier that opened it.
const dismiss = (clear: boolean) => {
  close(clear);
  toggle?.focus();
};

const pickType = (slug: string) => {
  typeSlug = slug;
  document.cookie = `search_type=${slug}; max-age=${ONE_YEAR_S}; path=/; samesite=lax`;
  if (idMenu?.matches(':popover-open')) idMenu.hidePopover();
  input?.focus();
  loadTrending(type);
  runSearch();
};

const oninput = () => runSearch();

const moveHighlight = (step: 1 | -1) => {
  const count = options.length;
  if (!count) return;
  if (!expanded) return;
  // Down wraps to the top; up from the top (or from nothing) wraps to the bottom, like OG.
  highlight = highlight < 0 && step < 0 ? count - 1 : (highlight + step + count) % count;
};

// Cmd or Ctrl+Enter opens a new tab. Otherwise click the row's own link, so SvelteKit's router handles it.
const openOption = (option: { id: string; href: string }, newTab: boolean) => {
  if (!option.href) {
    document.getElementById(option.id)?.querySelector('button')?.click();
    return;
  }
  if (newTab) {
    const row = rows.at(highlight);
    if (row && highlight < rows.length) record(row);
    window.open(option.href, '_blank', 'noopener');
    return;
  }
  document.getElementById(option.id)?.querySelector('a')?.click();
};

const onkeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    moveHighlight(event.key === 'ArrowDown' ? 1 : -1);
    return;
  }

  if (event.key === 'Escape') {
    // A search field clears itself on Esc. OG only closed the dropdown, and so does this: the query stays for next time.
    event.preventDefault();
    dismiss(false);
    return;
  }

  if (event.key === 'Delete' && highlight >= resultOptionCount) {
    const term = terms.at(highlight - resultOptionCount);
    if (!term) return;
    event.preventDefault();
    removeTerm(term);
    return;
  }

  if (event.key !== 'Enter') return;
  // Nothing highlighted: the form submits to /search/<type>?query=.
  const option = expanded && highlight >= 0 ? options.at(highlight) : undefined;
  if (!option) return;
  event.preventDefault();
  openOption(option, event.metaKey || event.ctrlKey);
};

const termLabel = (slug: string) => slug === 'official_lists' ? 'Official Lists' : recentSearchType(slug).label;
const pickTerm = (term: RecentSearch) => {
  query = term.query;
  pickType(recentSearchType(term.type).slug);
};
const removeTerm = (term: RecentSearch) => {
  recent?.remove(term);
  highlight = -1;
  input?.focus();
};
const clearTerms = () => {
  recent?.clear();
  highlight = -1;
  input?.focus();
};
const record = (row: SearchAutocompleteResult['rows'][number]) => {
  recent?.record(row.recent);
};

// A click on the panel's ::backdrop lands on the panel itself, so tell it apart by where the pointer is.
const onBackdrop = (event: Event) => {
  if (event.target !== panel || !(event instanceof PointerEvent) || !panel) return false;
  const box = panel.getBoundingClientRect();
  const { clientX: x, clientY: y } = event;
  return x < box.left || x > box.right || y < box.top || y > box.bottom;
};

// A click or focus outside closes the panel. What was typed stays for next time; an empty search resets like OG.
const dismissOutside = (root: HTMLElement) => {
  const outside = (event: Event) => {
    if (!active) return;
    if (!onBackdrop(event) && event.target instanceof Node && root.contains(event.target)) return;
    close(!query);
  };
  document.addEventListener('pointerdown', outside);
  document.addEventListener('focusin', outside);
  return () => {
    document.removeEventListener('pointerdown', outside);
    document.removeEventListener('focusin', outside);
  };
};

// `/` from anywhere on the page opens the search, like most sites with a search box.
const slashShortcut = () => {
  const keydown = (event: KeyboardEvent) => {
    const editing = event.target instanceof Element && Boolean(event.target.closest(EDITABLE));
    const { key, ctrlKey, metaKey, altKey, defaultPrevented } = event;
    if (!isSearchShortcut({ key, ctrlKey, metaKey, altKey, defaultPrevented, editing })) return;
    event.preventDefault();
    openSearch();
  };
  window.addEventListener('keydown', keydown);
  return () => window.removeEventListener('keydown', keydown);
};

// The header stays across client-side navigation, so reset it the way a fresh OG page load would. Only a results
// page keeps a query for the field: its own.
afterNavigate(({ to }) => {
  const next = to ? fromUrl(to.url) : null;
  close(!next);
  if (!next) return;
  typeSlug = next.slug;
  query = next.query;
  result = empty;
  answered = '';
});
</script>

<!-- Rows link to OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<search class={['header-search', { active }]} {@attach dismissOutside} {@attach slashShortcut}>
  <button
    bind:this={toggle}
    type="button"
    class={['toggle', { current }]}
    aria-label="Search"
    aria-keyshortcuts="/"
    aria-expanded={active}
    aria-controls="{id}-panel"
    style:anchor-name="--search-{id}"
    onclick={() => (active ? close(!query) : openSearch())}
  >
    <Icon svg={magnifyingGlass} />
    <span class="tip" aria-hidden="true"><TooltipBox side="bottom">Search <kbd>/</kbd></TooltipBox></span>
  </button>

  <form {action} method="get">
    <div bind:this={panel} id="{id}-panel" class="panel" popover="manual" style:position-anchor="--search-{id}">
      <HeaderTint />
      <div class="field">
        <label for="{id}-query" class="search-icon"><Icon svg={magnifyingGlass} /></label>
        <input
          bind:this={input}
          bind:value={query}
          id="{id}-query"
          type="search"
          name="query"
          placeholder="Is it me you're looking for?"
          aria-label="Search {type.label}"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="{id}-results"
          aria-expanded={expanded}
          aria-activedescendant={activeId}
          {oninput}
          {onkeydown}
        />
        <button type="button" class="close" aria-label="Close search" onclick={() => dismiss(true)}>
          <Icon svg={xmark} />
        </button>
      </div>

      <div class="types" role="group" aria-label="Search in">
          {#each textTypes as option (option.slug)}
            <button type="button" class="chip" aria-pressed={option.slug === type.slug} onclick={() => pickType(option.slug)}>
              {option.label}
            </button>
          {/each}
          <div class="ids" style:anchor-name="--search-ids-{id}">
            <button type="button" class={['id-toggle', { active: idType }]} popovertarget="{id}-ids">
              {idType?.label ?? 'By ID'}
              <Icon svg={angleDown} />
            </button>
            <div
              bind:this={idMenu}
              id="{id}-ids"
              class="id-menu"
              popover="auto"
              style:position-anchor="--search-ids-{id}"
              ontoggle={(event) => event.newState === 'open' && idMenu?.querySelector('button')?.focus()}
            >
              <ul>
                {#each idTypes as option (option.slug)}
                  <li>
                    <button type="button" aria-current={option.slug === type.slug} onclick={() => pickType(option.slug)}>
                      {option.label}
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        </div>

      <ul id="{id}-results" role="listbox" aria-label="Search results" hidden={!expanded} aria-busy={startingSoon}
        onpointerleave={() => (highlight = -1)}>
          {#if startingSoon}
            <li role="presentation" class="section" aria-hidden="true"><Shimmer inline="var(--search-shimmer-section)"
                block="var(--font-size-small)" /></li>
            {#each { length: SHIMMER_ROWS } as _, row (row)}
              <li role="presentation" class="result" aria-hidden="true">
                <span class="row-shimmer">
                  <span class="poster poster-shimmer"><Shimmer inline="100%" block="100%" /></span>
                  <span class="info">
                    <span><Shimmer inline={row % 2 ? 'var(--search-shimmer-title-short)' : 'var(--search-shimmer-title-long)'}
                        block="var(--font-size-base)" /></span>
                    <span class="pills-shimmer">
                      <Shimmer inline="var(--search-shimmer-type)" block="var(--search-shimmer-pill)" />
                      <Shimmer inline="var(--search-shimmer-genres)" block="var(--search-shimmer-pill)" />
                    </span>
                  </span>
                </span>
              </li>
            {/each}
          {/if}
          {#if rows.length}
            <li role="presentation" class="section">{typed ? 'Results' : trending[type.slug]?.label}</li>
          {/if}
          {#each rows as row, index (row.key)}
            <li
              id="{id}-option-{index}"
              role="option"
              aria-selected={highlight === index}
              class={['result', { selected: highlight === index }]}
              onpointerenter={() => (highlight = index)}
            >
              <a href={row.href} tabindex="-1" onclick={() => record(row)}>
                <span class="poster">
                  {#if row.poster}
                    <img src={row.poster} alt="" width="40" height="60" loading="lazy" />
                  {/if}
                </span>
                <span class="info">
                  {#if row.topTitle}<span class="top-title">{row.topTitle}</span>{/if}
                  <span class="title">{row.title}{#if row.year}<span class="year">{row.year}</span>{/if}</span>
                  <TagPills tags={[
                    { text: row.type, kind: 'primary' },
                    ...(row.tag ? [{ text: row.tag, kind: 'light' as const }] : []),
                    ...(row.genres?.length ? [{ segments: row.genres }] : []),
                    ...(row.tags ?? []).map((text) => ({ text })),
                  ]} />
                </span>
              </a>
            </li>
          {/each}
          {#if result.count}
            {@const index = rows.length}
            <li
              id="{id}-option-all"
              role="option"
              aria-selected={highlight === index}
              class={['all-results', { selected: highlight === index }]}
              onpointerenter={() => (highlight = index)}
            >
              <a href={allHref} tabindex="-1">
                <span class="term-icon"><Icon svg={arrowTurnDownLeft} /></span>
                <span>View all <strong>{result.count}</strong> results <span class="in-type">in {type.label}</span></span>
              </a>
            </li>
          {/if}
          {#if terms.length}
            <li role="presentation" class="section recent">
              Recent
              <RecentClearAll onclick={clearTerms} />
            </li>
          {/if}
          {#each terms as term, termIndex (`${term.query}:${term.type}`)}
            {@const index = resultOptionCount + termIndex}
            <SearchTermRow
              id="{id}-term-{termIndex}"
              role="option"
              aria-selected={highlight === index}
              selected={highlight === index}
              onpointerenter={() => (highlight = index)}
              icon={clockRotateLeft}
              query={term.query}
              type={term.type ? termLabel(term.type) : undefined}
              tabbable={false}
              onpick={() => pickTerm(term)}
              onremove={() => removeTerm(term)}
            />
          {/each}
        </ul>

      {#if noMatches}
        <div class="no-matches" role="status"><EmptyNote>No matches for “{answered}”.</EmptyNote></div>
      {/if}

      <p class="keys">
          <span><kbd>↑</kbd><kbd>↓</kbd> Move</span>
          <span><kbd>↵</kbd> Open</span>
          <span><kbd>{modifier}</kbd><kbd>↵</kbd> New tab</span>
          {#if terms.length}<span><kbd>Del</kbd> Remove recent</span>{/if}
          <span class="esc"><kbd>Esc</kbd> Close</span>
        </p>
    </div>
  </form>
</search>

<style>
/* The search is part of the bar, which is dark on every theme, so its light-dark() colors take their dark side. */
.header-search {
  color-scheme: dark;
}

/* The magnifier: a loose pill like the links, which stays lit while its panel is open. */
.toggle {
  position: relative;
  display: grid;
  place-items: center;
  inline-size: var(--header-pill-height);
  block-size: var(--header-pill-height);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-header-pill);
  background: none;
  color: var(--color-header-muted);
  font-size: var(--font-size-header-link);
  transition: background-color 0.2s, color 0.2s;

  &:is(:hover, [aria-expanded='true']) {
    background-color: var(--color-header-pill);
    color: var(--color-header-text);
  }

  &.current {
    background-color: var(--brand-primary);
    color: var(--color-text-inverse);
    box-shadow: var(--shadow-header-current);
  }
}

/* "Search /" under the magnifier on hover, since the shortcut has no field to sit in any more. */
.tip {
  position: absolute;
  inset-block-start: calc(100% + var(--tooltip-arrow) + 1px + var(--tooltip-offset));
  inset-inline-start: 50%;
  translate: -50% 0;
  inline-size: max-content;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-tooltip);

  .toggle:is(:hover, :focus-visible) & {
    opacity: 1;
  }

  [aria-expanded='true'] & {
    display: none;
  }
}

kbd {
  display: inline-grid;
  place-items: center;
  min-inline-size: var(--search-kbd-size);
  block-size: var(--search-kbd-size);
  padding-inline: var(--space-xs-inline);
  border-radius: var(--radius-search-kbd);
  background: var(--color-search-kbd-bg);
  font-family: inherit;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings);
  line-height: 1;
}

/* Grows out of the magnifier over the bar, so its field sits where the icon was and it covers the links. Open, it's
   clipped a little outside its box so the shadow shows; closed, it's clipped down to the icon's pill. */
.panel {
  --field-nudge: calc((var(--header-control-height) - var(--header-pill-height)) / 2);
  --closed-clip: inset(
    calc(var(--search-panel-inset-top) + var(--field-nudge))
      calc(100% - var(--search-panel-inset) - var(--header-pill-height))
      calc(100% - var(--search-panel-inset-top) - var(--field-nudge) - var(--header-pill-height))
      var(--search-panel-inset) round var(--radius-header-pill)
  );

  position: fixed;
  inset: auto;
  inset-block-start: calc(anchor(top) - var(--search-panel-inset-top) - var(--field-nudge));
  inset-inline-start: max(var(--space-lg-inline), calc(anchor(left) - var(--search-panel-inset)));
  isolation: isolate;
  inline-size: min(var(--search-panel-width), calc(100vw - 2 * var(--space-lg-inline)));
  max-block-size: calc(100dvh - 2 * var(--space-lg-block));
  margin: 0;
  overflow-y: auto;
  padding: var(--search-panel-inset-top) var(--search-panel-inset) var(--search-panel-inset);
  border: 0;
  border-radius: var(--radius-search-panel);
  background-color: var(--color-header-panel);
  backdrop-filter: var(--blur-header-glass);
  box-shadow: var(--shadow-search-panel);
  color: var(--color-header-text);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-light);
  clip-path: inset(var(--search-panel-shadow-room) round var(--radius-search-panel));
  transition: clip-path var(--transition-search-panel), opacity var(--transition-search-fade),
    display var(--transition-search-panel) allow-discrete, overlay var(--transition-search-panel) allow-discrete;

  @starting-style {
    clip-path: var(--closed-clip);
    opacity: 0;
  }

  &:not(:popover-open) {
    clip-path: var(--closed-clip);
    opacity: 0;
  }

  /* The page behind dims and blurs, to put the eye on the field. */
  &::backdrop {
    background-color: var(--color-search-backdrop);
    backdrop-filter: var(--blur-search-backdrop);
    transition: opacity var(--transition-search-panel), display var(--transition-search-panel) allow-discrete,
      overlay var(--transition-search-panel) allow-discrete;
  }

  &:not(:popover-open)::backdrop {
    opacity: 0;
  }

  @starting-style {
    &:popover-open::backdrop {
      opacity: 0;
    }
  }

  & ul {
    margin: 0;
    padding: 0;
    list-style: none;

    &[hidden] {
      display: none;
    }
  }

  & a {
    color: inherit;
    text-decoration: none;
  }
}

/* The field: a glass pill with a red ring, since it always has focus while it's showing. Its start padding centers
   the 1em magnifier in a pill-wide slot, so it lands where the closed one sits. */
.field {
  display: flex;
  align-items: center;
  gap: var(--space-base-inline);
  block-size: var(--header-control-height);
  margin-block-end: var(--search-panel-inset);
  padding-inline: calc((var(--header-pill-height) - 1em) / 2) var(--space-xs-inline);
  border-radius: var(--radius-header-control);
  background: var(--color-header-pill);
  box-shadow: 0 0 0 2px var(--brand-primary), 0 0 0 5px var(--color-search-ring);
}

.search-icon {
  display: flex;
  color: var(--color-header-muted);
}

/* Off with base.css's boxed control: the field around it is the box. */
input {
  flex: 1;
  min-inline-size: 0;
  min-block-size: 0;
  block-size: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
  box-shadow: none;
  color: var(--color-header-text);
  font-size: var(--font-size-nav);
  appearance: none;

  &::placeholder {
    color: var(--color-header-muted);
  }

  &::-webkit-search-cancel-button {
    display: none;
  }

  &:is(:focus, :focus-visible) {
    outline: none;
    box-shadow: none;
  }
}

.close {
  display: grid;
  place-items: center;
  inline-size: var(--search-close-size);
  block-size: var(--search-close-size);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-search-row);
  background: none;
  color: var(--color-header-muted);

  &:hover {
    background: var(--color-header-pill);
    color: var(--color-header-text);
  }
}

/* The type picker: one chip per text search, then the ID lookups in a menu at the end. The chips are see-through on
   the glass, the picked one a muted red. */
.types {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--search-chip-gap);
  padding: 0 0 var(--search-panel-inset);
  border-block-end: 1px solid var(--color-menu-separator);

  /* Nothing listed yet: the key hints' rule is enough. */
  .panel:has(> [role='listbox'][hidden]) & {
    padding-block-end: 0;
    border: 0;
  }
}

.chip,
.id-toggle {
  min-block-size: var(--control-height);
  padding: 0 var(--space-control-inline);
  border: 1px solid var(--color-search-chip-border);
  border-radius: var(--radius-control);
  background-color: var(--color-search-chip-bg);
  color: var(--color-control-text);
  font: inherit;
  font-size: var(--font-size-control);
  font-weight: var(--font-weight-control);
  line-height: 1;
  white-space: nowrap;
  transition: background-color 0.25s, border-color 0.25s, color 0.25s;

  &:hover {
    border-color: var(--color-search-chip-hover-border);
    background-color: var(--color-search-chip-hover-bg);
  }

  &:focus-visible {
    outline-offset: 0;
  }
}

.chip[aria-pressed='true'],
.id-toggle.active {
  border-color: var(--color-search-chip-on-border);
  background-color: var(--color-search-chip-on-bg);
  color: var(--color-search-chip-on-text);
  font-weight: var(--font-weight-headings-heavy);
}

.ids {
  margin-inline-start: auto;
}

.id-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
}

.id-menu {
  position: fixed;
  position-area: bottom span-left;
  inset: auto;
  min-inline-size: var(--search-id-menu-width);
  margin: var(--space-xs-inline) 0 0;
  padding: var(--space-xs-inline);
  border: 0;
  border-radius: var(--radius-search-row);
  background-color: var(--color-box);
  color: var(--color-dropdown-text);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-light);
  box-shadow: var(--shadow-search-panel);

  & ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  & button {
    display: block;
    inline-size: 100%;
    min-block-size: 0;
    padding: var(--space-base-block) var(--space-base-inline);
    border: 0;
    border-radius: var(--radius-search-row);
    background: none;
    color: inherit;
    line-height: var(--line-height-base);
    text-align: start;
    white-space: nowrap;

    &:is(:hover, :focus-visible) {
      outline: none;
      background-color: var(--color-search-row-hover);
    }

    &[aria-current='true'] {
      color: var(--color-search-type);
      font-weight: var(--font-weight-headings);
    }
  }
}

.section {
  padding: var(--space-search-section) var(--space-base-inline) var(--space-xs-inline);
  color: var(--color-search-in-type);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-block-start: var(--space-search-section);
}

/* Recent's heading carries Clear All at its far end. */
.recent {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Every row: rounded, with a soft gray highlight from the arrows or the mouse. The query rows are SearchTermRow. */
.result a,
.all-results a {
  border-radius: var(--radius-search-row);
  transition: background-color 0.15s;
}

.selected a {
  background-color: var(--color-search-row-hover);
}

.result :is(a, .row-shimmer) {
  display: grid;
  grid-template-columns: var(--search-poster-width) 1fr;
  column-gap: var(--space-base-inline);
  align-items: center;
  padding: var(--space-base-block) var(--space-base-inline);
}

.poster {
  display: block;
  inline-size: var(--search-poster-width);
  aspect-ratio: var(--ratio-poster);
  overflow: hidden;
  border-radius: var(--radius-sm);
  background-color: var(--color-separator);

  & img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}

/* A poster's place while the starting list loads: the shimmer fills it instead of the gray. */
.poster-shimmer {
  display: flex;
  background: none;
}

.pills-shimmer {
  display: flex;
  gap: var(--search-pill-gap);
}

.info {
  display: flex;
  flex-direction: column;
  gap: var(--space-search-pill-row);
  min-inline-size: 0;
}

.top-title {
  color: var(--color-search-term);
  font-size: var(--font-size-small);
  line-height: 1;
  text-transform: uppercase;
}

.title {
  font-weight: var(--font-weight-headings);
}

.year {
  margin-inline-start: var(--space-search-year);
  color: var(--color-search-year);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-light);
}

.all-results a {
  display: flex;
  align-items: center;
  padding: var(--space-lg-block) var(--space-base-inline);
  color: var(--color-search-term);
  font-size: var(--font-size-base);
  line-height: 1;

  & strong {
    color: var(--color-header-active-text);
    font-weight: var(--font-weight-headings-heavy);
  }
}

.term-icon {
  display: inline-flex;
  margin-inline-end: var(--space-base-inline);
  color: var(--color-search-in-type);
}

.in-type {
  margin-inline-start: var(--space-xs-inline);
  color: var(--color-search-in-type);
}

.no-matches {
  padding-block-start: var(--search-panel-inset);
}

/* The keyboard hints along the bottom of the panel. */
.keys {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs-block) var(--space-lg-inline);
  margin: var(--search-panel-inset) calc(-1 * var(--search-panel-inset)) calc(-1 * var(--search-panel-inset));
  padding: var(--space-lg-block) var(--search-panel-inset);
  border-block-start: 1px solid var(--color-menu-separator);
  color: var(--color-search-in-type);
  font-size: var(--font-size-small);

  & span {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs-block);
  }

  & kbd {
    margin-inline-end: 2px;
    color: var(--color-search-term);
  }
}

.esc {
  margin-inline-start: auto;
}

/* Tablets: the panel runs the width of the screen. */
@media (width <= 1024px) {
  .panel {
    inset-inline-start: var(--space-lg-inline);
    inline-size: calc(100vw - 2 * var(--space-lg-inline));
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel,
  .panel::backdrop,
  .toggle,
  .tip,
  .chip,
  .id-toggle,
  .result a,
  .all-results a {
    transition: none;
  }
}

/* No hover on the hints: a touch screen has no `/` key. */
@media (hover: none) {
  .tip,
  .keys {
    display: none;
  }
}
</style>
