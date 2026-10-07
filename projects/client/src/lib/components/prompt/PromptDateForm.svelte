<!--
  "Other date" inside a `PromptPopover`: a labeled date and time field in the control style, the picked moment
  written out under it, then Back and Save. The caller checks the value on submit, since only it knows the limits.
    <PromptDateForm id="watch-date-{id}" label="Watched date and time" bind:value bind:field max={maximum}
      preview={readable} saveLabel="Save watched date" onsubmit={submit} oncancel={() => (other = false)} />
-->
<script lang="ts">
interface Props {
  id: string;
  label: string;
  value: string;
  field?: HTMLInputElement;
  max: string;
  /** The picked moment written out, or what's wrong with it. */
  preview: string;
  /** Names the Save button for screen readers. */
  saveLabel: string;
  onsubmit: (event: SubmitEvent) => void;
  oncancel: () => void;
}

let { id, label, value = $bindable(), field = $bindable(), max, preview, saveLabel, onsubmit, oncancel }: Props =
  $props();
</script>

<form class="date-form" {onsubmit} novalidate>
  <label for={id}>{label}</label>
  <input bind:this={field} bind:value {id} type="datetime-local" required {max} step="900" />
  <p class="preview">{preview}</p>
  <div class="actions">
    <button type="button" class="back" onclick={oncancel}>Back</button>
    <button type="submit" class="save" aria-label={saveLabel}>Save</button>
  </div>
</form>

<style>
.date-form {
  display: grid;
  gap: var(--space-prompt-form);
  padding: var(--space-menu-row);
}

label {
  color: var(--color-menu-header);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings);
}

input {
  inline-size: 100%;
  block-size: var(--control-height);
  padding: 0 var(--space-control-inline);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font: inherit;

  &:focus-visible {
    border-color: var(--color-control-border-hover);
    outline: none;
  }
}

.preview {
  margin: 0;
  color: var(--color-menu-header);
  font-size: var(--font-size-small);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-prompt-form);
  margin-block-start: var(--space-prompt-form);
}

button {
  min-block-size: var(--control-height);
  padding: 0 var(--space-control-inline);
  border-radius: var(--radius-control);
  font-family: var(--font-headings);
  font-size: var(--font-size-control);
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.back {
  border: 1px solid var(--color-control-border);
  background-color: var(--color-control-raised-bg);
  color: var(--color-control-text);
  font-weight: var(--font-weight-control);

  &:is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-raised-hover-bg);
  }
}

.save {
  border: 0;
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);
  font-weight: var(--font-weight-headings-heavy);

  &:is(:hover, :focus-visible) {
    background-color: var(--brand-primary-darken);
  }
}

@media (prefers-reduced-motion: reduce) {
  button {
    transition: none;
  }
}
</style>
