<!--
  The member's avatar as a button: pick a photo and it's cropped to a centered square and saved as their Trakt avatar.
  The new photo shows at once; a failed upload puts the old one back and says so.
-->
<script lang="ts">
import { invalidateAll } from '$app/navigation';
import { api } from '$lib/api/api';
import { viewerFetch } from '$lib/auth/viewerFetch';
import { toast } from '$lib/components/toast/toast.svelte';
import { squareAvatar } from '$lib/firstNight/squareAvatar';
import Icon from '$lib/icons/Icon.svelte';
import camera from '$lib/icons/solid/camera.svg?raw';
import { markSettingsChanged } from '$lib/settings/markSettingsChanged';

const { src }: { src: string } = $props();
const id = $props.id();
let preview = $state<string>();
let busy = $state(false);

async function pick(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || busy) return;
  busy = true;
  try {
    const avatar = await squareAvatar(file);
    preview = avatar;
    const response = await api({ fetch: viewerFetch() }).users.avatar({ body: { user: { avatar } } });
    if (response.status < 200 || response.status >= 300) throw new Error(String(response.status));
    markSettingsChanged();
    toast.success('Looking good. Your new photo is saved.');
    await invalidateAll();
  } catch {
    preview = undefined;
    toast.error("Your photo didn't save. Try a JPEG or PNG.");
  } finally {
    busy = false;
  }
}
</script>

<label class="avatar" for="avatar-{id}" aria-busy={busy}>
  <img src={preview ?? src} alt="" width="96" height="96" />
  <span class="badge" aria-hidden="true"><Icon svg={camera} /></span>
  <span class="hint">Change photo</span>
  <input id="avatar-{id}" type="file" accept="image/*" onchange={pick} />
</label>

<style>
.avatar {
  position: relative;
  display: block;
  flex: none;
  inline-size: var(--first-night-avatar);
  block-size: var(--first-night-avatar);
  border-radius: 50%;
  box-shadow: var(--first-night-avatar-ring);
  cursor: pointer;

  &[aria-busy='true'] {
    opacity: 0.6;
    cursor: wait;
  }

  &:focus-within {
    outline: 2px solid var(--brand-primary);
    outline-offset: 3px;
  }
}

img {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.badge {
  position: absolute;
  inset-inline-end: 0;
  inset-block-end: 0;
  display: grid;
  place-items: center;
  inline-size: var(--first-night-avatar-badge);
  block-size: var(--first-night-avatar-badge);
  border-radius: 50%;
  background: var(--brand-primary);
  color: var(--color-first-night-text);
  box-shadow: 0 0 0 3px var(--color-first-night-bg);
}

/* "Change photo" over the face while the pointer is on it. */
.hint {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-first-night-avatar-veil);
  color: var(--color-first-night-text);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-heavy);
  opacity: 0;
  transition: opacity 0.15s ease;

  .avatar:is(:hover, :focus-within) & {
    opacity: 1;
  }
}

input {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  opacity: 0;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .hint {
    transition: none;
  }
}
</style>
