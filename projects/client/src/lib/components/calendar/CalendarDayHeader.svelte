<!--
  A calendar list day's bar: the big day number, then the month and weekday centered beside it. It stays pinned under
  the header while its day scrolls by. Today's bar is red-tinted with a red edge and a TODAY tag at its right end;
  past days are grey, so today reads as the line between done and coming up.
    <CalendarDayHeader date="2026-10-09" today past={false} />
-->
<script lang="ts">
interface Props {
  date: string;
  today?: boolean;
  past?: boolean;
  /** Scroll today's bar into view on load: the account's autoscroll setting. */
  autoscroll?: boolean;
}

const { date, today = false, past = false, autoscroll = false }: Props = $props();
const format = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));

function scrollToday(node: HTMLElement) {
  if (!today || !autoscroll) return;
  const frame = requestAnimationFrame(() =>
    node.scrollIntoView({
      block: 'start',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  );
  return () => cancelAnimationFrame(frame);
}
</script>

<h2 class={['date-separator', { today, past }]} {@attach scrollToday}>
  <span class="date">{Number(date.slice(8))}</span>
  <span class="lines"><span class="month">{format({ month: 'long' })}</span><span class="weekday">{
      format({ weekday: 'long' })
    }</span></span>
  {#if today}<span class="tag">Today</span>{/if}
</h2>

<style>
.date-separator {
  position: sticky;
  inset-block-start: var(--header-height);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  margin: 0;
  padding: var(--space-base-block) var(--space-lg-inline) var(--space-base-block) var(--space-base-inline);
  background: var(--color-date-separator);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  scroll-margin-block-start: var(--header-height);

  &.past {
    color: var(--color-calendar-past);
  }

  &.today {
    background: var(--color-calendar-today-bar);
    backdrop-filter: var(--calendar-today-blur);
    box-shadow: inset 4px 0 0 var(--brand-primary);
    color: var(--color-frame-text);

    & .date {
      color: var(--brand-primary);
    }
  }
}

.date {
  font-size: var(--font-size-date);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;
}

.lines {
  display: grid;
  line-height: 1.15;
}

.month {
  font-weight: var(--font-weight-headings-heavy);
}

.weekday {
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-light);
}

.tag {
  margin-inline-start: auto;
  padding: 2px 7px;
  border-radius: var(--radius-sm);
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);
  font-size: var(--font-size-calendar-today-tag);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-sidebar-label);
  line-height: 1.4;
  text-transform: uppercase;
}
</style>
