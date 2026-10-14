<!--
  The list editor: adds a list or edits one (or the watchlist or favorites, without a name, privacy or collaborators).
  An art header shows the list's first posters (a striped placeholder for a new list) under dark glass, with card
  tags over the title; then name, description, a row of privacy, comments and rank numbers (read only for the
  watchlist and favorites), the default sort with its direction, and collaborators; then Cancel and Save. Over the lists limit, Save is off and a notice says why.
-->
<script lang="ts">
import Dialog from '$lib/components/dialog/Dialog.svelte';
import DialogArtHeader from '$lib/components/dialog/DialogArtHeader.svelte';
import DialogForm from '$lib/components/dialog/DialogForm.svelte';
import FieldLabel from '$lib/components/dialog/FieldLabel.svelte';
import MultiSelect from '$lib/components/filters/MultiSelect.svelte';
import type { ListDraft } from '$lib/components/lists/ListDraft';
import ListSettingsRow from '$lib/components/lists/ListSettingsRow.svelte';
import ListSortField from '$lib/components/lists/ListSortField.svelte';
import type { CardTag } from '$lib/components/media/CardTag';
import { traktUrls } from '$lib/traktUrls';

interface Props {
  open: boolean;
  busy?: boolean;
  error?: string;
  max?: number;
  vip?: boolean;
  following: readonly { slug: string; name: string; avatar?: string }[];
  initial?: ListDraft;
  kind?: 'list' | 'watchlist' | 'favorites';
  editing?: boolean;
  title?: string;
  /** The list's first posters, for the header. A new list gets the striped placeholder. */
  posters?: readonly string[];
  /** Items on the list, as a tag in the header. */
  count?: number;
  /** A list saved as Link: its private URL, for the Copy share link button. */
  shareLink?: string;
  fieldErrors?: Readonly<Record<string, readonly string[]>>;
  followingError?: boolean;
  onsave: (draft: ListDraft) => void;
  onclose?: () => void;
}
let {
  open = $bindable(),
  busy = false,
  error = '',
  max,
  vip = false,
  following,
  followingError = false,
  onsave,
  onclose,
  initial,
  kind = 'list',
  editing = false,
  title,
  posters = [],
  count,
  shareLink,
  fieldErrors = {},
}: Props = $props();
const id = $props.id();
// svelte-ignore state_referenced_locally
let draft = $state<ListDraft>(
  initial ? { ...initial, collaborators: [...initial.collaborators] } : {
    name: '',
    description: '',
    privacy: 'private',
    allow_comments: true,
    display_numbers: false,
    sort_by: 'rank',
    sort_how: 'asc',
    collaborators: [],
  },
);
const UPDATE_TITLES = { list: 'Update List', watchlist: 'Update Watchlist', favorites: 'Update Favorites' } as const;
const heading = $derived(title ?? (editing ? UPDATE_TITLES[kind] : 'Add a list'));
const headerTags = $derived<readonly CardTag[]>([
  ...(kind === 'favorites' ? [{ text: 'Favorites', kind: 'favorite' } as const] : []),
  ...(kind === 'watchlist' ? [{ text: 'Watchlist', kind: 'list' } as const] : []),
  ...(kind === 'list' && !editing ? [{ text: 'New list', kind: 'generic' } as const] : []),
  ...(count !== undefined
    ? [{ text: `${count.toLocaleString('en-US')} ${count === 1 ? 'item' : 'items'}`, kind: 'generic' } as const]
    : []),
]);
const options = $derived([{
  options: following.map((user) => ({ value: user.slug, label: user.name, avatar: user.avatar })),
}]);
</script>

<!-- VIP destination is an external Trakt account page. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Dialog bind:open title={heading} size="md" variant="art" {onclose}>
  {#snippet header(titleId)}<DialogArtHeader id={titleId} title={heading} {posters} tags={headerTags} />{/snippet}
  <DialogForm save={busy ? 'Saving…' : 'Save List'} {busy} disabled={max !== undefined || (kind === 'list' && !draft.name.trim())}
    onsubmit={() => onsave(draft)} oncancel={() => (open = false)}>
    {#if max !== undefined}
      <p class="limit" role="alert">You've already created <strong>{max}</strong> lists.
        {#if !vip}<a href={traktUrls.vip} target="_blank" rel="noopener">Upgrade to VIP</a> to create unlimited lists.{/if}
      </p>
    {/if}
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    {#if kind === 'list'}
      <div>
        <FieldLabel text="Name" for="{id}-name" />
        <input id="{id}-name" {@attach (input) => { if (fieldErrors.name?.length) input.focus(); }} aria-invalid={Boolean(fieldErrors.name)}
          required maxlength="255" bind:value={draft.name} disabled={busy} />
        {#if fieldErrors.name}<p class="error" role="alert">{fieldErrors.name.join(' ')}</p>{/if}
      </div>
    {/if}
    {#each Object.entries(fieldErrors).filter(([field]) => field !== 'name' && field !== 'collaborators') as [field, errors] (field)}<p class="error" role="alert">{field}: {errors.join(' ')}</p>{/each}
    <div>
      <FieldLabel text="Description" for="{id}-description" />
      <textarea id="{id}-description" aria-invalid={Boolean(fieldErrors.description)} rows="3" bind:value={draft.description}
        disabled={busy}></textarea>
    </div>
    <ListSettingsRow bind:privacy={draft.privacy} bind:allowComments={draft.allow_comments}
      bind:displayNumbers={draft.display_numbers} readonly={kind !== 'list'} {shareLink} disabled={busy} />
    <ListSortField bind:by={draft.sort_by} bind:how={draft.sort_how} {vip} disabled={busy} />
    {#if kind === 'list'}
      <div class="collaborators">
        <FieldLabel text="Collaborators" id="{id}-collaborators" />
        <MultiSelect variant="list" bind:value={draft.collaborators} {options} label="Collaborators" placeholder="Search people you follow..."
          disabled={busy || followingError} />
        {#if followingError}<p class="error" role="status">Couldn't load collaborators. Close and reopen to retry.</p>{/if}
        {#if fieldErrors.collaborators}<p class="error" role="alert">{fieldErrors.collaborators.join(' ')}</p>{/if}
      </div>
    {/if}
  </DialogForm>
</Dialog>

<style>
.collaborators :global(.multi-select) {
  display: block;
  inline-size: 100%;
}

.limit {
  margin: 0;
  padding: var(--dialog-art-alert-padding);
  border: 1px solid var(--color-dialog-art-alert-border);
  border-radius: var(--radius-control);
  background-color: var(--color-dialog-art-alert-bg);
  color: var(--color-dialog-art-alert-text);
  font-size: var(--font-size-small);
  line-height: var(--line-height-base);

  & a {
    color: inherit;
    font-weight: var(--font-weight-headings-heavy);
    text-decoration: underline;
  }
}

.error {
  margin: var(--dialog-art-label-gap) 0 0;
  color: var(--brand-danger);
  font-size: var(--font-size-small);
}
</style>
