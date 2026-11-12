<!--
  The promotion's name in mono caps, a word to a line, white on black: the tag the header's Get VIP pill leads with
  during an offer.
-->
<script lang="ts">
interface Props {
  label: string;
}

const { label }: Props = $props();
</script>

<span class="tag">{label}</span>

<style>
.tag {
  display: inline-flex;
  align-items: center;
  inline-size: min-content;
  white-space: normal;
  padding-inline: var(--space-xs-inline);
  background: var(--color-promotion-tag);
  color: var(--color-promotion-tag-text);
  font-family: var(--font-mono);
  font-size: var(--font-size-promotion-tag);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-promotion-tag);
  line-height: 1.1;
  text-transform: uppercase;
  border-radius: calc(var(--radius-header-pill) - var(--promotion-tag-inset));
}
</style>
