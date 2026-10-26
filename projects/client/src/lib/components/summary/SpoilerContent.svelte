<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import type { Snippet } from 'svelte';
import type { Attachment } from 'svelte/attachments';
const { hidden, inline = false, children }: { hidden: boolean; inline?: boolean; children: Snippet } = $props();
let revealed = $state(false);
const blurred = $derived(hidden && !revealed);
const focusRevealed: Attachment<HTMLElement> = (element) => {
  if (revealed) element.focus({ preventScroll: true });
};
</script>
{#if hidden}
  <svelte:element this={inline ? 'span' : 'div'} class={['spoiler-content', { inline }]} tabindex="-1"
  {@attach focusRevealed}>
  <svelte:element this={inline ? 'span' : 'div'} class={{ blurred }} inert={blurred}
    aria-hidden={blurred}>{@render children()}</svelte:element>
  {#if blurred}
    <Tooltip text="Click to reveal spoilers">
      {#snippet trigger(tooltip)}
        <button type="button" aria-label="Click to reveal spoilers" onclick={() => (revealed = true)} {...tooltip}
        ></button>
      {/snippet}
    </Tooltip>
  {/if}
</svelte:element>
{:else}
  {@render children()}
{/if}
<style>
.spoiler-content {
  position: relative;
  /* Inline, it wraps with the text around it, so a long hidden title stays beside its episode number. */
  &.inline {
    display: inline;
  }
}
.blurred {
  filter: var(--blur-spoiler);
}
button {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  border: 0;
  background: transparent;
  color: var(--color-link);
  font: inherit;
  cursor: pointer;
}
</style>
