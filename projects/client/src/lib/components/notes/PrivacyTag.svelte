<!--
  Who can read a note, as a tinted comment tag with its icon: Private, Link, Friends or Public. The notes dialog shows
  it by the note field, and note cards with their tags.
    <PrivacyTag privacy="public" />
-->
<script lang="ts">
import CommentTag from '$lib/components/comments/CommentTag.svelte';
import globe from '$lib/icons/solid/globe.svg?raw';
import link from '$lib/icons/solid/link.svg?raw';
import lockKeyhole from '$lib/icons/solid/lock-keyhole.svg?raw';
import friends from '$lib/icons/trakt/friends-thick.svg?raw';
import type { Privacy } from '$lib/notes/Privacy';

const { privacy }: { privacy: Privacy } = $props();
const tags: Readonly<Record<Privacy, { svg: string; label: string }>> = {
  private: { svg: lockKeyhole, label: 'Private' },
  link: { svg: link, label: 'Link' },
  friends: { svg: friends, label: 'Friends' },
  public: { svg: globe, label: 'Public' },
};
</script>

<CommentTag svg={tags[privacy].svg} tint>{tags[privacy].label}</CommentTag>
