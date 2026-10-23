<script lang="ts">
import RatingLine from '$lib/components/rating/RatingLine.svelte';
import DemoSection from '$lib/design/DemoSection.svelte';

const ratings = Array.from({ length: 10 }, (_, i) => i + 1);
</script>

<DemoSection title="Every rating"
  note="The line under a poster title in the Social Feed: the heart takes the rating's color.">
  {#each ratings as rating (rating)}<RatingLine {rating} />{/each}
</DemoSection>
