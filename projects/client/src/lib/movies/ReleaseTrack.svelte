<!--
  The viewer's country (else the movie's original country) at the top of the release dates: its flag, name and tags,
  then every release in order on one line, red up to today, with a Today mark and a countdown to the next one.
    <ReleaseTrack country={releases.featured} />
-->
<script lang="ts">
import TagPills from '$lib/components/labels/TagPills.svelte';
import type { TagPill } from '$lib/components/labels/TagPill';
import CountryFlag from '$lib/components/table/CountryFlag.svelte';
import ReleaseFormats from './ReleaseFormats.svelte';
import { releasePills } from './releasePills.ts';
import type { ReleaseStop } from './toMovieReleases.ts';

interface Props {
  country: {
    readonly code: string;
    readonly name: string;
    readonly tag: string;
    readonly certification: string;
    readonly stops: readonly ReleaseStop[];
  };
}

const { country }: Props = $props();
const countdown = (days: number): TagPill =>
  days === 1
    ? { text: 'Tomorrow', tint: 'var(--color-release-countdown)' }
    : { lead: days.toLocaleString('en-US'), text: 'days', tint: 'var(--color-release-countdown)' };
const tags: readonly TagPill[] = $derived([
  { text: country.tag, kind: 'primary' },
  ...(country.certification ? [{ text: country.certification, kind: 'badge' as const }] : []),
]);
</script>

<section class="release-track" aria-labelledby="release-track-heading">
  <div class="heading">
    <h2 id="release-track-heading"><CountryFlag code={country.code} />{country.name}</h2>
    <TagPills {tags} />
  </div>
  <ol>
    {#each country.stops as stop, i (i)}
      <li class={{ released: stop.released, done: country.stops.at(i + 1)?.released, today: stop.today }}>
        <span class="dot" aria-hidden="true"></span>
        {#if stop.today}<span class="today-label" aria-hidden="true"><TagPills tags={[{ text: 'Today', kind: 'light' }]} /></span>{/if}
        <span class="type">{stop.type}</span>
        <time datetime={stop.date}>{stop.dateText}</time>
        {#if releasePills(stop).length > 0}<TagPills tags={releasePills(stop)} />{/if}
        {#if stop.formats.length > 0}<ReleaseFormats formats={stop.formats} />{/if}
        {#if stop.countdown !== null}<TagPills tags={[countdown(stop.countdown)]} />{/if}
      </li>
    {/each}
  </ol>
</section>

<style>
.release-track {
  padding: var(--space-release-box);
  border-radius: var(--radius-release-box);
  background-color: var(--color-release-box);
}

.heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-release-cell);
}

h2 {
  display: flex;
  align-items: center;
  gap: var(--space-release-cell);
  margin: 0;
  font-size: var(--font-size-h4);
}

ol {
  display: grid;
  grid-auto-columns: minmax(var(--release-track-stop-min), 1fr);
  grid-auto-flow: column;
  margin: 0;
  padding: var(--space-release-track-today) 0 0;
  overflow-x: auto;
  list-style: none;
}

li {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-release-stack);
  padding-block-start: calc(var(--release-track-dot) + var(--space-release-track-dot));
  padding-inline-end: var(--space-release-cell);

  /* The line from this stop's dot to the next one's. */
  &:not(:last-child)::before {
    content: '';
    position: absolute;
    inset-block-start: calc((var(--release-track-dot) - var(--release-track-line)) / 2);
    inset-inline: 0;
    block-size: var(--release-track-line);
    background: var(--color-release-track-line);
  }

  &.done::before {
    background: var(--color-release-track-done);
  }

  &.today::before {
    background: linear-gradient(
      to right,
      var(--color-release-track-done) 50%,
      var(--color-release-track-line) 50%
    );
  }

  &.today::after {
    content: '';
    position: absolute;
    inset-block-start: calc((var(--release-track-dot) - var(--release-track-tick)) / 2);
    inset-inline-start: 50%;
    inline-size: var(--release-track-line);
    block-size: var(--release-track-tick);
    background: var(--color-release-today);
  }
}

.dot {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  z-index: 1;
  box-sizing: border-box;
  inline-size: var(--release-track-dot);
  block-size: var(--release-track-dot);
  border: var(--release-track-line) solid var(--color-release-track-done);
  border-radius: 50%;
  background: var(--color-release-box);

  .released & {
    background: var(--color-release-track-done);
  }
}

.today-label {
  position: absolute;
  inset-block-start: calc(-1 * var(--space-release-track-today));
  inset-inline-start: 50%;
  translate: -50% 0;
}

.type {
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
}

time {
  font-variant-numeric: tabular-nums;
}

</style>
