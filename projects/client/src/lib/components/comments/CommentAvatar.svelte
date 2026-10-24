<!--
  A comment author's round avatar. `small` is a reply's, in a thread, and `large` the comment's on its own page.
-->
<script lang="ts">
interface Props {
  src: string;
  small?: boolean;
  large?: boolean;
}

const { src, small = false, large = false }: Props = $props();
</script>

<span class={['user-avatar', { small, large }]}>
  <img {src} alt="" loading="lazy" decoding="async" />
</span>

<style>
.user-avatar {
  display: block;
  inline-size: var(--comment-avatar);
}

.small {
  inline-size: var(--comment-avatar-nested);
}

.large {
  inline-size: var(--comment-avatar-root);
}

img {
  display: block;
  inline-size: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border: 2px solid var(--color-avatar-border);
  border-radius: 50%;
  background-color: var(--color-avatar-border);
}
</style>
