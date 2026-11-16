<!--
  The parental guide page's ratings: the origin country and the viewer's first, a box each side by side (flag, name
  and rating, the tag on the right), then a box per age, youngest first, four across: a header band with the age and
  its country count (Release Dates' globe, count and Countries tooltip), then its countries and their ratings. The
  origin country's box is ringed in red. Ratings that name no age close the row as Other. Each rating is the summary's
  pill, filling white on hover, and a US one says what it means. Boxes sit a gutter apart, as poster grids do.
    <CertificationGroups featured={view.featured} groups={view.groups} />
-->
<script lang="ts">
import TagPills from '#lib/components/labels/TagPills.svelte';
import Certification from '#lib/components/summary/Certification.svelte';
import CountryFlag from '#lib/components/table/CountryFlag.svelte';
import SubnavCount from '#lib/components/toolbar/SubnavCount.svelte';
import globe from '#lib/icons/regular/globe.svg?raw';
import type { toCertificationGroups } from './toCertificationGroups.ts';

type View = ReturnType<typeof toCertificationGroups>;

const { featured, groups }: Pick<View, 'featured' | 'groups'> = $props();
</script>

{#if featured.length > 0}
  <ul class="featured">
    {#each featured as country (country.code)}
      <li>
        <CountryFlag code={country.code} />
        <span class="country">{country.name}</span>
        <Certification certification={country.certification} country={country.code} />
        <span class="tags"><TagPills
            tags={country.tags.map((text) => ({ text, kind: text === 'Original Country' ? 'primary' : 'light' }))}
          /></span>
      </li>
    {/each}
  </ul>
{/if}
<ul class="groups">
  {#each groups as group (group.label)}
    <li class={['group', { original: group.original }]}>
      <span class="head">
        <h3>{group.label}</h3>
        <SubnavCount svg={globe} count={group.countries.length} noun="country" plural="countries" tooltip="Countries" />
      </span>
      <ul class="countries">
        {#each group.countries as country (country.code)}
          <li>
            <CountryFlag code={country.code} holdSpace />
            <span class="country">{country.name}</span>
            <Certification certification={country.certification} country={country.code} />
          </li>
        {/each}
      </ul>
    </li>
  {/each}
</ul>

<style>
/* One box per country, splitting the row between them. */
.featured {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  gap: var(--gutter);
  margin: 0 0 var(--gutter);
  padding: 0;
  list-style: none;

  & li {
    display: flex;
    align-items: center;
    gap: var(--space-xs-inline);
    padding: var(--space-certification-featured);
    border-radius: var(--radius-stats-tile);
    background-color: var(--color-stats-tile-bg);
  }
}

.tags {
  display: inline-flex;
  margin-inline-start: auto;
}

.groups {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--certification-group-min), 1fr));
  gap: var(--gutter);
  margin: 0;
  padding: 0;
  list-style: none;
}

.group {
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: clip;
  border-radius: var(--radius-stats-tile);
  background-color: var(--color-stats-tile-bg);

  &.original {
    outline: 1px solid var(--color-certification-group-origin);
  }
}

/* The age and its count on a band a step off the box. */
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs-inline);
  padding: var(--space-certification-group);
  background-color: var(--color-certification-head-bg);
}

h3 {
  margin: 0;
  font-size: var(--font-size-certification-age);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-genre-share);
}

.countries {
  display: grid;
  align-content: start;
  gap: var(--space-certification-countries);
  margin: 0;
  padding: var(--space-certification-group);
  list-style: none;

  & li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-xs-inline);
  }
}

.country {
  overflow: hidden;
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
