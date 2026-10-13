<!--
  A row of small tag pills, like the header search's results: `primary` is the brand red (a result's type), `light` the
  pale one (its year), `badge` a bold clear pill with a brighter outline (a rating certificate), and the rest the dark outlined default (genres, a runtime).
    <TagPills tags={[{ text: 'Movie', kind: 'primary' }, { text: '2026', kind: 'light' }, { text: 'Drama' }]} />
  A `lead` is bold before the text: `{ lead: '202.7K', text: 'shows' }`.
-->
<script lang="ts">
import type { TagPill } from './TagPill.ts';

const { tags }: { tags: readonly TagPill[] } = $props();
</script>

<span class="tag-pills">
  {#each tags as tag, i (`${i}:${tag.text}`)}<span class={['pill', tag.kind, { lead: tag.lead }]}
    >{#if tag.lead}<b>{tag.lead}</b> {tag.text}{:else}{tag.text}{/if}</span>{/each}
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

.light {
  background-color: var(--color-tag-pill-light-bg);
  box-shadow: none;
  color: var(--color-tag-pill-light-text);
}
</style>
