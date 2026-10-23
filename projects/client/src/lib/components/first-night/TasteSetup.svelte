<!--
  "Tune your picks", in the Watch Now popup's look: an art header, where the member watches as that popup's service
  tiles (up to five), and up to five genres they love as icon tiles, like v3's genre picker. Save writes the watch-now favorites
  and favorite genres to their Trakt settings, which v3 and the apps read too, then reloads the page data.
-->
<script lang="ts">
import { invalidateAll } from '$app/navigation';
import { viewerFetch } from '$lib/auth/viewerFetch';
import Dialog from '$lib/components/dialog/Dialog.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import DialogArtHeader from '$lib/components/dialog/DialogArtHeader.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import ServiceTile from '$lib/components/watchnow/ServiceTile.svelte';
import {
  fetchTasteCountries,
  fetchTasteServices,
  GENRE_LIMIT,
  SERVICE_LIMIT,
  serviceKey,
  SERVICES_SHOWN,
  type TasteCountry,
  tasteGenres,
} from '$lib/firstNight/taste';
import { titleFanart } from '$lib/firstNight/titleFanart';
import Icon from '$lib/icons/Icon.svelte';
import check from '$lib/icons/solid/check.svg?raw';
import magnifyingGlass from '$lib/icons/regular/magnifying-glass.svg?raw';
import tv from '$lib/icons/regular/tv-retro.svg?raw';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import { saveSettings } from '$lib/settings/saveSettings';
import { settingsRequest } from '$lib/settings/settingsRequest';
import CtaLink from './CtaLink.svelte';
import { genreIcons } from './genreIcons.ts';

interface Props {
  open: boolean;
  /** The watch-now country, lower case. */
  country: string;
  /** `us-netflix` keys already saved. */
  services: readonly string[];
  /** Genre slugs already saved. */
  genres: readonly string[];
}

let { open = $bindable(), country, services, genres }: Props = $props();

let picked = $state(new Set<string>());
let loved = $state(new Set<string>());
let busy = $state(false);
let place = $state('');
let countries = $state<TasteCountry[]>([]);
let query = $state('');
// Each opening starts from what's saved.
$effect(() => {
  if (!open) return;
  place = country;
  query = '';
  picked = new Set(services.slice(0, SERVICE_LIMIT));
  if (countries.length === 0) void fetchTasteCountries(fetch).then((list) => (countries = list));
  loved = new Set(genres.slice(0, GENRE_LIMIT));
});

// A new country loads its own services; picks are kept per country, as settings key them.
const all = $derived(open && place ? fetchTasteServices(fetch, place) : Promise.resolve([]));
const here = $derived(countries.find(({ code }) => code === place));
const pickedHere = $derived([...picked].filter((key) => key.startsWith(`${place}-`)).length);
const art = $derived(open ? titleFanart('shows', 'mr-robot') : Promise.resolve(undefined));
const full = $derived(loved.size >= GENRE_LIMIT);
const servicesFull = $derived(pickedHere >= SERVICE_LIMIT);

const toggle = (set: Set<string>, key: string) => {
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a fresh copy assigned to $state, never mutated after
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
};

async function save() {
  busy = true;
  const result = await saveSettings({
    request: settingsRequest(viewerFetch()),
    body: {
      browsing: { watchnow: { country: place, favorites: [...picked] }, genres: { favorites: [...loved] } },
    },
  });
  busy = false;
  if (!result.saved) {
    toast.error(result.errors.at(0) ?? "Your picks didn't save. Try again.");
    return;
  }
  toast.success('Saved to your Trakt settings. Watch Now and your picks follow them.');
  open = false;
  await invalidateAll();
}
</script>

<Dialog bind:open title="Tune your picks" size="xxl" variant="art" lightDismiss>
  {#snippet header(id)}
    {#await art then fanart}
      <DialogArtHeader {id} title="Tune your picks" {fanart}
        tags={[{ text: `${pickedHere} of ${SERVICE_LIMIT} services` }, { text: `${loved.size} of ${GENRE_LIMIT} genres` }]} />
    {/await}
  {/snippet}
  <!-- Focus starts on the popup itself, not on its first tile. -->
  <!-- svelte-ignore a11y_autofocus -->
  <div class="taste" tabindex="-1" autofocus>
    <section aria-labelledby="taste-services">
      <div class="services-head">
        <h3 id="taste-services" class="section-title">
          Where do you watch? <span class="count">{pickedHere}/{SERVICE_LIMIT}</span>
        </h3>
        <label class="filter">
          <span class="glass" aria-hidden="true"><Icon svg={magnifyingGlass} /></span>
          <input class="search" type="search" bind:value={query} placeholder="Filter Services"
            aria-label="Filter streaming services" />
        </label>
      </div>
      {#await all}
        <!-- A new country's services load in the same three rows, so the popup keeps its height. -->
        <div class="tiles" aria-busy="true">
          {#each { length: SERVICES_SHOWN } as _, i (i)}
            <Shimmer inline="100%" block="var(--service-height)" />
          {/each}
        </div>
      {:then list}
        {@const term = query.trim().toLowerCase()}
        <!-- The most popular three rows, or every match A to Z while searching, in the same fixed height. -->
        {@const shown = term
          ? list.filter(({ name }) => name.toLowerCase().includes(term)).toSorted((a, b) => a.name.localeCompare(b.name))
          : list.slice(0, SERVICES_SHOWN)}
        <div class="tiles">
          {#if shown.length === 0}
            <!-- A filter that matched nothing, or a country with no services at all. -->
            <div class="none" role="status">
              <span class="none-icon" aria-hidden="true"><Icon svg={term ? magnifyingGlass : tv} /></span>
              {#if term}
                <p class="none-title">No services match “{query.trim()}”</p>
                <p class="none-text">Check the spelling, try part of the name, or pick another country.</p>
                <CtaLink small onclick={() => (query = "")}>Clear filter</CtaLink>
              {:else}
                <p class="none-title">No streaming services in {here?.name ?? place.toUpperCase()} yet</p>
                <p class="none-text">Trakt doesn't list any services there. Pick another country from the menu below.</p>
              {/if}
            </div>
          {/if}
          {#each shown as service (service.slug)}
            {@const key = serviceKey(place, service.slug)}
            {@const on = picked.has(key)}
            <span class={['service', { off: !on && servicesFull }]}>
              <ServiceTile link={{ ...service, href: '' }} pressed={on}
                onclick={() => {
                  if (on || !servicesFull) picked = toggle(picked, key);
                }} />
            </span>
          {/each}
        </div>
      {/await}
    </section>
    <section aria-labelledby="taste-genres">
      <h3 id="taste-genres" class="section-title">
        What do you love? <span class="count">{loved.size}/{GENRE_LIMIT}</span>
      </h3>
      <div class="genres">
        {#each tasteGenres as genre (genre.slug)}
          {@const on = loved.has(genre.slug)}
          <button type="button" class="genre" aria-pressed={on} disabled={!on && full}
            onclick={() => (loved = toggle(loved, genre.slug))}>
            {#if on}<span class="tick"><Icon svg={check} /></span>{/if}
            <Icon svg={genreIcons[genre.icon]} />
            <span class="name">{genre.name}</span>
          </button>
        {/each}
      </div>
    </section>
  </div>
  <footer class="footer">
    {#if countries.length > 0}
      <Dropdown label="Country: {here?.name ?? place.toUpperCase()}">
        {#snippet trigger()}
          {#if here?.flag}<img class="flag" src={here.flag} alt="" />{/if}{here?.name ?? place.toUpperCase()}
        {/snippet}
        <ul class="countries">
          {#each countries as { code, name, flag } (code)}
            <li>
              <button type="button" aria-current={code === place} onclick={() => (place = code)}>
                {#if flag}<img class="flag" src={flag} alt="" />{/if}{name}
              </button>
            </li>
          {/each}
        </ul>
      </Dropdown>
    {/if}
    <span class="summary">Saved to your Trakt settings, so v3 and the apps use them too.</span>
    <CtaLink onclick={save}>{busy ? 'Saving…' : 'Save'}</CtaLink>
  </footer>
</Dialog>

<style>
/* The Watch Now popup's body, tiles and footer. */
.taste {
  outline: none;
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
}

/* A small tracked label, the rule running on after it. */
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

.count {
  padding: 0 var(--space-xs-inline);
  border-radius: var(--radius-tag);
  background-color: var(--color-menu-tag-bg);
  color: var(--color-menu-tag);
  letter-spacing: normal;
}

/* Always three rows tall, so searching never moves the genres; more matches scroll inside. */
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--tile-width), 1fr));
  grid-auto-rows: var(--service-height);
  align-content: start;
  gap: var(--watch-now-modal-columns-gap);
  /* Three rows and their two gaps, plus the room either side for the ticks. */
  block-size: calc(3 * var(--service-height) + 2 * var(--taste-tiles-row-gap) + 2 * var(--taste-tiles-room));
  padding: var(--taste-tiles-room);
  margin: calc(-1 * var(--taste-tiles-room));
  overflow-y: auto;
}

/* Nothing matched: a centered note filling the three rows, and a way back to every service. */
.none {
  grid-column: 1 / -1;
  grid-row: 1 / span 3;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: var(--space-xs-inline);
  text-align: center;

  p {
    margin: 0;
  }
}

.none-icon {
  display: grid;
  place-items: center;
  inline-size: var(--taste-none-icon);
  block-size: var(--taste-none-icon);
  margin-block-end: var(--space-xs-inline);
  border-radius: 50%;
  background: var(--color-taste-genre-bg);
  color: var(--color-taste-genre-text);
  font-size: var(--font-size-large);
}

.none-title {
  font-weight: var(--font-weight-headings-heavy);
}

.none-text {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}

.none :global(.cta) {
  margin-block-start: var(--space-xs-inline);
}

/* The section title and the search share a line. */
.services-head {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  margin-block-end: var(--space-watch-now-section);

  & .section-title {
    flex: 1;
    margin: 0;
  }
}

/* The filter: a magnifying glass inside the popup's outlined field, narrow and at the line's end. */
.filter {
  position: relative;
  flex: none;
  margin: 0;
}

.glass {
  position: absolute;
  inset-block: 0;
  inset-inline-start: var(--space-sm-inline);
  display: grid;
  place-items: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  pointer-events: none;
}

/* Out-ranks the art dialog's full-width fields. */
.taste .services-head input.search[type='search'] {
  inline-size: var(--taste-search-width);
  min-block-size: 0;
  block-size: var(--control-height-small);
  padding-inline-start: calc(var(--space-sm-inline) * 2 + 1em);
  font-size: var(--font-size-small);
}

/* A picked service gets the genres' red border and corner tick. */
.service {
  display: grid;

  /* The genres' 1px red border, so the tick sits in the same place on both: the tile's 2px brand-colored border
     goes to 1px red, and its padding takes the other pixel so the logo doesn't move. */
  & :global(.pressed > .icon) {
    padding: calc(var(--service-tile-padding-block) + 1px) calc(var(--service-tile-padding-inline) + 1px);
    border-width: 1px;
    border-color: var(--brand-primary);
  }

  & :global(.check) {
    inset-block-start: calc(var(--taste-genre-tick) / -3);
    inset-inline-end: calc(var(--taste-genre-tick) / -3);
    display: grid;
    place-items: center;
    inline-size: var(--taste-genre-tick);
    block-size: var(--taste-genre-tick);
    padding: 0;
    background: var(--brand-primary);
    color: var(--color-text-inverse);
    font-size: var(--font-size-taste-genre-tick);
  }

  /* Five picked: the rest wait until one comes off. */
  &.off {
    opacity: 0.4;
    pointer-events: none;
  }
}

/* v3's genre cards, with OG's solid icons: gray until picked, then washed red with a tick. */
.genres {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--taste-genre-min), 1fr));
  gap: var(--watch-now-modal-columns-gap);
}

.genre {
  position: relative;
  display: grid;
  place-items: center;
  align-content: center;
  gap: var(--space-xs-inline);
  block-size: var(--taste-genre-height);
  padding: var(--space-xs-inline);
  border: 1px solid var(--color-taste-genre-line);
  border-radius: var(--radius-service-modal);
  background: var(--color-taste-genre-bg);
  color: var(--color-taste-genre-text);
  font: inherit;
  font-size: var(--font-size-taste-genre-icon);
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;

  &:hover:not(:disabled) {
    border-color: var(--color-taste-genre-hover-line);
    color: var(--color-taste-genre-on-text);
  }

  &[aria-pressed='true'] {
    border-color: var(--brand-primary);
    background: var(--color-taste-genre-on-bg);
    color: var(--color-taste-genre-on-text);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.name {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1.15;
  text-align: center;
}

.tick {
  position: absolute;
  inset-block-start: calc(var(--taste-genre-tick) / -3);
  inset-inline-end: calc(var(--taste-genre-tick) / -3);
  display: grid;
  place-items: center;
  inline-size: var(--taste-genre-tick);
  block-size: var(--taste-genre-tick);
  border-radius: 50%;
  background: var(--brand-primary);
  color: var(--color-text-inverse);
  font-size: var(--font-size-taste-genre-tick);
}

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

/* Every watch-now country, scrolling inside a menu that stays on screen. */
.countries {
  max-block-size: var(--taste-country-menu-height);
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.countries button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-watch-now-label);
}

.summary {
  margin-inline: auto var(--space-sm-inline);
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}

@media (prefers-reduced-motion: reduce) {
  .genre {
    transition: none;
  }
}
</style>
