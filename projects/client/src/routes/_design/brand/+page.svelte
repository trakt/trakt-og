<script lang="ts">
import TraktMark from '$lib/components/brand/TraktMark.svelte';

// Each way a page draws the mark today: ink alone, or ink on a face.
const marks = [
  { name: 'Red ink, no face', use: "The home page's O", ink: 'var(--brand-primary)', face: undefined },
  { name: 'Red ink on white', use: 'The séance teaser', ink: 'var(--brand-primary)', face: '#fff' },
  { name: 'White ink on red', use: 'The classic logo', ink: '#fff', face: 'var(--brand-primary)' },
  { name: 'Blue ink, no face', use: 'The VHS teaser', ink: 'var(--brand-secondary)', face: undefined },
];
</script>

<svelte:head>
  <title>Brand · og design system</title>
</svelte:head>

<main>
  <h1>Brand</h1>
  <p>
    <code>TraktMark</code> draws the classic Trakt mark into a parent <code>&lt;svg viewBox="0 0 98.1 98.1"&gt;</code>.
    <code>ink</code> colors the mark; <code>face</code> fills the disc behind it.
  </p>

  <ul>
    {#each marks as mark (mark.name)}
      <li>
        <svg viewBox="0 0 98.1 98.1" role="img" aria-label="Trakt"><TraktMark ink={mark.ink} face={mark.face} /></svg>
        <b>{mark.name}</b>
        <span>{mark.use}</span>
      </li>
    {/each}
  </ul>
</main>

<style>
/* Plain values, like the other demos. The gray backdrop shows a mark with no face. */
main {
  padding: 1rem;
  font-family: system-ui, sans-serif;
  font-size: 14px;
}

ul {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  justify-items: center;
  gap: 0.25rem;
  padding: 1rem;
  background: #555;
  color: #fff;
  text-align: center;
}

svg {
  inline-size: 96px;
  block-size: 96px;
}
</style>
