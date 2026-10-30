<!--
  A tinted box inside an art dialog's form: amber for a warning or instructions (the lists limit, what to check before
  reporting), red for an error the server sent back. Links inside take its color, bold and underlined.
    <DialogNotice role="alert">You've already created <strong>5</strong> lists.</DialogNotice>
-->
<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  tone?: 'warning' | 'danger';
  role?: 'alert' | 'status';
  children: Snippet;
}

const { tone = 'warning', role, children }: Props = $props();
</script>

<p class={['dialog-notice', tone]} {role}>{@render children()}</p>

<style>
.dialog-notice {
  margin: 0;
  padding: var(--dialog-art-alert-padding);
  border: 1px solid var(--notice-border);
  border-radius: var(--radius-control);
  background-color: var(--notice-bg);
  color: var(--notice-text);
  font-size: var(--font-size-dialog-notice);
  line-height: var(--line-height-base);

  & :global(a) {
    color: inherit;
    font-weight: var(--font-weight-headings-heavy);
    text-decoration: underline;
  }
}

.warning {
  --notice-border: var(--color-dialog-art-alert-border);
  --notice-bg: var(--color-dialog-art-alert-bg);
  --notice-text: var(--color-dialog-art-alert-text);
}

.danger {
  --notice-border: var(--color-dialog-art-danger-border);
  --notice-bg: var(--color-dialog-art-danger-bg);
  --notice-text: var(--color-dialog-art-danger-text);
}
</style>
