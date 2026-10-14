<!--
  The list dialogs' row of privacy, comments and rank numbers, a third each. A personal list picks them from dropdowns,
  with Copy Link (or "Made on save") at the privacy label's end while Link is picked. The watchlist and favorites show
  them `readonly`: Trakt sets them, and the API can't change them.
    <ListSettingsRow bind:privacy bind:allowComments bind:displayNumbers {shareLink} />
-->
<script lang="ts">
import ChoiceDropdown from '$lib/components/dialog/ChoiceDropdown.svelte';
import SettingValue from '$lib/components/dialog/SettingValue.svelte';
import { copyLink } from '$lib/components/share/copyLink';
import Icon from '$lib/icons/Icon.svelte';
import ban from '$lib/icons/regular/ban.svg?raw';
import comment from '$lib/icons/regular/comment.svg?raw';
import globe from '$lib/icons/solid/globe.svg?raw';
import link from '$lib/icons/solid/link.svg?raw';
import listOl from '$lib/icons/solid/list-ol.svg?raw';
import lockKeyhole from '$lib/icons/solid/lock-keyhole.svg?raw';
import friends from '$lib/icons/trakt/friends-thick.svg?raw';

interface Props {
  privacy: string;
  allowComments: boolean;
  displayNumbers: boolean;
  /** Shown, not picked: the watchlist and favorites. */
  readonly?: boolean;
  /** A list saved as Link: its private URL, for Copy Link. */
  shareLink?: string;
  disabled?: boolean;
}

let {
  privacy = $bindable(),
  allowComments = $bindable(),
  displayNumbers = $bindable(),
  readonly = false,
  shareLink,
  disabled = false,
}: Props = $props();

const PRIVACY: readonly { value: string; label: string; svg: string }[] = [
  { value: 'private', label: 'Private', svg: lockKeyhole },
  { value: 'link', label: 'Link', svg: link },
  { value: 'friends', label: 'Following', svg: friends },
  { value: 'public', label: 'Public', svg: globe },
];
const COMMENTS: readonly { value: boolean; label: string; svg: string }[] = [
  { value: true, label: 'Allow', svg: comment },
  { value: false, label: 'Off', svg: ban },
];
const RANK: readonly { value: boolean; label: string; svg: string }[] = [
  { value: true, label: 'Show', svg: listOl },
  { value: false, label: 'Hide', svg: ban },
];
const shownPrivacy = $derived(PRIVACY.find((option) => option.value === privacy) ?? PRIVACY[0]);
const shownComments = $derived(COMMENTS.find((option) => option.value === allowComments) ?? COMMENTS[1]);
const shownRank = $derived(RANK.find((option) => option.value === displayNumbers) ?? RANK[1]);
</script>

<div class="settings">
  {#if readonly}
    <SettingValue label="Privacy" svg={shownPrivacy?.svg} value={shownPrivacy?.label ?? ''} />
    <SettingValue label="Comments" svg={shownComments?.svg} value={shownComments?.label ?? ''} />
    <SettingValue label="Rank numbers" svg={shownRank?.svg} value={shownRank?.label ?? ''} />
  {:else}
    <ChoiceDropdown label="Privacy" options={PRIVACY} bind:value={privacy} {disabled}>
      {#snippet aside()}
        {#if privacy === 'link' && shareLink}
          <button type="button" class="share-link" onclick={() => copyLink(shareLink)}><Icon svg={link} />Copy Link</button>
        {:else if privacy === 'link'}
          <span class="share-note">Made on save</span>
        {/if}
      {/snippet}
    </ChoiceDropdown>
    <ChoiceDropdown label="Comments" options={COMMENTS} bind:value={allowComments} {disabled} />
    <ChoiceDropdown label="Rank numbers" options={RANK} bind:value={displayNumbers} {disabled} />
  {/if}
</div>

<style>
.settings {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--dialog-art-columns-gap);

  @media (width < 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* At the Privacy label's end while Link is picked: the label's size and line, so the row's labels stay level. */
.share-link,
.share-note {
  font-size: var(--font-size-dialog-art-label);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-headings);
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
}

.share-note {
  color: var(--color-dialog-art-hint);
}

.share-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-action-share);
  font-family: var(--font-headings);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}
</style>
