<!--
  A list row's place while it loads: the poster fan, then the name, the owner, two lines of description and the count
  buttons along the foot, at the row's sizes. Hidden from screen readers, so whatever holds it says it's busy.
-->
<script lang="ts">
import Shimmer from './Shimmer.svelte';
</script>

<div class="list-row-shimmer" aria-hidden="true">
  <span class="fan"><Shimmer inline="100%" block="100%" /></span>
  <span class="body">
    <span class="name"><Shimmer inline="var(--list-card-shimmer-title-width)" block="var(--font-size-h4)" /></span>
    <Shimmer inline="var(--list-card-shimmer-owner-width)" block="var(--list-card-avatar-size)" />
    <span class="overview">
      <Shimmer inline="var(--list-card-shimmer-line-width)" block="var(--font-size-base)" />
      <Shimmer inline="var(--list-card-shimmer-short-width)" block="var(--font-size-base)" />
    </span>
    <span class="foot">
      {#each [0, 1, 2] as count (count)}
        <Shimmer inline="var(--list-card-shimmer-count-width)" block="var(--control-height)" />
      {/each}
    </span>
  </span>
</div>

<style>
.list-row-shimmer {
  display: grid;
  grid-template-columns: calc(var(--list-card-poster-width) + var(--list-card-sliver) * 4) minmax(0, 1fr);
  column-gap: var(--list-card-gap);
  padding-block-start: var(--list-card-spacing);
}

.fan {
  display: flex;
  block-size: var(--list-card-poster-height);
}

.body {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: var(--list-card-body-gap);
  min-inline-size: 0;
}

.name {
  display: flex;
  align-items: center;
  align-self: stretch;
  block-size: 1lh;
  font-size: var(--font-size-h4);
  line-height: var(--line-height-headings);
}

.overview {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  gap: calc(var(--line-height-computed) - var(--font-size-base));
  margin-block-start: var(--list-card-bubble-gap);
  padding-block-start: calc((var(--line-height-computed) - var(--font-size-base)) / 2);
}

.foot {
  display: flex;
  gap: var(--list-counts-gap);
  margin-block-start: auto;
  padding-block-start: var(--list-card-foot-gap);
}
</style>
