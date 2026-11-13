const DAY_MS = 24 * 60 * 60 * 1000;

type StreamedEpisode = {
  readonly released?: string | null;
  readonly effective_release_date?: string | null;
  readonly first_aired?: string | null;
};

/**
 * The day an episode streams, `YYYY-MM-DD`, when that's a day or more before its broadcast or it has none. Sources give
 * the streaming release as a date with no time, so it's shown as "Streaming" where an air time would be. A stream on
 * the broadcast's own day leaves the episode on its air time.
 */
export function earlyStreamDate({
  released,
  effective_release_date,
  first_aired,
}: StreamedEpisode): string | undefined {
  if (!released) return undefined;
  const day = released.slice(0, 10);
  if (!first_aired) return day;
  const streams = Date.parse(effective_release_date ?? `${day}T00:00:00Z`);
  return Date.parse(first_aired) - streams >= DAY_MS ? day : undefined;
}
