<!--
  The calendar sidebar's iCal Feed section body: "Add to calendar app" opens the feed in the viewer's calendar app
  (webcal://), "Copy iCal link" copies it. Feeds are a VIP feature of the My calendars, so the page only shows the
  section when there's one.
    <CalendarFeed url={feedUrl} mode="show" />
-->
<script lang="ts">
import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
import { useTrack } from '#lib/analytics/useTrack.ts';
import { toast } from '#lib/components/toast/toast.svelte.ts';
import Icon from '#lib/icons/Icon.svelte';
import calendarPlus from '#lib/icons/regular/calendar-plus.svg?raw';
import copyIcon from '#lib/icons/regular/copy.svg?raw';
import check from '#lib/icons/solid/check.svg?raw';

interface Props {
  url: string;
  /** What the calendar lists, as trakt-web's feed menu counts it. */
  mode: 'movie' | 'show' | 'media';
}

const { url, mode }: Props = $props();
let copied = $state(false);
const { track } = useTrack(AnalyticsEvent.CalendarFeed);

function copy() {
  track({ action: 'copy', mode });
  navigator.clipboard.writeText(url).then(
    () => {
      copied = true;
      setTimeout(() => (copied = false), 1600);
    },
    () => toast.error('Your browser blocked copying. Use "Add to calendar app" instead.'),
  );
}
</script>

<!-- The feed is an external API subscription. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<a class="button" href={url.replace(/^https:/, 'webcal:')} onclick={() => track({ action: 'subscribe', mode })}
  ><Icon svg={calendarPlus} />Add to calendar app</a>
<button type="button" class={['button', { copied }]} onclick={copy}>
  <Icon svg={copied ? check : copyIcon} />{copied ? 'Copied' : 'Copy iCal link'}
</button>

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
</style>
