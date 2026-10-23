<script lang="ts">
import DayGroup from '$lib/components/history/DayGroup.svelte';
import DemoSection from '$lib/design/DemoSection.svelte';
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
let poster = $state<WatchPopover>();
// Like a season card: the date first, then the bulk-watch question in the same prompt.
async function watchSeason(at: string | null) {
  const yes = await poster?.confirm({ count: 14, title: 'MobLand' });
  toast.success(yes ? `Added 14 plays: ${at}` : 'Cancelled');
}
</script>

<DemoSection title="Summary buttons"
  note="Not watched, watched and partly watched. Each opens the date, remove or remaining popover; poster icons share them.">
  {#each examples as example (example.mode)}
    <div class="example">
      <WatchPopover label={example.label} variant="summary" fill={example.fill} plural={example.mode === 'partial'}
        datePreferences={dates} onopen={(force) => Promise.resolve(force ? 'date' : example.mode)}
        onwatch={(at) => toast.success(at === null ? 'Removed all plays.' : `Added play: ${at}`)}
        onremaining={() => Promise.resolve(false)} oninvalid={() => toast.error('Invalid date format, please use the date picker.')}
        summary={{ icon: summaryCheck, text: example.text, percent: 'percent' in example ? example.percent : undefined, detail: 'detail' in example ? example.detail : undefined }} />
    </div>
  {/each}
</DemoSection>

<DemoSection title="Partly watched, with its menu" note="History, rewatch and drop under •••.">
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
            <VisibilityControl target={{ type: 'show', id: 1, title: 'Breaking Bad' }} action="rewatch" variant="menu" onsaving={close}><Icon svg={backward} fixedWidth />Rewatch show</VisibilityControl>
            <VisibilityControl target={{ type: 'show', id: 1, title: 'Breaking Bad' }} action="drop" variant="menu" onsaving={close}><Icon svg={circleMinus} fixedWidth />Drop show</VisibilityControl>
          {/snippet}
        </SummaryActionMenu>
      {/snippet}
    </WatchPopover>
  </div>
</DemoSection>

<DemoSection title="Poster icon"
  note="A season's icon: pick a date, then it asks before marking its 14 episodes watched. Past 300 episodes a whole show is refused.">
  <WatchPopover bind:this={poster} label="Add to watched history" datePreferences={dates}
    onopen={() => Promise.resolve('date')} onwatch={watchSeason} onremaining={() => Promise.resolve(false)}
    oninvalid={() => toast.error('Invalid date format, please use the date picker.')}>
    {#snippet trigger()}<Icon svg={check} />{/snippet}
  </WatchPopover>
</DemoSection>

<DemoSection title="Day dividers"
  note="History, library and ratings group cards under these. Click one to collapse its day.">
  <DayGroup weekday="Monday" date="October 5, 2026" runtime="24m">
    <p class="day-body">Two plays</p>
  </DayGroup>
  <DayGroup weekday="Tuesday" date="September 29, 2026" runtime="1h 52m">
    <p class="day-body">Four plays</p>
  </DayGroup>
  <DayGroup date="September 2026">
    <p class="day-body">A month divider, without a weekday</p>
  </DayGroup>
</DemoSection>

<style>
.example {
  max-inline-size: var(--watch-date-width);

  & + .example {
    margin-block-start: var(--summary-action-stack-gap);
  }
}

.day-body {
  padding-block: var(--gutter);
}
</style>
