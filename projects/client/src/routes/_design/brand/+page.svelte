<script lang="ts">
import TraktMark from '$lib/components/brand/TraktMark.svelte';
import Specimen from '$lib/design/Specimen.svelte';

// Each way a page draws the mark today: ink alone, or ink on a face.
const marks = [
  { name: 'Red ink, no face', use: "The home page's O", ink: 'var(--brand-primary)', face: undefined },
  { name: 'Red ink on white', use: 'The séance teaser', ink: 'var(--brand-primary)', face: '#fff' },
  { name: 'White ink on red', use: 'The classic logo', ink: '#fff', face: 'var(--brand-primary)' },
  { name: 'Blue ink, no face', use: 'The VHS teaser', ink: 'var(--brand-secondary)', face: undefined },
];
</script>

<Specimen title="Inks and faces">
  <p>
    <code>TraktMark</code> draws into a parent <code>&lt;svg viewBox="0 0 98.1 98.1"&gt;</code>. <code>ink</code>
    colors the mark; <code>face</code> fills the disc behind it. The gray tile shows a mark with no face.
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
</Specimen>

<style>
ul {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gutter);
  margin: var(--gutter) 0 0;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  justify-items: center;
  gap: var(--space-sm-block);
  inline-size: 200px;
  padding: var(--gutter);
  border-radius: var(--radius-object);
  background-color: var(--gray);
  color: var(--gray-lighter);
  text-align: center;
}

svg {
  inline-size: 96px;
  block-size: 96px;
}
</style>
