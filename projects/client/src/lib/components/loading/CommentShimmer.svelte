<!--
  A comment card's place while it loads: the avatar, the name and date lines beside it, the bubble, then React and
  Reply, at the card's sizes so nothing moves when it lands. `nested` takes a reply's smaller avatar and one-line
  bubble, as in a thread that's opening. Hidden from screen readers, so whatever holds it says it's busy.
-->
<script lang="ts">
import Shimmer from './Shimmer.svelte';

const { nested = false }: { nested?: boolean } = $props();
</script>

<div class={['comment-shimmer', { nested }]} aria-hidden="true">
  <Shimmer inline="var(--avatar)" block="var(--avatar)" round />
  <div class="main">
    <span class="head">
      <span class="name"><Shimmer inline="var(--comment-shimmer-name-width)" block="var(--font-size-comment-meta)" /></span>
      <span class="date"><Shimmer inline="var(--comment-shimmer-date-width)" block="var(--font-size-comment-meta)" /></span>
    </span>
    <span class="bubble"><Shimmer inline="100%" block="100%" /></span>
    <span class="actions">
      <Shimmer inline="var(--comment-shimmer-action-width)" block="var(--control-height)" />
      <Shimmer inline="var(--comment-shimmer-action-width)" block="var(--control-height)" />
    </span>
  </div>
</div>

<style>
.comment-shimmer {
  --avatar: var(--comment-avatar);
  --bubble-height: var(--comment-shimmer-bubble);
  display: grid;
  grid-template-columns: var(--avatar) minmax(0, 1fr);
  column-gap: var(--comment-column-gap);
  align-items: start;

  &.nested {
    --avatar: var(--comment-avatar-nested);
    --bubble-height: var(--comment-shimmer-bubble-nested);
    column-gap: var(--comment-column-gap-nested);
  }
}

.main {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
  padding-block-end: var(--comment-main-padding-end);
}

/* Each line as tall as the card's, the name's and the date's, centered on the avatar. */
.head {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--comment-head-line-gap);
  min-block-size: var(--avatar);
  line-height: var(--line-height-headings);
}

.name,
.date {
  display: flex;
  align-items: center;
  block-size: 1lh;
}

.date {
  font-size: var(--font-size-comment-meta);
}

/* A reply's bubble sits lower, level with a full-size card's. */
.bubble {
  display: flex;
  block-size: var(--bubble-height);
  margin-block-start: calc(var(--comment-bubble-gap) + (var(--comment-avatar) - var(--avatar)) / 2);
}

.actions {
  display: flex;
  gap: var(--comment-stats-gap);
  padding-block-start: var(--comment-stats-space);
}
</style>
