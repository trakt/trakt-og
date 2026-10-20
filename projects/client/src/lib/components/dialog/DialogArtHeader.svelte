<!--
  The art header on top of the notes and list dialogs: the item's fanart, a strip of the list's posters, or a striped
  placeholder for a new list, under a dark glass shade, with card tags over the title and `children` under it (a
  report's permalink). Pass it the id a Dialog `header` snippet hands over. Goes with `<Dialog variant="art">`, whose glass close sits in its corner.
    <DialogArtHeader {id} title="The Social Network" year={2010} fanart={url} tags={[{ text: 'Favorite', kind: 'favorite' }]} />
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import CardTag from '$lib/components/media/CardTag.svelte';
import type { CardTag as Tag } from '$lib/components/media/CardTag';

interface Props {
  id: string;
  title: string;
  year?: number | null;
  tags?: readonly Tag[];
  fanart?: string;
  /** A list's first posters, side by side, when there's no fanart. */
  posters?: readonly string[];
  children?: Snippet;
}

const { id, title, year, tags = [], fanart, posters = [], children }: Props = $props();
</script>

<header class="art-header">
  {#if fanart}
    <img class="art" src={fanart} alt="" />
  {:else if posters.length > 0}
    <div class="art posters">{#each posters as poster, i (i)}<img src={poster} alt="" />{/each}</div>
  {:else}
    <div class="art empty"></div>
  {/if}
  <div class="titles">
    {#if tags.length > 0}<p class="tags">{#each tags as tag, i (i)}<CardTag {...tag} />{/each}</p>{/if}
    <h2 {id}>{title}{#if year}<span class="year">{year}</span>{/if}</h2>
    {@render children?.()}
  </div>
</header>

<style>
.art-header {
  position: relative;
  display: grid;
  align-content: end;
  min-block-size: var(--dialog-art-header-min-height);
  overflow: hidden;
  color: var(--color-card-text);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background: var(--gradient-dialog-art-shade);
  }
}

.art {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  object-position: center 30%;
}

.posters {
  display: flex;

  & img {
    flex: 1;
    min-inline-size: 0;
    object-fit: cover;
  }
}

.empty {
  background: var(--gradient-dialog-art-empty);
}

/* Clear of the glass close in the corner. */
.titles {
  position: relative;
  z-index: 2;
  display: grid;
  gap: var(--dialog-art-header-gap);
  padding: var(--dialog-art-header-padding);
  padding-inline-end: calc(var(--dialog-art-close-size) + 2 * var(--dialog-art-close-offset));
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--dialog-art-tags-gap);
  margin: 0;
}

h2 {
  margin: 0;
  font-family: var(--font-headings);
  font-size: var(--font-size-dialog-art-title);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-dialog-art-title);
  text-shadow: var(--text-shadow-headings);
  text-wrap: balance;
}

.year {
  margin-inline-start: var(--dialog-art-year-gap);
  color: var(--color-dialog-art-year);
  font-weight: var(--font-weight-headings-light);
}
</style>
