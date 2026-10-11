<!--
  A row of small tag pills, like the header search's results: `primary` is the brand red (a result's type), `light` the
  pale one (its year, a rating certificate), and the rest the dark outlined default (genres, a runtime).
    <TagPills tags={[{ text: 'Movie', kind: 'primary' }, { text: '2026', kind: 'light' }, { text: 'Drama' }]} />
-->
<script lang="ts">
import type { TagPill } from './TagPill.ts';

const { tags }: { tags: readonly TagPill[] } = $props();
</script>

<span class="tag-pills">
  {#each tags as tag, i (`${i}:${tag.text}`)}<span class={['pill', tag.kind]}>{tag.text}</span>{/each}
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
  background-color: var(--color-header-pill);
  box-shadow: inset 0 0 0 1px var(--color-search-pill-line);
  color: var(--color-search-term);
  font-size: var(--font-size-search-pill);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-search-pill);
  white-space: nowrap;
}

.primary {
  background-color: var(--brand-primary);
  box-shadow: none;
  color: var(--color-text-inverse);
}

.light {
  background-color: var(--color-search-year-bg);
  box-shadow: none;
  color: var(--color-search-year-text);
}
</style>
