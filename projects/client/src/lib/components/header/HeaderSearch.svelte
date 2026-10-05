<!--
  The header search: the field and a panel that floats under it once it has focus. The panel holds the type chips
  (the ID lookups sit in their own menu at the end of the row), the autocomplete rows and a strip of keyboard hints.
  Typing waits 300ms, then shows up to 3 results and a "View all" row. Arrows move the highlight (a combobox with
  `aria-activedescendant`), Enter opens it or submits the form, Esc closes the panel, and a click outside closes it
  (and clears an empty field). A bare `/` anywhere else on the page focuses the field.
  The type picks the form's `/search/<type>` action and is kept in the `search_type` cookie so SSR renders it.
  Recent and trending query rows go under the results.
-->
<script lang="ts">
import { afterNavigate } from '$app/navigation';
import { page } from '$app/state';
import Icon from '$lib/icons/Icon.svelte';
import { untrack } from 'svelte';
import { requestRecentSearch } from '$lib/components/header/requestRecentSearch';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import { toast } from '$lib/components/toast/toast.svelte';
import { createRecentSearches } from '$lib/components/header/createRecentSearches.svelte';
import clockRotateLeft from '$lib/icons/light/clock-rotate-left.svg?raw';
import termMagnifier from '$lib/icons/light/magnifying-glass.svg?raw';
import termXmark from '$lib/icons/light/xmark.svg?raw';
import arrowTurnDownLeft from '$lib/icons/light/arrow-turn-down-left.svg?raw';
import magnifyingGlass from '$lib/icons/regular/magnifying-glass.svg?raw';
import xmark from '$lib/icons/regular/xmark.svg?raw';
import angleDown from '$lib/icons/solid/angle-down.svg?raw';
import { isSearchShortcut } from './isSearchShortcut.ts';
import { searchAutocomplete, type SearchAutocompleteResult } from './searchAutocomplete.ts';
import { searchTypes } from './searchTypes.ts';

const { savedType = '', viewer = null }: { savedType?: string; viewer?: string | null } = $props();

let recent = $state<ReturnType<typeof createRecentSearches>>();
$effect(() => {
  const identity = viewer;
  let storage: Storage | undefined;
  try {
    storage = localStorage;
  } catch { /* Memory-only history is still usable. */ }
  const controller = createRecentSearches({
    viewer: identity,
    storage,
    notify: toast.error,
    request: (path, body) =>
      requestRecentSearch({
        fetch: identity ? authenticatedFetch({ manager: userManager() }) : undefined,
        path,
        body,
      }),
  });
  recent = controller;
  return () => controller.dispose();
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
let focused = $state(false);
let open = $state(false);
let result = $state(empty);
let highlight = $state(-1);
let input = $state<HTMLInputElement>();
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
const terms = $derived([
  ...(recent?.user ?? []).map((term) => ({ term, recent: true })),
  ...(recent?.global ?? []).map((term) => ({ term, recent: false })),
]);
const resultOptionCount = $derived(result.rows.length + (result.count ? 1 : 0));
const options = $derived([
  ...result.rows.map((row, index) => ({ id: `${id}-option-${index}`, href: row.href })),
  ...(result.count ? [{ id: `${id}-option-all`, href: allHref }] : []),
  ...terms.map((_, index) => ({ id: `${id}-term-${index}`, href: '' })),
]);
const noRecent = $derived(Boolean(viewer && recent?.loaded && !recent.user.length));
// The panel opens with the field, so the type chips are there before anything is typed.
const panelOpen = $derived(focused && open);
const expanded = $derived(panelOpen && (options.length > 0 || noRecent));
const activeId = $derived(expanded && highlight >= 0 ? options.at(highlight)?.id : undefined);

let timer: ReturnType<typeof setTimeout> | undefined;
let inflight: AbortController | undefined;

// OG never cancelled a slow request, so a late answer could replace newer results. Aborting the last one drops it.
const runSearch = () => {
  clearTimeout(timer);
  inflight?.abort();
  highlight = -1;

  const text = query.trim();
  if (!text) {
    result = empty;
    return;
  }

  const searched = type;
  timer = setTimeout(async () => {
    const controller = new AbortController();
    inflight = controller;
    const next = await searchAutocomplete({
      type: searched,
      query: text,
      dates: page.data.datePreferences,
      signal: controller.signal,
    }).catch(() => null);
    if (!next || controller.signal.aborted) return;
    result = next;
    highlight = -1;
  }, DEBOUNCE_MS);
};

const close = (clear: boolean) => {
  focused = false;
  open = false;
  highlight = -1;
  if (!clear) return;
  clearTimeout(timer);
  inflight?.abort();
  query = '';
  result = empty;
};

// The close button hides itself, so a keyboard press (no pointer, detail 0) hands focus back to the field.
const clearSearch = (event: MouseEvent) => {
  close(true);
  if (event.detail === 0) input?.focus();
};

const pickType = (slug: string) => {
  typeSlug = slug;
  document.cookie = `search_type=${slug}; max-age=${ONE_YEAR_S}; path=/; samesite=lax`;
  if (idMenu?.matches(':popover-open')) idMenu.hidePopover();
  open = true;
  input?.focus();
  runSearch();
};

const onfocus = () => {
  focused = true;
  open = true;
  highlight = -1;
  void recent?.load();
};

const oninput = () => {
  open = true;
  runSearch();
};

const moveHighlight = (step: 1 | -1) => {
  const count = options.length;
  if (!count) return;
  if (!expanded) {
    open = true;
    return;
  }
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
    const row = result.rows.at(highlight);
    if (row && highlight < result.rows.length) record(row);
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
    // A search field clears itself on Esc. OG only closed the dropdown.
    event.preventDefault();
    open = false;
    input?.blur();
    return;
  }

  if (event.key === 'Delete' && highlight >= resultOptionCount) {
    const item = terms.at(highlight - resultOptionCount);
    if (item?.recent) {
      event.preventDefault();
      void recent?.remove(item.term);
      highlight = -1;
    }
    return;
  }

  if (event.key !== 'Enter') return;
  // Nothing highlighted: the form submits to /search/<type>?query=.
  const option = expanded && highlight >= 0 ? options.at(highlight) : undefined;
  if (!option) return;
  event.preventDefault();
  openOption(option, event.metaKey || event.ctrlKey);
};

const termType = (slug: string | null | undefined) =>
  findType(slug === 'all' ? '' : slug === 'official_lists' ? 'lists' : slug ?? '') ?? searchTypes[0];
const termLabel = (slug: string) => slug === 'official_lists' ? 'Official Lists' : termType(slug).label;
const pickTerm = (term: { query: string; type?: string | null }) => {
  query = term.query;
  pickType(termType(term.type).slug);
};
const record = (row: SearchAutocompleteResult['rows'][number]) => {
  void recent?.record(row.recent);
};

// A click or focus outside closes the panel. With nothing typed, it closes the whole search like OG.
const dismissOutside = (root: HTMLElement) => {
  const dismiss = (event: Event) => {
    if (!focused || (event.target instanceof Node && root.contains(event.target))) return;
    if (query) open = false;
    else close(true);
  };
  document.addEventListener('pointerdown', dismiss);
  document.addEventListener('focusin', dismiss);
  return () => {
    document.removeEventListener('pointerdown', dismiss);
    document.removeEventListener('focusin', dismiss);
  };
};

// `/` from anywhere on the page focuses the field, like most sites with a search box.
const slashShortcut = () => {
  const keydown = (event: KeyboardEvent) => {
    const editing = event.target instanceof Element && Boolean(event.target.closest(EDITABLE));
    const { key, ctrlKey, metaKey, altKey, defaultPrevented } = event;
    if (!isSearchShortcut({ key, ctrlKey, metaKey, altKey, defaultPrevented, editing })) return;
    event.preventDefault();
    input?.focus();
  };
  window.addEventListener('keydown', keydown);
  return () => window.removeEventListener('keydown', keydown);
};

// The header stays across client-side navigation, so reset it the way a fresh OG page load would.
afterNavigate(({ to }) => {
  close(false);
  input?.blur();
  const next = to ? fromUrl(to.url) : null;
  if (!next) return;
  typeSlug = next.slug;
  query = next.query;
  result = empty;
});
</script>

<!-- Rows link to OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<search class={['header-search', { focused }]} {@attach dismissOutside} {@attach slashShortcut}>
  <form {action} method="get">
    <label for="{id}-query" class="search-icon"><Icon svg={magnifyingGlass} /></label>
    <input
      bind:this={input}
      bind:value={query}
      id="{id}-query"
      type="search"
      name="query"
      placeholder="Is it me you're looking for?"
      aria-label="Search {type.label}"
      aria-keyshortcuts="/"
      autocomplete="off"
      role="combobox"
      aria-autocomplete="list"
      aria-controls="{id}-results"
      aria-expanded={expanded}
      aria-activedescendant={activeId}
      {onfocus}
      {oninput}
      {onkeydown}
    />
    <kbd class="shortcut" aria-hidden="true">/</kbd>
    <button type="button" class="close" aria-label="Clear search" onclick={clearSearch}>
      <Icon svg={xmark} />
    </button>

    <div class="panel" hidden={!panelOpen}>
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

      <ul id="{id}-results" role="listbox" aria-label="Search results" hidden={!expanded}
        onpointerleave={() => (highlight = -1)}>
        {#if result.rows.length}
          <li role="presentation" class="section">Results</li>
        {/if}
        {#each result.rows as row, index (row.key)}
          <li
            id="{id}-option-{index}"
            role="option"
            aria-selected={highlight === index}
            class={['result', { selected: highlight === index }]}
            onpointerenter={() => (highlight = index)}
          >
            <a href={row.href} tabindex="-1" onclick={() => record(row)}>
              <span class={['poster', { avatar: row.avatar }]}>
                {#if row.poster}
                  <img src={row.poster} alt="" width="40" height={row.avatar ? 40 : 60} loading="lazy" />
                {/if}
              </span>
              <span class="info">
                {#if row.topTitle}<span class="top-title">{row.topTitle}</span>{/if}
                <span class="title">{row.title}</span>
                <span class="meta">
                  <span class="type-name">{row.type}</span>
                  {#if row.tag}<span>{row.tag}</span>{/if}
                  {#if row.genres}<span class="genres">{row.genres}</span>{/if}
                </span>
              </span>
            </a>
          </li>
        {/each}
        {#if result.count}
          {@const index = result.rows.length}
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
        {#if recent?.user.length}
          <li role="presentation" class="section">Recent</li>
        {/if}
        {#if noRecent}
          <li role="presentation" class="no-recent">You have no recent searches.</li>
        {/if}
        {#each terms as item, termIndex (`${item.recent}:${item.term.query}:${item.term.type}`)}
          {@const index = resultOptionCount + termIndex}
          {#if !item.recent && termIndex === (recent?.user.length ?? 0)}
            <li role="presentation" class="section">Trending Searches</li>
          {/if}
          <li
            id="{id}-term-{termIndex}"
            role="option"
            aria-selected={highlight === index}
            class={['search-term', { selected: highlight === index }]}
            onpointerenter={() => (highlight = index)}
          >
            <button type="button" class="reuse-term" tabindex="-1" onclick={() => pickTerm(item.term)}>
              <span class="term-icon"><Icon svg={item.recent ? clockRotateLeft : termMagnifier} /></span>
              {item.term.query}
              {#if item.term.type}<span class="in-type">in {termLabel(item.term.type)}</span>{/if}
            </button>
            {#if item.recent}
              <button
                type="button"
                class="remove-term"
                aria-label="Remove recent search: {item.term.query}"
                disabled={recent?.busy}
                onclick={() => { void recent?.remove(item.term); highlight = -1; input?.focus(); }}
              ><Icon svg={termXmark} /></button>
            {/if}
          </li>
        {/each}
      </ul>

      <p class="keys">
        <span><kbd>↑</kbd><kbd>↓</kbd> Move</span>
        <span><kbd>↵</kbd> Open</span>
        <span><kbd>{modifier}</kbd><kbd>↵</kbd> New tab</span>
        {#if recent?.user.length}<span><kbd>Del</kbd> Remove recent</span>{/if}
        <span class="esc"><kbd>Esc</kbd> Close</span>
      </p>
    </div>
  </form>
</search>

<style>
form {
  position: relative;
  /* Hug the resting field, so the "/" hint sits inside its end. */
  inline-size: fit-content;
  max-inline-size: var(--search-max-width);

  /* OG widened to 500px and let the rest of the bar squeeze. Even with Figtree there's no room to squeeze just above
     1200px, so stop at the column's edge instead of pushing Sign In off the screen. */
  .focused & {
    inline-size: auto;
    min-inline-size: min(var(--search-focused-min-width), 100%);
  }
}

.search-icon {
  position: absolute;
  inset-block-start: 13px;
  inset-inline-start: 14px;
  z-index: 1;
  color: var(--color-header-text);
  cursor: pointer;

  .header-search:hover &,
  .focused & {
    color: var(--color-search-term);
  }
}

input {
  inline-size: var(--search-rest-width);
  min-block-size: 0;
  padding: 0 calc(var(--search-shortcut-room) + var(--space-sm-inline)) 0 40px;
  border: 0;
  border-radius: var(--radius-lg);
  background: var(--color-header-search-bg);
  backdrop-filter: var(--blur-header);
  box-shadow: none;
  color: var(--color-header-text);
  font-size: var(--font-size-nav);
  line-height: var(--search-control-height);
  cursor: pointer;
  appearance: none;
  transition: background-color 0.25s, color 0.25s, box-shadow 0.25s;

  &::placeholder {
    color: var(--gray-lightish);
  }

  &::-webkit-search-cancel-button {
    display: none;
  }

  &:focus-visible {
    outline: none;
  }

  &:is(:hover, :focus),
  .focused & {
    background-color: var(--color-box);
    color: var(--color-header-active-text);
    cursor: text;

    &::placeholder {
      color: var(--gray-light);
    }
  }

  /* A red ring with a soft halo instead of OG's squared-off box and red rule. */
  .focused & {
    inline-size: 100%;
    border-radius: var(--radius-search-field);
    box-shadow: 0 0 0 2px var(--brand-primary), 0 0 0 5px var(--color-search-ring);
  }
}

/* The resting field says `/` focuses it. Focus swaps it for the clear button. */
.shortcut,
.close {
  position: absolute;
  inset-block: 0;
  inset-inline-end: var(--space-sm-inline);
  z-index: 1;
  margin-block: auto;
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

.shortcut {
  background: var(--color-search-shortcut-bg);
  color: var(--color-header-text);
  pointer-events: none;

  .header-search:hover &,
  .focused & {
    display: none;
  }
}

.close {
  display: none;
  place-items: center;
  inline-size: var(--search-close-size);
  block-size: var(--search-close-size);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--color-search-term);
  font-size: 1.1em;

  &:hover {
    background: var(--color-search-row-hover);
  }

  .focused & {
    display: grid;
  }
}

.panel {
  position: absolute;
  inset-block-start: calc(100% + var(--space-search-panel-gap));
  inline-size: 100%;
  max-block-size: calc(100vh - var(--header-height) - var(--space-search-panel-gap));
  overflow-y: auto;
  padding: var(--space-search-section);
  border-radius: var(--radius-search-panel);
  background-color: var(--color-box);
  color: var(--color-header-active-text);
  box-shadow: var(--shadow-search-panel);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-light);

  &[hidden] {
    display: none;
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

/* The type picker: one chip per text search, then the ID lookups in a menu at the end. */
.types {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs-inline);
  padding: 0 0 var(--space-search-section);
  border-block-end: 1px solid var(--color-menu-separator);

  /* Nothing listed yet: the key hints' rule is enough. */
  .panel:has(> [role='listbox'][hidden]) & {
    padding-block-end: 0;
    border: 0;
  }
}

.chip,
.id-toggle {
  min-block-size: 0;
  padding: var(--space-sm-block) var(--space-base-inline);
  border: 0;
  border-radius: var(--radius-search-chip);
  background: none;
  color: var(--color-search-term);
  font: inherit;
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  transition: background-color 0.25s, color 0.25s;

  &:hover {
    background: var(--color-search-row-hover);
    color: var(--color-header-active-text);
  }

  &:focus-visible {
    outline-offset: 0;
  }
}

.chip[aria-pressed='true'],
.id-toggle.active {
  background: var(--brand-primary);
  color: var(--color-text-inverse);
}

.ids {
  margin-inline-start: auto;
}

.id-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
  border-radius: var(--radius-search-row);
  box-shadow: inset 0 0 0 1px var(--color-menu-separator);
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

.section,
.no-recent {
  padding: var(--space-search-section) var(--space-base-inline) var(--space-xs-inline);
  color: var(--color-search-in-type);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-block-start: var(--space-search-section);
}

.no-recent {
  color: var(--color-search-term);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-headings-light);
  letter-spacing: normal;
  text-transform: none;
}

/* Every row: rounded, with a soft gray highlight from the arrows or the mouse. */
.result a,
.all-results a,
.search-term {
  border-radius: var(--radius-search-row);
  transition: background-color 0.15s;
}

.selected a,
.search-term.selected {
  background-color: var(--color-search-row-hover);
}

.result a {
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

  /* A user's avatar: square, and round (OG's .poster.square and [data-type="users"]). */
  &.avatar {
    aspect-ratio: 1;
    border-radius: 50%;
  }
}

.info {
  display: flex;
  flex-direction: column;
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

/* Type, year and genres on one line, joined by middle dots. */
.meta {
  display: flex;
  flex-wrap: wrap;
  color: var(--color-search-term);
  font-size: var(--font-size-base);

  & > span + span::before {
    content: '·';
    margin-inline: var(--space-xs-inline);
  }
}

.type-name {
  color: var(--color-search-type);
  font-weight: var(--font-weight-headings);
}

.genres {
  text-transform: capitalize;
}

.all-results a,
.reuse-term {
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

.search-term {
  display: flex;
  align-items: center;
  font-size: var(--font-size-base);

  & button {
    min-block-size: 0;
    border: 0;
    border-radius: 0;
    background: none;
    font: inherit;
  }
}

.reuse-term {
  flex: 1;
  text-align: start;
}

/* The remove button stays out of the way until its row is pointed at or highlighted. */
.remove-term {
  display: grid;
  place-items: center;
  padding: var(--space-sm-block) var(--space-base-inline);
  color: var(--color-search-term);
  opacity: 0;
  transition: opacity 0.15s;

  .search-term:is(:hover, .selected) &,
  &:focus-visible {
    opacity: 1;
  }
}

/* The keyboard hints along the bottom of the panel. */
.keys {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs-block) var(--space-lg-inline);
  margin: var(--space-search-section) calc(-1 * var(--space-search-section)) calc(-1 * var(--space-search-section));
  padding: var(--space-base-block) var(--space-base-inline);
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

@media (prefers-reduced-motion: reduce) {
  input,
  .chip,
  .id-toggle,
  .result a,
  .all-results a,
  .search-term,
  .remove-term {
    transition: none;
  }
}

/* No hover on the hints: a touch screen has no `/` key. */
@media (hover: none) {
  .shortcut,
  .keys {
    display: none;
  }
}

/* At 1200px and below OG shrank the field to its magnifier. Focus opens it at full width over the nav. */
@media (width <= 1200px) {
  .header-search {
    position: relative;
    block-size: var(--search-control-height);
  }

  input {
    inline-size: var(--search-collapsed-width);
    padding-inline-end: 0;
  }

  .header-search:not(.focused) .shortcut {
    display: none;
  }

  .focused form {
    position: absolute;
    inset-block-start: 0;
    inline-size: var(--search-focused-min-width);
  }
}

/* Phones: a bare magnifier, and focus spreads the field across the bar. */
@media (width < 768px) {
  .header-search:not(.focused) {
    margin-inline-start: calc(-1 * var(--space-sm-inline));
  }

  input {
    background-color: transparent;
  }

  .search-icon {
    inset-inline-start: var(--space-base-inline);
    inset-block-start: calc((var(--search-control-height) - var(--search-icon-size-mobile)) / 2);
    font-size: var(--search-icon-size-mobile);
    line-height: 1;
  }

  .header-search.focused {
    position: fixed;
    inset-block-start: calc((var(--header-height) - var(--search-control-height)) / 2);
    inset-inline: var(--space-search-mobile-inset);
    z-index: var(--z-header);
  }

  .focused form {
    position: relative;
    inline-size: auto;
  }
}
</style>
