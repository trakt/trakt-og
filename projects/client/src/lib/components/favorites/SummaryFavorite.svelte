<!--
  The favorites button in a summary's action stack. Adding is one click; removing asks first
  (`FavoriteRemovePrompt`, under the button and its tile). Favorited, the button's tooltip is its note, off its left
  side, and the note tile beside it adds or edits the note in the notes dialog, which deletes it too.
    <SummaryFavorite target={favoriteTarget} color="var(--brand-seventh)" icon={star} label="Add to favorites" />
-->
<script lang="ts">
import FavoriteNoteTip from '$lib/components/favorites/FavoriteNoteTip.svelte';
import FavoriteRemovePrompt from '$lib/components/favorites/FavoriteRemovePrompt.svelte';
import MediaFavorite from '$lib/components/favorites/MediaFavorite.svelte';
import SummaryAction from '$lib/components/summary/SummaryAction.svelte';
import SummaryActionTile from '$lib/components/summary/SummaryActionTile.svelte';
import type { FavoriteTarget } from '$lib/favorites/FavoriteTarget';
import memo from '$lib/icons/regular/memo.svg?raw';
import filledMemo from '$lib/icons/solid/memo.svg?raw';
import filledStar from '$lib/icons/solid/star.svg?raw';

interface Props {
  target: FavoriteTarget;
  color: string;
  /** Before it's added. */
  icon: string;
  label: string;
}

const { target, color, icon, label }: Props = $props();
const id = $props.id();
let button = $state<HTMLElement>();
let row = $state<HTMLDivElement>();
let popover = $state<HTMLDivElement>();
let asking = $state(false);
</script>

<MediaFavorite {target}>
  {#snippet trigger({ selected, date, busy, locked, toggle, notable, note, noteBusy, editNote })}
    {#snippet noteTip()}<FavoriteNoteTip note={note ?? ''} />{/snippet}
    {#snippet noteTile()}
      <SummaryActionTile icon={note ? filledMemo : memo} label={note ? 'Edit note' : 'Add note'} aria-haspopup="dialog"
        aria-busy={noteBusy} onclick={() => { if (!noteBusy) editNote(); }} />
    {/snippet}
    <div bind:this={row} class="summary-favorite">
      <SummaryAction bind:element={button} {color} icon={selected ? filledStar : icon}
        text={selected ? date ? 'Favorited on' : 'Favorited' : label} detail={selected ? date : undefined} {selected}
        busy={busy ? 'Saving favorite' : undefined} aria-pressed={selected}
        aria-label={selected ? 'Remove from favorites' : label} aria-haspopup={selected ? 'dialog' : undefined}
        aria-controls={selected ? `favorite-${id}` : undefined} aria-expanded={selected ? asking : undefined}
        aria-busy={busy} aria-disabled={busy || Boolean(locked)} locked={Boolean(locked)} tooltip={locked ?? (selected && note ? noteTip : undefined)}
        tooltipPlacement={locked ? 'right' : 'left'}
        onclick={() => (selected ? popover?.showPopover() : toggle())} tiles={selected && notable ? noteTile : undefined} />
    </div>
    <FavoriteRemovePrompt id="favorite-{id}" anchor={row} trigger={button} {note} onremove={toggle}
      bind:element={popover} bind:asking />
  {/snippet}
</MediaFavorite>
