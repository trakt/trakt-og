<!-- An Upcoming Schedule entry's premiere or finale tag, in its episode type's color. -->
<script lang="ts">
import type { ScheduleItem } from '$lib/dashboard/ScheduleItem';

const { label }: { label: NonNullable<ScheduleItem['label']> } = $props();
</script>

<span class="tag" style:--episode-color="var(--episode-{label.kind})">{label.label}</span>

<style>
.tag {
  display: inline-block;
  padding: var(--schedule-tag-padding);
  background-color: var(--episode-color);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-size: var(--font-size-schedule-tag);
  line-height: 1;
  white-space: nowrap;
}
</style>
