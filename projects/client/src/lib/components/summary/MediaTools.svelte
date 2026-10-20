<!-- OG's sidebar tools: the shared report modal. -->
<script lang="ts">
import { page } from '$app/state';
import ReportDialog from '$lib/components/summary/ReportDialog.svelte';
import type { ReportTarget } from '$lib/components/summary/ReportTarget';
import Icon from '$lib/icons/Icon.svelte';
import flag from '$lib/icons/solid/flag.svg?raw';

interface Props {
  target: ReportTarget;
}
const { target }: Props = $props();
let reporting = $state(false);
</script>

{#if page.data.user}
  <ul class="media-tools" aria-label="{target.title} tools">
  <li><button type="button" onclick={() => { reporting = true; }}><Icon svg={flag} fixedWidth /><span>Report {target.type}</span></button></li>
</ul>
{/if}
<ReportDialog bind:open={reporting} {target} />

<style>
.media-tools {
  margin: 0;
  padding: var(--media-tools-padding);
  border-block-start: 1px solid var(--color-summary-separator);
  list-style: none;
  font-family: var(--font-headings);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-headings-light);
  text-transform: uppercase;
}
li {
  padding-block: var(--media-tools-row-padding);
}
button {
  display: grid;
  grid-template-columns: var(--media-tools-icon-column) minmax(0, 1fr);
  align-items: baseline;
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-media-tools);
  font: inherit;
  line-height: var(--media-tools-line-height);
  text-align: start;
  text-decoration: none;
  text-transform: inherit;
  transition: color var(--transition-card);
  &:is(:hover, :focus-visible) {
    color: var(--color-link);
  }
}
</style>
