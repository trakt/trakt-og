<!--
  The filters on, as removable chips: red-tinted, a left-out value struck through, a rating range led by its site's
  logo, a service by its name. A sidebar's Applied Filters section shows them under its heading.
    <FilterChips chips={[...filterTags(filters), ...services]} onremove={(id) => apply(withoutFilterTag(filters, id))} />
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import xmark from '$lib/icons/solid/xmark.svg?raw';
import imdbLogo from '$lib/assets/sites/imdb-clean.png';
import rtAudience from '$lib/assets/sites/rt/audience-upright.svg';
import rtFresh from '$lib/assets/sites/rt/tomatometer-fresh.svg';
import traktLogo from '$lib/assets/sites/trakt.png';
import type { FilterTag, TagSite } from './filterTags.ts';

interface Props {
  chips: readonly FilterTag[];
  onremove: (id: string) => void;
  /** Removing does nothing for viewers who can't filter (OG kept filters for VIPs). */
  disabled?: boolean;
}

const { chips, onremove, disabled = false }: Props = $props();

const sites: Record<TagSite, { logo: string; name: string }> = {
  trakt: { logo: traktLogo, name: 'Trakt' },
  imdb: { logo: imdbLogo, name: 'IMDb' },
  rt: { logo: rtFresh, name: 'Rotten Tomatoes' },
  'rt-audience': { logo: rtAudience, name: 'Rotten Tomatoes Audience' },
};
</script>

<ul class="filter-chips">
  {#each chips as chip (chip.id)}
    <li class={{ without: chip.without }}>
      {#if chip.site}<img src={sites[chip.site].logo} alt="{sites[chip.site].name} " />{/if}
      {#if chip.without}<span class="visually-hidden">Without </span>{/if}<span class="text">{chip.text}</span>
      <button type="button" aria-label="Remove {chip.without ? 'without ' : ''}{chip.text}" {disabled}
        onclick={() => onremove(chip.id)}><Icon svg={xmark} /></button>
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
  border: 1px solid var(--color-sidebar-pill-set-border);
  border-radius: var(--radius-control);
  background-color: var(--color-sidebar-pill-set-bg);
  color: var(--color-frame-text);
  font-size: var(--font-size-small);

  &.without {
    border-color: var(--color-sidebar-pill-border);
    background-color: var(--color-sidebar-pill-bg);

    & .text {
      color: var(--color-sidebar-pill-set-text);
      text-decoration: line-through;
    }
  }
}

img {
  inline-size: var(--filter-chip-site);
  block-size: var(--filter-chip-site);
  object-fit: contain;
}

.text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

button {
  display: grid;
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

  &:is(:hover, :focus-visible):not(:disabled) {
    background-color: var(--color-sidebar-pill-set-border);
    color: var(--color-frame-text);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
}
</style>
