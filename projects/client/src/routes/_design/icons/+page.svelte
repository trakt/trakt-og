<script lang="ts">
import DemoSection from '$lib/design/DemoSection.svelte';
import Icon from '$lib/icons/Icon.svelte';
import angleRight from '$lib/icons/light/angle-right.svg?raw';
import checkThick from '$lib/icons/trakt/check-thick.svg?raw';
import dolbyAtmos from '$lib/icons/logos/dolby_atmos.svg?raw';
import flag from '$lib/icons/regular/flag.svg?raw';
import gear from '$lib/icons/thin/gear.svg?raw';
import lockKeyhole from '$lib/icons/solid/lock-keyhole.svg?raw';
import traktLogomark from '$lib/icons/kit/trakt-logomark-circle-white.svg?raw';
import xTwitter from '$lib/icons/brands/x-twitter.svg?raw';

// One icon per family, each named the way OG's markup names it.
const icons = [
  { family: 'solid', name: 'lock-keyhole', og: 'fa-solid fa-lock-keyhole', svg: lockKeyhole },
  { family: 'regular', name: 'flag', og: 'fa-regular fa-flag', svg: flag },
  { family: 'light', name: 'angle-right', og: 'fa-light fa-angle-right', svg: angleRight },
  { family: 'thin', name: 'gear', og: 'fa-thin fa-gear', svg: gear },
  { family: 'brands', name: 'x-twitter', og: 'fa-brands fa-x-twitter', svg: xTwitter },
  {
    family: 'kit',
    name: 'trakt-logomark-circle-white',
    og: 'fa-kit fa-trakt-logomark-circle-white',
    svg: traktLogomark,
  },
  { family: 'trakt', name: 'check-thick', og: 'trakt-icon-check-thick', svg: checkThick },
  { family: 'logos', name: 'dolby_atmos', og: 'logos-icon-dolby_atmos', svg: dolbyAtmos },
];
</script>

<DemoSection title="One icon per family"
  note="Each icon sits on the text baseline and takes its size and color from the text around it.">
  <p>Extract one with <code>deno task icon &lt;family&gt; &lt;name&gt;</code>, as the design-system rules describe.</p>
  <!-- Focusable so keyboard users can scroll it sideways on narrow screens. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="table-scroll" role="region" aria-label="Icons by family" tabindex="0">
    <table>
      <thead>
        <tr>
          <th scope="col">Family</th>
          <th scope="col">OG class</th>
          <th scope="col">In text</th>
          <th scope="col">Fixed width</th>
          <th scope="col">Large</th>
        </tr>
      </thead>
      <tbody>
        {#each icons as icon (icon.family)}
          <tr>
            <th scope="row">{icon.family}</th>
            <td><code>{icon.og}</code></td>
            <td class="in-text"><Icon svg={icon.svg} /> {icon.name}</td>
            <td class="in-text"><Icon svg={icon.svg} fixedWidth /> {icon.name}</td>
            <td class="large"><Icon svg={icon.svg} label={icon.name} /></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</DemoSection>

<style>
.table-scroll {
  overflow-x: auto;
}

table {
  border-collapse: collapse;
}

th,
td {
  padding: var(--space-sm-block) var(--space-lg-inline);
  text-align: start;
  border-block-end: 1px solid var(--color-separator);
}

.in-text {
  white-space: nowrap;
}

/* Big enough to see each glyph's detail. */
.large {
  font-size: calc(var(--font-size-h1) * 2);
}
</style>
