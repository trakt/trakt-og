<!--
  A folding block of a SidebarFrame's sidebar: a small caps title with a chevron right after it, an optional action at
  the far right (Clear all), then the content. The open state is kept for a year in a `sidebar_<id>` cookie when the
  page passes `remember`, so SSR renders it the same.
    <SidebarSection id="display" title="Display" open={data.sections.display} remember>…</SidebarSection>
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import chevron from '$lib/icons/solid/chevron-down.svg?raw';
import type { Snippet } from 'svelte';

interface Props {
  id: string;
  title: string;
  open?: boolean;
  /** Keep the open state in a cookie. */
  remember?: boolean;
  /** To the header's right, outside the toggle. */
  action?: Snippet;
  children: Snippet;
}

const { id, title, open = true, remember = false, action, children }: Props = $props();
const uid = $props.id();

let expanded = $derived(open);

function toggle() {
  expanded = !expanded;
  if (!remember) return;
  document.cookie = `sidebar_${id}=${expanded ? 'open' : 'closed'}; path=/; samesite=lax; max-age=31536000`;
}
</script>

<section class="sidebar-section" aria-labelledby="{uid}-title">
  <div class="header">
    <button type="button" class="toggle" aria-expanded={expanded} aria-controls="{uid}-body" onclick={toggle}>
      <h2 id="{uid}-title">{title}</h2>
      <Icon svg={chevron} />
    </button>
    {@render action?.()}
  </div>
  <div id="{uid}-body" class="body" hidden={!expanded}>
    {@render children()}
  </div>
</section>

<style>
.sidebar-section {
  display: grid;
  background: none;
  gap: var(--sidebar-section-gap);
  padding-block-start: var(--space-base-inline);
  border-block-start: 1px solid var(--color-sidebar-rule);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm-inline);
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-base-block);
  min-block-size: 0;
  padding: var(--space-xs-block) 0;
  border: 0;
  background: none;
  color: var(--color-sidebar-label);
  cursor: pointer;

  & :global(.icon) {
    font-size: var(--font-size-sidebar-section);
    rotate: -90deg;

    @media (prefers-reduced-motion: no-preference) {
      transition: rotate var(--transition-card);
    }
  }

  &[aria-expanded='true'] :global(.icon) {
    rotate: 0deg;
  }

  &:is(:hover, :focus-visible) {
    color: var(--color-frame-text);
  }
}

h2 {
  margin: 0;
  color: inherit;
  font-size: var(--font-size-sidebar-section);
  font-weight: var(--font-weight-menu-header);
  letter-spacing: var(--letter-spacing-sidebar-label);
  line-height: 1.4;
  text-transform: uppercase;
}

.body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--sidebar-section-gap);

  &[hidden] {
    display: none;
  }
}
</style>
