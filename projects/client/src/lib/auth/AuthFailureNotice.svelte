<!--
  Why a sign-in or sign-out step failed, in a panel under the hyperspace loader's line: an amber status, the countdown
  to the next try under it, and Try Again Now as an outlined pill like a private profile's Pending.
    <AuthFailureNotice failure="rateLimited" seconds={24} onretry={retry} />
-->
<script lang="ts">
import Icon from '#lib/icons/Icon.svelte';
import arrowsRotate from '#lib/icons/solid/arrows-rotate.svg?raw';
import { AUTH_FAILURE_STATUS, type AuthFailure } from './authFailure.ts';
import { formatWait } from './retryDelaySeconds.ts';

interface Props {
  failure: AuthFailure;
  seconds: number;
  onretry: () => void;
}

const { failure, seconds, onretry }: Props = $props();
</script>

<div class="notice">
  <!-- The countdown stays out of the alert, so screen readers don't hear every second of it. -->
  <p class="status" role="alert">{AUTH_FAILURE_STATUS[failure]}</p>
  <p class="wait" aria-hidden="true">Trying again in <span class="time">{formatWait(seconds)}</span></p>
  <button type="button" class="retry" onclick={onretry}><Icon svg={arrowsRotate} />Try Again Now</button>
</div>

<style>
.notice {
  display: grid;
  justify-self: stretch;
  justify-items: center;
  padding: var(--space-hyperspace-notice-block) var(--space-hyperspace-notice-inline);
  border: 1px solid var(--color-hyperspace-notice-border);
  border-radius: var(--radius-hyperspace-notice);
  background-color: var(--color-hyperspace-notice-bg);
  backdrop-filter: var(--blur-hyperspace-notice);
}

p {
  margin: 0;
  font-family: var(--font-mono);
  letter-spacing: var(--letter-spacing-hyperspace-signal);
  text-transform: uppercase;
  text-wrap: balance;
}

.status {
  color: var(--color-hyperspace-status);
  font-size: var(--font-size-small);
}

.wait {
  margin-block: var(--space-hyperspace-notice-lines) var(--space-hyperspace-notice-retry);
  color: var(--color-hyperspace-wait);
  font-size: var(--font-size-hyperspace-wait);
}

/* "24s", not "24S". */
.time {
  text-transform: none;
}

/* A private profile's Pending pill: amber outline and text on dark glass, filling faintly under the pointer. */
.retry {
  display: inline-flex;
  align-items: center;
  gap: var(--space-action-button-icon);
  block-size: var(--profile-button-height);
  min-block-size: 0;
  padding: 0 var(--profile-button-padding);
  border: var(--action-button-border-width) solid var(--color-hyperspace-status);
  border-radius: var(--radius-profile-button);
  background-color: var(--color-profile-pill-bg);
  color: var(--color-hyperspace-status);
  font-family: var(--font-headings);
  font-size: var(--font-size-hyperspace-retry);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s;

  &:is(:hover, :focus-visible) {
    background-color: var(--color-hyperspace-retry-hover);
  }
}
</style>
