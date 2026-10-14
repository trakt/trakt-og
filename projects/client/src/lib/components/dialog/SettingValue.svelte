<!--
  A setting the dialog shows but can't change, in a dropdown's place: its label, then its value with an icon in a
  dashed box with no caret, so it reads as fixed. The watchlist and favorites show their privacy, comments and rank
  numbers this way.
    <SettingValue label="Comments" svg={ban} value="Off" />
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import FieldLabel from './FieldLabel.svelte';

const { label, value, svg }: { label: string; value: string; svg?: string } = $props();
const id = $props.id();
</script>

<div class="setting-value" role="group" aria-labelledby="{id}-label">
  <FieldLabel text={label} id="{id}-label" />
  <p class="value">{#if svg}<Icon {svg} />{/if}{value}</p>
</div>

<style>
.setting-value {
  min-inline-size: 0;
}

.value {
  display: flex;
  align-items: center;
  gap: var(--toggle-chip-count-gap);
  min-block-size: var(--control-height);
  margin: 0;
  padding: 0 var(--space-control-inline);
  border: 1px dashed var(--color-control-border);
  border-radius: var(--radius-control);
  color: var(--color-dialog-art-label);
  font-size: var(--font-size-control);
  white-space: nowrap;

  & :global(.icon) {
    flex: none;
    font-size: var(--font-size-dialog-art-chip-icon);
  }
}
</style>
