<svelte:options namespace="svg" />

<!--
  The classic Trakt mark (the paths of trakt-wide-red-white.svg), drawn into a parent <svg> in a 98.1-unit box so any
  page can recolor it: the home page's red O, and each coming-soon design. `face` fills the disc behind the mark; leave it out for the mark alone.
-->
<script lang="ts">
interface Props {
  ink: string;
  face?: string;
}

const { ink, face }: Props = $props();
</script>

{#if face}
  <circle cx="49.05" cy="49.05" r="49.1" style:fill={face} />
{/if}
<g style:fill={ink}>
  <path d="M20,75.8c7.2,7.8,17.6,12.8,29.1,12.8c5.9,0,11.5-1.3,16.5-3.6L38.2,57.6L20,75.8z" />
  <path
    d="M38,41.1L17.3,61.8L14.5,59l21.8-21.8h0l25.5-25.5c-4-1.4-8.3-2.1-12.8-2.1C27.3,9.6,9.6,27.2,9.6,49.1c0,8.9,2.9,17.1,7.9,23.7l20.7-20.7l1.4,1.4L69.2,83c0.6-0.3,1.2-0.7,1.7-1.1L38.2,49.2L18.3,69.1l-2.8-2.8l22.7-22.7l1.4,1.4l34.5,34.5c0.5-0.4,1-0.9,1.5-1.3L38.4,41.1L38,41.1z"
  />
  <path
    d="M78.4,75.5c6.3-7,10.2-16.3,10.2-26.5c0-15.8-9.3-29.5-22.8-35.8L41,38.1L78.4,75.5z M50.5,45.3l-2.8-2.8L67.3,23l2.8,2.8L50.5,45.3z M69.1,18.4L46.5,41l-2.8-2.8l22.6-22.6L69.1,18.4z"
  />
  <path
    d="M49.1,98.1C22,98.1,0,76.1,0,49.1C0,22,22,0,49.1,0s49.1,22,49.1,49.1C98.1,76.1,76.1,98.1,49.1,98.1z M49.1,4.9C24.7,4.9,4.9,24.7,4.9,49.1s19.8,44.1,44.1,44.1s44.1-19.8,44.1-44.1S73.4,4.9,49.1,4.9z"
  />
</g>
