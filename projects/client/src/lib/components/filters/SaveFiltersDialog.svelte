<!--
  Names a page's filters to keep in the sidebar's Saved Filters, in the smart list dialog's look: the art header with
  the page as a tag, the name, privacy fixed at Private in the list editor's dashed box (they stay in this browser),
  then the filters as read-only chips. A name already saved replaces that filter.
    <SaveFiltersDialog bind:open page="Premieres" {chips} onsave={(name) => save(name)} />
-->
<script lang="ts">
import Dialog from '$lib/components/dialog/Dialog.svelte';
import DialogArtHeader from '$lib/components/dialog/DialogArtHeader.svelte';
import DialogForm from '$lib/components/dialog/DialogForm.svelte';
import DialogNotice from '$lib/components/dialog/DialogNotice.svelte';
import FieldLabel from '$lib/components/dialog/FieldLabel.svelte';
import SettingValue from '$lib/components/dialog/SettingValue.svelte';
import type { CardTag } from '$lib/components/media/CardTag';
import calendarDays from '$lib/icons/solid/calendar-days.svg?raw';
import lockKeyhole from '$lib/icons/solid/lock-keyhole.svg?raw';
import FilterChips from './FilterChips.svelte';
import type { FilterTag } from './filterTags.ts';

interface Props {
  open: boolean;
  /** The page the filters are on: "My Premieres". */
  page: string;
  chips: readonly FilterTag[];
  fanart?: string;
  error?: string;
  onsave: (name: string) => void;
}

let { open = $bindable(), page, chips, fanart, error = '', onsave }: Props = $props();
const id = $props.id();

let name = $state('');
const tags = $derived<readonly CardTag[]>([{ text: page, icon: calendarDays }]);
</script>

<Dialog bind:open title="Save filters" size="md" variant="art">
  {#snippet header(titleId)}<DialogArtHeader id={titleId} title="Save filters" {fanart} {tags} />{/snippet}
  <DialogForm save="Save" disabled={!name.trim()} onsubmit={() => onsave(name.trim())} oncancel={() => (open = false)}>
    {#if error}<DialogNotice tone="danger" role="alert">{error}</DialogNotice>{/if}
    <div>
      <FieldLabel text="Name" for="{id}-name" />
      <input id="{id}-name" required maxlength="50" placeholder="Name this filter" bind:value={name} />
    </div>
    <SettingValue label="Privacy" svg={lockKeyhole} value="Private" />
    <div class="filters">
      <FieldLabel text="Filters" id="{id}-filters" />
      <div aria-labelledby="{id}-filters" role="group"><FilterChips {chips} /></div>
    </div>
  </DialogForm>
</Dialog>

<style>
/* A long chip ends in an ellipsis instead of widening the dialog. */
.filters {
  display: grid;
  gap: var(--dialog-art-label-gap);
  min-inline-size: 0;

  & > * {
    min-inline-size: 0;
  }
}
</style>
