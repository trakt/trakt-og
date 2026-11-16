<script lang="ts">
import Container from '#lib/components/container/Container.svelte';
import FanartHeader from '#lib/components/media/FanartHeader.svelte';
import ParentalBars from '#lib/components/parental/ParentalBars.svelte';
import ParentalMeter from '#lib/components/parental/ParentalMeter.svelte';
import SummaryTitle from '#lib/components/summary/SummaryTitle.svelte';
import Specimen from '#lib/design/Specimen.svelte';
import Variant from '#lib/design/Variant.svelte';
import earth from '#lib/icons/regular/earth-americas.svg?raw';
import shield from '#lib/icons/regular/shield-halved.svg?raw';
import CertificationGroups from '#lib/parental/CertificationGroups.svelte';
import type { ParentalGuide } from '#lib/parental/ParentalGuide.ts';
import ParentalGuideTiles from '#lib/parental/ParentalGuideTiles.svelte';
import { toCertificationGroups } from '#lib/parental/toCertificationGroups.ts';
import StatsSection from '#lib/stats/StatsSection.svelte';
import { breakingBad } from '../summary/fixtures.ts';

const guide: ParentalGuide = [
  { category: 'nudity', level: 1 },
  { category: 'violence', level: 2 },
  { category: 'profanity', level: 3 },
  { category: 'alcohol', level: 1 },
  { category: 'frightening', level: 0 },
];
const page = `${breakingBad.href}/parental-guide`;
const ratings = toCertificationGroups({
  certifications: [
    { certification: '14', country: 'br' },
    { certification: 'MA 15+', country: 'au' },
    { certification: '16', country: 'de' },
    { certification: '15', country: 'gb' },
    { certification: '15', country: 'kr' },
    { certification: '18', country: 'pl' },
    { certification: 'NC16', country: 'sg' },
    { certification: '-12', country: 'fr' },
    { certification: '18+', country: 'tr' },
    { certification: 'TV-MA', country: 'us' },
    { certification: 'PG', country: 'ie' },
  ],
  origin: 'us',
  viewer: 'gb',
});
</script>

{#snippet title(certification: string | null, parental?: { page: string; guide: ParentalGuide })}
  <FanartHeader image={breakingBad.fanart}>
    <SummaryTitle title={breakingBad.title} year={breakingBad.year} {certification} {parental} />
  </FanartHeader>
{/snippet}

<Specimen title="Title badge" bleed
  note="A movie's or show's rating links to its parental guide page's certifications. With a guide (signed-in viewers), a half joins it with a line per category, as tall as its level and in its color. Hover it for each level; click it for the page.">
  <Variant label="Rating and guide">{@render title('TV-MA', { page, guide })}</Variant>
  <Variant label="Guide, no rating">{@render title(null, { page, guide })}</Variant>
  <Variant label="Rating, no guide (guests)">{@render title('TV-MA', { page, guide: [] })}</Variant>
</Specimen>

<Specimen title="Meter and lines" note="The page's meter: three steps lit up to the level, in its color; None lights none. The badge's lines: one per category, as tall as its level.">
  <div class="meters">
    {#each [0, 1, 2, 3] as const as level (level)}<ParentalMeter {level} />{/each}
    <ParentalBars {guide} />
  </div>
</Specimen>

<Specimen title="Parental guide page" bleed
  note="The guide's levels as stats tiles, each name on one line, then the origin country and the viewer's on their own band (hover the US rating for its meaning), and every country's rating grouped by the youngest age, four across with each age's count beside it, the origin's group ringed. Ratings that name no age close the row as Other.">
  <Container>
    <div class="column">
      <StatsSection id="parental-guide" title="Parental Guide" icon={shield}>
        <ParentalGuideTiles {guide} />
      </StatsSection>
      <StatsSection id="certifications" title="Certifications" icon={earth}>
        <CertificationGroups featured={ratings.featured} groups={ratings.groups} />
      </StatsSection>
    </div>
  </Container>
</Specimen>

<style>
.meters {
  display: flex;
  align-items: center;
  gap: var(--space-stats-tiles);
}

/* The page's content column, beside where the summary sidebar sits. */
.column {
  margin-inline-start: var(--summary-offset);
  padding-block: var(--gutter) var(--space-stats-section);
}
</style>
