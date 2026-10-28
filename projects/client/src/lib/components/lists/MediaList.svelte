<script lang="ts">
import { isStandardApi } from '$lib/api/isStandardApi';
import { page } from '$app/state';
import { tick } from 'svelte';
import { rawApiFetch } from '$lib/api/rawApiFetch';
import { userManager } from '$lib/auth/userManager';
import { login } from '$lib/auth/login';
import { overlay } from '$lib/overlay/overlay';
import { toast } from '$lib/components/toast/toast.svelte';
import { listCatalog } from '$lib/components/lists/listCatalog.svelte';
import { QUICK_ADD } from '$lib/settings/quickAdd';
import { syncPickerOverlay } from '$lib/components/lists/syncPickerOverlay';
import { loadPickerLists } from '$lib/components/lists/loadPickerLists';
import { type PickerSection, pickerSections } from '$lib/components/lists/pickerSections';
import { toggleListItem } from '$lib/components/lists/toggleListItem';
import { createList } from '$lib/components/lists/createList';
import { loadFollowerCandidates } from '$lib/components/lists/loadFollowerCandidates';
import EmptyNote from '$lib/components/empty/EmptyNote.svelte';
import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
import NewListDialog from '$lib/components/lists/NewListDialog.svelte';
import SearchField from '$lib/components/filters/SearchField.svelte';
import LinkButton from '$lib/components/button/LinkButton.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import TooltipBox from '$lib/components/tooltip/TooltipBox.svelte';
import ListedTip from '$lib/components/lists/ListedTip.svelte';
import SummaryAction from '$lib/components/summary/SummaryAction.svelte';
import SummaryActionTile from '$lib/components/summary/SummaryActionTile.svelte';
import type { ListTarget } from '$lib/components/lists/ListTarget';
import type { PickerList } from '$lib/components/lists/PickerList';
import Icon from '$lib/icons/Icon.svelte';
import listIcon from '$lib/icons/trakt/list.svg?raw';
import listCheck from '$lib/icons/regular/list-check.svg?raw';
import listRegular from '$lib/icons/regular/list.svg?raw';
import plus from '$lib/icons/light/circle-plus.svg?raw';
import add from '$lib/icons/trakt/add-thick.svg?raw';
import close from '$lib/icons/regular/xmark.svg?raw';
import search from '$lib/icons/regular/magnifying-glass.svg?raw';
import friends from '$lib/icons/trakt/friends-thick.svg?raw';
import lock from '$lib/icons/solid/lock-keyhole.svg?raw';
import link from '$lib/icons/solid/link.svg?raw';
import arrow from '$lib/icons/light/angle-right.svg?raw';
import spinner from '$lib/icons/solid/arrows-rotate.svg?raw';
import { viewerFetch } from '../../auth/viewerFetch.ts';
interface Props {
  target: ListTarget;
  variant?: 'summary' | 'card';
  small?: boolean;
}
const { target, variant = 'card', small = false }: Props = $props();
const id = $props.id();
let triggerButton = $state<HTMLElement>();
let popover = $state<HTMLDivElement>();
let searchInput = $state<HTMLInputElement>();
let expanded = $state(false);
let opened = $state(false);
let busy = $state(false);
let loaded = $state(false);
let pendingRow = $state<number | null>(null);
let lists = $state<PickerList[]>([]);
let sections = $state<PickerSection[]>([]);
let watchlisted = $state(false);
let terms = $state('');
let searching = $state(false);
let newList = $state(false);
let createError = $state('');
let serverLimit = $state<number>();
let following = $state<{ slug: string; name: string; avatar?: string }[]>([]);
let followingError = $state(false);
const viewerState = $derived(overlay.state(target.type, target.id));
const selected = $derived(Boolean(viewerState.watchlisted || viewerState.listed));
const PRIVACY: Record<string, { svg: string; size?: 'people' | 'link' }> = {
  private: { svg: lock },
  link: { svg: link, size: 'link' },
  friends: { svg: friends, size: 'people' },
};
const byId = $derived(new Map(lists.map((list) => [list.id, list])));
const matches = (name: string) =>
  !searching || name.toLocaleLowerCase('en-US').includes(terms.toLocaleLowerCase('en-US'));
const shown = $derived(
  sections.map((section) => ({
    ...section,
    ids: section.ids.filter((rowId) => matches(rowId ? byId.get(rowId)?.name ?? '' : 'Watchlist')),
  })).filter(({ ids }) => ids.length),
);
const count = $derived(lists.filter((list) => list.selected).length);
const watchlistCount = $derived(overlay.watchlistCount());
const watchlistMode = $derived(
  QUICK_ADD && (
    (loaded ? lists.length : listCatalog.count(page.data.user?.slug ?? '') ?? 0) === 0 ||
    page.data.settings?.browsing?.list_popup_action === 'watchlist'
  ),
);
const label = $derived(selected ? 'Listed On' : watchlistMode ? 'Add to watchlist' : 'Add to list');
const listedOn = $derived(viewerState.lists ?? []);
const subtitle = $derived(
  [
    viewerState.watchlisted ? 'Watchlist' : '',
    listedOn.length ? `${listedOn.length} ${listedOn.length === 1 ? 'list' : 'lists'}` : '',
  ].filter(Boolean).join(' + '),
);
const tip = $derived(selected ? listedTip : label);
const listLimit = $derived(page.data.settings?.limits?.list);
const max = $derived(
  serverLimit ??
    (listLimit && lists.filter((list) => !list.collaboration).length >= listLimit.count ? listLimit.count : undefined),
);
// Holding the button for half a second opens the picker right away; the click that ends the press is then ignored.
const LONG_PRESS = 500;
let pressTimer: ReturnType<typeof setTimeout> | undefined;
let longPressed = false;
let changed = false;
const pressStart = (event: PointerEvent) => {
  if (event.button !== 0) return;
  longPressed = false;
  clearTimeout(pressTimer);
  pressTimer = setTimeout(() => {
    longPressed = true;
    void open(true);
  }, LONG_PRESS);
};
const pressEnd = () => clearTimeout(pressTimer);
const click = () => {
  if (longPressed) {
    longPressed = false;
    return;
  }
  void open();
};
const pickerKey = (event: KeyboardEvent) => {
  if (event.key !== 'ArrowDown') return;
  event.preventDefault();
  void open(true);
};
const authFetch = () => viewerFetch();
const request = (path: string, body: unknown) =>
  rawApiFetch({
    fetch: authFetch(),
    path,
    init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  });

$effect(() => {
  if (variant === 'summary' && page.data.user) void listCatalog.load(page.data.user.slug, authFetch()).catch(() => {});
});

async function load() {
  const result = await loadPickerLists({ fetch: authFetch(), target });
  lists = result.lists;
  listCatalog.update(page.data.user?.slug ?? '', lists.length);
  watchlisted = result.watchlisted ?? Boolean(viewerState.watchlisted);
  sections = pickerSections(lists, watchlisted);
  loaded = true;
  syncPickerOverlay({ overlay, target, lists, watchlisted });
}
async function open(force = false) {
  if (busy) return;
  if (!(await userManager().getUser())?.access_token) {
    await login();
    return;
  }
  busy = true;
  try {
    // A quick add needs no lists: the overlay already knows whether it's on the watchlist.
    if (!force && watchlistMode && !selected) {
      if (!loaded) watchlisted = Boolean(viewerState.watchlisted);
      await toggleWatchlist();
      return;
    }
    await load();
    if (QUICK_ADD && !force && lists.length === 0) {
      await toggleWatchlist();
      return;
    }
    popover?.togglePopover();
  } catch {
    toast.error("Doh! We couldn't load your lists. Please try again.");
  } finally {
    busy = false;
  }
}
async function toggleWatchlist() {
  const before = watchlisted;
  watchlisted = !before;
  const ok = await toggleListItem({ target, list: null, remove: before, overlay, request, notify: toast });
  if (!ok) watchlisted = before;
  return ok;
}
async function toggleRow(list?: PickerList) {
  if (busy) return;
  busy = true;
  pendingRow = list?.id ?? 0;
  try {
    if (!list) {
      if (await toggleWatchlist()) changed = true;
      return;
    }
    lists = lists.map((row) =>
      row.id === list.id ? { ...row, selected: !row.selected, count: row.count + (row.selected ? -1 : 1) } : row
    );
    const ok = await toggleListItem({
      target,
      list,
      remove: list.selected,
      overlay,
      request,
      notify: toast,
    });
    if (ok) changed = true;
    else lists = lists.map((row) => row.id === list.id ? list : row);
  } finally {
    busy = false;
    pendingRow = null;
  }
}
// The item count beside the hovered or focused row, placed from the row's box: Safari can't anchor a tooltip to a row
// inside the popover's scrolling list. A scroll moves it with its row and hides it once the row scrolls out of view.
let countTip = $state<{ text: string; top: number }>();
let countRow: HTMLElement | null = null;
function placeCount(row: HTMLElement | null) {
  countRow = row;
  const list = row?.closest('.scroll')?.getBoundingClientRect();
  const box = row?.getBoundingClientRect();
  const middle = box ? box.top + box.height / 2 : 0;
  countTip = row && box && list && popover && middle > list.top && middle < list.bottom
    ? { text: row.dataset.count ?? '', top: middle - popover.getBoundingClientRect().top - popover.clientTop }
    : undefined;
}
function beforeToggle(event: ToggleEvent) {
  if (event.newState === 'open') opened = true;
}
function toggle(event: ToggleEvent) {
  expanded = event.newState === 'open';
  if (!expanded) placeCount(null);
  if (expanded) popover?.querySelector<HTMLButtonElement>('button')?.focus();
  else if (!newList) {
    triggerButton?.focus({ preventScroll: true });
    if (changed) {
      changed = false;
      void overlay.refresh();
    }
  }
}
async function searchToggle() {
  searching = !searching;
  terms = '';
  await tick();
  if (searching) searchInput?.focus();
}
let loadingMounted = $state(false);
let loadingNew = $state(false);
async function openNew() {
  createError = '';
  serverLimit = undefined;
  followingError = false;
  popover?.hidePopover();
  // The Trakt loader covers the page while the collaborators load, then the dialog opens with them in.
  if (!loadingMounted) {
    loadingMounted = true;
    await tick();
    await new Promise(requestAnimationFrame);
  }
  loadingNew = true;
  try {
    following = await loadFollowerCandidates(authFetch());
  } catch {
    followingError = true;
  } finally {
    loadingNew = false;
    newList = true;
  }
}
async function save(draft: Parameters<typeof createList>[0]['draft'] & { collaborators: string[] }) {
  if (busy) return;
  busy = true;
  try {
    const { collaborators, ...fields } = draft;
    const created = await createList({ request, draft: fields });
    const row: PickerList = {
      id: created.ids.trakt,
      name: created.name,
      count: created.item_count,
      privacy: created.privacy,
      rank: 0,
      owner: page.data.user?.slug ?? 'me',
      collaboration: false,
      selected: false,
    };
    changed = true;
    lists = [row, ...lists];
    listCatalog.update(page.data.user?.slug ?? '', lists.length);
    const added = await toggleListItem({ target, list: row, remove: false, overlay, request, notify: toast });
    if (added) {
      lists = lists.map((list) => list.id === row.id ? { ...list, selected: true, count: list.count + 1 } : list);
    }
    sections = pickerSections(lists, watchlisted);
    const collaborations = await Promise.all(
      collaborators.map((slug) =>
        request(`/lists/${row.id}/collaborators/${encodeURIComponent(slug)}`, {}).then((response) => response.ok).catch(
          () => false,
        )
      ),
    );
    if (collaborations.some((ok) => !ok)) {
      toast.error('List created, but some collaborators could not be added. Collaborators must follow you.');
    }
    toast.success(`You created ${created.name}.${added ? '' : ' Retry adding this item in the picker.'}`);
    newList = false;
    popover?.showPopover();
  } catch (error) {
    if (error instanceof Error && error.message === '420') serverLimit = listLimit?.count ?? lists.length;
    else createError = 'Could not create the list. Check the name and try again.';
  } finally {
    busy = false;
  }
}
</script>
<!-- Picker links use list ids and the viewer's canonical slug. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class={['list-control', variant, { small, selected, expanded }]} style:anchor-name="--list-{id}">
  {#if variant === 'summary'}
    <SummaryAction bind:element={triggerButton} color="var(--brand-secondary)" icon={listIcon} text={label}
      detail={subtitle || undefined} {selected} busy={busy ? 'Saving lists' : undefined} tooltip={selected ? tip : undefined}
      aria-haspopup="dialog"
      aria-expanded={expanded} aria-controls="list-{id}" aria-keyshortcuts="ArrowDown" disabled={busy}
      onpointerdown={pressStart} onpointerup={pressEnd} onpointerleave={pressEnd} onpointercancel={pressEnd}
      oncontextmenu={(event) => event.preventDefault()} onkeydown={pickerKey} onclick={click}>
      {#snippet tiles()}
        <SummaryActionTile icon={plus} label={selected ? 'Manage lists' : 'Pick a list'} aria-haspopup="dialog"
          aria-controls="list-{id}" disabled={busy} onclick={() => open(true)} />
      {/snippet}
    </SummaryAction>
  {:else}
    <Tooltip content={tip} placement="bottom">
      {#snippet trigger(tooltip)}
        <button bind:this={triggerButton} type="button" class="trigger" aria-label={selected ? 'Manage lists' : label}
          aria-haspopup="dialog" aria-expanded={expanded} aria-controls="list-{id}" aria-busy={busy} disabled={busy}
          aria-keyshortcuts="ArrowDown" onpointerdown={pressStart} onpointerup={pressEnd} onpointerleave={pressEnd}
          onpointercancel={pressEnd} oncontextmenu={(event) => event.preventDefault()} onkeydown={pickerKey}
          onclick={click} {...tooltip}>
          <Icon svg={listRegular} fixedWidth />
          {#if busy}<span class="spinner"><Icon svg={spinner} /></span>{/if}
        </button>
      {/snippet}
    </Tooltip>
  {/if}
</div>
<div bind:this={popover} id="list-{id}" class={['picker', variant]} popover="auto" role="dialog"
  aria-label="Lists for {target.title}" style:position-anchor="--list-{id}" onbeforetoggle={beforeToggle}
  ontoggle={toggle}>
  {#if opened}
  <header class="head">
    <div class="title">
      <h3>Add to lists</h3>
      <p>On <b>{count + Number(watchlisted)}</b> of {lists.length + 1}</p>
    </div>
    <button type="button" class="tool" aria-label="Filter lists" aria-pressed={searching} onclick={searchToggle}><Icon
        svg={search} /></button>
    <button type="button" class="tool" aria-label="Close list picker" onclick={() => popover?.hidePopover()}><Icon
        svg={close} /></button>
  </header>
  <div class={['search', { open: searching }]} inert={!searching}>
    <div class="search-clip">
      <div class="search-field">
        <SearchField bind:element={searchInput} bind:value={terms} label="Filter lists" placeholder="Filter lists" />
      </div>
    </div>
  </div>
  <div class="scroll" onscroll={() => placeCount(countRow)}>
    {#each shown as section (section.key)}
      <h4 id="list-{id}-{section.key}">{section.title}</h4>
      <ul aria-labelledby="list-{id}-{section.key}">
        {#each section.ids as rowId (rowId)}
          {@const list = byId.get(rowId)}
          {#if rowId === 0}
            {@render row(null, 'Watchlist', watchlisted, watchlistCount, '', `/users/${page.data.user?.slug ?? 'me'}/watchlist`, page.data.settings?.limits?.watchlist?.item_count)}
          {:else if list}
            {@render row(list, list.name, list.selected, list.count, list.privacy, `/lists/${list.id}`, listLimit?.item_count)}
          {/if}
        {/each}
      </ul>
    {:else}
      <div class="empty"><EmptyNote>No lists match “{terms.trim()}”.</EmptyNote></div>
    {/each}
  </div>
  {#if countTip}<div class="count-tip" aria-hidden="true" style:top="{countTip.top}px"><TooltipBox side="left">{countTip.text}</TooltipBox></div>{/if}
  <footer><LinkButton onclick={openNew} variant="outline"><Icon svg={add} />New list</LinkButton></footer>
  {/if}
</div>
{#snippet listedTip()}<ListedTip user={page.data.user?.slug ?? 'me'} watchlisted={Boolean(viewerState.watchlisted)}
  lists={listedOn} />{/snippet}
{#snippet row(list: PickerList | null, name: string, active: boolean, total: number, privacy: string, href: string, limit?: number)}
  {@const maxed = limit !== undefined && total >= limit && !active}
  {@const pending = pendingRow === (list?.id ?? 0)}
  {@const kind = PRIVACY[privacy]}
  {@const size = list?.collaboration ? 'people' : kind?.size}
  {@const items = `${total.toLocaleString('en-US')} ${total === 1 ? 'item' : 'items'}`}
  <!-- OG's item count tooltip, on the left (global.js, lists.js): the picker's `countTip`. The hidden copy describes
       the row's toggle for screen readers. -->
  <li class={[size, { active, maxed, pending }]}>
  <div class="line" role="presentation" data-count={items}
    onpointerenter={(event) => event.pointerType !== 'touch' && placeCount(event.currentTarget)}
    onpointerleave={() => placeCount(null)}
    onfocusin={(event) => event.target instanceof Element && event.target.matches(':focus-visible') && placeCount(event.currentTarget)}
    onfocusout={() => placeCount(null)}>
    <button type="button" class="row" aria-pressed={active} aria-describedby="list-{id}-count-{list?.id ?? 0}"
      disabled={busy || maxed} onclick={() => toggleRow(list ?? undefined)}>
      <Icon svg={pending ? spinner : !list ? listCheck : list.collaboration ? friends : kind?.svg ?? listRegular} fixedWidth />
      <span class="name">{name}</span>
    </button>
    <span class="described" id="list-{id}-count-{list?.id ?? 0}">{items}</span>
    <a {href} target="_blank" rel="noopener" aria-label="Open {name}"><Icon svg={arrow} /></a>
  </div>
</li>
{/snippet}
{#if loadingMounted}<LoadingOverlay visible={loadingNew} />{/if}
{#if newList}<NewListDialog title="Add to new list" bind:open={newList} {busy} error={createError} {max}
  vip={page.data.user?.isVip} {following} {followingError} collaboratorsUnavailable={isStandardApi()}
  onclose={async () => { await tick(); triggerButton?.focus({ preventScroll: true }); }}
  onsave={save} />{/if}
<style>
.list-control {
  display: flex;
  position: relative;
  color: var(--brand-fifth);
}
.trigger {
  display: flex;
  align-items: center;
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
}
.card {
  --bar: var(--list-card-height);
  --width: var(--list-card-width);
}
.card.small {
  --bar: var(--list-card-small-height);
  --width: var(--list-card-small-width);
}
.card .trigger {
  justify-content: center;
  inline-size: var(--width);
  block-size: var(--bar);
  font-size: var(--font-size-quick-icon);
}
.card.small .trigger {
  font-size: var(--font-size-quick-icon-small);
}
.card.selected,
.card:has(.trigger:is(:hover, :focus-visible)) {
  background: var(--brand-fifth);
  color: var(--color-text-inverse);
}
button:focus-visible,
a:focus-visible {
  outline: var(--list-border) solid var(--color-input-border-focus);
  outline-offset: var(--list-border);
}
.spinner {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: var(--color-action-bg);
  color: var(--brand-secondary);
}
.spinner :global(.icon) {
  animation: spin var(--list-spinner-duration) linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
/* The shared prompt's surface and tinted title bar, with the filter and close tools, groups of menu rows and a New
   list footer. */
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
.picker.summary {
  inline-size: anchor-size(width);
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
/* Opens by growing from nothing under the title bar and fading in. */
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
  border-radius: var(--radius-menu-row);
  &:has(:is(.row, a):is(:hover, :focus-visible)) {
    background-color: var(--color-menu-row-hover);
    color: var(--color-menu-row-hover-text);
  }
}
.line {
  display: flex;
  align-items: center;
  min-inline-size: 0;
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
li.active .row,
li.active .row > :global(.icon) {
  color: var(--color-list-picker-on);
}
/* The count for screen readers; the tooltip shows it on screen. */
.described {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
li.maxed .name {
  text-decoration: line-through;
}
.pending .row > :global(.icon) {
  animation: spin var(--list-spinner-duration) linear infinite;
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
/* The shared tooltip's left placement: the box off the picker's edge, its arrow at the row. */
.count-tip {
  position: absolute;
  inset-inline-end: 100%;
  inline-size: max-content;
  translate: 0 -50%;
  padding-inline-end: calc(var(--tooltip-arrow) + 1px + var(--tooltip-offset));
  pointer-events: none;
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
}
@media (prefers-reduced-motion: reduce) {
  .spinner :global(.icon),
  .pending .row > :global(.icon) {
    animation: none;
  }
  .search {
    transition: none;
  }
}
</style>
