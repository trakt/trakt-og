<!-- A thin white progress bar on a profile box, with a caption at each end under it. -->
<script lang="ts">
interface Props {
  value: number;
  max: number;
  /** What the bar measures, for screen readers: "18 of 20 episodes watched". */
  label: string;
  caption: readonly [string, string];
}

const { value, max, label, caption }: Props = $props();
</script>

<progress {value} {max} aria-label={label}></progress>
<p class="caption" aria-hidden="true"><span>{caption[0]}</span><span>{caption[1]}</span></p>

<style>
progress {
  display: block;
  inline-size: 100%;
  block-size: var(--profile-box-meter-height);
  margin-block-start: 8px;
  border: 0;
  border-radius: var(--radius-profile-box-mark);
  overflow: hidden;
  appearance: none;
  background-color: var(--color-profile-track);

  &::-webkit-progress-bar {
    background-color: var(--color-profile-track);
  }

  &::-webkit-progress-value {
    border-radius: var(--radius-profile-box-mark);
    background-color: var(--color-profile-mark);
  }

  &::-moz-progress-bar {
    border-radius: var(--radius-profile-box-mark);
    background-color: var(--color-profile-mark);
  }
}

.caption {
  display: flex;
  justify-content: space-between;
  margin: 4px 0 0;
  color: var(--color-profile-ink-soft);
  font-size: var(--font-size-profile-chip);
}
</style>
