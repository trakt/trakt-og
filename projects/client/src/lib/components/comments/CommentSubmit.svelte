<!-- A comment composer's submit button ("Post", "Reply" or "Save"), with OG's spinner while it posts. -->
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
  min-block-size: var(--comment-submit-height);
  padding: var(--comment-submit-padding);
  border: 0;
  border-radius: var(--radius-comment-submit);
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-size: var(--font-size-comment-meta);
  font-weight: var(--font-weight-headings-heavy);
  text-transform: uppercase;

  &:is(:hover, :focus-visible) {
    background-color: var(--brand-primary-darken);
  }
}
</style>
