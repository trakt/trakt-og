<script lang="ts">
import RatingLine from '$lib/components/rating/RatingLine.svelte';
import Specimen from '$lib/design/Specimen.svelte';

const ratings = Array.from({ length: 10 }, (_, i) => i + 1);
</script>

<Specimen title="Every rating"
  note="The line under a poster title in the Social Feed: the heart takes the rating's color.">
  {#each ratings as rating (rating)}<RatingLine {rating} />{/each}
</Specimen>
