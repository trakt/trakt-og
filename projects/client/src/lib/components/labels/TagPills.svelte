<!--
  A row of small tag pills, like the header search's results: `primary` is the brand red (a result's type), `light` the
  pale one (an episode's air date), `badge` a bold clear pill with a brighter outline (a rating certificate), and the rest the dark outlined default (genres, a runtime).
    <TagPills tags={[{ text: 'Movie', kind: 'primary' }, { text: 'Jan 21, 2008', kind: 'light' }, { text: 'Drama' }]} />
  A `lead` is bold before the text: `{ lead: '202.7K', text: 'shows' }`. Related tags join into one pill split by thin
  lines: `{ segments: ['50m', '24 episodes'] }`. `large` is a size up, for a page header's counts.
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import type { TagPill } from './TagPill.ts';

const { tags, large = false }: { tags: readonly TagPill[]; large?: boolean } = $props();
</script>

<!-- A pill's href is another site's, which resolve() can't type. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<span class={['tag-pills', { large }]}>
  {#each tags as tag, i (`${i}:${'segments' in tag ? tag.segments.join() : tag.text}`)}{#if 'segments' in tag}<span
        class="pill segments"
      >{#each tag.segments as segment, s (s)}<span class="segment">{segment}</span>{/each}</span>{:else}<svelte:element
        this={tag.href ? 'a' : 'span'}
        href={tag.href}
        target={tag.href ? '_blank' : undefined}
        rel={tag.href ? 'noopener' : undefined}
        class={['pill', tag.kind, { lead: tag.lead, colored: tag.color, iconed: tag.icon, tinted: tag.tint, link: tag.href }]}
        style:--pill-color={tag.color}
        style:--pill-tint={tag.tint}
        aria-label={tag.label}
      >{#if tag.icon}<Icon svg={tag.icon} />{/if}{#if tag.lead}<b>{tag.lead}</b>{tag.text ? ` ${tag.text}` : ''}{:else}{tag.text}{/if}</svelte:element>{/if}{/each}
</span>

<style>
.tag-pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--search-pill-gap);
}

.pill {
  padding: var(--search-pill-padding);
  border-radius: var(--radius-search-pill);
  background-color: var(--color-tag-pill-bg);
  box-shadow: inset 0 0 0 1px var(--color-tag-pill-line);
  color: var(--color-tag-pill-text);
  font-size: var(--font-size-search-pill);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-search-pill);
  white-space: nowrap;

  /* A count pill's weights: the number bold, its word regular. */
  &.lead {
    font-weight: var(--font-weight-headings-light);
  }

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }

  /* An icon pill: the icon, a gap, then the count, like GitHub's repo stats. */
  &.iconed {
    display: inline-flex;
    align-items: center;
    gap: var(--tag-pill-icon-gap);
  }

  & :global(svg) {
    inline-size: 1em;
    block-size: 1em;
    color: var(--color-tag-pill-icon);
  }
}

/* A tinted pill: its icon in the tint, and the outline and fill a wash of it. */
.tinted {
  background-color: color-mix(in srgb, var(--pill-tint) var(--tag-pill-tint-fill), transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pill-tint) var(--tag-pill-tint-line), transparent);

  & :global(svg) {
    color: var(--pill-tint);
  }
}

.link {
  text-decoration: none;
  transition: background-color var(--link-button-duration);

  &:is(:hover, :focus-visible) {
    color: var(--color-tag-pill-text);
    text-decoration: none;
    background-color: color-mix(in srgb, var(--pill-tint, currentColor) var(--tag-pill-tint-hover), transparent);
  }
}

.large {
  gap: var(--tag-pill-large-gap);
}

.large .pill {
  padding: var(--tag-pill-large-padding);
  font-size: var(--font-size-tag-pill-large);
}

.segments {
  display: inline-flex;
  padding: 0;
}

.segment {
  padding: var(--search-pill-padding);

  & + & {
    box-shadow: inset 1px 0 0 var(--color-tag-pill-line);
  }
}

.primary {
  background-color: var(--brand-primary);
  box-shadow: none;
  color: var(--color-text-inverse);
}

.badge {
  background-color: transparent;
  box-shadow: inset 0 0 0 1px var(--color-tag-badge-line);
  color: var(--color-frame-ink);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-tag-badge);
}

.colored {
  background-color: var(--pill-color);
  box-shadow: none;
  color: var(--color-text-inverse);
}

.light {
  background-color: var(--color-tag-pill-light-bg);
  box-shadow: none;
  color: var(--color-tag-pill-light-text);
}
</style>
