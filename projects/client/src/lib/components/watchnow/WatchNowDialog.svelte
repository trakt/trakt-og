<!--
  The where-to-watch modal in the notes and list dialogs' look: the item's fanart under dark glass with "Where to Watch"
  and its type over the title, "Your Favorites" and one section per offer type as a grid of service tiles with what
  each costs (the cheapest rent and buy in green), then a footer bar with the country picker and "Powered by
  JustWatch". It loads on first open, like OG did, and a new country only loads that country's service names: one
  `/watchnow` call has every country's offers.
-->
<script lang="ts">
import type { Attachment } from 'svelte/attachments';
import justwatchLogo from '$lib/assets/sites/justwatch-logo.svg';
import Dialog from '$lib/components/dialog/Dialog.svelte';
import DialogArtHeader from '$lib/components/dialog/DialogArtHeader.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import Icon from '$lib/icons/Icon.svelte';
import heart from '$lib/icons/solid/heart.svg?raw';
import play from '$lib/icons/solid/play.svg?raw';
import { fetchWatchNow } from './fetchWatchNow.ts';
import { fetchWatchNowShared } from './fetchWatchNowShared.ts';
import ServiceTile from './ServiceTile.svelte';
import {
  countryCounts,
  favoriteSlugs,
  https,
  type Source,
  toSourceMap,
  toWatchNowSections,
  type WatchNowButton,
} from './watchNow.ts';
import {
  justWatchLinksSchema,
  watchNowCountriesSchema,
  type WatchNowCountry,
  type WatchNowOffers,
  watchNowOffersSchema,
  watchNowSourcesSchema,
} from './watchNowSchema.ts';

interface Props {
  open: boolean;
  button: WatchNowButton;
  title: string;
  year?: number | null;
  fanart?: string;
}

let { open = $bindable(), button, title, year, fanart }: Props = $props();

// svelte-ignore state_referenced_locally
let country = $state(button.country);
let offers = $state<WatchNowOffers | null>(null);
let countries = $state<WatchNowCountry[]>([]);
let justwatch = $state<Record<string, string | null | undefined>>({});
let sources = $state<Record<string, Map<string, Source>>>({});
let loaded = $state(false);

// An episode's JustWatch page is its season's, like OG.
const justwatchPath = $derived(button.path.replace(/\/episodes\/\d+$/, ''));
const tags = $derived([
  { text: 'Where to Watch', icon: play },
  { text: button.path.startsWith('/movies/') ? 'Movie' : 'Show', color: 'var(--color-dialog-art-media-tag)' },
]);

async function loadItem() {
  const [all, list, links] = await Promise.all([
    fetchWatchNow({ path: `${button.path}/watchnow`, schema: watchNowOffersSchema }),
    fetchWatchNowShared({ path: '/watchnow/countries', schema: watchNowCountriesSchema }),
    fetchWatchNow({ path: `${justwatchPath}/watchnow/justwatch_links`, schema: justWatchLinksSchema }),
  ]);
  offers = all;
  countries = list ?? [];
  justwatch = links ?? {};
  loaded = true;
}

async function loadSources(code: string) {
  const response = await fetchWatchNowShared({ path: `/watchnow/sources/${code}`, schema: watchNowSourcesSchema });
  sources = { ...sources, [code]: toSourceMap(response, code) };
}

$effect(() => {
  if (open && !loaded) void loadItem();
});

$effect(() => {
  if (open && !sources[country]) void loadSources(country);
});

const counts = $derived(countryCounts(offers));
const sections = $derived(
  toWatchNowSections({
    offers: offers?.[country],
    sources: sources[country] ?? new Map(),
    favorites: favoriteSlugs(button.favoriteKeys, country, button.country),
  }),
);
const loading = $derived(!loaded || !sources[country]);
const picked = $derived(countries.find(({ code }) => code === country));
// The countries that have it first, so the picker opens near the viewer's own, then the rest after a divider.
const countryGroups = $derived(
  [countries.filter(({ code }) => counts[code]), countries.filter(({ code }) => !counts[code])].filter((rows) =>
    rows.length > 0
  ),
);
// OG linked the item's JustWatch page, or JustWatch's home for the country (which calls Britain "uk").
const poweredBy = $derived.by(() => {
  const link = justwatch[country];
  return link ? https(link) : `https://www.justwatch.com/${country === 'gb' ? 'uk' : country}`;
});

// While the tiles load, the browser's first focus lands in the footer (Powered by JustWatch): start on the dialog.
const focusAboveFooter: Attachment<HTMLElement> = (footer) => {
  if (!open) return;
  queueMicrotask(() => {
    if (footer.contains(document.activeElement)) footer.closest('dialog')?.focus();
  });
};
</script>

{#snippet flag(src: string | null | undefined)}
  {#if src}<img class="flag" src={https(src)} alt="" />{/if}
{/snippet}

<Dialog bind:open title="Where to watch {title}" size="xl" variant="art" lightDismiss>
  {#snippet header(id)}
    <DialogArtHeader {id} {title} {year} {fanart} {tags} />
  {/snippet}

  <div class={['streaming-links', { loading }]} aria-busy={loading}>
    {#each sections as section (section.title)}
      <div>
        <h3 class="section-title">
          {#if section.favorites}<span class="favorites"><Icon svg={heart} /></span>{/if}
          {section.title}
          <span class="count">{section.links.length}</span>
        </h3>
        <div class="tiles">
          {#each section.links as link (link.slug)}
            <ServiceTile {link} uhd={link.uhd}>
              {#if link.terms.kind === 'prices'}
                <dl class="terms prices">
                  {#each link.terms.prices as { label, amount, lowest } (label)}
                    <dt>{label}</dt>
                    <dd class={{ lowest }}>{amount}{#if lowest}<span class="visually-hidden"> (lowest)</span>{/if}</dd>
                  {/each}
                </dl>
              {:else}
                <span class="terms note">
                  <strong>{link.terms.title}</strong>
                  {#if link.terms.detail}<span>{link.terms.detail}</span>{/if}
                </span>
              {/if}
            </ServiceTile>
          {/each}
        </div>
      </div>
    {:else}
      {#if !loading}
        <p class="no-links">We couldn't find any watch now links for your country. Check back soon!</p>
      {/if}
    {/each}
  </div>

  <footer class="footer" {@attach focusAboveFooter}>
    {#if countries.length > 0}
      <Dropdown label="Country: {picked?.name ?? country.toUpperCase()}">
        {#snippet trigger()}
          {@render flag(picked?.images?.flag)}{picked?.name ?? country.toUpperCase()}
          {#if counts[country]}<span class="tag">{counts[country]}</span>{/if}
        {/snippet}
        {#each countryGroups as rows, index (index)}
          {#if index > 0}<hr />{/if}
          <ul>
            {#each rows as { code, name, images } (code)}
              <li>
                <button type="button" aria-current={code === country} onclick={() => (country = code)}>
                  <span class="country">{@render flag(images?.flag)}{name}</span>
                  {#if counts[code]}<span class="tag">{counts[code]}</span>{/if}
                </button>
              </li>
            {/each}
          </ul>
        {/each}
      </Dropdown>
    {/if}
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    <a class="powered-by" href={poweredBy} target="_blank" rel="noopener">
      Powered by <img src={justwatchLogo} alt="JustWatch" />
    </a>
  </footer>
</Dialog>

<style>
.streaming-links {
  display: grid;
  gap: var(--space-watch-now-sections);
  padding: var(--dialog-art-body-top) var(--dialog-art-inline);
  --service-width: 100%;
  --service-height: var(--watch-now-modal-tile-height);
  --service-padding: 0;
  --service-radius: var(--radius-service-modal);
  --tile-width: var(--watch-now-modal-tile-width);

  @media (width < 768px) {
    --service-height: var(--watch-now-modal-tile-height-sm);
    --tile-width: var(--watch-now-modal-tile-width-sm);
  }

  &.loading {
    opacity: 0.5;
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: opacity var(--transition-card);
  }
}

/* A small tracked label with its count, the rule running on after it. */
.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-watch-now-label);
  margin: 0 0 var(--space-watch-now-section);
  color: var(--color-watch-now-section);
  font-family: var(--font-headings);
  font-size: var(--font-size-watch-now-section);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-see-more);
  line-height: var(--line-height-base);
  text-transform: uppercase;

  &::after {
    flex: 1;
    border-block-start: 1px solid var(--color-dialog-title-border);
    content: '';
  }
}

.favorites {
  display: inline-flex;
  color: var(--color-watch-now-favorites);
}

.count {
  padding: 0 var(--space-xs-inline);
  border-radius: var(--radius-tag);
  background-color: var(--color-menu-tag-bg);
  color: var(--color-menu-tag);
  letter-spacing: normal;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--tile-width), 1fr));
  gap: var(--watch-now-modal-columns-gap);
}

.terms {
  display: grid;
  margin: var(--space-watch-now-terms) 0 0;
  padding-inline: var(--space-watch-now-terms-inline);
  font-family: var(--font-body);
  font-size: var(--font-size-watch-now-terms);
  font-weight: normal;
  line-height: var(--line-height-watch-now-terms);
  text-align: start;
}

/* Rent and Buy down the left, their amounts lined up on the right. */
.prices {
  grid-template-columns: auto 1fr;
  column-gap: var(--space-watch-now-terms-columns);
  font-variant-numeric: tabular-nums;

  & dt {
    color: var(--color-control-muted);
  }

  & dd {
    margin: 0;
    font-weight: var(--font-weight-headings-heavy);
    text-align: end;
  }

  & .lowest {
    color: var(--color-watch-now-lowest);
  }
}

.note {
  & strong {
    font-weight: var(--font-weight-headings-heavy);
  }

  & span {
    color: var(--color-control-muted);
  }
}

.no-links {
  margin: 0;
  color: var(--color-control-muted);
  font-style: italic;
  text-align: center;
}

/* The art dialogs' footer bar, pinned to the bottom while a long list scrolls. */
.footer {
  position: sticky;
  inset-block-end: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--dialog-art-footer-gap);
  padding: var(--dialog-art-footer-padding);
  border-block-start: 1px solid var(--color-dialog-art-border);
  background-color: var(--color-dialog-art-footer-bg);
}

.flag {
  flex: none;
  inline-size: var(--watch-now-flag-size);
  block-size: var(--watch-now-flag-size);
}

.country {
  display: inline-flex;
  align-items: center;
  gap: var(--space-watch-now-label);
}

.powered-by {
  display: flex;
  align-items: center;
  gap: var(--space-control-section);
  margin-inline-start: auto;
  color: var(--color-control-muted);
  font-size: var(--font-size-small);
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    color: var(--color-control-text);
  }

  & img {
    block-size: var(--watch-now-justwatch-height);
  }
}
</style>
