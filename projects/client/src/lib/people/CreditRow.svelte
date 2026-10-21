<!--
  One credit in the person page's list view: the poster with the viewer's rating in its corner, the title and year,
  the character or job, its type and episode tags, then the same quick-icon bar a poster card has.
    <CreditRow {credit} episodes="62 episodes" userRating={8} icons={…} />
-->
<script lang="ts">
import posterPlaceholder from '$lib/assets/placeholders/poster.png';
import TagPills from '$lib/components/labels/TagPills.svelte';
import type { TagPill } from '$lib/components/labels/TagPill';
import CornerRating from '$lib/components/media/CornerRating.svelte';
import QuickIcons from '$lib/components/media/QuickIcons.svelte';
import type { ComponentProps } from 'svelte';
import type { PersonCredit } from './PersonCredit.ts';

interface Props {
  credit: PersonCredit;
  /** "62 episodes", left out when the viewer hides actors' episode counts. */
  episodes?: string;
  userRating?: number | null;
  /** Fade until hovered or focused, like a faded poster card. */
  faded?: boolean;
  icons: Omit<ComponentProps<typeof QuickIcons>, 'small'>;
}

const { credit, episodes, userRating, faded = false, icons }: Props = $props();

const tags = $derived<TagPill[]>([
  { text: credit.type === 'show' ? 'Show' : 'Movie', kind: 'primary' },
  ...(episodes ? [{ text: episodes }] : []),
  ...(credit.status ? [{ text: credit.status, kind: 'light' as const }] : []),
]);
</script>

<!-- Credit hrefs are built from the API's slugs, so they aren't route ids resolve() can check. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<article class={['credit-row', { faded }]}>
  <a class="poster" href={credit.href} tabindex="-1" aria-hidden="true">
    <img src={credit.image ?? posterPlaceholder} alt="" loading="lazy" decoding="async" />
    {#if userRating}<CornerRating rating={userRating} />{/if}
  </a>
  <div class="text">
    <div class="names">
      <h3><a href={credit.href}>{credit.title}</a>{#if credit.year}<span class="year">{credit.year}</span>{/if}</h3>
      {#if credit.characters}<p class="role">{credit.characters}</p>{/if}
    </div>
    <TagPills {tags} />
  </div>
  <div class="icons">
    <QuickIcons row small {...icons} />
  </div>
</article>

<style>
.credit-row {
  position: relative;
  display: grid;
  grid-template-columns: var(--person-credit-row-poster-width) minmax(0, 1fr) var(--person-credit-row-icons-width);
  gap: var(--person-credit-row-gap);
  align-items: center;
  padding-block: var(--person-credit-row-padding);
  transition: opacity var(--transition-card);

  /* The list rows' hover wash, reaching a little past the row. */
  &::before {
    content: '';
    position: absolute;
    inset: 0 calc(-1 * var(--list-card-wash-bleed));
    z-index: -1;
    border-radius: var(--radius-list-card);
    background-color: var(--color-list-card-wash);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-list-card);
  }

  &:is(:hover, :focus-within)::before {
    opacity: 1;
  }

  &.faded:not(:hover, :focus-within) {
    opacity: var(--opacity-faded);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &::before {
      transition: none;
    }
  }
}

.poster {
  position: relative;
  display: block;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: var(--radius-person-credit-row-poster);

  & img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}

.text {
  display: grid;
  gap: var(--person-credit-row-tags-gap);
  justify-items: start;
  min-inline-size: 0;
}

/* The character sits right under the title it belongs to. */
.names {
  display: grid;
  gap: var(--person-credit-row-line-gap);
}

h3 {
  margin: 0;
  font-size: var(--font-size-person-credit-row-title);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-person-credit-row-title);

  & a {
    color: inherit;
    text-decoration: none;

    &:is(:hover, :focus-visible) {
      color: var(--color-link);
    }
  }
}

.year {
  margin-inline-start: var(--person-credit-row-year-gap);
  color: var(--color-person-credit-row-year);
  font-size: var(--font-size-person-credit-row-year);
  font-weight: var(--font-weight-headings-light);
}

.role {
  margin: 0;
  color: var(--color-person-credit-row-role);
  font-size: var(--font-size-person-credit-row-role);
}

.icons {
  align-self: center;
}
</style>
