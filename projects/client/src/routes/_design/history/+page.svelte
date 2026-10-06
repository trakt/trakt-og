<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import DayGroup from '$lib/components/history/DayGroup.svelte';
import WatchPopover from '$lib/components/history/WatchPopover.svelte';
import SummaryActionMenu from '$lib/components/summary/SummaryActionMenu.svelte';
import Icon from '$lib/icons/Icon.svelte';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import summaryCheck from '$lib/icons/trakt/check.svg?raw';
import historyIcon from '$lib/icons/light/clock-rotate-left.svg?raw';
import VisibilityControl from '$lib/components/visibility/VisibilityControl.svelte';
import backward from '$lib/icons/light/backward.svg?raw';
import circleMinus from '$lib/icons/light/circle-minus.svg?raw';
import { toast } from '$lib/components/toast/toast.svelte';

const dates = { order: 'mdy', hour24: false, timeZone: 'America/Los_Angeles', weekStartDay: 0 } as const;
const examples = [
  { label: 'Add to history', mode: 'date', fill: 0, text: 'Add to history' },
  { label: '3 plays', mode: 'remove', fill: 1, text: '3 plays', detail: 'Oct 2, 2026' },
  { label: '50% watched', mode: 'partial', fill: 0.5, text: 'watched', percent: '50%', detail: '31/62 eps · 31 plays' },
] as const;
</script>

<svelte:head>
  <title>History controls · og design system</title>
</svelte:head>
<Container>
  <section>
    <h1>History controls</h1>
    <p>Summary buttons and poster quick icons share the same date, remove and remaining popovers.</p>
    {#each examples as example (example.mode)}
      <h2>{example.mode}</h2>
      <div class="example">
        <WatchPopover label={example.label} variant="summary" fill={example.fill} plural={example.mode === 'partial'}
          datePreferences={dates} onopen={(force) => Promise.resolve(force ? 'date' : example.mode)}
          onwatch={(at) => toast.success(at === null ? 'Removed all plays.' : `Added play: ${at}`)}
          onremaining={() => Promise.resolve(false)} oninvalid={() => toast.error('Invalid date format, please use the date picker.')}
          summary={{ icon: summaryCheck, text: example.text, percent: 'percent' in example ? example.percent : undefined, detail: 'detail' in example ? example.detail : undefined }} />
      </div>
    {/each}
    <h2>Partial, with history, rewatch and drop under •••</h2>
    <div class="example">
      <WatchPopover label="50% watched" variant="summary" fill={0.5} plural datePreferences={dates}
        onopen={(force) => Promise.resolve(force ? 'date' : 'partial')} onwatch={() => {}}
        onremaining={() => Promise.resolve(false)} oninvalid={() => {}}
        summary={{ icon: summaryCheck, text: 'watched', percent: '50%', detail: '31/62 eps · 31 plays' }}>
        {#snippet more()}
          <SummaryActionMenu>
            {#snippet children(close)}
              <a href="#history"><Icon svg={historyIcon} fixedWidth />View history</a>
              <hr />
              <VisibilityControl target={{ type: 'show', id: 1, title: 'Breaking Bad' }} action="rewatch" variant="menu" onsaving={close}><Icon svg={backward} fixedWidth />Rewatch this show</VisibilityControl>
              <VisibilityControl target={{ type: 'show', id: 1, title: 'Breaking Bad' }} action="drop" variant="menu" onsaving={close}><Icon svg={circleMinus} fixedWidth />Drop this show</VisibilityControl>
            {/snippet}
          </SummaryActionMenu>
        {/snippet}
      </WatchPopover>
    </div>
    <h2>Poster icon</h2>
    <WatchPopover label="Add to watched history" datePreferences={dates} onopen={() => Promise.resolve('date')}
      onwatch={(at) => toast.success(`Added play: ${at}`)} onremaining={() => Promise.resolve(false)}
      oninvalid={() => toast.error('Invalid date format, please use the date picker.')}>
      {#snippet trigger()}<Icon svg={check} />{/snippet}
    </WatchPopover>
    <h2>Day dividers</h2>
    <p>History, library and ratings group cards under these. Click one to collapse its day.</p>
    <DayGroup weekday="Monday" date="October 5, 2026" runtime="24m"><p class="day-body">Two plays</p></DayGroup>
    <DayGroup weekday="Tuesday" date="September 29, 2026" runtime="1h 52m"><p class="day-body">Four plays</p></DayGroup>
    <DayGroup date="September 2026"><p class="day-body">A month divider, without a weekday</p></DayGroup>
  </section>
</Container>
<style>
section {
  padding-block: calc(var(--header-height) + var(--gutter)) var(--gutter);
}
.example {
  max-inline-size: var(--watch-date-width);
}
.day-body {
  padding-block: var(--gutter);
}
</style>
