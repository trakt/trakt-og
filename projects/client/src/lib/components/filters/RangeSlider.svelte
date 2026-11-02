<!--
  The advanced filters' two-handle slider (years, runtime and the site ratings): a slim track whose knobs and bar are
  grey until the range is narrowed, then red, like a field's "Any" and its "filter on" look. Plain knobs are round
  with a grip; `labeled` ones are mini buttons that carry their value, like the rating sliders. The knobs sit inside
  the track's ends. Each one is a `role="slider"`: arrows step, Page Up and Down take ten steps, Home and End jump to
  the ends. Dragging a knob or pressing the track moves the nearest one.
    <RangeSlider bind:value scale={filterRanges({ now }).years} label="Released" />
-->
<script lang="ts">
import { fromPercent, type RangeScale, scaleMax, scaleMin, toPercent } from './rangeScale.ts';

interface Props {
  value: readonly [number, number];
  scale: RangeScale;
  /** Names the pair: each handle is "<label> minimum" and "<label> maximum". */
  label: string;
  labeled?: boolean;
  format?: (value: number) => string;
}

let { value = $bindable(), scale, label, labeled = false, format = (v: number) => `${v}` }: Props = $props();

let track = $state<HTMLElement>();
const min = $derived(scaleMin(scale));
const max = $derived(scaleMax(scale));
const percents = $derived(value.map((v) => toPercent(v, scale)) as [number, number]);
const set = $derived(value[0] !== min || value[1] !== max);

const round = (v: number) => Number(v.toFixed(`${scale.step}`.split('.').at(1)?.length ?? 0));

function move(index: 0 | 1, next: number) {
  const bounded = index === 0 ? Math.min(Math.max(next, min), value[1]) : Math.max(Math.min(next, max), value[0]);
  const v = round(bounded);
  if (v === value[index]) return;
  value = index === 0 ? [v, value[1]] : [value[0], v];
}

function onkeydown(event: KeyboardEvent, index: 0 | 1) {
  const step = scale.step;
  const moves: Record<string, number> = {
    ArrowLeft: value[index] - step,
    ArrowDown: value[index] - step,
    ArrowRight: value[index] + step,
    ArrowUp: value[index] + step,
    PageDown: value[index] - step * 10,
    PageUp: value[index] + step * 10,
    Home: min,
    End: max,
  };
  const next = moves[event.key];
  if (next === undefined) return;
  event.preventDefault();
  move(index, next);
}

const percentAt = (clientX: number) => {
  const rect = track?.getBoundingClientRect();
  return rect && rect.width > 0 ? ((clientX - rect.left) / rect.width) * 100 : 0;
};

let dragging = $state<0 | 1 | null>(null);

function startDrag(event: PointerEvent, index: 0 | 1) {
  if (event.button !== 0) return;
  event.preventDefault();
  dragging = index;
  track?.setPointerCapture(event.pointerId);
  track?.querySelectorAll<HTMLElement>('[role="slider"]')[index]?.focus();
}

function ontrackdown(event: PointerEvent) {
  const next = fromPercent(percentAt(event.clientX), scale);
  // The nearer handle, or the one on the side of the press when both sit together.
  const index = Math.abs(next - value[0]) < Math.abs(next - value[1]) || next < value[0] ? 0 : 1;
  startDrag(event, index);
  move(index, next);
}

function onpointermove(event: PointerEvent) {
  if (dragging === null) return;
  move(dragging, fromPercent(percentAt(event.clientX), scale));
}

const stop = () => (dragging = null);
</script>

<div class={['slider', { labeled, set, dragging: dragging !== null }]}>
  <div
    class="track"
    bind:this={track}
    role="presentation"
    onpointerdown={ontrackdown}
    {onpointermove}
    onpointerup={stop}
    onpointercancel={stop}
  >
    <div class="connect" style:inset-inline="{percents[0]}% {100 - percents[1]}%"></div>
    {#each [0, 1] as const as index (index)}
      <span
        class="handle"
        role="slider"
        tabindex="0"
        style:inset-inline-start="{percents[index]}%"
        aria-label="{label} {index === 0 ? 'minimum' : 'maximum'}"
        aria-valuemin={index === 0 ? min : value[0]}
        aria-valuemax={index === 0 ? value[1] : max}
        aria-valuenow={value[index]}
        aria-valuetext={format(value[index])}
        onkeydown={(event) => onkeydown(event, index)}
        onpointerdown={(event) => {
          event.stopPropagation();
          startDrag(event, index);
        }}
      >{#if labeled}{format(value[index])}{/if}</span>
    {/each}
  </div>
</div>

<style>
/* The track keeps half a knob free at each end, so a knob at 0% or 100% stays inside the column. */
.slider {
  --inset: calc(var(--slider-knob-size) / 2);

  padding-block: calc((var(--slider-knob-size) - var(--slider-height)) / 2);
  padding-inline: var(--inset);
  touch-action: none;

  &.labeled {
    --inset: calc(var(--slider-label-width) / 2);

    padding-block: calc((var(--slider-label-height) - var(--slider-height)) / 2);
  }
}

.track {
  position: relative;
  block-size: var(--slider-height);
  border-radius: var(--radius-slider);
  background-color: var(--color-slider-track);
  cursor: pointer;
}

/* A round knob's grip: three thin bars. */
.slider:not(.labeled) .handle::before {
  content: '';
  inline-size: var(--slider-grip-width);
  block-size: var(--slider-grip-height);
  background: repeating-linear-gradient(to right, var(--grip) 0 1px, transparent 1px 3px);
}

.connect {
  position: absolute;
  inset-block: 0;
  border-radius: var(--radius-slider);
  background-color: var(--color-slider-connect);

  .set & {
    background-color: var(--color-slider-connect-set);
  }
}

.handle {
  --grip: var(--color-slider-grip);

  position: absolute;
  inset-block-start: 50%;
  display: grid;
  place-items: center;
  inline-size: var(--slider-knob-size);
  block-size: var(--slider-knob-size);
  border: 1px solid var(--color-slider-handle-border);
  border-radius: 50%;
  background-color: var(--color-slider-handle);
  box-shadow: var(--shadow-slider-handle);
  color: var(--color-slider-handle-text);
  translate: -50% -50%;
  cursor: grab;

  &:hover {
    background-color: var(--color-slider-handle-hover);
  }

  /* The set field's faint red, laid over the panel so the track doesn't show through. */
  .set & {
    --grip: var(--color-slider-grip-set);

    border-color: var(--color-slider-handle-set-border);
    background-color: var(--color-filter-panel-bg);
    background-image: linear-gradient(var(--color-slider-handle-set) 0 0);
    color: var(--color-slider-handle-set-text);
  }

  .set &:hover {
    border-color: var(--color-slider-handle-set-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--color-input-border-focus);
    outline-offset: 2px;
  }

  .labeled & {
    inline-size: var(--slider-label-width);
    block-size: var(--slider-label-height);
    border-radius: var(--radius-control);
    font-family: var(--font-headings);
    font-size: var(--font-size-slider-label);
    font-weight: var(--font-weight-headings);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .dragging & {
    cursor: grabbing;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .connect,
  .handle {
    transition: background-color 0.2s, border-color 0.2s;
  }
}
</style>
