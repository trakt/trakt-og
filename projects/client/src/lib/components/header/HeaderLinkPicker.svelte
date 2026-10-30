<!--
  The header's link picker, in Tune your picks' look: an art header with the bar's count over every link the bar can
  hold, as tiles in six even columns: Main, Shows, Movies, My Calendars, All Calendars and the member's own pages under
  their first name. A tile turns
  its link on or off (bold and washed red with a red check when on, like the genres), and a new one goes to the end of the bar, which
  changes behind the popup as you pick. At the cap, tiles that would add are off. Done closes it; each pick is already
  saved.
-->
<script lang="ts">
import CtaLink from '$lib/components/first-night/CtaLink.svelte';
import Dialog from '$lib/components/dialog/Dialog.svelte';
import DialogArtHeader from '$lib/components/dialog/DialogArtHeader.svelte';
import { titleFanart } from '$lib/firstNight/titleFanart';
import Icon from '$lib/icons/Icon.svelte';
import check from '$lib/icons/solid/check.svg?raw';
import type { HeaderLink, HeaderLinkGroup } from './HeaderLink.ts';
import { headerLinkPrefs } from './headerLinkPrefs.ts';

interface Props {
  open: boolean;
  /** The bar's links, in order. */
  links: readonly HeaderLink[];
  choices: readonly HeaderLink[];
  onchange: (ids: string[]) => void;
  /** The member's first name, over their own pages. */
  name: string;
}

let { open = $bindable(), links, choices, onchange, name }: Props = $props();
const uid = $props.id();

const TITLE = 'Customize your header links';
const GROUPS = $derived<readonly (readonly [HeaderLinkGroup, string])[]>([
  ['main', 'Main'],
  ['shows', 'Shows'],
  ['movies', 'Movies'],
  ['my-calendars', 'My Calendars'],
  ['all-calendars', 'All Calendars'],
  ['profile', name],
]);

const art = $derived(open ? titleFanart('shows', 'mr-robot') : Promise.resolve(undefined));
const ids = $derived(links.map(({ id }) => id));
const full = $derived(ids.length >= headerLinkPrefs.MAX);
const columns = $derived(
  GROUPS.map(([group, title]) => ({ title, rows: choices.filter((choice) => choice.group === group) })).filter(
    ({ rows }) => rows.length > 0,
  ),
);

const toggle = (id: string) => onchange(ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]);
</script>

<Dialog bind:open title={TITLE} size="xxxl" variant="art" lightDismiss>
  {#snippet header(id)}
    {@const tags = [{ text: `${ids.length} of ${headerLinkPrefs.MAX} links` }]}
    {#await art}
      <DialogArtHeader {id} title={TITLE} {tags} loading />
    {:then fanart}
      <DialogArtHeader {id} title={TITLE} {fanart} {tags} />
    {/await}
  {/snippet}
  <!-- Focus starts on the popup itself, not on its first tile. -->
  <!-- svelte-ignore a11y_autofocus -->
  <div class="columns" tabindex="-1" autofocus>
    {#each columns as column, index (column.title)}
      <div class="column" role="group" aria-labelledby="{uid}-{index}">
        <h3 id="{uid}-{index}" class="column-title">{column.title}</h3>
        <ul>
          {#each column.rows as choice (choice.id)}
            {@const on = ids.includes(choice.id)}
            <li>
              <button type="button" class="choice" aria-pressed={on} disabled={!on && full}
                onclick={() => toggle(choice.id)}><span class="label" data-label={choice.label}>{choice.label}</span
                ><span class="mark"><Icon svg={check} /></span></button>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
  <footer class="footer">
    <span class="summary">
      {#if full}
        {headerLinkPrefs.MAX} links is the most. Remove one to add another.
      {:else}
        Saved to this browser.<br />Links that don't fit fold into a More menu.
      {/if}
    </span>
    <CtaLink onclick={() => (open = false)}>Done</CtaLink>
  </footer>
</Dialog>

<style>
/* A column per group, all one width. */
.columns {
  outline: none;
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  align-items: start;
  gap: var(--header-picker-gap);
  padding: var(--dialog-art-body-top) var(--dialog-art-inline);

  /* A narrower window's popup: three columns a row. */
  @media (width < 1200px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-flow: row;
  }
}

.column {
  display: grid;
  gap: var(--header-picker-title-gap);
  min-inline-size: 0;

  & ul {
    display: grid;
    gap: var(--header-picker-row-gap);
    margin: 0;
    padding: 0;
    list-style: none;
  }
}

/* Tune your picks' section label, lined up with the text inside the tiles under it. */
.column-title {
  margin: 0;
  padding-inline: calc(var(--space-sm-inline) + 1px);
  color: var(--color-watch-now-section);
  font-family: var(--font-headings);
  font-size: var(--font-size-watch-now-section);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-see-more);
  line-height: var(--line-height-base);
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* The genre tiles' look, as a row: gray until picked, then bold and washed red with a red check at the end. */
.choice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs-inline);
  inline-size: 100%;
  min-block-size: 0;
  padding: var(--header-picker-row-padding) var(--space-sm-inline);
  border: 1px solid var(--color-taste-genre-line);
  border-radius: var(--radius-service-modal);
  background: var(--color-taste-genre-bg);
  color: var(--color-taste-genre-text);
  font: inherit;
  font-size: var(--font-size-header-picker-choice);
  font-weight: normal;
  text-align: start;
  white-space: nowrap;
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
    font-weight: var(--font-weight-headings-heavy);
  }

  &:disabled {
    opacity: var(--opacity-action-disabled);
    cursor: not-allowed;
  }
}

/* The check keeps its room when off, so nothing shifts as a tile turns on. */
.mark {
  flex: none;
  color: var(--brand-primary);
  font-size: var(--font-size-header-picker-check);
  visibility: hidden;

  [aria-pressed='true'] > & {
    visibility: visible;
  }
}

/* Holds the bold label's width too, so a column doesn't widen when one of its tiles turns on. */
.label {
  display: inline-grid;

  &::after {
    content: attr(data-label);
    block-size: 0;
    overflow: hidden;
    font-weight: var(--font-weight-headings-heavy);
    visibility: hidden;
  }
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

.summary {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
}

@media (prefers-reduced-motion: reduce) {
  .choice {
    transition: none;
  }
}
</style>
