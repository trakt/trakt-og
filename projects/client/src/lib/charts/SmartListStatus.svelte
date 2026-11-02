<!--
  Over the Applied Filters chips while a chart shows one of the viewer's smart lists: its name after the smart list
  sparkles, linking to the list. Once the filters move away from the list's, a faded blue info box under it says so, with Save
  (a list's Done green), Save as new (the box's blue) and Undo (back to the list's own filters, a plain outline).
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import resetIcon from '$lib/icons/regular/arrow-rotate-left.svg?raw';
import clone from '$lib/icons/regular/clone.svg?raw';
import check from '$lib/icons/solid/check.svg?raw';
import sparkles from '$lib/icons/solid/sparkles.svg?raw';

interface Props {
  name: string;
  /** The list's own page. */
  href: string;
  changed: boolean;
  /** The chart with the list's own filters. */
  undoHref: string;
  busy?: boolean;
  onsavechanges: () => void;
  onsaveas: () => void;
}

const { name, href, changed, undoHref, busy = false, onsavechanges, onsaveas }: Props = $props();
</script>

<!-- Both hrefs come built. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class="smart-status">
  <a class="name" {href}><Icon svg={sparkles} /><span>{name}</span></a>
  {#if changed}
    <div class="changes" role="status">
      <p>Your filters changed since you saved this smart list.</p>
      <div class="buttons">
        <button type="button" class="action save" disabled={busy} onclick={onsavechanges}><Icon svg={check} />Save</button>
        <button type="button" class="action save-as" disabled={busy} onclick={onsaveas}><Icon svg={clone} />Save as new</button>
        <a class="action undo" href={undoHref}><Icon svg={resetIcon} />Undo</a>
      </div>
    </div>
  {/if}
</div>

<style>
.smart-status {
  display: grid;
  gap: var(--space-base-block);
}

.name {
  display: inline-flex;
  align-items: center;
  gap: var(--space-base-block);
  min-inline-size: 0;
  color: var(--color-frame-ink);
  font-size: var(--font-size-control);
  font-weight: var(--font-weight-headings-heavy);
  text-decoration: none;

  & span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & :global(.icon) {
    flex: none;
    color: var(--brand-primary);
  }

  &:is(:hover, :focus-visible) span {
    text-decoration: underline;
  }
}

.changes {
  display: grid;
  gap: var(--space-base-block);
  padding: var(--smart-status-padding);
  border: 1px solid var(--color-smart-status-border);
  border-radius: var(--radius-control);
  background-color: var(--color-smart-status-bg);
  color: var(--color-smart-status-text);
  font-size: var(--font-size-small);

  & p {
    margin: 0;
  }
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-base-block);
}

.action {
  --action-border: var(--color-control-border);
  --action-bg: transparent;
  --action-bg-hover: var(--color-control-hover-bg);
  --action-text: var(--color-control-text);
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
  min-block-size: var(--control-height-small);
  padding: 0 var(--space-sm-inline);
  border: 1px solid var(--action-border);
  border-radius: var(--radius-control);
  background-color: var(--action-bg);
  color: var(--action-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-heavy);
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;

  &:is(:hover, :focus-visible):not(:disabled) {
    background-color: var(--action-bg-hover);
  }

  &:disabled {
    cursor: default;
    opacity: var(--opacity-action-disabled);
  }
}

/* A list's Done: green tint, green outline. */
.save {
  --action-border: var(--color-mode-done-border);
  --action-bg: var(--color-mode-done-bg);
  --action-bg-hover: var(--color-mode-done-bg-hover);
  --action-text: var(--color-mode-done-text);
}

.save-as {
  --action-border: var(--color-smart-save-as-border);
  --action-bg: var(--color-smart-save-as-bg);
  --action-bg-hover: var(--color-smart-save-as-bg-hover);
  --action-text: var(--color-smart-save-as-text);
}

.undo :global(.icon) {
  color: var(--color-control-muted);
}
</style>
