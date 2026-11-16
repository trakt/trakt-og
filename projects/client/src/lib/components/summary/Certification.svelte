<!--
  A title's certification after its year ("PG-13", "TV-MA"): OG's small box at OG's size, in the frosted glass of the
  ratings strip's buttons (All Stats), filling white on hover, with a tooltip saying what the rating means. For
  summaries, episodes and their subpages, and every country's rating on the parental guide page, where `country`
  keeps OG's US tips to US ratings.
  On a movie's or show's summary, `page` makes the rating a link to its parental guide page's certifications, and a
  `guide` joins a half with a line per category, as tall as its level and in its color. That half has its own hover
  and tooltip (each category's level) and links to the page. With a guide but no certification, it stands alone.
    <Certification certification="TV-MA" />
    <Certification certification="TV-MA" page="/shows/phony/parental-guide" guide={levels} />
-->
<script lang="ts">
import { parentalCategoryLabels, parentalLevelLabels } from '#lib/components/filters/parentalGuide.ts';
import ParentalBars from '#lib/components/parental/ParentalBars.svelte';
import ParentalGuideTip from '#lib/components/parental/ParentalGuideTip.svelte';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import type { ParentalGuide } from '#lib/parental/ParentalGuide.ts';
import { certificationTip } from './certificationTip.ts';

interface Props {
  certification?: string | null;
  /** The rating's country, when it may not be the US's: OG's tips explain US ratings only. */
  country?: string;
  /** The title's parental guide page; the rating links to its certifications. */
  page?: string;
  /** The title's parental guide; its half shows only with `page` and a level to show. */
  guide?: ParentalGuide;
}

const { certification, country = 'us', page, guide = [] }: Props = $props();
const tip = $derived(certification && country === 'us' ? certificationTip(certification) : undefined);
const levels = $derived(page && guide.length > 0 ? guide : null);
const spoken = $derived(
  levels
    ?.map(({ category, level }) => `${parentalCategoryLabels[category]} ${parentalLevelLabels[level]}`)
    .join(', '),
);
</script>

<!-- The page's path is built from the title's slug; resolve() only takes literal routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if certification || levels}
  <span class={['badge', { joined: certification && levels }]}>
    {#if certification}
      <Tooltip text={tip}>
        {#snippet trigger(tooltip)}
          {#if page}
            <a class="certification" href="{page}#certifications" {...tooltip}>{certification}</a>
          {:else}
            <!-- Focusable, so the keyboard can show what the rating means. -->
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <span class="certification" tabindex={tip ? 0 : undefined} {...tooltip}>{certification}</span>
          {/if}
        {/snippet}
      </Tooltip>
    {/if}
    {#if levels && page}
      <Tooltip>
        {#snippet trigger(tooltip)}
          <a class="certification guide" href={page} aria-label="Parental Guide: {spoken}" {...tooltip}><ParentalBars
              guide={levels}
            /></a>
        {/snippet}
        <ParentalGuideTip guide={levels} />
      </Tooltip>
    {/if}
  </span>
{/if}

<style>
.badge {
  display: inline-flex;
  margin-inline-start: var(--space-certification);
  vertical-align: middle;
}

.certification {
  display: inline-block;
  padding: var(--space-certification-padding);
  border: 1px solid var(--color-certification-line);
  border-radius: var(--radius-control);
  background-color: var(--color-certification-bg);
  backdrop-filter: var(--blur-header-glass);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-size: var(--font-size-certification);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-base);
  text-decoration: none;
  text-shadow: none;
  cursor: default;
  transition: background-color var(--transition-card), color var(--transition-card), border-color
    var(--transition-card);

  &:is(a) {
    cursor: pointer;
  }

  &:is(:hover, :focus-visible) {
    border-color: var(--color-certification-hover-bg);
    background-color: var(--color-certification-hover-bg);
    color: var(--color-certification-hover-text);
    text-decoration: none;
  }
}

/* The lines keep their dark colors on the art, and take the deeper light ones once the half fills white. */
.guide {
  display: inline-flex;
  align-items: center;
  align-self: stretch;
  color-scheme: dark;

  &:is(:hover, :focus-visible) {
    color-scheme: light;
  }
}

/* The rating and the shield as one pill in two halves, split by a thin line. */
.joined {
  & .certification:not(.guide) {
    border-start-end-radius: 0;
    border-end-end-radius: 0;
  }

  & .guide {
    margin-inline-start: -1px;
    border-inline-start-color: var(--color-certification-divider);
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .certification {
    transition: none;
  }
}
</style>
