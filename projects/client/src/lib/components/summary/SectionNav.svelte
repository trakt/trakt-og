<!--
  The sidebar's section links on a summary page (OG's `ul.nav.sections`): anchors down the page, which glide to their
  section's heading, some with a circled arrow to the full subpage ("All people"). A `page` section is one link to another page, its arrow
  inside it, so the whole row opens that page (Stats).
  The settings sidebar uses it with `spy` off (OG never marked the panel in view there) and `ruled`, which adds a rule
  above the first link and drops the top margin.
-->
<script lang="ts">
import { replaceState } from '$app/navigation';
import { page } from '$app/state';
import type { Attachment } from 'svelte/attachments';
import SeeMore from '$lib/components/see-more/SeeMore.svelte';
import Icon from '$lib/icons/Icon.svelte';
import arrowRightLong from '$lib/icons/regular/arrow-right-long.svg?raw';
import { isPlainClick } from '$lib/utils/isPlainClick';
import { prefersReducedMotion } from 'svelte/motion';

interface Section {
  readonly label: string;
  /** Usually an anchor on the page, like `#people`. */
  readonly href: string;
  readonly more?: { readonly href: string; readonly text: string };
  /** A link to another page instead of an anchor: the arrow sits inside it. */
  readonly page?: boolean;
}

interface Props {
  sections: readonly Section[];
  label?: string;
  /** Marks the section in view as the page scrolls. */
  spy?: boolean;
  ruled?: boolean;
}

const { sections, label = 'Sections', spy = true, ruled = false }: Props = $props();
const first = () => sections.at(0)?.href;
// svelte-ignore state_referenced_locally
let current = $state(spy ? first() : undefined);
// Without scrollend, about how long a smooth scroll takes down a summary.
const GLIDE_FALLBACK_MS = 700;
const cssLength = (name: string) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;

// The heading the section opens with, down its first children: Overview opens with its stats, not a heading, and a
// lazy section has none until it loads.
function leadingHeading(section: HTMLElement): Element | undefined {
  for (let element = section.firstElementChild; element; element = element.firstElementChild) {
    if (element.tagName === 'H2') return element;
  }
  return undefined;
}

// Where the section's heading, else its top, sits a gutter under the sticky header, where the spy marks it current.
function headingTop(section: HTMLElement) {
  const heading = leadingHeading(section) ?? section;
  return heading.getBoundingClientRect().top + window.scrollY - cssLength('--header-height') - cssLength('--gutter');
}

// The page can still shift under a glide as lazy sections load, so once it settles it glides again, a few times at most.
function glide(section: HTMLElement, tries = 3) {
  const top = headingTop(section);
  const reduced = prefersReducedMotion.current;
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  if (tries <= 1) return;
  const settled = () => {
    if (Math.abs(headingTop(section) - window.scrollY) > 1) glide(section, tries - 1);
  };
  if ('onscrollend' in window) window.addEventListener('scrollend', settled, { once: true });
  else setTimeout(settled, GLIDE_FALLBACK_MS);
}

// The browser's own jump would leave the heading under the header.
function jump(event: MouseEvent, href: string) {
  const section = document.getElementById(href.slice(1));
  if (!section || !isPlainClick(event)) return;
  event.preventDefault();
  glide(section);
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same page, with only its hash changed
  replaceState(href, page.state);
}

const track: Attachment<HTMLElement> = () => {
  if (!spy) return;
  let frame = 0;
  const update = () => {
    const targets = sections.filter(({ page }) => !page)
      .map(({ href }) => ({ href, element: document.getElementById(href.slice(1)) }));
    // The header and a small reading gap, measured from the existing design token.
    const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) + 60;
    current = targets.filter(({ element }) => element && element.getBoundingClientRect().top <= offset).at(-1)?.href ??
      targets.at(0)?.href;
  };
  const scroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  };
  update();
  window.addEventListener('scroll', scroll, { passive: true });
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll', scroll);
  };
};
</script>

<!-- Anchors and subpages og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<nav class={{ ruled }} aria-label={label} {@attach track}>
  <ul>
    {#each sections as section (section.href)}
      <li>
        {#if section.page}
          <a class="section page" href={section.href}>{section.label}<span class="arrow"><Icon svg={arrowRightLong} /></span></a>
        {:else}
          <a class="section" href={section.href} aria-current={section.href === current ? 'location' : undefined}
            onclick={(event) => jump(event, section.href)}>{section.label}</a>
        {/if}
        {#if section.more}
          <span class="more"><SeeMore href={section.more.href} text={section.more.text} iconOnly /></span>
        {/if}
      </li>
    {/each}
  </ul>
</nav>

<style>
ul {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

li {
  position: relative;
  border-block-end: 1px solid var(--color-summary-separator);
}

.ruled {
  & ul {
    margin-block-start: 0;
  }

  & li:first-child {
    border-block-start: 1px solid var(--color-summary-separator);
  }
}

.section {
  display: block;
  padding-block: 7px;
  color: var(--color-summary-label);
  font-family: var(--font-headings);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-headings);
  text-transform: uppercase;
  text-decoration: none;
  transition: color var(--transition-card);

  /* OG's scrollspy `li.active a`. */
  &:is(:hover, :focus-visible, [aria-current]) {
    color: var(--color-summary-hover);
    text-decoration: none;
  }
}

.page {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Like the see-more arrows beside the other sections, red and nudged right on hover. */
.arrow {
  font-size: var(--font-size-see-more-icon-only);
  line-height: 1;
  transition: color var(--transition-see-more), transform var(--transition-see-more);

  .page:is(:hover, :focus-visible) & {
    color: var(--color-see-more-hover);
    transform: translateX(var(--space-see-more-nudge));
  }
}

@media (prefers-reduced-motion: reduce) {
  .arrow {
    transition: none;
  }
}

.more {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  padding-block: 5px 6px;

  /* The arrows rest in the section links' gray, then turn red like every see-more link. */
  --color-see-more: var(--color-summary-label);
}
</style>
