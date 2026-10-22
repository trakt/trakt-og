<!--
  A bar that shimmers in the place of a number or a name until it loads. `inline` and `block` size it, usually with
  tokens, and `round` makes it a circle for a flag or an avatar. It's hidden from screen readers, so whatever it sits in
  says it's loading. With reduced motion it holds still.
-->
<script lang="ts">
interface Props {
  inline: string;
  block: string;
  round?: boolean;
}

const { inline, block, round = false }: Props = $props();
</script>

<span class={['shimmer', { round }]} aria-hidden="true" style:inline-size={inline} style:block-size={block}></span>

<style>
.shimmer {
  display: inline-block;
  flex: none;
  vertical-align: middle;
  border-radius: var(--radius-tag);
  background: var(--shimmer) 0 0 / 200% 100%;
  animation: shimmer var(--shimmer-duration) linear infinite;

  &.round {
    border-radius: 50%;
  }
}

@keyframes shimmer {
  from {
    background-position: 100% 0;
  }

  to {
    background-position: -100% 0;
  }
}
</style>
