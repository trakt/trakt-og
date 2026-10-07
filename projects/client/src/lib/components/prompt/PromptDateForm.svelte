<!--
  "Other date" inside a `PromptPopover`: a date and time field in the control style, then Back and Save. The field
  says the date itself, so `label` names it for screen readers only. The caller checks the value on submit, since
  only it knows the limits, and says what's wrong.
    <PromptDateForm id="watch-date-{id}" label="Watched date and time" bind:value bind:field max={maximum}
      saveLabel="Save watched date" onsubmit={submit} oncancel={() => (other = false)} />
-->
<script lang="ts">
interface Props {
  id: string;
  label: string;
  value: string;
  field?: HTMLInputElement;
  max: string;
  /** Names the Save button for screen readers. */
  saveLabel: string;
  onsubmit: (event: SubmitEvent) => void;
  oncancel: () => void;
}

let { id, label, value = $bindable(), field = $bindable(), max, saveLabel, onsubmit, oncancel }: Props = $props();
</script>

<form class="date-form" {onsubmit} novalidate>
  <input bind:this={field} bind:value {id} type="datetime-local" aria-label={label} required {max} step="900" />
  <div class="actions">
    <button type="button" class="back" onclick={oncancel}>Back</button>
    <button type="submit" class="save" aria-label={saveLabel}>Save</button>
  </div>
</form>

<style>
.date-form {
  display: grid;
  /* The same space under the field as above it: the prompt body's padding plus the form's own. */
  gap: calc(var(--space-menu) + var(--space-prompt-form));
  padding: var(--space-menu-row);
  padding-block: var(--space-prompt-form);
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

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-prompt-form);
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
