<!-- A profile box's progress bar, the summary watched button's purple one: Last Watched's way through a show. -->
<script lang="ts">
interface Props {
  value: number;
  max: number;
  /** What the bar measures, for screen readers: "18 of 20 episodes watched". */
  label: string;
}

const { value, max, label }: Props = $props();
</script>

<progress {value} {max} aria-label={label}></progress>

<style>
progress {
  display: block;
  inline-size: 100%;
  block-size: var(--watch-progress-height);
  margin-block-start: 8px;
  border: 0;
  border-radius: var(--radius-watch-progress);
  overflow: hidden;
  appearance: none;
  background-color: var(--color-watch-progress-track);

  &::-webkit-progress-bar {
    background-color: var(--color-watch-progress-track);
  }

  &::-webkit-progress-value {
    border-radius: inherit;
    background-color: var(--brand-tertiary);
  }

  &::-moz-progress-bar {
    border-radius: inherit;
    background-color: var(--brand-tertiary);
  }
}
</style>
