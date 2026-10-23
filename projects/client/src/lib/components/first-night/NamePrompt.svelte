<!--
  "What should we call you?": sets a new member's display name in place, since signing up only gives them a
  generated username. Saving hands the name to `onsaved`, or reloads the page data so every greeting picks it up.
-->
<script lang="ts">
import { invalidateAll } from '$app/navigation';
import { viewerFetch } from '$lib/auth/viewerFetch';
import { toast } from '$lib/components/toast/toast.svelte';
import { savedName } from '$lib/firstNight/savedName.svelte';
import { saveSettings } from '$lib/settings/saveSettings';
import { settingsRequest } from '$lib/settings/settingsRequest';

/** `quiet`: the label is for screen readers only, where a row already says what this is. */
/**
 * `onsaved` takes the saved name, so the page can show it in place. Left out, the page data reloads instead.
 */
const { quiet = false, onsaved }: { quiet?: boolean; onsaved?: (name: string) => void } = $props();
const id = $props.id();
let name = $state('');
let busy = $state(false);

async function save(event: SubmitEvent) {
  event.preventDefault();
  const trimmed = name.trim();
  if (!trimmed || busy) return;
  busy = true;
  const result = await saveSettings({
    request: settingsRequest(viewerFetch()),
    body: { user: { name: trimmed } },
  });
  busy = false;
  if (!result.saved) {
    toast.error(result.errors.at(0) ?? "Your name didn't save. Try again.");
    return;
  }
  toast.success(`Nice to meet you, ${trimmed.split(' ')[0]}.`);
  savedName.set(trimmed);
  if (onsaved) onsaved(trimmed);
  else await invalidateAll();
}
</script>

<form class={['name-prompt', { quiet }]} onsubmit={save}>
  <label for="name-{id}">What should we call you?</label>
  <input id="name-{id}" bind:value={name} autocomplete="name"
    placeholder={quiet ? 'What should we call you?' : 'Your name'}
    maxlength="100" />
  <button type="submit" disabled={busy || !name.trim()}>Save</button>
</form>

<style>
.name-prompt {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  color: var(--color-first-night-muted);
}

/* Quiet sits in a row of its own: one line, a field wide enough for its placeholder, the label for screen readers. */
.quiet {
  flex-wrap: nowrap;

  input {
    flex: none;
    inline-size: var(--name-prompt-input-max);
  }
}

.quiet label {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

input {
  flex: 1 1 var(--name-prompt-input-min);
  min-inline-size: 0;
  max-inline-size: var(--name-prompt-input-max);
  block-size: 34px;
  padding-inline: 12px;
  border: 1px solid var(--color-first-night-button-line);
  border-radius: var(--radius-object);
  background: var(--color-first-night-tab);
  color: var(--color-first-night-text);
  font: inherit;

  &::placeholder {
    color: var(--color-first-night-dim);
  }
}

button {
  block-size: 34px;
  padding-inline: 14px;
  border: 0;
  border-radius: var(--radius-object);
  background: var(--brand-primary);
  color: var(--color-first-night-text);
  font: inherit;
  font-weight: var(--font-weight-headings-heavy);
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
}
</style>
