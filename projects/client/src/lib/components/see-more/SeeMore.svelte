<!--
  The "see more" link to the right of a section heading: small tracked uppercase text and a long arrow, gray until
  hover, then red with the arrow nudging right. "See more" unless you pass `text`. A caller on a different background
  sets `--color-see-more` for its gray (a slider's light gray, the summary sidebar's). With `iconOnly` the text is only
  for screen readers and shows as a tooltip, like the arrows in the summary sidebar. With `controls` instead of `href`
  it's a disclosure button for that element, like OG's "Expand" on a collapsed panel.
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import arrowRightLong from '$lib/icons/regular/arrow-right-long.svg?raw';

type Props =
  & { text?: string; iconOnly?: boolean }
  & (
    | {
      href: string;
      controls?: never;
      /** Opens in a new tab, like OG's `target: '_blank'` forum links ("Learn More"). */
      external?: boolean;
    }
    | { href?: never; controls: string; expanded: boolean; ontoggle: () => void; external?: never }
  );

const props: Props = $props();
const text = $derived(props.text ?? 'See more');
const iconOnly = $derived(props.iconOnly ?? false);
</script>

<!-- Hrefs point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<Tooltip text={iconOnly ? text : undefined}>
  {#snippet trigger(tooltip)}
    {#if props.controls}
      <button type="button" class={['see-more', { 'icon-only': iconOnly }]} aria-controls={props.controls}
        aria-expanded={props.expanded} onclick={props.ontoggle} {...tooltip}>
        <span class="text">{text}</span><span class="arrow"><Icon svg={arrowRightLong} /></span>
      </button>
    {:else}
      <a
        class={['see-more', { 'icon-only': iconOnly }]}
        href={props.href}
        target={props.external ? '_blank' : undefined}
        rel={props.external ? 'noopener' : undefined}
        {...tooltip}
      >
        <span class="text">{text}</span><span class="arrow"><Icon svg={arrowRightLong} /></span>
      </a>
    {/if}
  {/snippet}
</Tooltip>

<style>
.see-more {
  color: var(--color-see-more);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  font-size: var(--font-size-see-more);
  letter-spacing: var(--letter-spacing-see-more);
  line-height: 2;
  text-transform: uppercase;
  transition: color var(--transition-see-more);

  &:is(:hover, :focus-visible) {
    color: var(--color-see-more-hover);
    text-decoration: none;
  }
}

/* The disclosure button looks like the link. */
button.see-more {
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
}

.arrow {
  display: inline-block;
  margin: -2px 0 0 var(--space-see-more-icon);
  font-size: var(--font-size-see-more-icon);
  line-height: 1;
  vertical-align: middle;

  @media (prefers-reduced-motion: no-preference) {
    transition: transform var(--transition-see-more);

    .see-more:is(:hover, :focus-visible) & {
      transform: translateX(var(--space-see-more-nudge));
    }
  }
}

.icon-only .arrow {
  margin-inline-start: 0;
  font-size: var(--font-size-see-more-icon-only);
}

.icon-only .text {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
