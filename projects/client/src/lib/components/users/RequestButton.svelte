<!--
  A follow-request button: outlined, on a darker tint of its own color. `approve` is green and `deny` red; both
  brighten with a glow on hover. `block` is neutral and turns red on hover; `neutral` (Review, Hide) just lifts. Used
  by the profile's request deck and the dashboard's Follow Requests.
    <RequestButton tone="approve" icon={checkThick} onclick={approve}>Approve</RequestButton>
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';
import Icon from '$lib/icons/Icon.svelte';

interface Props extends HTMLButtonAttributes {
  tone: 'approve' | 'deny' | 'block' | 'neutral';
  icon?: string;
  children: Snippet;
}

const { tone, icon, children, type = 'button', ...rest }: Props = $props();
</script>

<button {type} class={['request-button', tone]} {...rest}>
  {#if icon}<Icon svg={icon} />{/if}{@render children()}
</button>

<style>
.request-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-action-button-icon);
  block-size: var(--profile-request-button-height);
  min-block-size: 0;
  padding: 0 var(--space-base-inline);
  border: var(--action-button-border-width) solid var(--color-profile-button-border);
  border-radius: var(--radius-profile-button);
  background-color: var(--color-profile-block-bg);
  color: var(--color-profile-block-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-action-button);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;

  &.approve {
    border-color: var(--color-profile-approve-border);
    background-color: var(--color-profile-approve-bg);
    color: var(--color-profile-approve-text);

    &:is(:hover, :focus-visible):not([aria-disabled='true']) {
      border-color: var(--color-profile-follow-hover-border);
      background-color: var(--color-profile-approve-hover-bg);
      color: var(--color-text-inverse);
      box-shadow: var(--shadow-profile-approve-hover);
    }
  }

  &.deny {
    border-color: var(--color-profile-deny-border);
    background-color: var(--color-profile-deny-bg);
    color: var(--color-profile-deny-text);

    &:is(:hover, :focus-visible):not([aria-disabled='true']) {
      border-color: var(--color-profile-remove);
      background-color: var(--color-profile-deny-hover-bg);
      color: var(--color-text-inverse);
      box-shadow: var(--shadow-profile-deny-hover);
    }
  }

  &.block:is(:hover, :focus-visible):not([aria-disabled='true']) {
    border-color: var(--color-profile-deny-border);
    background-color: var(--color-profile-deny-bg);
    color: var(--color-profile-deny-text);
  }

  &.neutral:is(:hover, :focus-visible):not([aria-disabled='true']) {
    border-color: var(--color-profile-button-border-hover);
    background-color: var(--color-profile-button-hover-bg);
    color: var(--color-text-inverse);
  }

  &[aria-disabled='true'] {
    cursor: progress;
  }
}

@media (prefers-reduced-motion: reduce) {
  .request-button {
    transition: none;
  }
}
</style>
