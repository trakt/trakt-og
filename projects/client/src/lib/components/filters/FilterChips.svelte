<!--
  The filters on, one removable chip each: red-tinted, its values comma-separated like the panel's field (a left-out
  one struck through, a chip that only leaves values out grey), a rating range led by its site's logo in place of
  its name. Values that
  don't fit end in an ellipsis, with the whole list in the chip's title. A sidebar's Applied Filters section shows them
  under its heading. Without `onremove` they're read only, the way the smart list dialog lists what it saves.
    <FilterChips chips={filterChips(…)} onremove={(id) => apply(withoutFilterTag(filters, id))} />
-->
<script lang="ts">
import Icon from '#lib/icons/Icon.svelte';
import xmark from '#lib/icons/solid/xmark.svg?raw';
import imdbLogo from '#lib/assets/sites/imdb-solid.svg';
import letterboxdLogo from '#lib/assets/sites/letterboxd.svg';
import malLogo from '#lib/assets/sites/mal.svg';
import tmdbLogo from '#lib/assets/sites/tmdb.svg';
import rtAudience from '#lib/assets/sites/rt/audience-upright.svg';
import rtFresh from '#lib/assets/sites/rt/tomatometer-fresh.svg';
import traktLogo from '#lib/assets/sites/trakt.png';
import { filterTagLabel } from './filterTagLabel.ts';
import type { FilterTag, TagSite } from './filterTags.ts';

interface Props {
  chips: readonly FilterTag[];
  onremove?: (id: string) => void;
}

const { chips, onremove }: Props = $props();

const plain = (chip: FilterTag) =>
  chip.values.map(({ text, without }) => (without ? `without ${text}` : text)).join(', ');

const sites: Record<TagSite, { logo: string; name: string }> = {
  trakt: { logo: traktLogo, name: 'Trakt' },
  imdb: { logo: imdbLogo, name: 'IMDb' },
  tmdb: { logo: tmdbLogo, name: 'TMDB' },
  rt: { logo: rtFresh, name: 'Rotten Tomatoes' },
  'rt-audience': { logo: rtAudience, name: 'Rotten Tomatoes Audience' },
  letterboxd: { logo: letterboxdLogo, name: 'Letterboxd' },
  mal: { logo: malLogo, name: 'MyAnimeList' },
};
</script>

<ul class="filter-chips">
  {#each chips as chip (chip.id)}
    {@const label = filterTagLabel(chip.id)}
    <li class={{ without: chip.values.every((value) => value.without) }} title="{label}: {plain(chip)}">
      {#if chip.site}<img src={sites[chip.site].logo} alt="" />{/if}
      <span class={chip.site ? 'visually-hidden' : 'label'}>{label}:</span>
      <span class="text">{#each chip.values as value, i (value.text)}{i > 0 ? ', ' : ''}{#if value.without}<span
            class="visually-hidden">without </span><s>{value.text}</s>{:else}{value.text}{/if}{/each}</span>
      {#if onremove}
        <button type="button" aria-label="Remove {label} filter" onclick={() => onremove(chip.id)}><Icon svg={xmark} /></button>
      {/if}
    </li>
  {/each}
</ul>

<style>
.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-base-block);
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
  max-inline-size: 100%;
  block-size: var(--sidebar-pill-height);
  padding-inline: var(--space-sm-inline) var(--space-xs-block);

  &:not(:has(button)) {
    padding-inline-end: var(--space-sm-inline);
  }
  border: 1px solid var(--color-sidebar-pill-set-border);
  border-radius: var(--radius-control);
  background-color: var(--color-sidebar-pill-set-bg);
  color: var(--color-frame-ink);
  font-size: var(--font-size-filter-chip);

  &.without {
    border-color: var(--color-sidebar-pill-border);
    background-color: var(--color-sidebar-pill-bg);
  }
}

img {
  inline-size: var(--filter-chip-site);
  block-size: var(--filter-chip-site);
  object-fit: contain;
}

.label {
  flex: none;
  color: var(--color-sidebar-pill-set-text);

  .without & {
    color: var(--color-sidebar-pill-text);
  }
}

.text {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

s {
  color: var(--color-sidebar-pill-set-text);
}

button {
  display: grid;
  flex: none;
  place-items: center;
  inline-size: var(--filter-chip-remove);
  block-size: var(--filter-chip-remove);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--color-sidebar-pill-set-text);
  font-size: var(--font-size-caret);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-sidebar-pill-set-border);
    color: var(--color-frame-ink);
  }
}
</style>
