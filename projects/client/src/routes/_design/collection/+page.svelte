<script lang="ts">
import Specimen from '$lib/design/Specimen.svelte';
import WatchPopover from '$lib/components/history/WatchPopover.svelte';
import CollectionLogos from '$lib/components/collection/CollectionLogos.svelte';
import { collectionBadges } from '$lib/components/collection/collectionBadges';
import CollectionMetadataFields from '$lib/components/collection/CollectionMetadataFields.svelte';
import type { CollectionMetadata } from '$lib/components/collection/CollectionMetadata';
import { toast } from '$lib/components/toast/toast.svelte';
import Icon from '$lib/icons/Icon.svelte';
import collection from '$lib/icons/trakt/collection.svg?raw';
import collectionThick from '$lib/icons/trakt/collection-thick.svg?raw';
import { librarySourceIcon } from '$lib/components/collection/librarySourceIcon';
import LibrarySyncLink from '$lib/components/collection/LibrarySyncLink.svelte';
const dates = { order: 'mdy', hour24: false, timeZone: 'America/Los_Angeles', weekStartDay: 0 } as const;
const examples = [
  { label: 'Add to library', mode: 'date', fill: 0, text: 'Add to library' },
  { label: 'In Library', mode: 'remove', fill: 1, text: 'In Library', detail: 'Oct 2, 2026' },
  { label: '50% in library', mode: 'partial', fill: 0.5, text: 'in library', percent: '50%', detail: '31/62 episodes' },
] as const;
let draft = $state<CollectionMetadata>({ media_type: 'bluray', resolution: 'hd_1080p' });
const shelf = [
  { media_type: 'bluray', resolution: 'uhd_4k', hdr: 'dolby_vision', audio: 'dolby_atmos', audio_channels: '7.1' },
  { media_type: 'dvd', audio: 'dts', audio_channels: '5.1' },
  { media_type: 'digital', resolution: 'hd_1080p' },
  { resolution: 'hd_720p' },
] as const;
const synced = [
  { label: 'Added by hand', icon: undefined },
  { label: 'Plex', icon: librarySourceIcon(['plex']) },
  { label: 'Jellyfin', icon: librarySourceIcon(['jellyfin']) },
] as const;
</script>
<Specimen title="Summary buttons"
  note="Not collected, collected and partly collected: date choices, optional metadata, removal and remaining episodes.">
  {#each examples as example (example.mode)}
    <div class="example">
      <WatchPopover collection label={example.label} variant="summary" fill={example.fill} plural={example.mode === 'partial'} datePreferences={dates}
        onopen={(force) => Promise.resolve(force ? 'date' : example.mode)} onwatch={(at) => toast.success(at === null ? 'Removed from library.' : `Collected: ${at}`)} onremaining={() => Promise.resolve(false)} oninvalid={() => toast.error('Choose a valid date.')}
        summary={{ icon: collection, text: example.text, percent: 'percent' in example ? example.percent : undefined, detail: 'detail' in example ? example.detail : undefined }}>
        {#snippet metadata(done, saving)}<CollectionMetadataFields value={draft} {saving} onsave={(value) => { draft = value; done(); }} />{/snippet}
      </WatchPopover>
    </div>
  {/each}
</Specimen>

<Specimen title="With metadata" note="The format and audio logos sit on the right; the tooltip spells them out.">
  {#each shelf as metadata, index (index)}
    {@const badges = collectionBadges(metadata)}
    {#snippet logos()}{#if badges}<CollectionLogos {badges} />{/if}{/snippet}
    <div class="example">
      <WatchPopover collection label="In Library" variant="summary" fill={1} datePreferences={dates}
        onopen={() => Promise.resolve('remove')} onwatch={() => {}} onremaining={() => Promise.resolve(false)}
        oninvalid={() => {}} summary={{ icon: collection, text: 'In Library', detail: 'Oct 2, 2026', aside: logos, tooltip: Object.values(metadata).join(' · ') }} />
    </div>
  {/each}
</Specimen>

<Specimen title="Poster icon">
  <WatchPopover collection label="Add to library" datePreferences={dates} onopen={() => Promise.resolve('date')}
    onwatch={(at) => toast.success(`Collected: ${at}`)} onremaining={() => Promise.resolve(false)}
    oninvalid={() => toast.error('Choose a valid date.')}>
    {#snippet trigger()}<Icon svg={collection} />{/snippet}
    {#snippet metadata(done, saving)}<CollectionMetadataFields value={draft} {saving} onsave={(value) => { draft = value; done(); }} />{/snippet}
  </WatchPopover>
</Specimen>

<Specimen title="Synced library"
  note="With adding off, an item not in the library gets a faded link to v3's sync settings. One in the library opens on removal and metadata, with no +, long press or Add remaining. Items synced from a media server show its icon.">
  <div class="example">
    <LibrarySyncLink variant="summary" />
  </div>
  {#each synced as { label, icon } (label)}
    <div class="example">
      <WatchPopover collection adding={false} label="In Library" variant="summary" fill={1} datePreferences={dates}
        removeNote={icon && `It may come back on the next ${icon.name} sync.`}
        onopen={() => Promise.resolve('remove')} onwatch={() => toast.success('Removed from library.')}
        onremaining={() => Promise.resolve(false)} oninvalid={() => {}}
        summary={{ icon: icon?.svg ?? collection, text: 'In Library', detail: label, tooltip: icon && `Synced from ${icon.name}` }}>
        {#snippet metadata(done, saving)}<CollectionMetadataFields value={draft} {saving} onsave={(value) => { draft = value; done(); }} />{/snippet}
      </WatchPopover>
    </div>
  {/each}
  <div class="posters">
    <LibrarySyncLink />
    {#each synced as { label, icon } (label)}
      <WatchPopover collection adding={false} {label} fill={1} datePreferences={dates} tooltip={label}
        onopen={() => Promise.resolve('remove')} onwatch={() => {}} onremaining={() => Promise.resolve(false)} oninvalid={() => {}}>
        {#snippet trigger()}<span class="glyph"><Icon svg={icon?.svg ?? collectionThick} /></span>{/snippet}
      </WatchPopover>
    {/each}
  </div>
</Specimen>

<style>
.example + .example {
  margin-block-start: var(--summary-action-stack-gap);
}
.posters {
  display: flex;
  margin-block-start: var(--summary-action-stack-gap);
  background-color: var(--color-card-bg);
  inline-size: max-content;
}
.glyph {
  display: contents;
  --icon-shift: var(--quick-icon-trakt-shift);
}
.example {
  max-inline-size: var(--collection-metadata-width);
}
</style>
