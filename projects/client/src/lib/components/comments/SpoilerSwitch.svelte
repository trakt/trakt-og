<!--
  The composer's Spoilers toggle, an outlined button like Cancel: pressed, it takes the spoiler tag's amber and marks
  the whole comment as a spoiler, so it's blurred until clicked.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import eyeSlash from '$lib/icons/solid/eye-slash.svg?raw';

let { spoiler = $bindable(false) }: { spoiler?: boolean } = $props();
</script>

<button type="button" class="spoiler" aria-pressed={spoiler} onclick={() => (spoiler = !spoiler)}>
  <Icon svg={eyeSlash} />Spoilers
</button>

<style>
.spoiler {
  --tone: var(--color-comment-chip-spoiler);
  display: inline-flex;
  align-items: center;
  gap: var(--comment-spoiler-gap);
  min-block-size: var(--dialog-art-button-height);
  padding: var(--dialog-art-button-padding);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background: none;
  color: var(--color-control-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-dialog-art-button);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;
  cursor: pointer;
  transition: background-color var(--transition-comment-quiet), border-color var(--transition-comment-quiet);

  & :global(.icon) {
    color: var(--color-comment-muted);
  }

  &:hover {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-dialog-art-button-hover);
  }

  &[aria-pressed='true'] {
    border-color: color-mix(in srgb, var(--tone) var(--list-card-chip-line), transparent);
    background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-tint), transparent);
    color: color-mix(in srgb, var(--tone), var(--color-list-card-chip-lift) var(--list-card-chip-lift));

    & :global(.icon) {
      color: inherit;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .spoiler {
    transition: none;
  }
}
</style>
