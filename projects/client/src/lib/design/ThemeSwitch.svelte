<!-- The demos' theme: Light, OG's default, or Dark, Dark Knight. -->
<script lang="ts">
import type { DesignPrefs } from './designPrefs.ts';

type Theme = DesignPrefs['theme'];

interface Props {
  theme: Theme;
  onchange: (theme: Theme) => void;
}

const { theme, onchange }: Props = $props();
const options: readonly { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
</script>

<div class="switch" role="group" aria-label="Theme">
  {#each options as option (option.value)}
    <button type="button" aria-pressed={option.value === theme} onclick={() => onchange(option.value)}>
      {option.label}
    </button>
  {/each}
</div>

<style>
.switch {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  padding: 2px;
  border: 1px solid var(--color-design-nav-border);
  border-radius: var(--radius-round);
  background-color: var(--color-design-nav-input);
  color-scheme: dark;
}

button {
  padding: var(--space-xs-inline) var(--space-sm-inline);
  border: 0;
  border-radius: var(--radius-round);
  background: none;
  color: var(--color-design-nav-muted);
  font-family: var(--font-headings);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings);
  cursor: pointer;

  &:hover {
    color: var(--color-design-nav-active);
  }

  &[aria-pressed='true'] {
    background-color: var(--brand-primary);
    color: var(--color-design-nav-active);
  }
}
</style>
