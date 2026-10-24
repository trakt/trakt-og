<script lang="ts">
import { resolve } from '$app/paths';
import Container from '$lib/components/container/Container.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import { overlay } from '$lib/overlay/overlay';

const colorGroups: Record<string, string[]> = {
  Grays: ['gray-darker', 'gray-dark', 'gray', 'gray-light', 'gray-lightish', 'gray-lighter'],
  Brand: [
    'brand-primary',
    'brand-primary-darken',
    'brand-secondary',
    'brand-tertiary',
    'brand-quaternary',
    'brand-fifth',
    'brand-sixth',
    'brand-seventh',
    'brand-eighth',
    'brand-success',
    'brand-info',
    'brand-warning',
    'brand-danger',
  ],
  Ratings: Array.from({ length: 10 }, (_, i) => `rating-${i + 1}`),
  'Episode types': [
    'episode-series-premiere',
    'episode-season-premiere',
    'episode-mid-season-premiere',
    'episode-mid-season-finale',
    'episode-season-finale',
    'episode-series-finale',
    'episode-bonus',
    'episode-trailer',
  ],
  'Themed (flip with the theme)': [
    'color-page',
    'color-surface',
    'color-box',
    'color-text',
    'color-text-muted',
    'color-link',
    'color-link-hover',
    'color-separator',
    'color-input-bg',
    'color-input-text',
    'color-input-border',
  ],
};

const spaces = ['xs', 'sm', 'base', 'lg'];
const radii = ['radius-tag', 'radius-object', 'radius-container', 'radius-round'];
const shadows = ['shadow-dropdown', 'shadow-input-focus'];

let overlayType = $state<'movie' | 'show' | 'season' | 'episode'>('movie');
let overlayId = $state(1);
const overlayState = $derived(
  JSON.stringify(overlay.state(overlayType, overlayId), (_, value) => value === undefined ? 'unknown' : value, 2),
);
</script>

<Specimen title="Type"
  note="Figtree everywhere (OG used Proxima Nova). Headings are 600 unless they have a bold part.">
  <h2 class="specimen">Heading 2, 24px with <b>bold</b> at 600</h2>
  <h3>Heading 3, 24px</h3>
  <h4>Heading 4, 18px</h4>
  <h5>Heading 5, 14px</h5>
  <h6>Heading 6, 12px</h6>
  <p>
    Body copy is 14px Figtree 400 on a 20px line. Breaking Bad follows Walter White, a chemistry teacher who turns to
    making meth after a cancer diagnosis. <a href={resolve('/_design/tokens')}>A link</a>, <strong>strong text</strong>
    and <small>small text</small>.
  </p>
  <p>A second paragraph shows the 10px paragraph margin.</p>
</Specimen>

<Specimen title="Colors">
  {#each Object.entries(colorGroups) as [group, names] (group)}
    <h3 class="group">{group}</h3>
    <ul class="swatches">
      {#each names as name (name)}
        <li>
          <span class="chip" style:background-color="var(--{name})"></span>
          <code>--{name}</code>
        </li>
      {/each}
    </ul>
  {/each}
</Specimen>

<Specimen title="Spacing and radii">
  <ul class="row">
    {#each spaces as size (size)}
      <li>
        <span class="pad" style:padding="var(--space-{size}-block) var(--space-{size}-inline)">--space-{size}</span>
      </li>
    {/each}
    <li><span class="gutter"></span> <code>--gutter</code></li>
  </ul>
  <ul class="row">
    {#each radii as name (name)}
      <li class="radius" style:border-radius="var(--{name})"><code>--{name}</code></li>
    {/each}
  </ul>
</Specimen>

<Specimen title="Form controls" note="Base element styles, with no classes: OG's Bootstrap 3 inputs.">
  <form class="row" onsubmit={(e) => e.preventDefault()}>
    <label>Text <input type="text" placeholder="Search shows, movies, people" /></label>
    <label>Select <select><option>Trending</option><option>Popular</option></select></label>
    <label>Disabled <input type="text" value="Disabled" disabled /></label>
    <button type="button">Button</button>
  </form>
  <label class="textarea">Textarea <textarea rows="3"></textarea></label>
</Specimen>

<Specimen title="Shadows and image ratios">
  <ul class="row">
    {#each shadows as name (name)}
      <li class="shadow" style:box-shadow="var(--{name})"><code>--{name}</code></li>
    {/each}
  </ul>
  <div class="row ratios">
    <div class="poster"><code>--ratio-poster</code></div>
    <div class="fanart"><code>--ratio-fanart</code></div>
  </div>
</Specimen>

<Specimen title="Page column" bleed
  note="Container: OG's page width, 740, 960 and 1160px from 768, 992 and 1200px wide viewports. Fold the nav to see it at full width.">
  <Container>
    <div class="column">Container</div>
  </Container>
</Specimen>

<Specimen title="Overlay state"
  note="The signed-in viewer's state for one item, from $lib/overlay/overlay. Signed out, every field is unknown.">
  <form class="row" onsubmit={(e) => e.preventDefault()}>
    <label>
      Type
      <select bind:value={overlayType}>
        <option value="movie">Movie</option>
        <option value="show">Show</option>
        <option value="season">Season</option>
        <option value="episode">Episode</option>
      </select>
    </label>
    <label>Trakt id <input type="number" min="1" bind:value={overlayId} /></label>
  </form>
  <pre aria-live="polite">{overlayState}</pre>
</Specimen>

<style>
.specimen {
  margin-block-start: 0;
}

.group {
  margin-block: var(--gutter) var(--space-lg-block);
  font-size: var(--font-size-h5);
  color: var(--color-text-muted);
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--gutter);
}

.swatches li {
  display: grid;
  justify-items: start;
  gap: var(--space-sm-block);
}

.chip {
  display: block;
  inline-size: 100%;
  block-size: 48px;
  border: 1px solid var(--color-separator);
  border-radius: var(--radius-tag);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--gutter);

  & + .row {
    margin-block-start: var(--gutter);
  }
}

.pad {
  display: inline-block;
  background-color: var(--gray-lightish);
  color: var(--gray-darker);
}

.gutter {
  display: inline-block;
  inline-size: var(--gutter);
  block-size: var(--gutter);
  background-color: var(--gray-lightish);
  vertical-align: middle;
}

.radius,
.shadow {
  padding: var(--space-lg-block) var(--space-lg-inline);
  background-color: var(--color-box);
}

.radius {
  border: 1px solid var(--color-input-border);
}

label {
  display: inline-grid;
  gap: var(--space-sm-block);
}

.textarea {
  display: grid;
  margin-block-start: var(--gutter);
  max-inline-size: 480px;
}

.ratios {
  align-items: start;

  & div {
    display: grid;
    place-content: center;
    background-color: var(--gray-dark);
    color: var(--gray-lighter);
  }
}

.poster {
  inline-size: 160px;
  aspect-ratio: var(--ratio-poster);
}

.fanart {
  inline-size: 480px;
  max-inline-size: 100%;
  aspect-ratio: var(--ratio-fanart);
}

.column {
  padding: var(--space-lg-block);
  background-color: var(--gray-lightish);
  color: var(--gray-darker);
  text-align: center;
}
</style>
