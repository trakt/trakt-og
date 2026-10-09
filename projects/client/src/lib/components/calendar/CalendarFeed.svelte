<!--
  The calendar sidebar's iCal Feed section body: "Add to calendar app" opens the feed in the viewer's calendar app
  (webcal://), "Copy iCal link" copies it. Feeds are a VIP feature of the My calendars, so everyone else gets the VIP
  link, and the All calendars say where to find one.
    <CalendarFeed url={data.feedUrls[slug]} vip={isVip} mine={target === 'my'} />
-->
<script lang="ts">
import { toast } from '$lib/components/toast/toast.svelte';
import Icon from '$lib/icons/Icon.svelte';
import calendarPlus from '$lib/icons/regular/calendar-plus.svg?raw';
import copyIcon from '$lib/icons/regular/copy.svg?raw';
import check from '$lib/icons/solid/check.svg?raw';
import { traktUrls } from '$lib/traktUrls';

interface Props {
  url: string | null;
  vip: boolean;
  /** A My calendar; the All calendars have no feed. */
  mine: boolean;
}

const { url, vip, mine }: Props = $props();
let copied = $state(false);

function copy() {
  if (!url) return;
  navigator.clipboard.writeText(url).then(
    () => {
      copied = true;
      setTimeout(() => (copied = false), 1600);
    },
    () => toast.error('Your browser blocked copying. Use "Add to calendar app" instead.'),
  );
}
</script>

<!-- The feed is an external API subscription and the VIP page is an OG route og hasn't built yet. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if !mine}
  <p class="note">Feeds come from your own calendars. Pick a My calendar to subscribe to it.</p>
{:else if !vip}
  <a class="button" href={traktUrls.vip} target="_blank" rel="noopener">
    <Icon svg={calendarPlus} />Unlock iCal feeds with VIP
  </a>
{:else if url}
  <a class="button" href={url.replace(/^https:/, 'webcal:')}><Icon svg={calendarPlus} />Add to calendar app</a>
  <button type="button" class={['button', { copied }]} onclick={copy}>
    <Icon svg={copied ? check : copyIcon} />{copied ? 'Copied' : 'Copy iCal link'}
  </button>
{:else}
  <p class="note">Your feed is unavailable. Reload the page to try again.</p>
{/if}

<style>
.button {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  inline-size: 100%;
  min-block-size: var(--control-height);
  padding: 0 var(--space-control-inline);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font: inherit;
  font-size: var(--font-size-control);
  text-decoration: none;
  cursor: pointer;

  & :global(.icon) {
    color: var(--color-control-muted);
  }

  &:is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-hover-bg);
    color: var(--color-control-text);
  }

  &.copied :global(.icon) {
    color: var(--brand-success);
  }
}

.note {
  margin: 0;
  color: var(--color-sidebar-label);
  font-size: var(--font-size-small);
}
</style>
