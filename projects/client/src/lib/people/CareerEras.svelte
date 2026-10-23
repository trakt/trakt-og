<!--
  The sidebar's career chart, under the section nav: five years a row, newest first, each with a bar for how many
  credits it holds. With a viewer, the solid part of the bar is what they've watched. Picking an era narrows the
  credits to those years, picking it again clears it, and either way `onpick` runs (the page scrolls to its credits).
    <CareerEras {eras} bind:selected watched={(credit) => …} name={…} onpick={…} />
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { eraAccent } from './eraAccent.ts';
import type { CareerEra } from './toCareerEras.ts';
import type { PersonCredit } from './PersonCredit.ts';

interface Props {
  eras: readonly CareerEra[];
  /** The picked era's first year. */
  selected: number | null;
  /** Left out for a signed-out viewer, so the bars show only the credits. */
  watched?: (credit: PersonCredit) => boolean;
  /** What a credit is named by in the tooltip: acting credits by character. */
  name: (credit: PersonCredit) => string;
  onpick?: () => void;
}

let { eras, selected = $bindable(), watched, name, onpick }: Props = $props();

function pick(start: number) {
  selected = selected === start ? null : start;
  onpick?.();
}

const most = $derived(Math.max(1, ...eras.map(({ credits }) => credits.length)));
const rows = $derived(
  eras.map((era, i) => {
    const seen = watched ? era.credits.filter(watched).length : 0;
    const share = (count: number) => `${(count / most) * 100}%`;
    return {
      ...era,
      label: `${era.start}–${era.end}`,
      accent: eraAccent(i),
      seen: share(seen),
      rest: share(era.credits.length - seen),
      tip: era.top
        ? `${era.start} to ${era.end}: ${era.credits.length} credits, best known for ${name(era.top)}`
        : undefined,
    };
  }).toReversed(),
);
</script>

<nav class="career-eras" aria-label="Career by five years">
  <ul>
    {#each rows as era (era.start)}
      <li>
        <Tooltip text={era.tip} placement="right">
          {#snippet trigger(tooltip)}
            <button type="button" class="era" style:--era-accent={era.accent} aria-pressed={selected === era.start}
              disabled={era.credits.length === 0} onclick={() => pick(era.start)}
              {...tooltip}>
              <span class="years">{era.label}</span>
              <span class="bar" aria-hidden="true"
                ><span class="seen" style:inline-size={era.seen}></span><span class="rest" style:inline-size={era.rest}
                ></span></span>
              <span class="count">{era.credits.length}<span class="visually-hidden"> credits</span></span>
            </button>
          {/snippet}
        </Tooltip>
      </li>
    {/each}
  </ul>
</nav>

<style>
/* Right under the section nav, spaced like its links, with its rule closing the chart off from the links below. */
.career-eras {
  padding-block: var(--person-eras-padding);
  border-block-end: 1px solid var(--color-summary-separator);
}

ul {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.era {
  display: grid;
  grid-template-columns: var(--person-eras-columns);
  gap: var(--person-eras-column-gap);
  align-items: center;
  /* The years and the count line up with the section nav's text; only the hover and pick wash reach past it. */
  inline-size: calc(100% + 2 * var(--person-eras-row-bleed));
  margin-inline: calc(-1 * var(--person-eras-row-bleed));
  padding: var(--person-eras-row-padding-block) var(--person-eras-row-bleed);
  border: 0;
  border-radius: var(--radius-person-eras-row);
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;

  &:is(:hover, :focus-visible):not(:disabled) {
    background-color: var(--color-person-eras-hover);
  }

  &[aria-pressed='true'] {
    background-color: color-mix(in srgb, var(--era-accent) var(--person-eras-picked-tint), transparent);
  }

  &:disabled {
    cursor: default;
  }
}

.years {
  color: var(--era-accent);
  font-size: var(--font-size-person-eras-years);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-person-eras-years);
  white-space: nowrap;
}

.bar {
  display: flex;
  block-size: var(--person-eras-bar-height);
  overflow: hidden;
  border-radius: var(--radius-person-eras-bar);
  background-color: var(--color-person-eras-track);
}

.seen {
  background-color: var(--era-accent);
}

.rest {
  background-color: color-mix(in srgb, var(--era-accent) var(--person-eras-rest-tint), transparent);
}

/* The dropdowns' count tag. */
.count {
  justify-self: end;
  padding: var(--person-eras-count-padding);
  border-radius: var(--radius-tag);
  background-color: var(--color-menu-tag-bg);
  color: var(--color-menu-tag);
  font-size: var(--font-size-person-eras-count);
  font-variant-numeric: tabular-nums;
  line-height: var(--line-height-base);

  [aria-pressed='true'] & {
    color: var(--color-text);
    font-weight: var(--font-weight-headings-heavy);
  }
}
</style>
