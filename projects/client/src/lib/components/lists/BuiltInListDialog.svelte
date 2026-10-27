<!--
  Edits the owner's watchlist or favorites from their list page: the list editor's art header (its first posters,
  a Watchlist or Favorites tag and the count), then the description, the privacy, comments and rank numbers Trakt sets
  (shown, not picked), and the default sort, then Cancel and Save.
  The API can't read the description back, so the field starts empty unless the page knows it, and an untouched field
  keeps the saved one.
-->
<script lang="ts">
import Dialog from '$lib/components/dialog/Dialog.svelte';
import DialogArtHeader from '$lib/components/dialog/DialogArtHeader.svelte';
import DialogForm from '$lib/components/dialog/DialogForm.svelte';
import FieldLabel from '$lib/components/dialog/FieldLabel.svelte';
import ListSettingsRow from '$lib/components/lists/ListSettingsRow.svelte';
import ListSortField from '$lib/components/lists/ListSortField.svelte';
import type { CardTag } from '$lib/components/media/CardTag';

interface Props {
  open: boolean;
  kind: 'watchlist' | 'favorites';
  busy: boolean;
  description: string | undefined;
  sortBy: string;
  sortHow: string;
  /** The list's first posters, for the header. */
  posters?: readonly string[];
  /** Items on the list, as a tag in the header. */
  count?: number;
  /** What Trakt sets and the API can't change: the profile's privacy, comments off, rank numbers on favorites only. */
  privacy?: string;
  allowComments?: boolean;
  displayNumbers?: boolean;
  onsave: (draft: { description?: string; sort_by: string; sort_how: string }) => void;
  onclose?: () => void;
}
let {
  open = $bindable(),
  kind,
  busy,
  description,
  sortBy,
  sortHow,
  posters = [],
  count,
  privacy = 'public',
  allowComments = false,
  displayNumbers = kind === 'favorites',
  onsave,
  onclose,
}: Props = $props();
const id = $props.id();
let text = $state('');
let touched = $state(false);
let by = $state('rank');
let how = $state('asc');
$effect(() => {
  if (open) {
    text = description ?? '';
    touched = false;
    by = sortBy;
    how = sortHow;
  }
});
const heading = $derived(kind === 'favorites' ? 'Update Favorites' : 'Update Watchlist');
const tags = $derived<readonly CardTag[]>([
  kind === 'favorites' ? { text: 'Favorites', kind: 'favorite' } : { text: 'Watchlist', kind: 'list' },
  ...(count !== undefined
    ? [{ text: `${count.toLocaleString('en-US')} ${count === 1 ? 'item' : 'items'}`, kind: 'generic' } as const]
    : []),
]);
</script>

<Dialog bind:open title={heading} size="md" variant="art" {onclose}>
  {#snippet header(titleId)}<DialogArtHeader id={titleId} title={heading} {posters} {tags} />{/snippet}
  <DialogForm save={busy ? 'Saving…' : 'Save List'} {busy}
    onsubmit={() => onsave({ ...(touched && { description: text }), sort_by: by, sort_how: how })}
    oncancel={() => (open = false)}>
    <div>
      <FieldLabel text="Description" for="{id}-description" />
      <textarea id="{id}-description" rows="3" bind:value={text} oninput={() => (touched = true)} disabled={busy}></textarea>
    </div>
    <ListSettingsRow readonly {privacy} {allowComments} {displayNumbers} />
    <ListSortField bind:by bind:how disabled={busy} />
  </DialogForm>
</Dialog>
