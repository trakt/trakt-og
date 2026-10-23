<!--
  "Bring your history": TV Time, IMDb and Letterboxd as three logo tiles, each opening that importer on v3 web in a
  new tab. The welcome wall leads with it, since an import fills an account faster than anything else.
-->
<script lang="ts">
import imdb from '$lib/assets/sites/imdb-solid.svg';
import letterboxd from '$lib/assets/sites/letterboxd.svg';
import { traktUrls } from '$lib/traktUrls';

const sources = [
  { id: 'tvtime', name: 'TV Time', note: 'Shows, movies and progress' },
  { id: 'imdb', name: 'IMDb', note: 'Ratings and watchlist', logo: imdb },
  { id: 'letterboxd', name: 'Letterboxd', note: 'Films, ratings and watchlist', logo: letterboxd },
] as const;
</script>

<!-- Each tile opens an import page on trakt.tv, outside this app. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="import">
  {#each sources as source (source.id)}
    <a class="tile" href={traktUrls.importFrom(source.id)} target="_blank" rel="noopener">
      {#if 'logo' in source}
        <img class={['logo', source.id]} src={source.logo} alt="" />
      {:else}
        <span class="wordmark">{source.name}</span>
      {/if}
      <span class="label">
        <span class="name">Import from {source.name}</span>
        <span class="note">{source.note}</span>
      </span>
    </a>
  {/each}
</div>

<style>
.import {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (width < 768px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.tile {
  display: flex;
  align-items: center;
  gap: 12px;
  min-block-size: var(--import-tile-height);
  padding: 10px 14px;
  border: 1px solid var(--color-import-tile-line);
  border-radius: var(--radius-object);
  background: var(--color-import-tile-glass);
  backdrop-filter: var(--blur-import-tile);
  color: var(--color-first-night-text);
  text-decoration: none;
  transition: background-color 0.2s;

  &:is(:hover, :focus-visible) {
    background: color-mix(in srgb, var(--color-import-tile-glass), white 8%);
    color: var(--color-first-night-text);
    text-decoration: none;
  }
}

.logo {
  flex: none;
  block-size: var(--import-logo-height);
}

/* TV Time's yellow, as a wordmark tile until its logo file is in the assets. */
.wordmark {
  flex: none;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--color-tv-time);
  color: var(--color-tv-time-text);
  font-weight: 900;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.label {
  display: grid;
  min-inline-size: 0;
}

.name {
  font-weight: var(--font-weight-headings-heavy);
}

.note {
  color: var(--color-first-night-dim);
  font-size: var(--font-size-small);
}
</style>
