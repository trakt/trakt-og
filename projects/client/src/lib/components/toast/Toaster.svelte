<!--
  Toasts: dark glass cards stacked down from under the header's right edge, newest on top. Show one with
  `toast.success(message)` or `toast.error(message)` from `./toast.svelte.ts`. Each goes after 5s, and a line along its
  bottom drains to show it. Hovering or focusing one holds it, and it goes 1s after the pointer or focus leaves.
  Errors announce assertively, successes politely. A toast can carry one action that closes it and runs:
  `toast.error(message, { label: 'Upgrade', run })` is a tinted `LinkButton` in the link red before the close, and
  `toast.success(message, { label: 'Undo', icon, run })` an icon button beside the close, its label the tooltip, like
  the close's "Close".
-->
<script lang="ts">
import LinkButton from '#lib/components/button/LinkButton.svelte';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import Icon from '#lib/icons/Icon.svelte';
import circleCheck from '#lib/icons/solid/circle-check.svg?raw';
import circleExclamation from '#lib/icons/solid/circle-exclamation.svg?raw';
import xmark from '#lib/icons/regular/xmark.svg?raw';
import { flip } from 'svelte/animate';
import { fly } from 'svelte/transition';
import { toast } from './toast.svelte.ts';
import { prefersReducedMotion } from 'svelte/motion';

const TIMEOUT = 5000;
const EXTENDED_TIMEOUT = 1000;

const icons = { success: circleCheck, error: circleExclamation };

// Svelte transitions skip base.css's reduced-motion rule.
const duration = (ms: number) => (prefersReducedMotion.current ? 0 : ms);

// Dismisses the toast after `ms`, draining its timer line from `from` (1 is full) to empty on the way.
const countdown = (node: HTMLElement, id: number) => (from: number, ms: number) => {
  const timeout = setTimeout(() => toast.dismiss(id), ms);
  const line = node.querySelector('.timer')?.animate(
    [{ transform: `scaleX(${from})` }, { transform: 'scaleX(0)' }],
    { duration: ms, fill: 'forwards' },
  );
  return {
    hold: () => {
      clearTimeout(timeout);
      line?.pause();
    },
    left: () => from * (1 - Number(line?.currentTime ?? 0) / ms),
    stop: () => {
      clearTimeout(timeout);
      line?.cancel();
    },
  };
};

const autoDismiss = (id: number) => (node: HTMLElement) => {
  const start = countdown(node, id);
  let timer = start(1, TIMEOUT);
  const hold = () => timer.hold();
  const release = () => {
    const left = timer.left();
    timer.stop();
    timer = start(left, EXTENDED_TIMEOUT);
  };
  const events = [['pointerenter', hold], ['focusin', hold], ['pointerleave', release], ['focusout', release]] as const;
  events.forEach(([name, handler]) => node.addEventListener(name, handler));
  return () => {
    timer.stop();
    events.forEach(([name, handler]) => node.removeEventListener(name, handler));
  };
};
</script>

<div class="toaster">
  {#each toast.list as { id, type, message, action } (id)}
    <div
      class={['toast', type]}
      role={type === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
      in:fly={{ x: 24, duration: duration(260) }}
      out:fly={{ x: 24, duration: duration(200) }}
      animate:flip={{ duration: duration(200) }}
      {@attach autoDismiss(id)}
    >
      <span class="icon"><Icon svg={icons[type]} /></span>
      <p class="message">{message}</p>
      <span class="buttons">
        {#if action}
          {@const run = () => {
            toast.dismiss(id);
            action.run();
          }}
          {@const icon = action.icon}
          <span class="action">
            {#if icon}
              <Tooltip text={action.label} placement="bottom">
                {#snippet trigger(tooltip)}
                  <button type="button" class="icon-button" aria-label={action.label} onclick={run} {...tooltip}>
                    <Icon svg={icon} />
                  </button>
                {/snippet}
              </Tooltip>
            {:else}
              <LinkButton variant="tinted" onclick={run}>{action.label}</LinkButton>
            {/if}
          </span>
        {/if}
        <Tooltip text="Close" placement="bottom">
          {#snippet trigger(tooltip)}
            <button type="button" class="icon-button" aria-label="Close" onclick={() => toast.dismiss(id)} {...tooltip}>
              <Icon svg={xmark} />
            </button>
          {/snippet}
        </Tooltip>
      </span>
      <span class="timer"></span>
    </div>
  {/each}
</div>

<style>
.toaster {
  position: fixed;
  inset-block-start: calc(var(--header-height) + var(--toast-offset));
  inset-inline-end: var(--toast-offset);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--toast-gap);
  inline-size: min(var(--toast-width), 100vw - 2 * var(--toast-offset));
}

.toast {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--toast-icon-gap);
  padding: var(--toast-padding);
  overflow: hidden;
  border: 1px solid var(--color-toast-border);
  border-radius: var(--radius-toast);
  background-color: var(--color-toast-bg);
  box-shadow: var(--shadow-toast);
  backdrop-filter: var(--blur-toast);
  color: var(--color-toast-text);
  font-size: var(--font-size-toast);

  &.success {
    --color-toast-type: var(--color-toast-success);
  }

  &.error {
    --color-toast-type: var(--color-toast-error);
    border-color: var(--color-toast-error-border);
  }
}

.icon {
  display: flex;
  color: var(--color-toast-type);
  font-size: var(--font-size-toast-icon);
}

.message {
  margin: 0;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.buttons {
  display: flex;
  align-items: center;
  gap: var(--toast-button-gap);
}

/* "Upgrade": a tinted button in the link red, lifted for the glass. */
.action {
  display: flex;
  --link-button-tint: var(--color-toast-action);

  & .icon-button {
    font-size: var(--font-size-toast-action-icon);
  }
}

.icon-button {
  display: grid;
  place-items: center;
  min-block-size: 0;
  block-size: var(--toast-close-size);
  inline-size: var(--toast-close-size);
  padding: 0;
  border: 0;
  border-radius: var(--radius-toast-close);
  background: none;
  color: var(--color-toast-close);
  font-size: var(--font-size-toast-close);

  &:is(:hover, :focus-visible) {
    background-color: var(--color-toast-close-hover);
    color: var(--color-toast-text);
  }
}

.timer {
  position: absolute;
  inset: auto 0 0;
  block-size: var(--toast-timer-height);
  background-color: var(--color-toast-type);
  transform-origin: left;

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
}
</style>
