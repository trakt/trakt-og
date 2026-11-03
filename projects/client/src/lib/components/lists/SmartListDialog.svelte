<!--
  Saves a chart's filters as a smart list, or renames one and changes who sees it, in the list editor's look: the art
  header (the chart's top fanart, or the striped placeholder) with where it fills from as a smart list purple tag,
  then name and privacy, then the filters as read-only chips. At the smart list limit, Save is off and a notice says why.
    <SmartListDialog bind:open source="Trending shows" {chips} onsave={({ name, privacy }) => save(name, privacy)} />
-->
<script lang="ts">
import Dialog from '$lib/components/dialog/Dialog.svelte';
import ChoiceDropdown from '$lib/components/dialog/ChoiceDropdown.svelte';
import DialogArtHeader from '$lib/components/dialog/DialogArtHeader.svelte';
import DialogForm from '$lib/components/dialog/DialogForm.svelte';
import DialogNotice from '$lib/components/dialog/DialogNotice.svelte';
import FieldLabel from '$lib/components/dialog/FieldLabel.svelte';
import FilterChips from '$lib/components/filters/FilterChips.svelte';
import type { FilterTag } from '$lib/components/filters/filterTags';
import type { CardTag } from '$lib/components/media/CardTag';
import globe from '$lib/icons/solid/globe.svg?raw';
import lockKeyhole from '$lib/icons/solid/lock-keyhole.svg?raw';
import friends from '$lib/icons/trakt/friends-thick.svg?raw';
import sparkles from '$lib/icons/solid/sparkles.svg?raw';
import type { SmartListPrivacy } from '$lib/lists/smart/SmartList';
import { traktUrls } from '$lib/traktUrls';
import { AnalyticsEvent } from '$lib/analytics/AnalyticsEvent';
import { useTrack } from '$lib/analytics/useTrack';
import { trackUpsellImpression } from '$lib/analytics/trackUpsellImpression';

interface Props {
  open: boolean;
  /** Renaming an existing list instead of saving a new one. */
  editing?: boolean;
  initial?: { name: string; privacy: SmartListPrivacy };
  /** Where the titles come from: "Trending shows". */
  source: string;
  chips: readonly FilterTag[];
  fanart?: string;
  busy?: boolean;
  /** The account holds as many smart lists as it may. */
  atLimit?: boolean;
  vip?: boolean;
  error?: string;
  onsave: (list: { name: string; privacy: SmartListPrivacy }) => void;
  onclose?: () => void;
}

let {
  open = $bindable(),
  editing = false,
  initial,
  source,
  chips,
  fanart,
  busy = false,
  atLimit = false,
  vip = false,
  error = '',
  onsave,
  onclose,
}: Props = $props();
const id = $props.id();

// svelte-ignore state_referenced_locally
let name = $state(initial?.name ?? '');
// svelte-ignore state_referenced_locally
let privacy = $state<SmartListPrivacy>(initial?.privacy ?? 'private');

// Public or private, like trakt-web's switch: the API lists a friends-only smart list to its owner alone, so friends
// can't find it. A list saved that way elsewhere keeps its Following until it's changed.
const PRIVACY = $derived<readonly { value: SmartListPrivacy; label: string; svg: string }[]>([
  { value: 'private', label: 'Private', svg: lockKeyhole },
  ...(initial?.privacy === 'friends' ? [{ value: 'friends' as const, label: 'Following', svg: friends }] : []),
  { value: 'public', label: 'Public', svg: globe },
]);
const heading = $derived(editing ? 'Update Smart List' : 'Save filters as a smart list');
const tags = $derived<readonly CardTag[]>([{ text: source, icon: sparkles, color: 'var(--color-list-chip-smart)' }]);

const { track: trackVipUpsell } = useTrack(AnalyticsEvent.VipUpsell);
</script>

<!-- VIP destination is an external Trakt account page. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Dialog bind:open title={heading} size="md" variant="art" {onclose}>
  {#snippet header(titleId)}<DialogArtHeader id={titleId} title={heading} {fanart} {tags} />{/snippet}
  <DialogForm save={busy ? 'Saving…' : 'Save'} {busy} disabled={(atLimit && !editing) || !name.trim()}
    onsubmit={() => onsave({ name: name.trim(), privacy })} oncancel={() => (open = false)}>
    {#if atLimit && !editing}
      <DialogNotice role="alert">You've reached your smart list limit.
        {#if !vip}<a href={traktUrls.vipFor('smart-list')} target="_blank" rel="noopener"
          onclick={() => trackVipUpsell({ source: 'smart-list' })} {@attach trackUpsellImpression('smart-list')}>Upgrade to VIP</a> to save more.{/if}
      </DialogNotice>
    {/if}
    {#if error}<DialogNotice tone="danger" role="alert">{error}</DialogNotice>{/if}
    <div>
      <FieldLabel text="Name" for="{id}-name" />
      <input id="{id}-name" required maxlength="255" bind:value={name} disabled={busy} />
    </div>
    <ChoiceDropdown label="Privacy" options={PRIVACY} bind:value={privacy} disabled={busy} />
    {#if !editing}
      <div class="filters">
        <FieldLabel text="Filters" id="{id}-filters" />
        {#if chips.length > 0}
          <div aria-labelledby="{id}-filters" role="group"><FilterChips {chips} /></div>
        {:else}
          <p class="note">Every title on {source}.</p>
        {/if}
      </div>
    {/if}
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

.note {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}
</style>
