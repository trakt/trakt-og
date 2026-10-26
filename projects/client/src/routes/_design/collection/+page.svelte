<script lang="ts">
import { page } from '$app/state';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import WatchPopover from '$lib/components/history/WatchPopover.svelte';
import CollectionLogoRow from '$lib/components/collection/CollectionLogoRow.svelte';
import { collectionBadges } from '$lib/components/collection/collectionBadges';
import CollectionMetadataFields from '$lib/components/collection/CollectionMetadataFields.svelte';
import type { CollectionMetadata } from '$lib/components/collection/CollectionMetadata';
import type { LibrarySource } from '$lib/components/collection/LibrarySource';
import { librarySourceIcon } from '$lib/components/collection/librarySourceIcon';
import LibraryTip from '$lib/components/collection/LibraryTip.svelte';
import MediaCollection from '$lib/components/collection/MediaCollection.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import Icon from '$lib/icons/Icon.svelte';
import collection from '$lib/icons/trakt/collection.svg?raw';
import collectionThick from '$lib/icons/trakt/collection-thick.svg?raw';
import { formatDate } from '$lib/utils/formatDate';
import { breakingBad, noWayHome } from '../summary/fixtures.ts';

const dates = $derived(page.data.datePreferences);
const collectedAt = $derived(formatDate('2026-10-02T20:15:00Z', { ...dates, time: true }));
const added = $derived(formatDate('2026-10-02T20:15:00Z', dates));
// Sample library items, the way MediaCollection draws each once it's in the library: synced or not, with metadata or not.
const synced: { label: string; sources?: LibrarySource[]; metadata?: CollectionMetadata }[] = [
  { label: 'Added by hand' },
  { label: 'Synced from Plex', sources: ['plex'] },
  { label: 'Synced from Jellyfin', sources: ['jellyfin'] },
  {
    label: 'Synced, with metadata',
    sources: ['plex'],
    metadata: {
      media_type: 'bluray',
      resolution: 'uhd_4k',
      hdr: 'dolby_vision',
      audio: 'dolby_atmos',
      audio_channels: '7.1',
    },
  },
];
let drafts = $state<Record<string, CollectionMetadata>>({});
const removed = () => toast.success('Removed from library.');
</script>

<Specimen title="Summary button" row
  note="Not in the library, there's no button: adding is off. In it, it opens on removal and metadata, with no + or add date. A synced item shows its server's icon.">
  {#each synced as { label, sources, metadata: saved } (label)}
    {@const source = librarySourceIcon(sources)}
    {@const badges = collectionBadges(saved)}
    {#snippet logos()}{#if badges}<CollectionLogoRow {badges} align="start" />{/if}{/snippet}
    <Variant {label}>
      <div class="example">
        <WatchPopover collection adding={false} hasMetadata={Boolean(saved)} label="In Library" variant="summary"
          fill={1} datePreferences={dates} removeNote={source && `It may come back on the next ${source.name} sync.`}
          onopen={() => Promise.resolve('remove')} onwatch={removed} onremaining={() => Promise.resolve(false)}
          oninvalid={() => {}}
          summary={{
            icon: source?.svg ?? collection,
            text: 'In Library',
            detail: collectedAt,
            footer: badges ? logos : undefined,
          }}>
          {#snippet metadata(done, saving)}
            <CollectionMetadataFields value={drafts[label] ?? saved ?? {}} {saving}
              onsave={(value) => { drafts[label] = value; done(); }} />
          {/snippet}
        </WatchPopover>
      </div>
    </Variant>
  {/each}
</Specimen>

<Specimen title="Your library" row
  note="The real button on a movie and a show, with the signed-in viewer's own library.">
  <Variant label="Movie">
    <div class="example">
      <MediaCollection target={{ type: 'movie', id: noWayHome.id, title: noWayHome.fullTitle, released: true }}
        variant="summary" />
    </div>
  </Variant>
  <Variant label="Show">
    <div class="example">
      <MediaCollection variant="summary" target={{
        type: 'show',
        id: breakingBad.id,
        title: breakingBad.title,
        airedEpisodes: breakingBad.airedEpisodes,
        released: true,
      }} />
    </div>
  </Variant>
</Specimen>

<Specimen title="Poster icons"
  note="The same states in a card's quick-icon bar, which has no library icon for what isn't in it: by hand, Plex, Jellyfin and Plex with metadata. Each tooltip is the library card: the date, its format logos and its server.">
  <div class="posters">
    {#each synced as { label, sources, metadata: saved } (label)}
      {@const source = librarySourceIcon(sources)}
      {#snippet tip()}<LibraryTip tip={{ added, metadata: saved, sources }} />{/snippet}
      <WatchPopover collection adding={false} label="In Library" fill={1} datePreferences={dates} tooltip={tip}
        removeNote={source && `It may come back on the next ${source.name} sync.`}
        onopen={() => Promise.resolve('remove')} onwatch={removed} onremaining={() => Promise.resolve(false)}
        oninvalid={() => {}}>
        {#snippet trigger()}<span class="glyph"><Icon svg={source?.svg ?? collectionThick} /></span>{/snippet}
      </WatchPopover>
    {/each}
  </div>
</Specimen>

<style>
.example {
  inline-size: var(--watch-date-width);
}

.posters {
  display: flex;
  inline-size: max-content;
  background-color: var(--color-card-bg);
}

.glyph {
  display: contents;
  --icon-shift: var(--quick-icon-trakt-shift);
}
</style>
