<!--
  The Last 30 Days keys over the minutes chart: time watched, episodes, movies and the best week, in the genre
  keys' style. The episode and movie keys take their bars' colors for the rule over them, so they double as the
  chart's legend. The profile's ratings keys use it too, a key about one rating ruled in that rating's color, as do
  the stats page's Quality Over Time highlights, each with its own `color` and `icon`, and counts already split
  for a bold name (`{ value: '8x04', text: 'The Bells' }`). The
  counts sit under a short rule, a tad apart from the share, each number bold in the key's ink (`splitCount`).
-->
<script lang="ts">
import Icon from '#lib/icons/Icon.svelte';
import { splitCount } from './splitCount.ts';

/** A count line: split for its bold number by `splitCount`, or already split, for a bold name like "8x04". */
type Count = string | { readonly value: string; readonly text?: string };

type Key = {
  readonly name: string;
  readonly share: string;
  readonly counts: readonly Count[];
  /** Rules it like that play type's bars. */
  readonly type?: string;
  /** Rules it in that 1 to 10 rating's color. */
  readonly rating?: number;
  /** Rules it, and colors its icon, in this CSS color instead. */
  readonly color?: string;
  /** Raw SVG before its name. */
  readonly icon?: string;
};

const { keys }: { keys: readonly Key[] } = $props();

const color = (key: Key) => {
  if (key.color) return key.color;
  if (key.type) return `var(--color-minutes-${key.type})`;
  if (key.rating) return `var(--rating-${key.rating})`;
  return undefined;
};
</script>

<div class="watched-keys">
  <ul class="keys" style:--key-columns={Math.min(keys.length, 4)}>
  {#each keys as key (key.name)}
    <li class="key" style:--color={color(key)}>
      <span class="name">{#if key.icon}<span class="glyph"><Icon svg={key.icon} /></span>{/if}{key.name}</span>
      <span class="share">{key.share}</span>
      {#if key.counts.length > 0}
        <span class="counts">
          {#each key.counts as count, i (count)}{@const { value, text } = typeof count === 'string' ? splitCount(count) : count}{#if i > 0}<span
              class="separator" aria-hidden="true">·</span>{/if}<span>{#if value}<b>{value}</b>{/if}{value && text
                ? ' '
                : ''}{text ?? ''}</span>{/each}
        </span>
      {/if}
    </li>
  {/each}
  </ul>
</div>

<style>
.watched-keys {
  container-type: inline-size;
}

.keys {
  display: grid;
  grid-template-columns: repeat(var(--key-columns), minmax(0, 1fr));
  gap: var(--space-genre-keys-row) var(--space-genre-keys-column);
  margin: 0;
  padding: 0;
  list-style: none;
}

.key {
  min-inline-size: 0;
  padding-block-start: var(--space-genre-key-top);
  border-block-start: var(--genre-key-rule) solid var(--color, var(--color-genre-other));
}

.name {
  display: block;
  overflow: hidden;
  color: var(--color-genre-label);
  font-family: var(--font-headings);
  font-size: var(--font-size-genre-label);
  font-weight: var(--font-weight-headings);
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.glyph {
  display: inline-flex;
  margin-inline-end: var(--strip-item-gap);
  color: var(--color);
  vertical-align: middle;
}

.share {
  display: block;
  color: var(--color-genre-label);
  font-family: var(--font-headings);
  font-size: var(--font-size-genre-share);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-genre-share);
}

.counts {
  display: block;
  margin-block-start: var(--space-genre-counts-rule);
  padding-block-start: var(--space-genre-counts-rule);
  border-block-start: 1px solid var(--color-genre-divider);
  color: var(--color-genre-count);
  font-size: var(--font-size-genre-key-count);
  font-variant-numeric: tabular-nums;

  /* The number in the key's ink, its words gray: the count is what you scan for. */
  & b {
    color: var(--color-genre-label);
    font-weight: var(--font-weight-headings-heavy);
  }
}

.separator {
  margin-inline: var(--space-genre-separator);
}

/* Narrow: two keys a row. */
@container (width < 600px) {
  .keys {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
