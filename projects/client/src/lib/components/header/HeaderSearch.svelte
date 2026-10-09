<!--
  The header search: a magnifier in the bar that opens a glass panel under it (a manual popover, so it draws in the top
  layer and its glass blurs the page). The panel holds the field, the type chips (the ID lookups sit in their own menu
  at the end of the row), the autocomplete rows and a strip of keyboard hints.
  Typing waits 300ms, then shows up to 3 results and a "View all" row. Arrows move the highlight (a combobox with
  `aria-activedescendant`), Enter opens it or submits the form, Esc or the close button shuts the panel and hands focus back
  to the magnifier, and a click outside closes it (keeping what was typed). A bare `/` anywhere else opens it.
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
import HeaderTint from '$lib/components/header/HeaderTint.svelte';
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
let active = $state(false);
let result = $state(empty);
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
const expanded = $derived(active && (options.length > 0 || noRecent));
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
  void recent?.load();
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
    // A search field clears itself on Esc. OG only closed the dropdown, and so does this: the query stays for next time.
    event.preventDefault();
    dismiss(false);
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

// A click or focus outside closes the panel. What was typed stays for next time; an empty search resets like OG.
const dismissOutside = (root: HTMLElement) => {
  const outside = (event: Event) => {
    if (!active || (event.target instanceof Node && root.contains(event.target))) return;
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
});
</script>

<!-- Rows link to OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<search class={['header-search', { active }]} {@attach dismissOutside} {@attach slashShortcut}>
  <button
    bind:this={toggle}
    type="button"
    class="toggle"
    aria-label="Search"
    aria-keyshortcuts="/"
    aria-expanded={active}
    aria-controls="{id}-panel"
    style:anchor-name="--search-{id}"
    onclick={() => (active ? close(!query) : openSearch())}
  >
    <Icon svg={magnifyingGlass} />
    <span class="tip" aria-hidden="true">Search <kbd>/</kbd></span>
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
}

/* "Search /" under the magnifier on hover, since the shortcut has no field to sit in any more. */
.tip {
  position: absolute;
  inset-block-start: calc(100% + var(--space-search-panel-gap));
  inset-inline-start: 50%;
  translate: -50% 0;
  display: flex;
  align-items: center;
  gap: var(--space-xs-inline);
  padding: var(--space-xs-inline) var(--space-sm-inline);
  border-radius: var(--radius-search-kbd);
  background: var(--color-search-tip-bg);
  color: var(--color-header-text);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-light);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;

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

/* Hangs from the magnifier, clear of the bar, on the same tinted glass. */
.panel {
  position: fixed;
  position-area: bottom span-right;
  inset: auto;
  isolation: isolate;
  inline-size: min(var(--search-panel-width), calc(100vw - 2 * var(--space-lg-inline)));
  max-block-size: calc(100vh - var(--header-height) - 2 * var(--space-search-panel-gap));
  margin: calc((var(--header-height) - var(--header-pill-height)) / 2 + var(--space-search-panel-gap)) 0 0;
  overflow-y: auto;
  padding: var(--space-search-section);
  border: 0;
  border-radius: var(--radius-search-panel);
  background-color: var(--color-header-panel);
  backdrop-filter: var(--blur-header-glass);
  box-shadow: var(--shadow-search-panel);
  color: var(--color-header-text);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-light);

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

/* The field: a glass pill with a red ring, since it always has focus while it's showing. */
.field {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  block-size: var(--header-control-height);
  margin-block-end: var(--space-search-section);
  padding-inline: var(--space-base-inline) var(--space-xs-inline);
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

/* The type picker: one chip per text search, then the ID lookups in a menu at the end. The chips take the control
   look discover's toggle chips use, the picked one filled red. */
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
  min-block-size: var(--control-height);
  padding: 0 var(--space-control-inline);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font: inherit;
  font-size: var(--font-size-control);
  font-weight: var(--font-weight-control);
  line-height: 1;
  white-space: nowrap;
  transition: background-color 0.25s, border-color 0.25s, color 0.25s;

  &:hover {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-hover-bg);
  }

  &:focus-visible {
    outline-offset: 0;
  }
}

.chip[aria-pressed='true'],
.id-toggle.active {
  border-color: var(--brand-primary);
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);
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
  .toggle,
  .tip,
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
  .tip,
  .keys {
    display: none;
  }
}
</style>
