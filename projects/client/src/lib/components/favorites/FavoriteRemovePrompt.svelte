<!--
  The red prompt that asks before a favorite comes off, under `anchor`, with an amber notice when its note would go
  too. The caller opens it with `showPopover()` on the bound `element`; it moves focus into its choices, and back to
  `trigger` (or `anchor`) when it shuts. `asking` follows it, for the trigger's `aria-expanded`.
    <FavoriteRemovePrompt id="favorite-{id}" anchor={button} {note} bind:element={prompt} onremove={toggle} />
-->
<script lang="ts">
import PromptPopover from '#lib/components/prompt/PromptPopover.svelte';
import PromptRow from '#lib/components/prompt/PromptRow.svelte';
import { anchorNames } from '#lib/components/tooltip/anchorNames.ts';
import deleteIcon from '#lib/icons/regular/trash-xmark.svg?raw';
import xmark from '#lib/icons/regular/xmark.svg?raw';

interface Props {
  id: string;
  anchor?: HTMLElement;
  trigger?: HTMLElement;
  note?: string;
  onremove: () => void;
  element?: HTMLDivElement;
  asking?: boolean;
}

let { id, anchor, trigger, note, onremove, element = $bindable(), asking = $bindable(false) }: Props = $props();
const name = $derived(`--${id}`);

// Beside the anchor's other names, like a tooltip's.
$effect(() => {
  if (!anchor) return;
  const node = anchor;
  const added = name;
  node.style.setProperty('anchor-name', anchorNames(node.style.getPropertyValue('anchor-name'), { add: added }));
  return () => {
    const rest = anchorNames(node.style.getPropertyValue('anchor-name'), { remove: added });
    if (rest) node.style.setProperty('anchor-name', rest);
    else node.style.removeProperty('anchor-name');
  };
});

function toggled(event: ToggleEvent) {
  asking = event.newState === 'open';
  const back = trigger ?? anchor;
  if (asking) element?.querySelector<HTMLElement>('.body button')?.focus();
  else if (back?.isConnected) back.focus({ preventScroll: true });
}

function remove() {
  element?.hidePopover();
  onremove();
}
</script>

{#snippet noteNotice()}Your note on this favorite will be <strong>deleted</strong> too.{/snippet}
<PromptPopover {id} anchor={name} title="Remove from favorites?" tone="danger" notice={note ? noteNotice : undefined}
  bind:element ontoggle={toggled}>
  <PromptRow svg={deleteIcon} danger onclick={remove}>Yes, remove it!</PromptRow>
  <PromptRow svg={xmark} onclick={() => element?.hidePopover()}>Keep it</PromptRow>
</PromptPopover>
