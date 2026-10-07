<!--
  A card manage icon that asks first, in the shared prompt under it (`PromptPopover`, red): delete, block member,
  and a list's Reset Ranks and Delete, which label the icon with `text` and can add a `warning`. A short warning
  sits on the yes row as its detail; a longer one gets its own line above the choices.
    <ManageConfirm name="delete" svg={deleteIcon} label="Delete" yes="Yes, delete it!" onconfirm={remove}>
      Delete your comment?
    </ManageConfirm>
-->
<script lang="ts">
import type { ComponentProps, Snippet } from 'svelte';
import PromptPopover from '$lib/components/prompt/PromptPopover.svelte';
import PromptRow from '$lib/components/prompt/PromptRow.svelte';
import Icon from '$lib/icons/Icon.svelte';
import xmark from '$lib/icons/regular/xmark.svg?raw';
import Tooltip from '../tooltip/Tooltip.svelte';

interface Props {
  /** The class the card styles it by. */
  name: string;
  svg: string;
  /** The tooltip and accessible name. */
  label: string;
  yes: string;
  onconfirm: () => void;
  /** A visible label after the icon. */
  text?: string;
  /** A line between the question and the choices, like "This can't be undone!". */
  warning?: string;
  busy?: boolean;
  /** The question. */
  children: Snippet;
  disabled?: boolean;
  /** Where the tooltip shows. */
  placement?: ComponentProps<typeof Tooltip>['placement'];
}

const { name, svg, label, yes, onconfirm, text, warning, busy = false, disabled = false, placement, children }: Props =
  $props();

const id = $props.id();
let popover = $state<HTMLDivElement>();
let button = $state<HTMLButtonElement>();
let expanded = $state(false);
// "This can't be undone!" fits beside the yes; the list limit warning doesn't.
const SHORT_WARNING = 32;
const shortWarning = $derived(warning && warning.length <= SHORT_WARNING ? warning : undefined);

function toggle(event: ToggleEvent) {
  expanded = event.newState === 'open';
  if (expanded) popover?.querySelector<HTMLElement>('.body button')?.focus();
  else if (button?.isConnected) button.focus({ preventScroll: true });
}

function confirm() {
  popover?.hidePopover();
  onconfirm();
}
</script>

<span class="confirm {name}" style:anchor-name="--confirm-{id}">
  <Tooltip text={label} {placement}>
    {#snippet trigger(tooltip)}
      <button bind:this={button} type="button" aria-label={text ? undefined : label} aria-haspopup="dialog"
        aria-controls="confirm-{id}" aria-expanded={expanded} aria-disabled={busy || undefined} {disabled}
        onclick={() => { if (!busy) popover?.showPopover(); }} {...tooltip}>
        <Icon {svg} />{#if text}<span class="text">{text}</span>{/if}
      </button>
    {/snippet}
  </Tooltip>
  <PromptPopover id="confirm-{id}" anchor="--confirm-{id}" title={children} tone="danger"
    note={shortWarning ? undefined : warning} bind:element={popover} ontoggle={toggle}>
    <PromptRow {svg} danger detail={shortWarning} onclick={confirm}>{yes}</PromptRow>
    <PromptRow svg={xmark} onclick={() => popover?.hidePopover()}>No</PromptRow>
  </PromptPopover>
</span>

<style>
/* The card places it among its manage icons and sets its color. */
.confirm {
  display: inline-flex;
}

.confirm > button {
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font-size: var(--confirm-icon-size, var(--font-size-comment-icon));
  line-height: 1;
}
</style>
