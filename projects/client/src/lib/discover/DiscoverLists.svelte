<!--
  Discover's lists for the month's theme, under the standard panel heading, with toggles to sort them (trending this
  week, most liked, most comments, recently updated): six cards, three across. The list's first poster, blown up and blurred, fills each card in the list's colours, darkening
  towards the foot, with everything on it: the rank and this week's likes, the poster fan (hovering opens the poster
  under the pointer), the owner's avatar beside the name and "by" line, and the counts at the bottom.
-->
<script lang="ts">
import PanelHeading from '$lib/components/dashboard/PanelHeading.svelte';
import VipLabel from '$lib/components/labels/VipLabel.svelte';
import Icon from '$lib/icons/Icon.svelte';
import listIcon from '$lib/icons/regular/list.svg?raw';
import comment from '$lib/icons/regular/comment.svg?raw';
import file from '$lib/icons/regular/file.svg?raw';
import thumbsUp from '$lib/icons/regular/thumbs-up.svg?raw';
import { sortThemeLists } from './sortThemeLists.ts';
import type { ThemeList } from './ThemeList.ts';
import { themeListSorts } from './themeListSorts.ts';
import ToggleChips from './ToggleChips.svelte';

interface Props {
  lists: readonly ThemeList[];
  season: string;
}

const { lists, season }: Props = $props();
let sort = $state<(typeof themeListSorts)[number]['id']>('trending');
const shown = $derived(sortThemeLists(lists, sort));
const count = (n: number) => n.toLocaleString('en-US');
const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);
</script>

<!-- List and user hrefs are built from ids and slugs, which resolve() can't type. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if lists.length > 0}
  <section id="lists" class="lists" aria-labelledby="theme-lists-heading">
  <PanelHeading id="theme-lists-heading" title="{season} Lists" icon={listIcon} />
  <div class="controls">
    <ToggleChips label="Sort lists" options={themeListSorts} bind:selected={sort} />
  </div>
  <ul>
      {#each shown as tile, index (tile.id)}
        <li>
          <article class="tile">
            {#if tile.posters[0]}<img class="backdrop" src={tile.posters[0]} alt="" loading="lazy" />{/if}
            <div class="media">
              <p class="pills">
                <span class="pill">#{index + 1}</span>
                {#if tile.weekLikes}<span class="pill week">+{count(tile.weekLikes)} likes this week</span>{/if}
              </p>
              <a class="fan" href={tile.href} tabindex="-1" aria-hidden="true">
                {#each tile.posters as poster, slot (slot)}
                  <span class="fan-item"><img src={poster} alt="" loading="lazy" decoding="async" /></span>
                {/each}
              </a>
            </div>
            <div class="body">
              <div class="head">
                <img class="avatar" src={tile.owner.avatar} alt="" loading="lazy" decoding="async" />
                <h3><a href={tile.href} title={tile.name}>{tile.name}</a></h3>
                <p class="by">
                  <span>by <a href={tile.owner.href}>{tile.owner.name}</a></span>
                  {#if tile.owner.vip}<VipLabel badge={tile.owner.vip} pill />{/if}
                </p>
              </div>
              <p class="counts">
                <span class="stat"><Icon svg={file} /><strong>{count(tile.items)}</strong>
                  {plural(tile.items, 'item')}</span>
                <span class="stat"><Icon svg={thumbsUp} /><strong>{count(tile.likes)}</strong>
                  {plural(tile.likes, 'like')}</span>
                {#if tile.comments !== undefined}
                  <span class="stat"><Icon svg={comment} /><strong>{count(tile.comments)}</strong>
                    {plural(tile.comments, 'comment')}</span>
                {/if}
              </p>
            </div>
          </article>
        </li>
      {/each}
    </ul>
</section>
{/if}

<style>
.lists {
  container-type: inline-size;
  display: grid;
  gap: var(--discover-heading-margin);
  background: none;
}

.controls {
  margin-block-end: var(--discover-controls-gap);
}

ul {
  display: grid;
  grid-template-columns: repeat(var(--columns, 1), minmax(0, 1fr));
  gap: var(--list-tile-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

@container (width >= 600px) {
  ul {
    --columns: 2;
  }
}

@container (width >= 900px) {
  ul {
    --columns: 3;
  }
}

.tile {
  position: relative;
  isolation: isolate;
  /* Over the blurred poster in both themes. */
  color-scheme: dark;
  display: flex;
  flex-direction: column;
  block-size: 100%;
  overflow: hidden;
  border-radius: var(--radius-list-tile);
  background-color: var(--color-list-tile-bg);
  color: var(--color-discover-text);

  /* Darker towards the foot, under the text. */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--list-tile-shade);
  }
}

.media {
  display: grid;
  gap: var(--list-tile-media-gap);
  padding: var(--list-tile-media-padding);
}

/* The first poster, blown up and blurred, fills the card in the list's colours. */
.backdrop {
  position: absolute;
  inset: calc(var(--list-tile-backdrop-bleed) * -1);
  inline-size: calc(100% + var(--list-tile-backdrop-bleed) * 2);
  max-inline-size: none;
  block-size: calc(100% + var(--list-tile-backdrop-bleed) * 2);
  object-fit: cover;
  filter: var(--filter-list-tile-backdrop);
  z-index: -2;
}

/* The poster fan: the first poster at full width, the rest sharing what's left; the hovered one opens up. */
.fan {
  display: flex;
  block-size: var(--list-tile-fan-height);
  overflow: hidden;
  border-radius: var(--radius-list-tile-fan);
  box-shadow: var(--shadow-list-tile-fan-frame);
}

.fan-item {
  position: relative;
  flex: 1 1 0;
  min-inline-size: 0;
  overflow: hidden;
  box-shadow: var(--shadow-list-tile-fan);

  &:first-child {
    flex: 0 0 var(--list-tile-fan-first);
    box-shadow: none;
  }

  .fan:hover & {
    flex: 1 1 0;
  }

  .fan:hover &:hover {
    flex: 0 0 var(--list-tile-fan-first);
  }

  & img {
    position: absolute;
    inset-block: 0;
    inset-inline-end: 0;
    inline-size: var(--list-tile-fan-first);
    max-inline-size: none;
    block-size: 100%;
    object-fit: cover;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .fan-item {
    transition: flex var(--transition-list-tile-fan);
  }
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--list-tile-by-gap);
  margin: 0;
}

.pill {
  padding: var(--list-tile-pill-padding);
  border-radius: var(--radius-sm);
  background-color: var(--color-list-tile-rank-bg);
  color: var(--color-discover-on-image);
  font-size: var(--font-size-list-tile-pill);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-list-tile-pill);
  text-transform: uppercase;
}

.week {
  background-color: var(--season-accent);
}

.body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--list-tile-body-gap);
  padding: var(--list-tile-body-padding);

  & p {
    margin: 0;
  }
}

/* The avatar beside two lines: the name, then the owner. */
.head {
  display: grid;
  grid-template-columns: var(--list-tile-avatar) minmax(0, 1fr);
  align-items: center;
  gap: var(--list-tile-head-gap);
}

h3 {
  margin: 0;
  overflow: hidden;
  font-size: var(--font-size-list-tile-name);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-headings);
  text-overflow: ellipsis;
  white-space: nowrap;

  & a {
    color: var(--color-discover-text);

    &:is(:hover, :focus-visible) {
      color: var(--color-link);
      text-decoration: none;
    }
  }
}

.by {
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: var(--list-tile-by-gap);
  color: var(--color-discover-muted);
  font-size: var(--font-size-list-tile-meta);

  & a {
    color: var(--color-discover-text);
    font-weight: var(--font-weight-headings);
  }
}

.avatar {
  grid-row: span 2;
  inline-size: var(--list-tile-avatar);
  block-size: var(--list-tile-avatar);
  border-radius: 50%;
  object-fit: cover;
}

.counts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--list-tile-counts-gap);
  margin-block-start: auto;
  padding-block-start: var(--list-tile-body-gap);
  padding-inline-start: var(--list-tile-counts-inset);
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: var(--list-tile-stat-gap);
  color: var(--color-discover-muted);
  font-size: var(--font-size-list-tile-meta);
  white-space: nowrap;

  & :global(svg) {
    color: var(--brand-secondary);
    font-size: var(--font-size-list-tile-stat-icon);
  }

  & strong {
    color: var(--color-discover-text);
    font-size: var(--font-size-list-tile-stat);
    font-weight: var(--font-weight-headings-heavy);
    font-variant-numeric: tabular-nums;
  }
}
</style>
