<script lang="ts">
import type { CollectionMetadata } from '$lib/components/collection/CollectionMetadata';
import { collectionFields } from '$lib/components/collection/collectionFields';
interface Props {
  value: CollectionMetadata;
  onsave: (metadata: CollectionMetadata) => void;
  saving?: boolean;
}
const { value, onsave, saving = false }: Props = $props();
const id = $props.id();
let form = $state<HTMLFormElement>();
function submit(event: SubmitEvent) {
  event.preventDefault();
  if (!form) return;
  const data = new FormData(form);
  onsave({
    media_type: String(data.get('media_type') || '') || null,
    resolution: String(data.get('resolution') || '') || null,
    hdr: String(data.get('hdr') || '') || null,
    audio: String(data.get('audio') || '') || null,
    audio_channels: String(data.get('audio_channels') || '') || null,
    '3d': data.get('3d') === 'true',
  });
}
</script>

<form bind:this={form} onsubmit={submit}>
  <div class="fields">
    {#each collectionFields as field (field.key)}
      <div class="field">
        <label for="collection-{id}-{field.key}">{field.label}</label>
        <select id="collection-{id}-{field.key}" name={field.key} value={String(value[field.key] ?? '')}>
          <option value="">{field.key === '3d' ? 'No' : 'None'}</option>
          {#each field.options as [key, label] (key)}<option value={key}>{label}</option>{/each}
        </select>
      </div>
    {/each}
  </div>
  <button type="submit">{saving ? 'Save metadata' : 'Add metadata'}</button>
</form>

<style>
/* A `PromptPopover` body: a row a field, the label on the left and its pick on the right, then Save. */
form {
  display: grid;
  gap: var(--space-menu);
}

.fields {
  display: grid;
}

.field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-menu-check);
  padding: var(--space-collection-field);
  border-radius: var(--radius-menu-row);

  &:hover,
  &:focus-within {
    background-color: var(--color-menu-row-hover);
  }
}

label {
  color: var(--color-dropdown-menu-text);
}

select {
  max-inline-size: var(--collection-select-max);
  min-block-size: var(--collection-select-height);
  padding: 0 var(--space-xs-inline);
  border: 0;
  border-radius: var(--radius-menu-row);
  background: none;
  color: var(--color-control-text);
  font: var(--font-weight-headings) var(--font-size-menu) / 1 var(--font-headings);
  text-align: end;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--color-control-border-hover);
  }
}

button {
  min-block-size: var(--control-height);
  margin-block-start: var(--space-menu);
  border: 0;
  border-radius: var(--radius-control);
  background: var(--brand-primary);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background: var(--brand-primary-darken);
  }
}
</style>
