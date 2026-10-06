<!-- The composer's "Spoilers" switch: marks the whole comment as a spoiler, so it's blurred until clicked. -->
<script lang="ts">
let { spoiler = $bindable(false) }: { spoiler?: boolean } = $props();
</script>

<button type="button" class="switch" role="switch" aria-checked={spoiler} onclick={() => (spoiler = !spoiler)}>
  <span class="track" aria-hidden="true"></span>Spoilers
</button>

<style>
.switch {
  display: inline-flex;
  align-items: center;
  gap: var(--comment-switch-gap);
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-comment-muted);
  font-family: var(--font-body);
  font-size: var(--font-size-comment-meta);
  cursor: pointer;

  &[aria-checked='true'] {
    color: var(--color-text);
  }
}

.track {
  position: relative;
  flex: none;
  inline-size: var(--comment-switch-width);
  block-size: var(--comment-switch-height);
  border-radius: var(--comment-switch-height);
  background-color: var(--color-comment-switch-track);
  transition: background-color var(--transition-comment-quiet);

  &::after {
    content: '';
    position: absolute;
    inset-block-start: var(--comment-switch-inset);
    inset-inline-start: var(--comment-switch-inset);
    inline-size: var(--comment-switch-knob);
    block-size: var(--comment-switch-knob);
    border-radius: 50%;
    background-color: var(--color-comment-switch-knob);
    box-shadow: var(--shadow-comment-switch-knob);
    transition: translate var(--transition-comment-quiet);
  }

  [aria-checked='true'] > & {
    background-color: var(--color-comment-switch-on);

    &::after {
      translate: var(--comment-switch-travel) 0;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .track,
  .track::after {
    transition: none;
  }
}
</style>
