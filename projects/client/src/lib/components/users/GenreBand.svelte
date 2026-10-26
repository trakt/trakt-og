<!--
  The profile's Most Watched Genres: one band split by each genre's share, the top six in color and the rest folded
  into a striped "Other" piece. The key under it names every piece and links its counts to the history filtered by
  the genre; "Other" opens a list of the rest. Hovering a piece or a key, or focusing a key, picks it out and shows
  its numbers over the band. The band and that card are decoration: the key carries everything.
-->
<script lang="ts">
import TooltipBox from '$lib/components/tooltip/TooltipBox.svelte';
import TooltipStat from '$lib/components/tooltip/TooltipStat.svelte';
import type { GenreBar } from '$lib/users/profile/toGenreBar';
import { type BandWords, toGenreBand } from '$lib/users/profile/toGenreBand';

/** `words` names the pieces when they aren't genres. */
const { genres, words }: { genres: readonly GenreBar[]; words?: BandWords } = $props();
const id = $props.id();

const band = $derived(toGenreBand(genres, words));
/** The picked piece: a slice's index, or the slice count for Other. */
let hot = $state<number | null>(null);
let open = $state(false);
const picked = $derived(hot === null ? null : (band.slices.at(hot) ?? band.other));
const tipLines = $derived(
  picked
    ? [
      ...picked.tip.lines.map(({ type, text }) => ({ text, color: `var(--color-genre-${type})` })),
      { ...picked.tip.footer, muted: true },
    ]
    : [],
);

const pick = (i: number) => () => (hot = i);
const unpick = () => (hot = null);
const toggle = () => (open = !open);
</script>

<!-- The history page doesn't take a genre filter from a resolved route yet. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet counts(links: GenreBar['counts'])}
  {#each links as count, i (count.href)}{#if i > 0}<span class="separator">·</span>{/if}<a
  href={count.href}>{count.text}</a>{/each}
{/snippet}

<div class={['genre-band', { dim: hot !== null }]}>
  <div class="band" aria-hidden="true">
    {#each band.slices as slice, i (slice.slug)}
      <!-- The band is hidden from assistive tech; its key below is what they get. -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class={['piece', { hot: hot === i }]}
        style:flex-grow={slice.grow}
        style:--color="var(--color-genre-slot-{slice.slot})"
        onpointerenter={pick(i)}
        onpointerleave={unpick}
      ></div>
    {/each}
    {#if band.other}
      <!-- A mouse shortcut for the Other key's button, which is the control keyboards and screen readers get. -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div
        class={['piece', 'other', { hot: hot === band.slices.length }]}
        style:flex-grow={band.other.grow}
        onpointerenter={pick(band.slices.length)}
        onpointerleave={unpick}
        onclick={toggle}
      ></div>
    {/if}
  </div>

  {#if picked}
    <div class="tip" aria-hidden="true" style:--center={picked.center}>
      <TooltipBox><TooltipStat label={picked.tip.title} value={picked.tip.share} lines={tipLines} /></TooltipBox>
    </div>
  {/if}

  <ol class="keys" style:--keys={band.slices.length + (band.other ? 1 : 0)}>
    {#each band.slices as slice, i (slice.slug)}
      <li
        class={['key', { hot: hot === i }]}
        style:--color="var(--color-genre-slot-{slice.slot})"
        onpointerenter={pick(i)}
        onpointerleave={unpick}
        onfocusin={pick(i)}
        onfocusout={unpick}
      >
        {#if slice.avatar}
          <span class="name with-avatar"><img src={slice.avatar} alt="" loading="lazy" decoding="async" />{#if slice.href}<a
                href={slice.href}>{slice.name}</a>{:else}<span>{slice.name}</span>{/if}</span>
        {:else}
          <span class="name">{slice.name}</span>
        {/if}
        <span class="share">{slice.share}</span>
        <span class="counts">{@render counts(slice.counts)}</span>
      </li>
    {/each}
    {#if band.other}
      <li
        class={['key', 'other', { hot: hot === band.slices.length }]}
        onpointerenter={pick(band.slices.length)}
        onpointerleave={unpick}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls="{id}-tail"
          onclick={toggle}
          onfocus={pick(band.slices.length)}
          onblur={unpick}
        >
          <span class="name">{band.other.label}</span>
          <span class="share">{band.other.share}</span>
          <span class="counts toggle">{open ? 'Hide them' : 'Show them'}
            <span aria-hidden="true">{open ? '▴' : '▾'}</span></span>
        </button>
      </li>
    {/if}
  </ol>

  {#if band.other}
    <ul id="{id}-tail" class="tail" hidden={!open}>
      {#each band.other.tail as row (row.slug)}
        <li>
          <span class="name">{row.name}</span>
          <span class="tail-share">{row.share}</span>
          <span class="mini" style:--width="{row.mini}%"></span>
          <span class="counts">{@render counts(row.counts)}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
.genre-band {
  --tip-edge: calc(var(--tooltip-arrow) + 1px + var(--tooltip-offset));
  position: relative;
  container-type: inline-size;
}

.band {
  display: flex;
  gap: var(--genre-bar-gap);
  block-size: var(--genre-band-height);
}

.piece {
  flex: 0 1 0;
  min-inline-size: var(--genre-bar-gap);
  background: var(--color);
  transition: opacity var(--transition-chart);

  &:first-child {
    border-start-start-radius: var(--radius-genre-band);
    border-end-start-radius: var(--radius-genre-band);
  }

  &:last-child {
    border-start-end-radius: var(--radius-genre-band);
    border-end-end-radius: var(--radius-genre-band);
  }

  &.other {
    background: var(--genre-other-fill);
    cursor: pointer;
  }

  .dim &:not(.hot) {
    opacity: var(--opacity-genre-piece-dimmed);
  }
}

/* The tooltip over the band, centered on the picked piece but kept inside the chart, its arrow on the piece. */
.tip {
  --start: clamp(
    0px,
    calc(var(--center) * 1cqi - var(--genre-tip-width) / 2),
    calc(100cqi - var(--genre-tip-width))
  );
  --tooltip-arrow-at: calc(var(--center) * 1cqi - var(--start));
  position: absolute;
  z-index: 1;
  inset-block-end: calc(100% + var(--tip-edge));
  inset-inline-start: var(--start);
  inline-size: var(--genre-tip-width);
  pointer-events: none;
}

.keys {
  display: grid;
  grid-template-columns: repeat(var(--keys), minmax(0, 1fr));
  gap: var(--space-genre-keys-row) var(--space-genre-keys-column);
  margin: var(--space-genre-keys-row) 0 0;
  padding: 0;
  list-style: none;
}

.key {
  min-inline-size: 0;
  padding-block-start: var(--space-genre-key-top);
  border-block-start: var(--genre-key-rule) solid var(--color);
  transition: opacity var(--transition-chart);

  &.other {
    --color: var(--color-genre-other);
  }

  .dim &:not(.hot) {
    opacity: var(--opacity-genre-key-dimmed);
  }

  & button {
    display: block;
    inline-size: 100%;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
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

/* A person's key: their avatar by the name, which links to their profile. */
.with-avatar {
  display: flex;
  gap: var(--space-genre-avatar);
  align-items: center;
  margin-block-end: var(--space-genre-avatar-under);

  & img {
    flex: none;
    inline-size: var(--genre-avatar);
    block-size: var(--genre-avatar);
    border-radius: 50%;
    object-fit: cover;
  }

  & > :last-child {
    min-inline-size: 0;
    overflow: hidden;
    color: inherit;
    text-decoration: none;
    text-overflow: ellipsis;
  }

  & a:is(:hover, :focus-visible) {
    text-decoration: underline;
  }
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
  color: var(--color-genre-count);
  font-size: var(--font-size-genre-key-count);

  & .separator {
    margin-inline: var(--space-genre-separator);
  }

  & a {
    color: inherit;
    text-decoration: none;

    &:is(:hover, :focus-visible) {
      color: var(--color-genre-count-link-hover);
    }
  }
}

.tail {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--genre-tail-column), 1fr));
  gap: 0 var(--space-genre-tail);
  margin: var(--space-genre-tail) 0 0;
  padding: var(--space-genre-tail) 0 0;
  border-block-start: 1px solid var(--color-genre-divider);
  list-style: none;

  &[hidden] {
    display: none;
  }

  & li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: baseline;
    padding-block: var(--space-genre-tail-row);
    border-block-end: 1px solid var(--color-genre-divider);
  }

  & .counts {
    grid-column: 1 / -1;
    font-size: var(--font-size-genre-count);
  }
}

.tail-share {
  color: var(--color-genre-label);
  font-family: var(--font-headings);
  font-size: var(--font-size-genre-tail-share);
  font-weight: var(--font-weight-headings-heavy);
}

/* The genre's size against the biggest one in the tail. */
.mini {
  grid-column: 1 / -1;
  block-size: var(--genre-mini-height);
  margin-block: calc(var(--genre-mini-height) / 2);
  border-radius: var(--genre-mini-height);
  background: linear-gradient(var(--color-genre-other), var(--color-genre-other)) 0 0 / var(--width) 100% no-repeat
    var(--color-genre-mini-track);
}

/* Tablet: four keys a row. Phone: two. */
@container (width < 1000px) {
  .keys {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@container (width < 600px) {
  .keys {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .piece,
  .key {
    transition: none;
  }
}
</style>
