<!--
  One person in a summary's people row or on a people page: a rounded headshot (or a Futurama silhouette by gender), the name, the characters or jobs
  and an optional "62 episodes" tag pill. Name and role wrap to two lines each instead of cutting off. As a card it fills
  the width it's given, so the row or grid around it sets the size; as a `row` it's a small headshot beside the same
  lines, for the cast & crew page's list view, where the role gets three lines. When the name or role is still cut off,
  hovering or focusing the card shows both in full in a tooltip: the name in bold, the role in gray.
-->
<script lang="ts">
import type { Attachment } from 'svelte/attachments';
import TagPills from '#lib/components/labels/TagPills.svelte';
import { fitLines } from '#lib/components/tooltip/fitLines.ts';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import { cutsOff } from './cutsOff.ts';
import { personPlaceholder } from './personPlaceholder.ts';

interface Props {
  name: string;
  href: string;
  image?: string;
  /** Picks the Futurama silhouette when there's no `image`. */
  gender?: string;
  /** The characters or jobs, joined: "Walter White / Heisenberg". */
  role: string;
  /** Shows: "62 episodes", or '' when the viewer hides actor spoilers. Movies leave it out and get no pill. */
  episodes?: string;
  layout?: 'card' | 'row';
}

const { name, href, image, gender, role, episodes, layout = 'card' }: Props = $props();

let cut = $state(false);

const measure: Attachment<HTMLElement> = (text) => {
  void [name, role, layout];
  const observer = new ResizeObserver(() => {
    cut = [...text.querySelectorAll<HTMLElement>('.name, .role')].some(cutsOff);
  });
  observer.observe(text);
  return () => observer.disconnect();
};
</script>

<!-- Person pages og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet full()}
  <span class="full">
    <strong {@attach fitLines}>{name}</strong>
    {#if role}<span class="full-role" {@attach fitLines}>{role}</span>{/if}
  </span>
{/snippet}

<Tooltip content={cut ? full : undefined}>
  {#snippet trigger(tooltip)}
    <!-- The card's own text already says it all to a screen reader. -->
    <a class={['cast-card', layout]} {href} {...tooltip} aria-describedby={undefined}>
      <img class="headshot" src={image ?? personPlaceholder(gender)} alt="" loading="lazy" decoding="async"
        data-placeholder={personPlaceholder(gender)} style:--image-placeholder-person={`url("${personPlaceholder(gender)}")`} />
      <span class="text" {@attach measure}>
        <span class="name">{name}</span>
        <span class="role">{role || '\u00a0'}</span>
        {#if episodes}
          <span class="count"><TagPills tags={[{ text: episodes }]} /></span>
        {/if}
      </span>
    </a>
  {/snippet}
</Tooltip>

<style>
.cast-card {
  display: grid;
  align-content: start;
  justify-items: start;
  gap: var(--cast-card-line-gap);
  text-decoration: none;

  &:is(:hover, :focus) {
    text-decoration: none;
  }

  &:is(:hover, :focus-visible) .name {
    color: var(--color-actor-hover);
  }

  &.row {
    grid-template-columns: var(--cast-row-headshot) minmax(0, 1fr);
    align-items: center;
    gap: var(--cast-row-gap);
    padding: var(--cast-row-padding);
    border-radius: var(--radius-headshot);
    background-color: var(--color-cast-row-bg);
    transition: background-color var(--transition-card);

    &:is(:hover, :focus-visible) {
      background-color: var(--color-cast-row-hover-bg);
    }
  }
}

.headshot {
  display: block;
  inline-size: 100%;
  aspect-ratio: var(--ratio-poster);
  margin-block-end: var(--cast-card-headshot-gap);
  border-radius: var(--radius-headshot);
  object-fit: cover;
  background-color: var(--color-card-bg);

  .row & {
    margin: 0;
  }
}

.text {
  display: grid;
  gap: var(--cast-card-line-gap);
  inline-size: 100%;
  min-inline-size: 0;

  /* Under the headshot, centered like the rest of the page; beside it in a row, flush left. */
  .card & {
    justify-items: center;
    text-align: center;
  }
}

.name,
.role {
  display: -webkit-box;
  overflow: hidden;
  font-family: var(--font-headings);
  line-height: var(--line-height-cast-card);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  transition: color var(--transition-card);

  /* One line each under the headshot, cut wherever the width runs out, so every card is the same height. */
  .card & {
    display: block;
    justify-self: stretch;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.name {
  color: var(--color-actor-name);
  font-size: var(--font-size-cast-card-name);
  font-weight: var(--font-weight-headings);
}

.role {
  color: var(--color-actor-character);
  font-size: var(--font-size-cast-card-role);

  .row & {
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }
}

.full {
  display: grid;
  justify-items: center;

  & > * {
    display: inline-block;
  }
}

.full-role {
  color: var(--color-tooltip-muted);
}

.count {
  margin-block-start: var(--cast-card-count-gap);
}
</style>
