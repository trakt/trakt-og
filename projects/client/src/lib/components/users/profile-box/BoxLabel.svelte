<!-- A profile box's label: Title Case in the source, drawn in the dashboard panels' tracked caps. -->
<script lang="ts">
const { text }: { text: string } = $props();
</script>

<p class="label">{text}</p>

<style>
.label {
  /* Room for the shadow, which the ellipsis' clipping would cut. */
  margin: calc(-1 * var(--profile-box-shadow-room));
  padding: var(--profile-box-shadow-room);
  overflow: hidden;
  font-family: var(--font-headings);
  font-size: var(--font-size-profile-label);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-profile-label);
  line-height: 1.2;
  text-overflow: ellipsis;
  text-shadow: var(--text-shadow-profile-label);
  text-transform: uppercase;
  white-space: nowrap;
}
</style>
