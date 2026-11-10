<script lang="ts">
  import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
  import { trackUpsellImpression } from '#lib/analytics/trackUpsellImpression.ts';
  import SeoHead from '#lib/seo/SeoHead.svelte';
  import { toListSeo } from '#lib/seo/pages/toListSeo.ts';
  import { listPreviewArt } from '#lib/lists/listPreviewArt.ts';
  import { rawApiFetch } from '#lib/api/rawApiFetch.ts';
  import BuiltInListEditor from '#lib/components/lists/BuiltInListEditor.svelte';
  import { overlay } from '#lib/overlay/overlay.ts';
  import { toast } from '#lib/components/toast/toast.svelte.ts';
  import { loadOwnerItems } from '#lib/lists/loadOwnerItems.ts';
  import { moveListItem } from '#lib/lists/moveListItem.ts';
  import { rerankListCards } from '#lib/lists/rerankListCards.ts';
  import { removeOwnerItems } from '#lib/lists/removeOwnerItems.ts';
  import { writeOwnerList } from '#lib/lists/writeOwnerList.ts';
  import { toListItemCard } from '#lib/lists/toListItemCard.ts';
  import { afterNavigate, goto, invalidateAll } from '$app/navigation';
  import ListNotice from '#lib/components/lists/ListNotice.svelte';
  import ListTag from '#lib/components/lists/ListTag.svelte';
  import ListTitleRow from '#lib/components/lists/ListTitleRow.svelte';
  import SortMenu from '#lib/components/sort/SortMenu.svelte';
  import SortLabel from '#lib/components/sort/SortLabel.svelte';
  import { memberRelation } from '#lib/components/comments/memberRelation.ts';
  import { convertToSmartList } from '#lib/lists/smart/convertToSmartList.ts';
  import ReportDialog from '#lib/components/summary/ReportDialog.svelte';
  import { leaveList } from '#lib/components/lists/leaveList.ts';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
  import { useTrack } from '#lib/analytics/useTrack.ts';
  import { untrack } from 'svelte';
  import { flip } from 'svelte/animate';
  import { prefersReducedMotion } from 'svelte/motion';
  import ListEditor from '#lib/components/lists/ListEditor.svelte';
  import ManageConfirm from '#lib/components/comments/ManageConfirm.svelte';
  import { deleteList } from '#lib/components/lists/deleteList.ts';
  import { api } from '#lib/api/api.ts';
  import CommentText from '#lib/components/comments/CommentText.svelte';
  import { parseComment } from '#lib/components/comments/text/parseComment.ts';
  import Container from '#lib/components/container/Container.svelte';
  import Dropdown from '#lib/components/dropdown/Dropdown.svelte';
  import SortDirection from '#lib/components/dropdown/SortDirection.svelte';
  import FadeHideMenu from '#lib/components/filters/FadeHideMenu.svelte';
  import TermsFilter from '#lib/components/filters/TermsFilter.svelte';
  import WatchNowFilter from '#lib/components/watchnow/WatchNowFilter.svelte';
  import WatchNowChips from '#lib/components/watchnow/WatchNowChips.svelte';
  import { favoriteSlugs } from '#lib/components/watchnow/watchNow.ts';
  import { watchNowTiles } from '#lib/components/filters/watchNowFilter.ts';
  import type { ViewerSettings } from '#lib/settings/ViewerSettings.ts';
  import { listFilterOptions } from '#lib/lists/listFilterOptions.ts';
  import EmptyState from '#lib/components/empty/EmptyState.svelte';
  import LoadFailed from '#lib/components/empty/LoadFailed.svelte';
  import { expireHideCookie } from '#lib/components/filters/expireHideCookie.ts';
  import type { HeaderUser } from '#lib/components/header/HeaderUser.ts';
  import ListTransfer from '#lib/components/lists/ListTransfer.svelte';
  import clone from '#lib/icons/regular/clone.svg?raw';
  import file from '#lib/icons/regular/file.svg?raw';
  import fileExport from '#lib/icons/regular/file-export.svg?raw';
  import ListItemEdit from '#lib/components/lists/ListItemEdit.svelte';
  import OfficialListHeader from '#lib/components/lists/OfficialListHeader.svelte';
  import RankInput from '#lib/components/lists/RankInput.svelte';
  import PosterGrid from '#lib/components/media/PosterGrid.svelte';
  import NotesDialog from '#lib/components/notes/NotesDialog.svelte';
  import Pagination from '#lib/components/pagination/Pagination.svelte';
  import ReadMore from '#lib/components/readmore/ReadMore.svelte';
  import ShareButton from '#lib/components/share/ShareButton.svelte';
  import ShareArrival from '#lib/share/ShareArrival.svelte';
  import CollaboratorsChip from '#lib/components/lists/CollaboratorsChip.svelte';
  import SectionToolbar from '#lib/components/toolbar/SectionToolbar.svelte';
  import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
  import Icon from '#lib/icons/Icon.svelte';
  import userXmark from '#lib/icons/regular/user-xmark.svg?raw';
  import barsProgress from '#lib/icons/regular/bars-progress.svg?raw';
  import deleteIcon from '#lib/icons/regular/trash-xmark.svg?raw';
  import flag from '#lib/icons/regular/flag.svg?raw';
  import move from '#lib/icons/regular/up-down-left-right.svg?raw';
  import check from '#lib/icons/solid/check.svg?raw';
  import pencil from '#lib/icons/regular/pen.svg?raw';
  import type { ProfileUser } from '#lib/users/ProfileUser.ts';
  import { createListManager } from '#lib/lists/createListManager.svelte.ts';
  import { listGenreOptions } from '#lib/lists/listGenreOptions.ts';
  import { listHref } from '#lib/lists/listHref.ts';
  import ListItemPoster from '#lib/lists/ListItemPoster.svelte';
  import { listPrivacy } from '#lib/lists/listPrivacy.ts';
  import ListManageBar from '#lib/lists/ListManageBar.svelte';
  import { listSortHow, reverseHow } from '#lib/lists/listItemSorts.ts';
  import { listTitleActions } from '#lib/lists/listTitleActions.ts';
  import ListStats from '#lib/lists/ListStats.svelte';
  import type { ListStats as ListStatsNumbers } from '#lib/lists/toListStats.ts';
  import { listTypeOptions } from '#lib/lists/listTypeOptions.ts';
  import type { loadBuiltInList } from '#lib/lists/loadBuiltInList.ts';
  import type { loadOfficialList } from '#lib/lists/loadOfficialList.ts';
  import type { loadList } from '#lib/lists/loadList.ts';
  import type { ListItemCard } from '#lib/lists/toListItemCard.ts';
  import { visibleListSorts } from '#lib/lists/visibleListSorts.ts';
  import { sortCardsByViewer, viewerSortReady, viewerSortValue } from '#lib/lists/viewerSort.ts';
  import CardShimmerRow from '#lib/components/loading/CardShimmerRow.svelte';
  import { externalLink } from '#lib/externalLink.ts';
  import { traktUrls } from '#lib/traktUrls.ts';
  import { watchNowCountry } from '../settings/watchNowCountry.ts';
  import { viewerFetch } from '../auth/viewerFetch.ts';

  type Props = { 
    data: 
      (
        (
          Awaited<ReturnType<typeof loadList>> |
          Awaited<ReturnType<typeof loadBuiltInList>>) &

        { 
          profile: ProfileUser;
          user: HeaderUser | null;
          settings?: ViewerSettings | null
         }) |

      (
        Awaited<ReturnType<typeof loadOfficialList>> &
        { user: HeaderUser | null; settings?: ViewerSettings | null })
   };

  const { data }: Props = $props();

  let fadeHide = $derived(data.fadeHide);
  const filterCookie = $derived(data.kind === 'personal' || data.kind === 'official' ? 'list' : data.kind);

  function clearHide() {
    expireHideCookie(filterCookie);
     
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same list, without its hide filters
    void goto(listHref(page.url, { hide: [] }));
  }
const filterOptions = $derived(
  listFilterOptions({
    kind: data.kind,
    types: data.query.types,
    isSelf: data.kind !== 'official' && data.user?.slug === data.profile.slug,
  }),
);
const country = $derived(watchNowCountry(data.settings));
const favoriteKeys = $derived(data.settings?.browsing?.watchnow?.favorites ?? []);
const tiles = $derived(
  data.list
    ? watchNowTiles({
      watchnow: data.query.watchnow?.split(',') ?? [],
      sources: data.filterSources,
      country,
      favorites: favoriteSlugs(favoriteKeys, country, country),
    })
    : [],
);
let reportOpen = $state(false);
let left = $state(false);
let leaving = $state(false);
$effect(() => {
  void data.list;
  void data.user;
  left = false;
  leaving = false;
  reportOpen = false;
});
// Once the viewer stops collaborating, they leave the chip and its panel.
const collaborators = $derived(
  data.list ? data.collaborators.filter(({ slug }) => !left || slug !== data.user?.slug) : [],
);
const listOwner = $derived(
  'profile' in data
    ? {
      name: data.profile.displayName,
      href: `/users/${data.profile.slug}`,
      avatar: data.profile.avatarUrl,
      vip: data.profile.vip,
    }
    : undefined,
);
  async function leave() {
    if (!data.list || !data.user || leaving || left) return;
    const source = data;
    leaving = true;
    const ok = await leaveList({
      fetch: viewerFetch(),
      id: data.list.id,
      viewer: data.user.slug,
      patch: () => {
        left = true;
        return () => {
          if (data === source) left = false;
        };
      },
      notify: (message) => {
        if (data === source) toast.error(message);
    },
    });
    if (data !== source) return;
    leaving = false;
    if (ok) {
      toast.success('You stopped collaborating on this list.');
      await goto(resolve('/users/[id]/lists/collaborations', { id: data.user.slug }));
    }
  }
  const vip = $derived(data.user?.isVip ?? false);
  const typeOptions = $derived(listTypeOptions(data.kind));
const typeLabel = $derived(
  data.query.types.length > 0
    ? data.query.types.map((type) => typeOptions.find((option) => option.type === type)?.label ?? type).join(', ')
    : 'All',
);
const genreLabel = $derived(
  data.query.genres.length > 0
    ? data.query.genres.map((slug) => listGenreOptions.find((option) => option.slug === slug)?.label ?? slug)
      .join(', ')
    : 'All',
);
const sorts = $derived(visibleListSorts({ types: data.query.types, signedIn: data.user !== null }));
// The resolved stats bar numbers: undefined while they stream, null when they couldn't be counted.
let listStats = $state<ListStatsNumbers | null>();
// Stats that came with the page are known on the server too; streamed ones once they settle.
const knownStats = $derived(data.list && !(data.stats instanceof Promise) ? data.stats : listStats);
// Show progress tracks only shows, so a list of movies and no shows opens progress on its franchises.
const moviesOnly = $derived(
  Boolean(knownStats?.items?.some(({ type }) => type === 'movie') && !knownStats.items.some(({ type }) => type === 'show')),
);
const actions = $derived(
  data.list
    ? listTitleActions({
      list: data.list,
      viewer: data.user ? { slug: data.user.slug } : null,
      isCollaborator: data.isCollaborator && !left,
      origin: page.url.origin,
      moviesOnly,
    })
    : null,
);
// : the watchlist and favorites are titled after their owner.
const pageTitle = $derived(
  data.kind === 'official'
    ? data.list.name
    : data.kind === 'watchlist' || data.kind === 'favorites'
    ? `${data.profile.displayName}'s ${data.kind}`
    : `${data.list?.name}, a list by ${data.profile.displayName}`,
);
const filtered = $derived(
  data.query.types.length > 0 || data.query.genres.length > 0 || Boolean(data.query.terms) ||
    Boolean(data.query.watchnow) || (data.query.hide?.length ?? 0) > 0,
);
const clearedHref = $derived(
  listHref(page.url, { types: [], genres: [], terms: '', watchnow: '', hide: data.query.hide?.length ? [] : undefined }),
);
const ownList = $derived(data.kind !== 'official' && data.user?.slug === data.profile.slug);
let editing = $state(false);
let deleting = $state(false);
let personalCount = $state<number>();
const limit = $derived(page.data.settings?.limits?.list?.count);
const deleteWarning = $derived(
  limit !== undefined && (personalCount ?? 0) > limit
    ? `You're over the ${limit} list limit. You won't be able to re-create this list if you delete it.`
    : "This can't be undone!",
);
  $effect(() => {
    if (!actions?.delete) return;
  api({ fetch: viewerFetch() }).users.lists.personal({
    params: { id: 'me' },
    query: { limit: 1 },
  }).then((response) => {
      if (response.status === 200) {
        personalCount = Number(response.headers.get('x-pagination-item-count')) || response.body.length;
      }
    }).catch(() => {});
  });
  async function removeList() {
    if (!data.list || data.list.id === null || deleting) return;
    deleting = true;
    const ok = await deleteList({
      id: data.list.id,
      overlay,
      notify: toast,
      request: (path, method) => rawApiFetch({ fetch: viewerFetch(), path, init: { method } }),
    remove: () => () => {},
    });
    deleting = false;
    if (ok) {
      void overlay.refresh();
      await goto(resolve('/users/[id]/lists', { id: data.list.ownerSlug }));
    }
  }
  // Friend or Following, from the viewer's network, as on the list's row; never on Trakt's own lists or the viewer's.
const relation = $derived(
  data.kind === 'official' ? undefined : memberRelation(overlay.slices().network, data.list?.ownerSlug),
);

  // The owner's list an app stopped syncing: offer to let it fill itself from the API's ready-made setup. It keeps its
  // address, name and privacy.
  const smartDraft = $derived('smartDraft' in data ? data.smartDraft : null);
  let converting = $state(false);
  async function convertList() {
    const list = data.list;
    if (!list || !smartDraft || converting) return;
    converting = true;
    const outcome = await convertToSmartList({
    request: (path, method, body) =>
      rawApiFetch({
        fetch: viewerFetch(),
        path,
        init: { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      }),
      list: list.slug,
      name: list.name,
    privacy: list.isPublic ? 'public' : list.pills.includes('Following') ? 'friends' : 'private',
    draft: smartDraft,
    });
    converting = false;
    if (outcome === 'converted') {
      toast.success(`${list.name} now fills itself as a smart list.`);
      await invalidateAll();
      return;
    }
    toast.error(outcome === 'limit'
      ? "You've reached your smart list limit, so this list stays as it is."
      : "Doh! We couldn't change this list. Please try again.");
  }
  // Official lists and public personal lists are in search; the watchlist and favorites follow their route's robots.
const indexed = $derived(
  !!data.list?.isPublic && !('profile' in data && data.profile.isPrivate) && data.kind !== 'watchlist' &&
    data.kind !== 'favorites',
);
  const ownerKind = $derived(data.kind === 'watchlist' || data.kind === 'favorites' ? data.kind : null);
  const itemsSource = $derived(ownerKind ?? 'user-list');
  const owner = $derived(ownerKind !== null && data.user?.slug === data.list?.ownerSlug);
  // Outgoing posters must not read a derived after its owning effect has been destroyed.
  let removingFromOwner = false;
  $effect.pre(() => {
    removingFromOwner = owner;
  });

  let ownerManaging = $state(false);
  let ownerBusy = $state(false);
  let allItems = $state<readonly ListItemCard[] | null>(null);
  let selectedKeys = $state<readonly number[] | null>(null);
  let removedKeys = $state<readonly number[]>([]);

  const itemTotal = $derived(data.list
    ? owner
      ? Math.max(0, data.total - removedKeys.length)
      : data.total
    : 0);

  let savedDescription = $state<string | undefined>();
  const description = $derived(parseComment(savedDescription || data.list?.description || ''));
  let notesItem = $state<ListItemCard | null>(null);
  let notesOpen = $state(false);
  let notesDraft = $state('');
  // Notes saved since the page loaded, by item key, so a note added outside manage mode shows without a reload.
  let savedNotes = $state<Readonly<Record<number, string>>>({});
  // The edit dialogs' header: the list's first five posters.
  const listPosters = $derived((data.list ? data.cards : []).slice(0, 5).flatMap((card) => card.image ? [card.image] : []));

  // Watched, Collected and Plays: the loader sent the whole list, ordered here once the viewer's overlay has loaded. The
  // order is taken once, so watching a poster doesn't move it out from under the viewer.
  const browserSortReady = $derived(!(data.list && data.sortInBrowser) || viewerSortReady(data.sort.by, overlay.slices()));
const viewerValue = (by: string) => (card: ListItemCard) =>
  card.type === 'person' ? undefined : viewerSortValue(by, overlay.state(card.type, card.id, card.seasonOf));
  const pageCards = $derived.by(() => {
    if (!data.list) return [];
    if (!data.sortInBrowser) return data.cards;
    if (!browserSortReady) return [];
    const { cards, sort, query: { page, limit } } = data;
    return untrack(() => sortCardsByViewer(cards, sort, viewerValue(sort.by))).slice((page - 1) * limit, page * limit);
  });
const ownerCards = $derived(
  (ownerManaging && allItems && selectedKeys
    ? selectedKeys.flatMap((key) => {
      const item = allItems?.find((row) => row.key === key);
      return item ? [item] : [];
    })
    : pageCards.map((item) => allItems?.find((row) => row.key === item.key) ?? item))
    .filter((item) => !removedKeys.includes(item.key))
    .map((item) => item.key in savedNotes ? { ...item, notes: savedNotes[item.key] || undefined } : item),
);
const request = (path: string, init?: Parameters<typeof rawApiFetch>[0]['init']) =>
  rawApiFetch({ fetch: viewerFetch(), path, init });
  $effect(() => {
    void (data.list ? data.cards : undefined);
    ownerBusy = false;
    allItems = null;
    selectedKeys = null;
    removedKeys = [];
    savedNotes = {};
    ownerManaging = false;
    editing = false;
    notesOpen = false;
    savedDescription = undefined;
  });
  function editBuiltIn() {
    if (!owner || !ownerKind || ownerBusy || transferBusy) return;
    editing = true;
  }
  async function toggleManage() {
    if (!owner || !ownerKind || !data.list || ownerBusy || transferBusy) return;
    if (ownerManaging) {
      ownerManaging = false;
      return;
    }
    // The mode opens at once, its writes held while the whole list loads.
    ownerManaging = true;
    ownerBusy = true;
    const source = data;
    try {
      const [complete, selection] = await Promise.all([
        loadOwnerItems({ kind: ownerKind, request }),
      loadOwnerItems({ kind: ownerKind, request, selection: { query: data.query, sort: data.sort } }),
      ]);
      if (source !== data || !data.list) return;
      const options = { sortBy: data.sort.by, datePreferences: data.datePreferences };
      const items = complete.map((row) => toListItemCard(row, options));
      if (selection.some((row) => !items.some((item) => item.key === row.id))) throw new Error('List changed');
      allItems = items;
      const selected = selection.flatMap((row) => items.filter((item) => item.key === row.id));
    selectedKeys = (data.sortInBrowser ? sortCardsByViewer(selected, data.sort, viewerValue(data.sort.by)) : selected).map(
      (item) => item.key,
    );
    } catch {
      if (source === data) ownerManaging = false;
      toast.error("Doh! We couldn't load the complete list. Please try again.");
    } finally {
      if (source === data) ownerBusy = false;
    }
  }
  async function saveOrder(next: readonly ListItemCard[]) {
    if (!owner || !ownerKind || !allItems || ownerBusy || transferBusy) return;
    const source = data;
    const before = allItems;
    const beforeKeys = selectedKeys;
    allItems = next;
    selectedKeys = next.filter((item) => beforeKeys?.includes(item.key)).map((item) => item.key);
    ownerBusy = true;
    const ok = await writeOwnerList({
      kind: ownerKind,
      change: { type: 'order', rank: next.map((item) => item.key) },
      request,
    notify: toast,
    });
    if (source !== data) return;
    if (!ok) {
      allItems = before;
      selectedKeys = beforeKeys;
    }
    ownerBusy = false;
  }
  function moveItem(item: ListItemCard, rank: number) {
    if (!ownerManaging || !allItems || ownerBusy || transferBusy) return;
    const order = allItems.map((row) => row.key);
    const next = moveListItem(order, item.key, rank);
    if (next !== order) void saveOrder(rerankListCards(allItems, next, { by: 'rank', how: 'asc' }));
  }
  function resetOrder() {
    if (!allItems || ownerBusy || transferBusy) return;
    const keys = ownerCards.map((item) => item.key);
  void saveOrder(
    [...ownerCards, ...allItems.filter((item) => !keys.includes(item.key))].map((item, i) => ({
      ...item,
      rank: i + 1,
    })),
  );
  }
  async function removeItems(items: readonly ListItemCard[]) {
    if (!owner || !ownerKind || !allItems || ownerBusy || !items.length) return;
    const source = data;
    const before = allItems;
    const beforeRemoved = removedKeys;
    const keys = items.map((item) => item.key);
    allItems = allItems.filter((item) => !keys.includes(item.key)).map((item, i) => ({ ...item, rank: i + 1 }));
    removedKeys = [...removedKeys, ...keys];
    ownerBusy = true;
    const ok = await removeOwnerItems({ kind: ownerKind, items, overlay, request, notify: toast });
    if (source !== data) return;
    if (!ok) {
      allItems = before;
      removedKeys = beforeRemoved;
    } else toast.success(`Removed ${items.length} ${items.length === 1 ? 'item' : 'items'}.`);
    ownerBusy = false;
  }
  function editNotes(item: ListItemCard) {
    if (ownerBusy || transferBusy) return;
    notesItem = item;
    notesDraft = item.notes ?? '';
    notesOpen = true;
  }
  // Optimistic, put back if the write fails. Resolves whether it saved, or undefined when the page moved on.
  async function writeOwnerNotes(item: ListItemCard, notes: string) {
    if (!owner || !ownerKind || ownerBusy || transferBusy) return false;
    const source = data;
    const before = savedNotes;
    savedNotes = { ...savedNotes, [item.key]: notes.trim() };
    ownerBusy = true;
    const ok = await writeOwnerList({
      kind: ownerKind,
      change: { type: 'notes', id: item.key, notes },
      request,
    notify: toast,
    });
    if (source !== data) return undefined;
    if (!ok) savedNotes = before;
    ownerBusy = false;
    return ok;
  }
  async function saveOwnerNotes(notes: string) {
    if (!notesItem || !await writeOwnerNotes(notesItem, notes)) return;
    notesOpen = false;
    toast.success('Notes saved!');
  }
  function deleteNotes(item: ListItemCard) {
  if (owner) void writeOwnerNotes(item, '');
  else void manager.saveNote(item, '');
  }
  // The notes dialog's delete, for the item it's open on.
  function deleteOpenNotes(item: ListItemCard | null) {
    if (!item) return;
    notesOpen = false;
    noteOpen = false;
    deleteNotes(item);
  }
  function dragItem(item: ListItemCard, event: PointerEvent) {
    if (ownerBusy || event.button !== 0 || !(event.currentTarget instanceof HTMLElement)) return;
    event.preventDefault();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const end = (endEvent: PointerEvent) => {
      const target = document.elementFromPoint(endEvent.clientX, endEvent.clientY)?.closest('[data-list-item]');
      const key = Number(target?.getAttribute('data-list-item'));
      const row = allItems?.find((item) => item.key === key);
      cleanup();
      if (row) moveItem(item, row.rank);
    };
    const cancel = () => cleanup();
    const cleanup = () => {
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', cancel);
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    };
    handle.addEventListener('pointerup', end, { once: true });
    handle.addEventListener('pointercancel', cancel, { once: true });
  }

  // Manage mode. The watchlist and favorites get it with their own endpoints in.
  const canManage = $derived(Boolean(actions?.manage) && data.list?.kind === 'personal');
  let transferBusy = $state(false);
  const manager = createListManager(
  () =>
    data.list === null
      ? { list: null, cards: [], sort: { by: 'rank', how: 'asc' }, query: data.query }
      : { list: data.list, cards: pageCards, sort: data.sort, query: data.query },
  () => transferBusy,
  );
  $effect(() => {
    void data.list;
    untrack(manager.reset);
  });

  afterNavigate(({ shallow, type }) => {
    if (shallow && type === 'goto') return;

    manager.managing = false;
    ownerManaging = false;
  });
  const managing = $derived(owner ? ownerManaging : canManage && manager.managing);
  $effect(() => {
    const source = data;
    listStats = undefined;
    if (!source.list) return;
    void Promise.resolve(source.stats).then((stats) => {
      if (data === source) listStats = stats;
    }).catch(() => {
      if (data === source) listStats = null;
    });
  });
  // The items stat's count, which counts the filtered items: the total header doesn't apply the hide filters.
  const filteredCount = $derived(listStats?.count);
  // The owner's count is the loaded selection's; until it loads, the filtered count.
const manageCount = $derived(
  owner && selectedKeys ? ownerCards.length : filteredCount ?? (data.list ? data.total : 0),
);
  const displayCards = $derived(owner ? ownerCards : manager.cards);
  const writing = $derived((owner ? ownerBusy : manager.busy) || transferBusy);
  // OG dragged only a ranked list that fits one page, and offered "Change position" in the other sorts.
const draggable = $derived(
  data.list !== null && data.sort.by === 'rank' && !(owner && managing) && data.page.type === 'paginated' &&
    data.page.total === 1,
);
  const duration = $derived(prefersReducedMotion.current ? 0 : 300);
  const rankInputs: Record<number, RankInput> = $state({});

  // `m` toggles manage mode, except while typing or in a dialog.
  const shortcut = () => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'm' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (
      event.target instanceof Element &&
      event.target.closest('input, textarea, select, [contenteditable], dialog, [popover]:popover-open')
    ) {
        return;
      }
      if (owner) {
        event.preventDefault();
        void toggleManage();
        return;
      }
      if (!canManage) return;
      event.preventDefault();
      manager.managing = !manager.managing;
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  };

  const { track: trackSort } = useTrack(AnalyticsEvent.ListSort);

  let noteCard = $state<ListItemCard | null>(null);
  let noteOpen = $state(false);
  let noteDraft = $state('');
  let noteLimit = $state<string | null>(null);
  let noteSaving = $state(false);
  function openNotes(item: ListItemCard) {
    noteCard = item;
    noteDraft = item.notes ?? '';
    noteLimit = null;
    noteOpen = true;
  }
  async function saveNotes(text: string) {
    if (!noteCard || noteSaving) return;
    noteSaving = true;
    try {
      const result = await manager.saveNote(noteCard, text);
      if (result.saved) noteOpen = false;
      noteLimit = result.limit ?? null;
      if (noteLimit !== null && !vip) useTrack(AnalyticsEvent.VipGate).track({ feature: 'notes' });
    } finally {
      noteSaving = false;
    }
  }
</script>

<!--
  A list page under the profile frame: the subnav with the type and genre dropdowns, the sort
  and its direction, the title row with the list's pills and the viewer's icons (in manage mode, the whole-selection
  actions), the description band, then the ranked
  poster grid between two paginations. The stats bar sits before the sort; the filter icons follow it. Watchlist, favorites and official lists render here too.
-->
<!-- Filter and item URLs point at og pages by their OG paths, which resolve() only takes once they exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#if data.list}
  <SeoHead
    {...toListSeo({
      name: data.kind === 'personal' || data.kind === 'official' ? data.list.name : pageTitle,
      owner: data.kind === 'personal' ? data.profile.displayName : undefined,
      description: data.list.description,
      path: data.list.href,
      itemCount: data.list.itemCount,
      image: listPreviewArt(data.cards.at(0)),
      items: indexed && data.query.page === 1 ? data.cards.map(({ href }) => href) : undefined,
    })}
    noindex={!indexed}
  />
{/if}

{#if editing && data.kind === 'personal' && data.list}<ListEditor id={data.list.id} posters={listPosters}
  count={data.list.itemCount}
  onsaved={(slug) => goto(resolve('/users/[id]/lists/[list]', { id: data.list?.ownerSlug ?? data.profile.slug, list: slug }))}
  onclose={() => { editing = false; }} />{/if}

{#if data.list}
  {@const list = data.list}

  {#snippet action(label: string, svg: string, kind: string, text?: string, onclick?: () => void)}
    <Tooltip text={label}>
      {#snippet trigger(tooltip)}
        <button
          type="button"
          class={[
            'action',
            kind,
            { active: kind === 'manage' && ownerManaging }
          ]}
          aria-label={text ? undefined : label}
          aria-disabled={!onclick || ownerBusy}
          aria-pressed={kind === 'manage' && onclick ? ownerManaging : undefined}
          onclick={() => {
            if (!ownerBusy) onclick?.();
          }}
          {...tooltip}
        >
          <Icon svg={svg} />

          {#if text}
            <span class="action-text">{text}</span>
          {/if}
        </button>
      {/snippet}
    </Tooltip>
  {/snippet}


  <ReportDialog bind:open={reportOpen} target={{ type: 'list', id: list.id, title: list.name, href: list.href,
    ownerSlug: list.kind === 'personal' ? list.ownerSlug : undefined, posters: listPosters }} />
  {#if data.kind === 'official'}
    <OfficialListHeader image={data.listCover} />
  {/if}

  <SectionToolbar
    statsChip={{
      svg: file,
      value: itemTotal.toLocaleString('en-US'),
      label: 'Items'
    }}
  >
    {#snippet filters()}
      <Dropdown section="Media">
        {#snippet trigger()}{typeLabel}{/snippet}
        <ul>
          <li><a href={listHref(page.url, { types: [] })}
            aria-current={data.query.types.length === 0 ? 'page' : undefined}>All</a></li>
          {#each typeOptions as option (option.type)}
            <li><a href={listHref(page.url, { types: [option.type] })}
              aria-current={data.query.types.includes(option.type) ? 'page' : undefined}>{option.label}</a></li>
          {/each}
        </ul>
      </Dropdown>
      <Dropdown section="Genre">
        {#snippet trigger()}{genreLabel}{/snippet}
        <ul class="limit-10">
          <li><a href={listHref(page.url, { genres: [] })}
            aria-current={data.query.genres.length === 0 ? 'page' : undefined}>All Genres</a></li>
          {#each listGenreOptions as option (option.slug)}
            <li><a href={listHref(page.url, { genres: [option.slug] })}
              aria-current={data.query.genres.includes(option.slug) ? 'page' : undefined}>{option.label}</a></li>
          {/each}
        </ul>
      </Dropdown>
    {/snippet}
    {#snippet stats()}
      <ListStats
        itemCount={itemTotal}
        stats={data.stats}
        progress={data.user !== null}
        likeTarget={{ id: list.id, ownerSlug: list.kind === 'personal' ? list.ownerSlug : undefined, viewer: data.user?.slug ?? null }}
        likeCount={list.kind === 'watchlist' || list.kind === 'favorites' ? undefined : list.likeCount}
        comments={list.allowComments ? { count: list.commentCount, href: `${list.href}/comments` } : undefined}
      />
    {/snippet}
    {#snippet summary()}
      <span class="sort">
        <Dropdown joined section="Sort">
          {#snippet trigger()}
            <SortLabel sort={sorts.find(({ by }) => by === data.sort.by)} />
          {/snippet}

          <SortMenu
            sorts={sorts}
            current={data.sort.by}
            href={(sort) => listHref(page.url, { sort: { by: sort.by, how: listSortHow(sort.by) } })}
            onpick={(sort) => trackSort({ sortBy: sort.by, sortHow: listSortHow(sort.by) })} />
        </Dropdown>
        <!-- Flipped is away from the sort's own direction; Random has none. -->
        <SortDirection joined descending={listSortHow(data.sort.by) === 'desc'} disabled={data.sort.by === 'random'}
          bind:flipped={
            () => data.sort.how !== listSortHow(data.sort.by),
            (next) => {
              const how = reverseHow(data.sort.by, next);
              trackSort({ sortBy: data.sort.by, sortHow: how });
              void goto(listHref(page.url, { sort: { by: data.sort.by, how } }));
            }
          } />
      </span>
      <span class="filter-icons">
        <TermsFilter
          bind:terms={() => data.query.terms ?? '', (terms) => goto(listHref(page.url, { terms }))}
        />

        <WatchNowFilter
          value={data.query.watchnow}
          country={country}
          favorites={favoriteKeys}
        />

        <FadeHideMenu
          value={fadeHide}
          options={filterOptions.fade}
          hideOptions={filterOptions.hide}
          cookie={filterCookie}
          onchange={(next) => {
            const changed = next.hide.join(',') !== fadeHide.hide.join(',');
            fadeHide = next;
            const url = new URL(page.url.href);
            url.searchParams.set('fade', next.fade.join(','));
            void goto(url, { shallow: true, replace: true, state: page.state });
            if (changed) void goto(listHref(page.url, { hide: next.hide }));
          }} />
      </span>
    {/snippet}
  </SectionToolbar>

  {#snippet titleTags()}
    {#if relation}
      <span class="tag"><ListTag relation={relation} /></span>
    {/if}

    {#each list.pills as pill (pill)}
      <span class="tag"><ListTag tag={pill} /></span>
    {/each}

    {#if list.shareLink}
      <span class="tag"><ListTag tag="Link" /></span>
    {/if}

    {#if collaborators.length > 0}
      <span class="title-chip">
        <CollaboratorsChip
          collaborators={collaborators}
          list={{ name: list.name, poster: data.cards.at(0)?.image }}
          owner={listOwner}
        />
      </span>
    {/if}
  {/snippet}

  <ListTitleRow
    id="list-title"
    name={list.name}
    href={list.href}
    managing={managing}
    ruled={description.length === 0}
    tags={titleTags}
    actions={actions ? titleActions : undefined}
  />

  {#snippet titleActions()}
          <!-- Managing, the whole-selection actions take the icons' place, and Manage, last so it stays put, reads Done. -->
          {#if actions}
            {#if managing}
              <ListManageBar count={manageCount} busy={writing}
                onreset={owner ? resetOrder : manager.resetRanks}
                ondelete={owner ? () => void removeItems(ownerCards) : manager.deleteAll}>
                {#snippet transfers()}
                  <ListTransfer source={list} query={data.query} sort={data.sort} count={manageCount} svg={clone} busy={writing} onbusychange={(busy) => transferBusy = busy} />
                  <ListTransfer source={list} query={data.query} sort={data.sort} count={manageCount} svg={fileExport} busy={writing} onbusychange={(busy) => transferBusy = busy} move />
                {/snippet}
              </ListManageBar>
            {:else}
            {#if actions.report}{@render action('Report List', flag, 'report', undefined, () => { reportOpen = true; })}{/if}
            {#if actions.edit && data.kind !== 'personal'}{@render action('Edit', pencil, 'edit', undefined, owner ? editBuiltIn : undefined)}{:else if actions.edit}<Tooltip text="Edit">{#snippet trigger(tooltip)}<button type="button" class="action edit" aria-label="Edit" {...tooltip} onclick={() => { editing = true; }}><Icon svg={pencil} /></button>{/snippet}</Tooltip>{/if}
            {#if actions.delete}<span class="delete" style:--confirm-icon-size="var(--font-size-list-row-action)"><ManageConfirm name="delete" svg={deleteIcon} label="Delete" yes="Yes, delete it!" warning={deleteWarning} disabled={deleting} onconfirm={removeList}>Delete this list?</ManageConfirm></span>{/if}
            <span class="share"><ShareButton url={actions.shareUrl} title={list.name} large={false}
              tracking={{ source: 'user-list' }} /></span>
            {#if actions.leave}{@render action('Stop collaborating on this list', userXmark, 'leave', 'Leave', leave)}{/if}
            {/if}
            {#if actions.progressHref && !managing}
              <Tooltip text="View watched progress">
                {#snippet trigger(tooltip)}
                  <a class="action progress" href={actions.progressHref} {...externalLink(actions.progressHref)} {...tooltip}><Icon svg={barsProgress} /><span
                      class="action-text"
                    >Progress</span></a>
                {/snippet}
              </Tooltip>
            {/if}
            {#if actions.manage && canManage}
              <Tooltip text={managing ? 'Stop managing' : 'Reorder, copy, move and delete'}>
                {#snippet trigger(tooltip)}
                  <button type="button" class={['action', 'manage', { active: managing }]} aria-pressed={managing}
                    aria-keyshortcuts="m" {...tooltip} onclick={() => manager.managing = !manager.managing}><Icon
                      svg={managing ? check : move}
                    /><span class="action-text">{managing ? 'Done' : 'Manage'}</span></button>
                {/snippet}
              </Tooltip>
            {:else if actions.manage}
              {@render action(ownerManaging ? 'Stop managing' : 'Reorder, copy, move and delete', ownerManaging ? check : move, 'manage',
                ownerManaging ? 'Done' : 'Manage', owner ? toggleManage : undefined)}
            {/if}
          {/if}
  {/snippet}

  {#if smartDraft && list.staleOrigin}
    <Container>
      <ListNotice action="Make it a smart list" busy={converting} onaction={convertList}>
        Synced from <strong>{list.staleOrigin.name}</strong>, which no longer updates Trakt lists. As a smart list it
        keeps {Math.round(smartDraft.confidence * 100)}% of its titles today and adds new ones that match on its own.
      </ListNotice>
    </Container>
  {/if}

  <WatchNowChips tiles={tiles} />

  {#if description.length > 0}
    <section class="description" aria-label="About this list">
  <Container>
    <div class="description-text">
      <ReadMore>
        <CommentText blocks={description} />
      </ReadMore>
    </div>
  </Container>
</section>
  {/if}

  <section class={['items', { managing }]} aria-label="{list.name} items" aria-busy={writing || !browserSortReady} {@attach shortcut}
    {@attach trackDrilldowns({ source: itemsSource })}>
  <Container>
      {#if !browserSortReady}
        <CardShimmerRow columns={6} ratio="poster" />
      {:else if displayCards.length > 0}
        {#if !(owner && managing) && data.page.type === 'paginated'}<Pagination meta={data.page} label="List pages" />{/if}
        <div class="grid" {@attach manager.dragEvents}>
          <PosterGrid>
            {#each displayCards as item (item.key)}
              <div
                data-list-item={item.key}
                class={{
                  dragging: manager.dragging?.key === item.key,
                  'drop-target': manager.dragging && manager.dropRank === item.rank
                }}
                animate:flip={{ duration }}
              >
                <ListItemPoster
                  item={item}
                  sortBy={data.sort.by}
                  rank={list.displayNumbers && !managing ? item.rank : undefined}
                  removing={() => removingFromOwner
                    ? removedKeys.includes(item.key)
                    : manager.isRemoved(item.key)}
                  datePreferences={data.datePreferences}
                  edit={managing ? edit : undefined}
                  fade={fadeHide.fade}
                  oneditnotes={owner || canManage
                    ? (card) => owner ? editNotes(card) : openNotes(card)
                    : undefined}
                  ondeletenotes={owner || canManage ? deleteNotes : undefined}
                />
              </div>
            {/each}
          </PosterGrid>
        </div>
        {#snippet edit(item: ListItemCard)}
          <RankInput bind:this={rankInputs[item.key]} name={item.title} rank={item.rank} busy={writing}
            onmove={(rank) => owner ? moveItem(item, rank) : manager.move(item, rank)} />
          <ListItemEdit name={item.title} rank={item.rank} total={owner && allItems ? allItems.length : data.total} notes={Boolean(item.notes)} draggable={owner ? data.sort.by === 'rank' : draggable}
            changeRank={data.sort.by !== 'rank'} busy={writing} onmove={(rank) => owner ? moveItem(item, rank) : manager.move(item, rank)}
            ondrag={(event) => owner ? dragItem(item, event) : manager.startDrag(item, event)} onchangerank={() => rankInputs[item.key]?.focus()}
            onremove={() => owner ? void removeItems([item]) : manager.remove(item)} onnotes={() => owner ? editNotes(item) : openNotes(item)} />
        {/snippet}
        {#if !(owner && managing) && data.page.type === 'paginated'}<Pagination meta={data.page} label="List pages" />{/if}
      {:else}
        <div class="empty">
          {#if data.hideFailed}
            <LoadFailed what="This list with these filters" action={{ onclick: clearHide, text: 'Clear filters' }} />
          {:else if filtered}
            <EmptyState action={{ href: clearedHref, text: 'Clear filters' }} />
          {:else}
            <EmptyState action={ownList ? { href: resolve('/shows/[chart=chart]/[[period]]', { chart: 'trending' }), text: 'Find a show' } : undefined} />
          {/if}
        </div>
      {/if}
    </Container>
</section>

  {#if ownerKind && owner}
    {#if editing}<BuiltInListEditor kind={ownerKind} posters={listPosters} count={data.list?.itemCount}
  privacy={data.list ? listPrivacy(data.list) : undefined} allowComments={data.list?.allowComments}
        displayNumbers={data.list?.displayNumbers}
        description={savedDescription}
        onclose={() => editing = false}
        onsaved={(saved) => {
          if (saved.description !== undefined) savedDescription = saved.description;
        }}
      />
    {/if}

    {#if notesItem}
      <NotesDialog bind:open={notesOpen} bind:draft={notesDraft} favorite={ownerKind === 'favorites'} busy={ownerBusy}
  tags={ownerKind === 'watchlist' && notesItem.noteTitle.show ? [{ text: notesItem.noteTitle.show, kind: 'generic' }] : []}
  privacy={data.list ? listPrivacy(data.list) : undefined} item={notesItem.noteTitle} onsave={saveOwnerNotes}
  ondelete={notesItem.notes ? () => deleteOpenNotes(notesItem) : undefined} />
    {/if}
  {/if}
  {#if !owner && noteCard}
    <NotesDialog bind:open={noteOpen} bind:draft={noteDraft} busy={noteSaving} disabled={noteLimit !== null}
  tags={noteCard.noteTitle.show ? [{ text: noteCard.noteTitle.show, kind: 'generic' }] : []}
  privacy={data.list ? listPrivacy(data.list) : undefined} item={noteCard.noteTitle} onsave={saveNotes}
  ondelete={noteCard.notes ? () => deleteOpenNotes(noteCard) : undefined}>
      {#if noteLimit !== null}
        <p class="notes-limit" role="alert" {@attach trackUpsellImpression('lists')}>You've already added <strong>{noteLimit}</strong> notes.
          {#if !vip}Upgrade to <a href={traktUrls.vipFor('lists')} target="_blank" rel="noopener">VIP</a> to add unlimited notes.{/if}</p>
      {/if}
    </NotesDialog>
  {/if}
{/if}
<ShareArrival />

<style>
.filter-icons {
  display: flex;
  align-items: center;
  gap: var(--list-filter-icon-gap);
}

.sort {
  display: flex;
  align-items: center;
}

.limit-10 {
  max-block-size: var(--dropdown-limit-10-height);
  overflow-y: auto;
}

  /* The list row's description text: its size, its softer color and its unboxed quotes. */
  .description {
    --read-more-shade: var(--color-subnav-text-bg);
    --comment-quote-bg: transparent;
    background-color: var(--color-subnav-text-bg);
    color: var(--color-list-card-description);
    font-size: var(--font-size-base);
  }

  .description-text {
    padding-block: var(--list-description-padding);
  }

  .items {
    display: flow-root;
    padding-block-end: var(--space-panel);

    /* The top pagination spacing and.pagination-bottom. */
    & :global(nav) {
      margin-block: var(--line-height-computed) 0;
    }
  }

.empty {
  padding-block-start: var(--line-height-computed);
}

  /* #sortable-grid.sortable: the quick icons dim while the edit icons are up. */
  .managing :global(.quick-icons > *) {
    opacity: var(--opacity-list-manage-quick-icons);
  }

  .dragging {
    opacity: var(--list-reorder-drag-opacity);
  }

  .drop-target {
    outline: var(--list-reorder-rank-border) solid var(--brand-primary);
  }

  /* With no pagination above them, the first posters sit 30px under the band. */
  .grid:first-child {
    padding-block-start: var(--list-grid-offset);
  }

  .grid [data-list-item] {
    scroll-margin-block-start: calc(var(--header-height) + var(--list-reorder-scroll-offset));
  }

  .notes-limit {
    margin: 0 0 var(--gutter);
    text-align: center;
  }

</style>
