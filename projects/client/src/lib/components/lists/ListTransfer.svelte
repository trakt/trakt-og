<script lang="ts">
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { tick } from 'svelte';
import { login } from '$lib/auth/login';
import { rawApiFetch } from '$lib/api/rawApiFetch';
import { overlay } from '$lib/overlay/overlay';
import { toast } from '$lib/components/toast/toast.svelte';
import EmptyNote from '$lib/components/empty/EmptyNote.svelte';
import LinkButton from '$lib/components/button/LinkButton.svelte';
import SearchField from '$lib/components/filters/SearchField.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { listRowIcon } from '$lib/components/lists/listRowIcon';
import { loadListCatalog } from '$lib/components/lists/loadListCatalog';
import { pickerSections } from '$lib/components/lists/pickerSections';
import { sortPickerLists } from '$lib/components/lists/sortPickerLists';
import type { PickerList } from '$lib/components/lists/PickerList';
import { fetchListItemRefs } from '$lib/lists/fetchListItemRefs';
import { transferListItems } from '$lib/lists/transferListItems';
import type { ListView } from '$lib/lists/toListView';
import type { ListQuery } from '$lib/lists/ListQuery';
import type { ListSort } from '$lib/lists/resolveListSort';
import Icon from '$lib/icons/Icon.svelte';
import add from '$lib/icons/trakt/add-thick.svg?raw';
import close from '$lib/icons/regular/xmark.svg?raw';
import search from '$lib/icons/regular/magnifying-glass.svg?raw';
import arrow from '$lib/icons/light/angle-right.svg?raw';
import spinner from '$lib/icons/solid/arrows-rotate.svg?raw';
import { GENERIC_ERROR } from '../../utils/genericError.ts';
import { viewerFetch } from '../../auth/viewerFetch.ts';

interface Props {
  source: ListView;
  query: ListQuery;
  sort: ListSort;
  count: number;
  move?: boolean;
  svg: string;
  busy?: boolean;
  onbusychange?: (busy: boolean) => void;
}
const {
  source,
  query,
  sort,
  count,
  move = false,
  svg,
  busy: otherBusy = false,
  onbusychange = () => {},
}: Props = $props();
const id = $props.id();
const label = $derived(move ? 'Move' : 'Copy');
let triggerButton = $state<HTMLButtonElement>();
let popover = $state<HTMLDivElement>();
let input = $state<HTMLInputElement>();
let expanded = $state(false);
let busy = $state(false);
let searching = $state(false);
let terms = $state('');
let lists = $state<PickerList[]>([]);
let watchlistCount = $state(0);
let pending = $state<number | null>(null);
let failed = $state<number | null>(null);
let created = $state<Parameters<typeof transferListItems>[0]['destination']>(null);
const rows = $derived(sortPickerLists(lists.filter((list) => list.id !== source.id), searching ? terms : ''));
const listLimit = $derived(page.data.settings?.limits?.list);
const watchLimit = $derived(page.data.settings?.limits?.watchlist?.item_count);
const hasWatchlist = $derived(!(source.kind === 'watchlist' && source.ownerSlug === page.data.user?.slug));
const byId = $derived(new Map(rows.map((list) => [list.id, list])));
// The poster picker's groups, with nothing listed yet: the watchlist (0) and own lists, then collaborations.
const sections = $derived(
  pickerSections(rows, false)
    .map((section) => ({ ...section, ids: hasWatchlist ? section.ids : section.ids.filter(Boolean) }))
    .filter(({ ids }) => ids.length),
);
$effect(() => {
  void source.id;
  created = null;
  popover?.hidePopover();
});
const authFetch = () => viewerFetch();
const request = (path: string, body: unknown) =>
  rawApiFetch({
    fetch: authFetch(),
    path,
    init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  });
const read = (target: NonNullable<Parameters<typeof transferListItems>[0]['destination']>) =>
  fetchListItemRefs({
    fetch: authFetch(),
    base: target.watchlist
      ? '/users/me/watchlist'
      : `/users/${encodeURIComponent(target.owner)}/lists/${target.id}/items`,
    query: { types: [], genres: [] },
    sort: { by: 'rank', how: 'asc' },
  });
async function open() {
  if (busy || otherBusy) return;
  if (!page.data.user) {
    await login();
    return;
  }
  busy = true;
  onbusychange(true);
  try {
    const [catalog, watchlist] = await Promise.all([
      loadListCatalog(authFetch()),
      hasWatchlist ? read({ id: 0, name: 'Watchlist', owner: 'me', watchlist: true }) : [],
    ]);
    lists = catalog;
    watchlistCount = watchlist.length;
    searching = false;
    terms = '';
    failed = null;
    popover?.showPopover();
  } catch {
    toast.error("Doh! We couldn't load your lists. Please try again.");
  } finally {
    busy = false;
    onbusychange(false);
  }
}
async function transfer(list: PickerList | null, watchlist = false) {
  if (busy || otherBusy) return;
  const selectedSource = source;
  const selectedQuery = query;
  const selectedSort = sort;
  const row = watchlist ? -1 : list?.id ?? 0;
  const limit = watchlist ? watchLimit : listLimit?.item_count;
  const total = watchlist ? watchlistCount : list?.count ?? 0;
  if (limit !== undefined && (list || watchlist) && total >= limit) {
    failed = row;
    toast.error(
      `Your ${watchlist ? 'watchlist' : `${list?.name} list`} already has ${limit.toLocaleString('en-US')} items.`,
    );
    return;
  }
  if (
    !list && !watchlist && !created && listLimit &&
    lists.filter((item) => !item.collaboration).length >= listLimit.count
  ) {
    toast.error(`You've already created ${listLimit.count.toLocaleString('en-US')} lists.`);
    return;
  }
  busy = true;
  onbusychange(true);
  pending = row;
  failed = null;
  try {
    const base = selectedSource.kind === 'official'
      ? `/lists/${selectedSource.id}/items`
      : selectedSource.kind === 'personal'
      ? `/users/${encodeURIComponent(selectedSource.ownerSlug)}/lists/${selectedSource.id}/items`
      : `/users/${encodeURIComponent(selectedSource.ownerSlug)}/${selectedSource.kind}`;
    const items = await fetchListItemRefs({ fetch: authFetch(), base, query: selectedQuery, sort: selectedSort });
    if (
      !list && !watchlist && !created && limit !== undefined &&
      items.filter((item) => item.type !== 'person').length > limit
    ) {
      toast.error(`A new list can only have ${limit.toLocaleString('en-US')} items.`);
      failed = row;
      return;
    }
    const result = await transferListItems({
      source: selectedSource,
      sort: selectedSort,
      items,
      move,
      destination: watchlist
        ? { id: 0, owner: 'me', name: 'Watchlist', watchlist: true }
        : list
        ? { id: list.id, owner: list.owner, name: list.name }
        : created,
      request,
      read,
      overlay,
      notify: toast,
    });
    if (!list && !watchlist && source.id === selectedSource.id) created = result.target;
    if (!result.ok) {
      failed = row;
      void overlay.refresh();
      return;
    }
    popover?.hidePopover();
    toast.success(
      `${move ? 'Moved' : 'Copied'} ${result.count.toLocaleString('en-US')} ${
        result.count === 1 ? 'item' : 'items'
      } on ${selectedSource.name} to this list!${
        result.skipped
          ? ` ${result.skipped} ${
            result.skipped === 1 ? 'person was' : 'people were'
          } left out because people can't be added to lists.`
          : ''
      }`,
    );
    await goto(
      result.target.watchlist
        ? resolve('/users/[id]/watchlist', { id: page.data.user?.slug ?? 'me' })
        : resolve('/lists/[id=listId]', { id: String(result.target.id) }),
      {
        invalidateAll: true,
      },
    );
    void overlay.refresh();
  } catch {
    failed = row;
    toast.error(GENERIC_ERROR);
  } finally {
    busy = false;
    onbusychange(false);
    pending = null;
  }
}
async function searchToggle() {
  searching = !searching;
  terms = '';
  await tick();
  if (searching) input?.focus();
}
function toggle(event: ToggleEvent) {
  expanded = event.newState === 'open';
  if (expanded) popover?.querySelector<HTMLButtonElement>('button')?.focus();
  else triggerButton?.focus({ preventScroll: true });
}
</script>
<!-- Canonical list URLs are shared by personal, official and built-in lists. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<span class="control" style:anchor-name="--transfer-{id}">
  <Tooltip text="{label} items into another list">
    {#snippet trigger(tooltip)}
      <button bind:this={triggerButton} type="button" class="trigger" aria-label="{label} items into another list" disabled={busy || otherBusy} aria-busy={busy}
        aria-haspopup="dialog" aria-expanded={expanded} aria-controls="transfer-{id}" {...tooltip} onclick={open}>
        <Icon {svg} />
      </button>
    {/snippet}
  </Tooltip>
</span>
<div bind:this={popover} id="transfer-{id}" class="picker" popover="auto" role="dialog"
  aria-label="{label} items into a list"
  aria-busy={busy} style:position-anchor="--transfer-{id}" ontoggle={toggle}>
  <header class="head">
    <div class="title">
      <h3>{label} items</h3>
      <p><b>{count.toLocaleString('en-US')}</b> {count === 1 ? 'item' : 'items'} into a list</p>
    </div>
    <button type="button" class="tool" aria-label="Filter lists" aria-pressed={searching} onclick={searchToggle}><Icon
        svg={search} /></button>
    <button type="button" class="tool" aria-label="Close list picker" onclick={() => popover?.hidePopover()}><Icon
        svg={close} /></button>
  </header>
  <div class={['search', { open: searching }]} inert={!searching}>
    <div class="search-clip">
      <div class="search-field">
        <SearchField bind:element={input} bind:value={terms} label="Filter lists" placeholder="Filter lists" />
      </div>
    </div>
  </div>
  <div class="scroll">
    {#each sections as section (section.key)}
      <h4 id="transfer-{id}-{section.key}">{section.title}</h4>
      <ul aria-labelledby="transfer-{id}-{section.key}">
        {#each section.ids as rowId (rowId)}
          {@const list = byId.get(rowId)}
          {#if rowId === 0}
            {@render row(null, 'Watchlist', watchlistCount, `/users/${page.data.user?.slug}/watchlist`)}
          {:else if list}
            {@render row(list, list.name, list.count, `/lists/${list.id}`)}
          {/if}
        {/each}
      </ul>
    {/each}
    {#if searching && terms.trim() && rows.length === 0}<div class="empty"><EmptyNote>No lists match “{terms.trim()}”.</EmptyNote></div>{/if}
  </div>
  <footer class={{ pending: pending === 0, error: failed === 0 }}><LinkButton onclick={() => transfer(null, false)}
      disabled={busy || otherBusy} variant="outline"><Icon svg={pending === 0 ? spinner : add} />New list</LinkButton></footer>
</div>
{#snippet row(list: PickerList | null, name: string, total: number, href: string)}
  {@const rowId = list?.id ?? -1}
  {@const limit = list ? listLimit?.item_count : watchLimit}
  {@const icon = listRowIcon(list)}
  <li class={[icon.size, { maxed: limit !== undefined && total >= limit, pending: pending === rowId, error: failed === rowId }]}
    title="{total.toLocaleString('en-US')} {total === 1 ? 'item' : 'items'}">
    <button type="button" class="row" disabled={busy || otherBusy} onclick={() => transfer(list, !list)}>
      <Icon svg={pending === rowId ? spinner : icon.svg} fixedWidth />
      <span class="name">{name}</span>
    </button>
    <a {href} target="_blank" rel="noopener" aria-label="View {name}"><Icon svg={arrow} /></a>
  </li>
{/snippet}
<style>
.control {
  display: inline-flex;
}
/* An icon in a rounded box that fills on hover, like the list title's edit and share icons. */
.trigger {
  display: inline-grid;
  place-items: center;
  inline-size: var(--comment-tool-size);
  block-size: var(--comment-tool-size);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-comment-tool);
  background: none;
  color: var(--color-control-text);
  font-size: var(--font-size-list-row-action);
  line-height: 1;
  transition: background-color var(--transition-comment-quiet);

  &:is(:hover, :focus-visible):not(:disabled) {
    background-color: var(--color-comment-chip);
  }
}
button:focus-visible,
a:focus-visible {
  outline: var(--list-border) solid var(--color-input-border-focus);
  outline-offset: var(--list-border);
}
/* The poster list picker's surface (MediaList): its tinted title bar with the filter and close tools, the filter that
   grows in, groups of menu rows and a New list footer. */
.picker {
  --tone: var(--color-list-picker-tone);
  position: fixed;
  inset: auto;
  position-area: bottom;
  position-try-fallbacks: flip-block, flip-inline;
  inline-size: var(--list-picker-width);
  max-inline-size: calc(100vw - var(--gutter));
  margin: var(--space-menu-offset) 0;
  padding: 0;
  overflow: visible;
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-menu);
  background-color: var(--color-menu-bg);
  color: var(--color-dropdown-menu-text);
  box-shadow: var(--shadow-menu);
  font: var(--font-size-menu) / var(--line-height-base) var(--font-body);
  text-align: start;
}
.head {
  display: flex;
  align-items: center;
  gap: var(--space-prompt-head-gap);
  padding: var(--space-prompt-head);
  border-block-end: 1px solid color-mix(in srgb, var(--tone) var(--prompt-tint-border), var(--color-menu-border));
  border-radius: calc(var(--radius-menu) - 1px) calc(var(--radius-menu) - 1px) 0 0;
  background: color-mix(in srgb, var(--tone) var(--prompt-tint), var(--color-menu-bg));
}
.title {
  flex: 1;
  min-inline-size: 0;
  & h3 {
    margin: 0;
    color: var(--color-prompt-title);
    font-family: var(--font-headings);
    font-size: var(--font-size-prompt-title);
    font-weight: var(--font-weight-headings-heavy);
    line-height: var(--line-height-prompt-title);
  }
  & p {
    margin: 0;
    color: var(--color-menu-header);
    font-size: var(--font-size-small);
  }
  & b {
    color: var(--color-prompt-title);
    font-variant-numeric: tabular-nums;
  }
}
.tool {
  flex: none;
  display: grid;
  place-items: center;
  inline-size: var(--prompt-close-size);
  block-size: var(--prompt-close-size);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-menu-row);
  background: none;
  color: var(--color-menu-header);
  font-size: var(--font-size-prompt-close);
  &:is(:hover, :focus-visible, [aria-pressed='true']) {
    background-color: var(--color-menu-row-hover);
    color: var(--color-menu-row-hover-text);
    outline: none;
  }
  &[aria-pressed='true'] {
    color: var(--color-list-picker-on);
  }
}
.search {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows var(--transition-list-picker-search), opacity var(--transition-list-picker-search);
  &.open {
    grid-template-rows: 1fr;
    opacity: 1;
  }
}
.search-clip {
  min-block-size: 0;
  overflow: hidden;
}
.search-field {
  padding: var(--space-list-picker-search);
  & :global(input:focus) {
    border-color: var(--color-list-picker-on);
    box-shadow: 0 0 0 var(--list-picker-search-ring) var(--color-list-picker-search-ring);
  }
}
.scroll {
  max-block-size: var(--list-picker-scroll-height);
  padding: 0 var(--space-menu) var(--space-menu);
  overflow: hidden auto;
  overscroll-behavior: contain;
}
h4 {
  margin: 0;
  padding: var(--space-menu-header);
  color: var(--color-menu-header);
  font-size: var(--font-size-menu-header);
  font-weight: var(--font-weight-menu-header);
  letter-spacing: var(--letter-spacing-menu-header);
  text-transform: uppercase;
}
ul {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin: 0;
  padding: 0;
  list-style: none;
}
li {
  display: flex;
  align-items: center;
  min-inline-size: 0;
  border-radius: var(--radius-menu-row);
  &:has(:is(.row, a):is(:hover, :focus-visible)) {
    background-color: var(--color-menu-row-hover);
    color: var(--color-menu-row-hover-text);
  }
}
.row {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-prompt-row-icon);
  min-inline-size: 0;
  min-block-size: 0;
  padding: var(--space-list-picker-row);
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  &:focus-visible {
    outline: none;
  }
  & > :global(.icon) {
    flex: none;
    color: var(--color-menu-header);
    font-size: var(--font-size-prompt-row-icon);
  }
}
/* Scaled, not resized, so the names stay lined up. */
li.people .row > :global(.icon) {
  scale: var(--list-picker-people-scale);
}
li.link .row > :global(.icon) {
  scale: var(--list-picker-link-scale);
}
.name {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
li.maxed .name {
  text-decoration: line-through;
}
li.pending .row,
li.pending .row > :global(.icon) {
  color: var(--color-list-picker-on);
}
li.error .row,
li.error .row > :global(.icon) {
  color: var(--brand-danger);
}
li a {
  display: grid;
  flex: none;
  place-items: center;
  align-self: stretch;
  padding-inline: var(--space-list-picker-link);
  border-radius: var(--radius-menu-row);
  color: var(--color-menu-header);
  font-size: var(--font-size-menu-check);
  &:is(:hover, :focus-visible) {
    color: var(--color-menu-row-hover-text);
    outline: none;
  }
}
.empty {
  padding: var(--space-menu-row);
  padding-block-start: var(--space-menu);
  text-align: center;
}
footer {
  display: grid;
  padding: var(--space-list-picker-footer);
  border-block-start: 1px solid var(--color-menu-divider);
  &.error :global(.link-button) {
    color: var(--brand-danger);
  }
}
li.pending .row > :global(.icon),
footer.pending :global(.icon) {
  animation: spin var(--list-spinner-duration) linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  li.pending .row > :global(.icon),
  footer.pending :global(.icon) {
    animation: none;
  }
  .search {
    transition: none;
  }
}
</style>
