<!--
  The notes dialog for an item's note: the item's fanart under dark glass with its card tags (Favorite, the item's
  type, then any `tags` a caller adds, like a list's show) over the title, then a 500-character note field with who
  can read it and a meter of the characters left, and Cancel and Save. Cmd/Ctrl+Enter saves too. OG's privacy and
  spoiler toggles only showed for history, library and rating notes, which this doesn't take yet. Saving blank text
  deletes the note. `children` sits above the field, like the notes limit.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import CharacterMeter from '$lib/components/dialog/CharacterMeter.svelte';
import Dialog from '$lib/components/dialog/Dialog.svelte';
import DialogArtHeader from '$lib/components/dialog/DialogArtHeader.svelte';
import DialogForm from '$lib/components/dialog/DialogForm.svelte';
import FieldLabel from '$lib/components/dialog/FieldLabel.svelte';
import type { CardTag } from '$lib/components/media/CardTag';
import PrivacyTag from '$lib/components/notes/PrivacyTag.svelte';
import type { NotableItem } from '$lib/notes/NotableItem';
import type { Privacy } from '$lib/notes/Privacy';

interface Props {
  open: boolean;
  draft: string;
  /** Left without a type, there's no type tag. */
  item: Pick<NotableItem, 'title' | 'year' | 'fanart'> & { readonly type?: NotableItem['type'] };
  onsave: (text: string) => void;
  /** A favorite's note: a Favorite tag, and the favorites prompt in the empty field. */
  favorite?: boolean;
  /** Tags after the item's own: a list item's show, "Dropped". */
  tags?: readonly CardTag[];
  /** Who can read the note, where the caller knows: private notes, or a list's privacy for its items. */
  privacy?: Privacy;
  busy?: boolean;
  /** Save is off, as over the account's notes limit. */
  disabled?: boolean;
  children?: Snippet;
}

let {
  open = $bindable(),
  draft = $bindable(),
  item,
  onsave,
  favorite = false,
  tags = [],
  privacy,
  busy = false,
  disabled = false,
  children,
}: Props = $props();

// OG's TRAKT_NOTES_MAX_LENGTH.
const MAX_LENGTH = 500;
const TYPES: Readonly<Record<NotableItem['type'], string>> = {
  movie: 'Movie',
  show: 'Show',
  season: 'Season',
  episode: 'Episode',
  person: 'Person',
};
const id = $props.id();
const headerTags = $derived<readonly CardTag[]>([
  ...(favorite ? [{ text: 'Favorite', kind: 'favorite' } as const] : []),
  ...(item.type ? [{ text: TYPES[item.type], color: 'var(--color-dialog-art-media-tag)' }] : []),
  ...tags,
]);

// Reads `open`, so each opening puts the caret after the existing note, like OG.
const caretToEnd = (textarea: HTMLTextAreaElement) => {
  if (open) textarea.setSelectionRange(textarea.value.length, textarea.value.length);
};
</script>

<Dialog bind:open title="Notes on {item.title}" size="notes" variant="art">
  {#snippet header(titleId)}
    <DialogArtHeader id={titleId} title={item.title} year={item.year} fanart={item.fanart} tags={headerTags} />
  {/snippet}

  <DialogForm save={busy ? 'Saving...' : 'Save Note'} {busy} {disabled} onsubmit={() => onsave(draft)}
    oncancel={() => (open = false)}>
    {@render children?.()}
    <div>
      <FieldLabel text="Note" for="{id}-note">{#snippet aside()}{#if privacy}<PrivacyTag {privacy} />{/if}{/snippet}</FieldLabel>
      <textarea
        id="{id}-note"
        bind:value={draft}
        placeholder={favorite ? 'Why is this one of your all time favorites?' : 'Add notes...'}
        rows="5"
        maxlength={MAX_LENGTH}
        {@attach caretToEnd}
      ></textarea>
      <CharacterMeter length={draft.length} max={MAX_LENGTH} />
    </div>
  </DialogForm>
</Dialog>
