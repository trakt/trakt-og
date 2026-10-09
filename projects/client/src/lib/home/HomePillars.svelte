<!-- The three short sections under the landing hero: og, desktop and stats, each a big word with a red full stop. -->
<script lang="ts">
const PILLARS = [
  { label: 'The classic', word: 'og', text: 'Classic Trakt, rebuilt from scratch. Open source, on the Trakt API.' },
  { label: 'Big screens', word: 'desktop', text: 'Made for desktops and tablets, with room for everything.' },
  { label: 'Every number', word: 'stats', text: 'Deep stats, and precise control over every watch.' },
] as const;
</script>

<section class="pillars" aria-label="What OG Redux is">
  {#each PILLARS as { label, word, text } (word)}
    <div class="pillar">
      <p class="label">{label}</p>
      <h2>{word}</h2>
      <p class="text">{text}</p>
    </div>
  {/each}
</section>

<style>
.pillars {
  container-type: inline-size;
  background-color: var(--color-home-bg);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-block-start: 1px solid var(--color-home-line);
}

.pillar {
  display: grid;
  align-content: start;
  gap: var(--home-pillar-gap);
  padding-block: var(--home-pillar-padding-block);
  padding-inline: var(--home-pillar-padding-inline);

  & + & {
    border-inline-start: 1px solid var(--color-home-line);
  }
}

.label {
  margin: 0;
  font-size: var(--font-size-home-pillar-label);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-home-pillar-label);
  text-transform: uppercase;
  color: var(--color-home-muted);
}

h2 {
  margin: 0;
  font-size: var(--font-size-home-pillar);
  font-weight: var(--font-weight-home-display);
  line-height: 1;
  letter-spacing: var(--letter-spacing-home-pillar);
  color: var(--color-home-text);

  &::after {
    content: '.';
    color: var(--brand-primary);
  }
}

.text {
  max-inline-size: var(--home-pillar-text-width);
  margin: 0;
  font-size: var(--font-size-home-pillar-text);
  color: var(--color-home-soft);
}
</style>
