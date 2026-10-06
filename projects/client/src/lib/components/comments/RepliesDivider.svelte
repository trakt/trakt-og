<!--
  The small "1 reply" divider on a comment page's thread, with a hairline to its end. It's the replies' heading.
    <RepliesDivider count={replies.length} />
-->
<script lang="ts">
const { count }: { count: number } = $props();
</script>

<h2 class="replies-divider">{count.toLocaleString('en-US')} {count === 1 ? 'reply' : 'replies'}</h2>

<style>
.replies-divider {
  display: flex;
  align-items: center;
  gap: var(--comment-rail-label-gap);
  margin: var(--comment-rail-label-space) 0 0;
  color: var(--color-comment-muted);
  font-family: var(--font-headings);
  font-size: var(--font-size-comment-rail-label);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-headings);
  letter-spacing: var(--letter-spacing-comment-rail-label);
  text-transform: uppercase;

  &::after {
    content: '';
    flex: 1;
    block-size: 1px;
    background-color: var(--color-comment-rail);
  }
}
</style>
