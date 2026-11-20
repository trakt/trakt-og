<!--
  Whose list it is, as a list tag: the owner's avatar in the icon's place and their username, title cased. A pinned
  list wears it on the dashboard and in the customize popup when it's someone else's.
    <ListOwnerTag username="sean" avatar={avatarUrl} />
-->
<script lang="ts">
import CommentTag from '#lib/components/comments/CommentTag.svelte';

interface Props {
  username: string;
  avatar?: string;
}

const { username, avatar }: Props = $props();
</script>

<CommentTag tint color="var(--color-list-chip-following)">{#if avatar}<img class="avatar" src={avatar} alt="" />{/if}<span
    class="name">{username}</span></CommentTag>

<style>
.avatar {
  flex: none;
  inline-size: var(--list-owner-tag-avatar);
  block-size: var(--list-owner-tag-avatar);
  border-radius: 50%;
  object-fit: cover;
}

.name {
  text-transform: capitalize;
}
</style>
