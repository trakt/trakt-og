<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import WatchPopover from '$lib/components/history/WatchPopover.svelte';
import CollectionLogos from '$lib/components/collection/CollectionLogos.svelte';
import { collectionBadges } from '$lib/components/collection/collectionBadges';
import CollectionMetadataFields from '$lib/components/collection/CollectionMetadataFields.svelte';
import type { CollectionMetadata } from '$lib/components/collection/CollectionMetadata';
import { toast } from '$lib/components/toast/toast.svelte';
import Icon from '$lib/icons/Icon.svelte';
import collection from '$lib/icons/trakt/collection.svg?raw';
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
</script>
<svelte:head>
  <title>Collection controls · og design system</title>
</svelte:head>
<Container>
  <section>
    <h1>Library controls</h1>
    <p>Optional metadata, date choices, removal and remaining episodes.</p>
    {#each examples as example (example.mode)}
      <h2>{example.mode}</h2>
      <div class="example">
        <WatchPopover collection label={example.label} variant="summary" fill={example.fill} plural={example.mode === 'partial'} datePreferences={dates}
          onopen={(force) => Promise.resolve(force ? 'date' : example.mode)} onwatch={(at) => toast.success(at === null ? 'Removed from library.' : `Collected: ${at}`)} onremaining={() => Promise.resolve(false)} oninvalid={() => toast.error('Choose a valid date.')}
          summary={{ icon: collection, text: example.text, percent: 'percent' in example ? example.percent : undefined, detail: 'detail' in example ? example.detail : undefined }}>
          {#snippet metadata(done, saving)}<CollectionMetadataFields value={draft} {saving} onsave={(value) => { draft = value; done(); }} />{/snippet}
        </WatchPopover>
      </div>
    {/each}
    <h2>Summary button with metadata</h2>
    <p>The format and audio logos sit on the right; the tooltip spells them out.</p>
    {#each shelf as metadata, index (index)}
      {@const badges = collectionBadges(metadata)}
      {#snippet logos()}{#if badges}<CollectionLogos {badges} />{/if}{/snippet}
      <div class="example">
        <WatchPopover collection label="In Library" variant="summary" fill={1} datePreferences={dates}
          onopen={() => Promise.resolve('remove')} onwatch={() => {}} onremaining={() => Promise.resolve(false)}
          oninvalid={() => {}} summary={{ icon: collection, text: 'In Library', detail: 'Oct 2, 2026', aside: logos, tooltip: Object.values(metadata).join(' · ') }} />
      </div>
    {/each}
    <h2>Poster library icon</h2>
    <WatchPopover collection label="Add to library" datePreferences={dates} onopen={() => Promise.resolve('date')} onwatch={(at) => toast.success(`Collected: ${at}`)} onremaining={() => Promise.resolve(false)} oninvalid={() => toast.error('Choose a valid date.')}>
      {#snippet trigger()}<Icon svg={collection} />{/snippet}
      {#snippet metadata(done, saving)}<CollectionMetadataFields value={draft} {saving} onsave={(value) => { draft = value; done(); }} />{/snippet}
    </WatchPopover>
  </section>
</Container>
<style>
section {
  padding-block: calc(var(--header-height) + var(--gutter)) var(--gutter);
}
.example + .example {
  margin-block-start: var(--summary-action-stack-gap);
}
.example {
  max-inline-size: var(--collection-metadata-width);
}
</style>
