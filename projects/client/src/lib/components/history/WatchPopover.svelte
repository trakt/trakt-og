<script lang="ts">
import { type Snippet, tick } from 'svelte';
import plus from '$lib/icons/light/circle-plus.svg?raw';
import disc from '$lib/icons/light/compact-disc.svg?raw';
import calendar from '$lib/icons/regular/calendar-lines.svg?raw';
import clock from '$lib/icons/regular/clock.svg?raw';
import play from '$lib/icons/regular/play.svg?raw';
import trash from '$lib/icons/regular/trash-can.svg?raw';
import xmark from '$lib/icons/regular/xmark.svg?raw';
import question from '$lib/icons/solid/question.svg?raw';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import PromptDateForm from '$lib/components/prompt/PromptDateForm.svelte';
import PromptPopover from '$lib/components/prompt/PromptPopover.svelte';
import PromptRow from '$lib/components/prompt/PromptRow.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import SummaryAction from '$lib/components/summary/SummaryAction.svelte';
import SummaryActionTile from '$lib/components/summary/SummaryActionTile.svelte';
import Spinner from '$lib/components/loading/Spinner.svelte';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import { watchDateInput } from '$lib/components/history/watchDateInput';
import { watchDateInstant } from '$lib/components/history/watchDateInstant';
import { formatDate } from '$lib/utils/formatDate';

type Mode = 'date' | 'remove' | 'partial';
/** What a summary button shows (`SummaryAction`'s icon, text, percent and detail). */
interface SummaryContent {
  icon: string;
  text: string;
  percent?: string;
  detail?: Snippet | string;
  aside?: Snippet;
  tooltip?: string;
}
interface Props {
  label: string;
  variant?: 'summary' | 'card';
  fill?: number;
  selected?: boolean;
  busy?: boolean;
  plural?: boolean;
  small?: boolean;
  datePreferences: DatePreferences;
  /** The poster icon's content. */
  trigger?: Snippet;
  summary?: SummaryContent;
  /** Summary only: a `SummaryActionMenu` under the +. */
  more?: Snippet;
  onopen: (force: boolean) => Promise<Mode | null>;
  onwatch: (at: string | null, force: boolean) => void;
  onremaining: () => Promise<boolean>;
  oninvalid: () => void;
  /** Cards only: a "Watching now" choice that opens the check-in modal. */
  oncheckin?: () => void;
  onremovePlay?: () => void;
  tooltip?: string;
  collection?: boolean;
  hasMetadata?: boolean;
  metadata?: Snippet<[() => void, boolean]>;
}
const {
  label,
  variant = 'card',
  fill = 0,
  selected = fill > 0,
  busy = false,
  plural = false,
  small = false,
  datePreferences,
  trigger: content,
  summary,
  more,
  onopen,
  onwatch,
  onremaining,
  oninvalid,
  oncheckin,
  onremovePlay,
  tooltip,
  collection = false,
  hasMetadata = false,
  metadata,
}: Props = $props();
const id = $props.id();
let button = $state<HTMLElement>();
let side = $state<HTMLButtonElement>();
let popover = $state<HTMLDivElement>();
let field = $state<HTMLInputElement>();
let expanded = $state(false);
let mode = $state<Mode>('date');
let editingMetadata = $state(false);
let savingMetadata = $state(false);
let force = $state(false);
let other = $state(false);
let value = $state('');
let maximum = $state('');
let returnTo = $state<HTMLElement>();
let press: ReturnType<typeof setTimeout> | undefined;
let pressed = false;
const title = $derived(
  editingMetadata
    ? 'Any optional metadata?'
    : mode === 'date'
    ? collection ? 'When did you add this to library?' : 'When did you watch this?'
    : mode === 'remove'
    ? collection ? 'Remove from library?' : 'Remove from history?'
    : 'What would you like to do?',
);
// Not added yet, the + always asks for a date, where the button itself may add right away with the default.
const addLabel = $derived(
  collection
    ? selected ? 'Add to library' : 'Pick a library date'
    : selected
    ? plural ? 'Add more plays' : 'Add another play'
    : 'Pick a watched date',
);
const instant = $derived(value ? watchDateInstant(value, datePreferences.timeZone) : null);

async function open(add: boolean) {
  if (busy) return;
  const next = await onopen(add);
  if (!next) return;
  mode = next;
  force = add;
  other = false;
  editingMetadata = false;
  savingMetadata = false;
  returnTo = add && side ? side : button;
  popover?.showPopover();
}
function toggle(event: ToggleEvent) {
  expanded = event.newState === 'open';
  if (expanded) firstChoice()?.focus();
  else returnTo?.focus({ preventScroll: true });
}
/** The prompt's first choice, past its close button. */
const firstChoice = () => popover?.querySelector<HTMLElement>('.body :is(button, select)');
function choose(at: string | null) {
  if (busy) return;
  popover?.hidePopover();
  onwatch(at, force);
}
function otherDate() {
  const now = new Date();
  maximum = watchDateInput(now, datePreferences.timeZone);
  value = watchDateInput(new Date(Math.floor(now.getTime() / 900_000) * 900_000), datePreferences.timeZone);
  other = true;
}
$effect(() => {
  if (other) field?.focus();
  if (editingMetadata) popover?.querySelector<HTMLSelectElement>('select')?.focus();
});
function submit(event: SubmitEvent) {
  event.preventDefault();
  if (!instant || value > maximum || !field?.validity.valid) {
    oninvalid();
    return;
  }
  choose(instant);
}
async function remaining() {
  if (await onremaining()) {
    popover?.hidePopover();
    return;
  }
  mode = 'date';
  force = false;
  await tick();
  firstChoice()?.focus();
}
function editMetadata(save: boolean) {
  savingMetadata = save;
  editingMetadata = true;
}
async function finishMetadata() {
  editingMetadata = false;
  if (savingMetadata) popover?.hidePopover();
  else {
    await tick();
    firstChoice()?.focus();
  }
}
function release() {
  clearTimeout(press);
}
function pointerdown(event: PointerEvent) {
  if (event.button !== 0) return;
  pressed = false;
  press = setTimeout(() => {
    pressed = true;
    void open(true);
  }, 500);
}
function click() {
  release();
  if (pressed) {
    pressed = false;
    return;
  }
  void open(false);
}
</script>

{#if variant === 'summary' && summary}
  <div class="watch-control summary" style:anchor-name="--watch-{id}" aria-busy={busy}>
  <SummaryAction bind:element={button} color={collection ? 'var(--brand-quaternary)' : 'var(--brand-tertiary)'}
    icon={summary.icon} text={summary.text} percent={summary.percent} detail={summary.detail} aside={summary.aside}
    tooltip={summary.tooltip}
    {selected}
    busy={busy ? collection ? 'Saving collection' : 'Saving watched history' : undefined}
    aria-label={label} aria-controls="watch-{id}" aria-haspopup="dialog" aria-expanded={expanded} aria-disabled={busy}
    onclick={click} onpointerdown={pointerdown} onpointerup={release} onpointercancel={release}
    onpointerleave={release}>
      {#snippet tiles()}
        <SummaryActionTile bind:element={side} icon={plus} label={addLabel} aria-controls="watch-{id}"
          aria-haspopup="dialog" aria-expanded={expanded} aria-disabled={busy} onclick={() => open(true)} />
        {@render more?.()}
      {/snippet}
    </SummaryAction>
</div>
{:else}
<div class={['watch-control', variant, { small, collection, selected }]} style:--watch-fill={fill}
  style:--watch-color={collection ? 'var(--brand-quaternary)' : 'var(--brand-tertiary)'}
  style:anchor-name="--watch-{id}" aria-busy={busy}>
  <Tooltip text={tooltip} placement="bottom">
    {#snippet trigger(tip)}
      <button bind:this={button} type="button" class="watch-trigger" aria-label={label}
        aria-controls="watch-{id}" aria-haspopup="dialog" aria-expanded={expanded} aria-disabled={busy}
        onclick={click} onpointerdown={pointerdown} onpointerup={release} onpointercancel={release} onpointerleave={release} {...tip}>
        <span class="base"></span>{@render content?.()}
      </button>
    {/snippet}
  </Tooltip>
  {#if busy}<span class="busy"><Spinner label={collection ? "Saving collection" : "Saving watched history"} /></span>{/if}
</div>
{/if}
<PromptPopover id="watch-{id}" anchor="--watch-{id}" {title} tone={collection ? 'collected' : 'watched'}
  size={editingMetadata ? 'wide' : 'default'} bind:element={popover} ontoggle={toggle}>
  {#if editingMetadata && metadata}
    {@render metadata(finishMetadata, savingMetadata)}
  {:else if mode === 'date'}
    {#if other}
      <PromptDateForm id="watch-date-{id}" label="{collection ? 'Collected' : 'Watched'} date and time" bind:value
        bind:field max={maximum}
        preview={instant ? formatDate(instant, { ...datePreferences, format: 'LL', time: true }) : 'Choose a valid date and time.'}
        saveLabel={collection ? 'Save collected date' : 'Save watched date'} onsubmit={submit}
        oncancel={async () => { other = false; await tick(); firstChoice()?.focus(); }} />
    {:else}
      {#if oncheckin && !collection}
        <PromptRow svg={play} detail="Check in" aria-haspopup="dialog" onclick={() => { popover?.hidePopover(); oncheckin(); }}>Watching now</PromptRow>
      {/if}
      <PromptRow svg={check} onclick={() => choose('now')}>{collection ? 'Right now' : 'Just finished'}</PromptRow>
      <PromptRow svg={calendar} onclick={() => choose('released')}>Release date</PromptRow>
      <PromptRow svg={question} onclick={() => choose('unknown')}>Unknown date</PromptRow>
      <hr />
      <PromptRow svg={clock} onclick={otherDate}>Other date…</PromptRow>
      {#if collection && metadata}
        <PromptRow svg={disc} detail={hasMetadata ? 'Added' : undefined} onclick={() => editMetadata(false)}>Add metadata</PromptRow>
      {/if}
    {/if}
  {:else if mode === 'remove'}
    {#if onremovePlay}
      <PromptRow svg={trash} danger onclick={() => { popover?.hidePopover(); onremovePlay(); }}>Only this play</PromptRow>
    {/if}
    <PromptRow svg={trash} danger onclick={() => choose(null)}>{collection
        ? plural ? 'Remove all episodes' : 'Remove from library'
        : plural ? 'Remove all episode plays' : 'Remove all plays'}</PromptRow>
    <PromptRow svg={xmark} onclick={() => popover?.hidePopover()}>Keep {plural ? 'them' : 'it'}</PromptRow>
    <hr />
    {#if collection}
      <PromptRow svg={disc} onclick={() => editMetadata(true)}>Edit metadata</PromptRow>
    {:else}
      <PromptRow svg={plus} onclick={() => { mode = 'date'; force = true; }}>{plural ? 'Add more plays' : 'Add another play'}</PromptRow>
    {/if}
  {:else}
    <PromptRow svg={check} onclick={remaining}>{collection ? 'Add remaining' : 'Watch remaining'}</PromptRow>
    <PromptRow svg={trash} danger onclick={() => choose(null)}>Remove all</PromptRow>
    <hr />
    <PromptRow svg={xmark} onclick={() => popover?.hidePopover()}>Nothing</PromptRow>
  {/if}
</PromptPopover>

<style>
.watch-control {
  position: relative;
  color: var(--watch-color, var(--brand-tertiary));
  &.card {
    inline-size: var(--watch-card-width);
    block-size: var(--watch-card-height);
    &.small {
      inline-size: var(--watch-card-small-width);
      block-size: var(--watch-card-small-height);
    }
  }
  &[aria-busy='true'] {
    opacity: var(--watch-busy-opacity);
    cursor: wait;
  }
}
.busy {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: var(--color-box);
  color: var(--watch-color, var(--brand-tertiary));
  font-size: var(--font-size-action-icon);
}
.watch-trigger {
  position: relative;
  display: flex;
  align-items: center;
  inline-size: 100%;
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
  &:focus-visible {
    outline: var(--watch-focus) solid var(--color-input-border-focus);
    outline-offset: calc(-1 * var(--watch-focus));
  }
}
.base {
  display: none;
}
.card .watch-trigger {
  display: grid;
  place-items: center;
  block-size: 100%;
  font-size: var(--font-size-quick-icon);
  .small & {
    font-size: var(--font-size-quick-icon-small);
  }
  .base {
    display: block;
    position: absolute;
    inset: 0;
    background: var(--watch-color, var(--brand-tertiary));
    opacity: var(--watch-fill);
    transition: opacity var(--transition-card);
  }
  & :global(.icon) {
    position: relative;
  }
  .selected &,
  &:is(:hover, :focus-visible) {
    color: var(--color-card-text);
  }
  &:is(:hover, :focus-visible) .base {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .base {
    transition: none;
  }
}
</style>
