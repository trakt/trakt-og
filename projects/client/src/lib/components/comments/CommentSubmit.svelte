<!-- A comment composer's submit button ("Post", "Reply" or "Save"), red like a note's Save, with OG's spinner while it posts. -->
<script lang="ts">
import Spinner from '../loading/Spinner.svelte';

interface Props {
  posting: boolean;
  text: string;
  /** What the spinner says while it posts. */
  label: string;
}

const { posting, text, label }: Props = $props();
</script>

<button type="submit" class="submit" aria-busy={posting}>
  {#if posting}<Spinner {label} />{:else}{text}{/if}
</button>

<style>
.submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-block-size: var(--dialog-art-button-height);
  padding: var(--dialog-art-button-padding);
  border: 1px solid var(--brand-primary);
  border-radius: var(--radius-control);
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-size: var(--font-size-dialog-art-button);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;

  &:is(:hover, :focus-visible) {
    border-color: var(--brand-primary-darken);
    background-color: var(--brand-primary-darken);
  }
}
</style>
