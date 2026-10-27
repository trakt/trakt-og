<script lang="ts">
import { page } from '$app/state';
import { type ComponentProps, type Snippet, tick } from 'svelte';
import { rawApiFetch } from '$lib/api/rawApiFetch';
import { userManager } from '$lib/auth/userManager';
import { login } from '$lib/auth/login';
import { overlay } from '$lib/overlay/overlay';
import { toast } from '$lib/components/toast/toast.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Spinner from '$lib/components/loading/Spinner.svelte';
import PromptDateForm from '$lib/components/prompt/PromptDateForm.svelte';
import PromptPopover from '$lib/components/prompt/PromptPopover.svelte';
import PromptRow from '$lib/components/prompt/PromptRow.svelte';
import backward from '$lib/icons/light/backward.svg?raw';
import arrowRotateLeft from '$lib/icons/regular/arrow-rotate-left.svg?raw';
import ban from '$lib/icons/regular/ban.svg?raw';
import circleMinus from '$lib/icons/regular/circle-minus.svg?raw';
import clock from '$lib/icons/regular/clock.svg?raw';
import xmark from '$lib/icons/regular/xmark.svg?raw';
import { watchDateInput } from '$lib/components/history/watchDateInput';
import { watchDateInstant } from '$lib/components/history/watchDateInstant';
import { changeVisibility } from '$lib/components/visibility/changeVisibility';
import { dropNote } from '$lib/components/visibility/dropNote.svelte';
import type { VisibilityTarget } from '$lib/components/visibility/VisibilityTarget';
import { traktUrls } from '$lib/traktUrls';
import { viewerFetch } from '../../auth/viewerFetch.ts';

interface Props {
  target: VisibilityTarget;
  action: 'rewatch' | 'unrewatch' | 'drop' | 'restore' | 'hide';
  section?: 'calendar' | 'recommendations' | 'progress_watched' | 'progress_collected';
  /** Left out, only for `headless`, which draws no button. */
  variant?: 'badge' | 'menu';
  /** Names the button for screen readers, and its tooltip, in place of the action's own "Hide this movie". */
  label?: string;
  tooltip?: string;
  placement?: ComponentProps<typeof Tooltip>['placement'];
  /** The trigger's content. A headless control has none. */
  children?: Snippet;
  /**
   * No button of its own: the caller opens the prompt with `openPrompt()` (a ••• menu's row, which closes first so the
   * prompt isn't nested in it), and the prompt anchors where the control is placed.
   */
  headless?: boolean;
  /** Where the focus goes back to when a headless control's prompt closes. */
  returnFocus?: HTMLElement;
  /** The `anchor-name` (with its `--`) the prompt sits by instead of the control's own: a headless control's button. */
  anchor?: string;
  onsave?: () => void;
  /**
   * Called as the save starts, with whether it went through. A page that removes or reloads the item itself (the
   * progress rows) takes over moving the focus, so the control skips its own.
   */
  onsaving?: (saved: Promise<boolean>) => void;
}
const {
  target,
  action,
  section,
  variant,
  label: labelOverride,
  tooltip,
  placement = 'bottom',
  children,
  headless = false,
  returnFocus,
  anchor,
  onsave,
  onsaving,
}: Props = $props();
const id = $props.id();
let button = $state<HTMLButtonElement>();
let popover = $state<HTMLDivElement>();
let field = $state<HTMLInputElement>();
let busy = $state(false);
let expanded = $state(false);
let other = $state(false);
let value = $state('');
let maximum = $state('');
let returnTo: HTMLElement | undefined;
const dates = $derived(page.data.datePreferences);
const dateAction = $derived(action === 'rewatch' || action === 'drop');
const title = $derived(
  action === 'rewatch'
    ? 'When did you start rewatching?'
    : action === 'drop'
    ? 'When did you drop this?'
    : action === 'restore'
    ? 'Undrop this show?'
    : action === 'unrewatch'
    ? 'Stop rewatching this show?'
    : `Hide this ${target.type}?`,
);
const label = $derived(
  labelOverride ??
    (action === 'rewatch'
      ? 'Rewatch this show'
      : action === 'drop'
      ? 'Drop this show'
      : action === 'restore'
      ? 'Undrop this show'
      : action === 'unrewatch'
      ? 'Stop rewatching this show'
      : `Hide this ${target.type}`),
);
const instant = $derived(watchDateInstant(value, dates.timeZone));
async function open() {
  if (busy) return;
  if (!(await userManager().getUser())?.access_token) return login();
  if (action === 'rewatch' && !page.data.user?.isVip) {
    globalThis.open(traktUrls.vip, '_blank', 'noopener');
    return;
  }
  returnTo = returnFocus ?? button?.closest('article')?.querySelector<HTMLElement>('.titles-link') ??
    button?.closest('main')?.querySelector<HTMLElement>('.watch-trigger') ?? button;
  other = false;
  popover?.showPopover();
}
/** Opens the prompt as the trigger would: a headless control's way in. */
export function openPrompt() {
  return open();
}
function toggle(event: ToggleEvent) {
  expanded = event.newState === 'open';
  if (expanded) firstChoice()?.focus();
  else (button?.isConnected ? button : returnTo)?.focus({ preventScroll: true });
}
/** The prompt's first choice, past its close button. */
const firstChoice = () => popover?.querySelector<HTMLElement>('.body button');
// The rewatch's purple, red to drop, gray to hide or restore.
const tone = $derived(action === 'rewatch' ? 'watched' : action === 'drop' ? 'danger' : 'neutral');
const actionIcon = $derived(
  action === 'rewatch'
    ? backward
    : action === 'hide'
    ? ban
    : action === 'restore' || action === 'unrewatch'
    ? arrowRotateLeft
    : circleMinus,
);
function otherDate() {
  const now = new Date();
  maximum = watchDateInput(now, dates.timeZone);
  value = watchDateInput(new Date(Math.floor(now.getTime() / 900_000) * 900_000), dates.timeZone);
  other = true;
}
$effect(() => {
  if (other) field?.focus();
});
async function save(at?: string) {
  if (busy) return;
  popover?.hidePopover();
  busy = true;
  try {
    const main = button?.closest('main');
    const articles = [...(main?.querySelectorAll<HTMLElement>('article') ?? [])];
    const current = button?.closest('article');
    const index = articles.findIndex((article) => article === current);
    const saving = changeVisibility({
      target,
      action,
      section,
      at,
      overlay,
      notify: toast,
      request: (path, body, method) =>
        rawApiFetch({
          path,
          fetch: viewerFetch(),
          init: method === 'DELETE'
            ? { method }
            : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
        }),
    });
    onsaving?.(saving);
    if (!onsaving && (action === 'hide' || action === 'drop')) {
      await tick();
      const candidate = [...articles.slice(index + 1), ...articles.slice(0, index).toReversed()]
        .find((article) => article.isConnected && !article.hidden && article.getClientRects().length > 0)
        ?.querySelector<HTMLElement>('a.titles-link, button');
      (candidate ?? main?.querySelector<HTMLElement>('nav[aria-label="Pagination"] a') ?? main)?.focus({
        preventScroll: true,
      });
    }
    if (!(await saving)) return;
    onsave?.();
    // Like v3, a drop asks why. A season dropped through its show doesn't.
    if (action === 'drop' && target.type === 'show' && !target.season) void dropNote.open(target);
  } finally {
    busy = false;
  }
}
function submit(event: SubmitEvent) {
  event.preventDefault();
  if (!instant || !field?.validity.valid || value > maximum) {
    toast.error('Invalid date format, please use the date picker.');
    return;
  }
  void save(instant);
}
</script>

<span class={['visibility-control', variant, { headless }]}
  style:anchor-name={anchor ? undefined : `--visibility-${id}`}>
  {#if !headless}
  <Tooltip text={variant === 'menu' ? undefined : tooltip ?? label} {placement}>
  {#snippet trigger(tip)}
    <button bind:this={button} type="button" class={['visibility-trigger', variant]}
      aria-label={label} aria-haspopup="dialog" aria-controls="visibility-{id}" aria-expanded={expanded}
      aria-busy={busy} aria-disabled={busy} onclick={open} {...tip}>
      {#if busy}<Spinner label="Saving {target.title}" />{:else}{@render children?.()}{/if}
    </button>
  {/snippet}
  </Tooltip>
  {/if}
</span>
<PromptPopover id="visibility-{id}" anchor={anchor ?? `--visibility-${id}`} {title} {tone} bind:element={popover}
  ontoggle={toggle}>
  {#if other}
    <PromptDateForm id="visibility-date-{id}" label="{action === 'rewatch' ? 'Rewatch' : 'Dropped'} date and time"
      bind:value bind:field max={maximum}
      saveLabel="Save date" onsubmit={submit}
      oncancel={async () => { other = false; await tick(); firstChoice()?.focus(); }} />
  {:else if dateAction}
    <PromptRow svg={actionIcon} danger={action === 'drop'} onclick={() => save()}>Right now</PromptRow>
    <PromptRow svg={clock} onclick={otherDate}>Other date…</PromptRow>
  {:else}
    <PromptRow svg={actionIcon} onclick={() => save()}>{action === 'restore'
      ? 'Yes, undrop it!'
      : action === 'unrewatch'
      ? 'Yes, stop rewatching!'
      : 'Yes, hide it!'}</PromptRow>
    <PromptRow svg={xmark} onclick={() => popover?.hidePopover()}>No</PromptRow>
  {/if}
</PromptPopover>

<style>
.visibility-control {
  display: inline-flex;
  &.menu {
    display: flex;
  }
  /* No button: only a point for the prompt to anchor to, taking no room in a row of icons. */
  &.headless {
    flex: none;
    inline-size: 0;
  }
}
.visibility-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  &:focus-visible {
    outline: var(--watch-focus) solid var(--color-input-border-focus);
    outline-offset: calc(-1 * var(--watch-focus));
  }
  &[aria-busy='true'] {
    cursor: wait;
  }
  &.badge {
    font-size: inherit;
    line-height: 1;
  }
  /* A dropdown menu's row. */
  &.menu {
    justify-content: start;
    gap: var(--summary-action-menu-row-gap);
    inline-size: 100%;
    padding: var(--space-menu-row);
    border-radius: var(--radius-menu-row);
    color: inherit;
    font: inherit;
    line-height: var(--line-height-base);
    text-align: start;
    white-space: nowrap;
    &:is(:hover, :focus-visible) {
      background: var(--color-menu-row-hover);
      color: var(--color-menu-row-hover-text);
      outline: none;
    }
    & > :global(.icon) {
      color: var(--color-text-muted);
      font-size: var(--font-size-summary-action-menu-icon);
    }
  }
}
</style>
