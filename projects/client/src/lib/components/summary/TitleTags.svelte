<!--
  The tag bar above a title on summaries and subpages: one glass bar in parts. First an optional page label ("Stats",
  "Comments") on a lighter wash, then the way up (a movie's collection, a season's show, an episode's show and
  season), each a block that fills the bar's height on hover, split by a slash that leans like a typed "/" and clips
  each block's fill and click area to its side, then full-color tags: the episode type and Post Credits, "×2" for two
  scenes.
  Nothing renders without a part.
    <TitleTags links={[{ title: 'Ted Lasso', href: '/shows/ted-lasso' }, { title: 'Season 1', href }]} {type} {credits} />
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { postCredits } from './postCredits.ts';

interface Props {
  /** A gold part that leads the bar and catches the light once: a person's "70th birthday". */
  highlight?: { readonly text: string; readonly svg?: string };
  /** The subpage this is: "Stats", "Cast & Crew". */
  label?: string;
  /**
   * The way up, outermost first. One without an href is this page itself, like a titled season's "Season 10". A
   * `tint` washes its block in that color: a person fanart's character.
   */
  links?: readonly { readonly title: string; readonly href?: string; readonly tint?: string }[];
  /** The episode type: "Season Premiere", colored by `--episode-{kind}`. */
  type?: { readonly text: string; readonly kind: string };
  /** The API's `during_credits` and `after_credits`. */
  credits?: { readonly duringCredits?: boolean | null; readonly afterCredits?: boolean | null };
}

const { highlight, label, links = [], type, credits }: Props = $props();
const scenes = $derived(postCredits({ during: credits?.duringCredits, after: credits?.afterCredits }));
const slashed = (i: number) => ({ 'before-slash': i < links.length - 1, 'after-slash': i > 0 });
</script>

<!-- The links are canonical API slugs, and resolve() only takes literal routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if highlight || label || links.length > 0 || type || scenes}
  <div class="title-tags">
    {#if highlight}<span class="part highlight">{#if highlight.svg}<Icon svg={highlight.svg} />{/if}{highlight.text}</span>{/if}
    {#if label}<span class="part label">{label}</span>{/if}
    {#if links.length > 0}
      <span class="part links">
        {#each links as link, i (link.title)}
          {#if link.href}
            <a class={['link', slashed(i), { tinted: link.tint }]} style:--link-tint={link.tint} href={link.href}
              rel={i === links.length - 1 ? 'up' : undefined}>{link.title}</a>
          {:else}
            <span class={['link', slashed(i), { tinted: link.tint }]} style:--link-tint={link.tint}>{link.title}</span>
          {/if}
        {/each}
      </span>
    {/if}
    {#if type}<span class="part tag" style:--tag="var(--episode-{type.kind})">{type.text}</span>{/if}
    {#if scenes}
      <Tooltip text={scenes.hint}>
        {#snippet trigger(tooltip)}
          <span class="part tag credits" {...tooltip}>Post Credits{#if scenes.count > 1}<span class="count"
                aria-hidden="true">×{scenes.count}</span><span class="visually-hidden">, {scenes.count} scenes</span
              >{/if}</span>
        {/snippet}
      </Tooltip>
    {/if}
  </div>
{/if}

<style>
.title-tags {
  display: inline-flex;
  max-inline-size: 100%;
  block-size: var(--title-tags-height);
  margin-block-end: var(--space-title-tags);
  overflow: hidden;
  border: 1px solid var(--color-title-tags-line);
  border-radius: calc(var(--title-tags-height) / 2);
  background-color: var(--color-title-tags-bg);
  backdrop-filter: var(--blur-profile-pill);
  color: var(--color-title-tags-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-title-tags);
  font-weight: var(--font-weight-headings);
  line-height: 1;
  text-shadow: none;
  white-space: nowrap;
}

.part {
  display: inline-flex;
  align-items: center;
  padding-inline: var(--title-tags-padding);
}

/* Gold, with one sweep of light across it after the page opens. */
.highlight {
  position: relative;
  gap: var(--title-tags-highlight-gap);
  overflow: hidden;
  background-color: var(--color-title-tags-highlight);
  color: var(--color-title-tags-highlight-text);
  font-weight: var(--font-weight-headings-heavy);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(100deg, transparent 30%, var(--color-title-tags-shine) 50%, transparent 70%);
    translate: -120% 0;
    animation: shine var(--title-tags-shine-duration) ease var(--title-tags-shine-delay) both;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      display: none;
    }
  }
}

@keyframes shine {
  to {
    translate: 120% 0;
  }
}

.label {
  /* The rounded end crowds the start, so the end gives a little back to read even. */
  padding-inline-end: var(--title-tags-label-padding-end);
  background-color: var(--color-title-tags-label);
  color: var(--color-text-inverse);
  font-weight: var(--font-weight-headings-heavy);
}

.label + .links {
  border-inline-start: 1px solid var(--color-title-tags-divider);
}

.links {
  align-items: stretch;
  padding-inline: 0;
}

/* Each step up is its own block, so hovering fills it rather than only underlining. */
.link {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding-inline: var(--title-tags-padding);
  color: inherit;
  text-decoration: none;
  transition: background-color var(--transition-card), color var(--transition-card);
}

.tinted {
  background-color: color-mix(in srgb, var(--link-tint) var(--title-tags-tint), transparent);
  color: var(--color-text-inverse);
}

a.link:is(:hover, :focus-visible) {
  background-color: var(--color-title-tags-hover);
  color: var(--color-text-inverse);
  outline: none;
  text-decoration: none;
}

/* The slash between a show and its season: each block is clipped along it, the fill and the click area too. */
.before-slash {
  padding-inline-end: calc(var(--title-tags-slant) / 2 + var(--title-tags-slash-gap));
  clip-path: polygon(0 0, 100% 0, calc(100% - var(--title-tags-slant)) 100%, 0 100%);
}

.after-slash {
  margin-inline-start: calc(-1 * var(--title-tags-slant));
  padding-inline-start: calc(var(--title-tags-slant) / 2 + var(--title-tags-slash-gap));
  /* A pixel past the slash, so the line it draws isn't clipped to half. */
  clip-path: polygon(calc(var(--title-tags-slant) - 1px) 0, 100% 0, 100% 100%, -1px 100%);

  /* Drawn past the bar's edges, so the line runs into the border instead of tapering off at the corners. */
  &::before {
    content: '';
    position: absolute;
    inset-block: -2px;
    inset-inline-start: -1px;
    inline-size: calc(var(--title-tags-slant) + 2px);
    background: linear-gradient(
      to bottom right,
      transparent calc(50% - 1px),
      var(--color-title-tags-divider) calc(50% - 1px),
      var(--color-title-tags-divider) calc(50% + 1px),
      transparent calc(50% + 1px)
    );
    pointer-events: none;
  }
}

/* A step between two others, like a titled season's number: slashed on both sides. */
.before-slash.after-slash {
  clip-path: polygon(
    calc(var(--title-tags-slant) - 1px) 0,
    100% 0,
    calc(100% - var(--title-tags-slant)) 100%,
    -1px 100%
  );
}

.tag {
  background-color: var(--tag);
  color: var(--color-text-inverse);
  font-weight: var(--font-weight-headings-heavy);
}

.credits {
  --tag: var(--color-title-tags-credits-bg);
  color: var(--color-title-tags-credits-text);
  cursor: default;
}

.count {
  margin-inline-start: var(--space-title-tags-count);
  font-weight: var(--font-weight-headings);
  opacity: var(--opacity-title-tags-count);
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .link {
    transition: none;
  }
}
</style>
