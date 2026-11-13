type DatedEpisode = {
  readonly effective_release_date?: string | null;
  readonly first_aired?: string | null;
};

/**
 * When an episode is out: the API's `effective_release_date`, the earlier of its broadcast and an early streaming
 * release, else `first_aired`. The API counts aired episodes and up next by it.
 */
export function episodeReleasedAt({ effective_release_date, first_aired }: DatedEpisode): string | undefined {
  return effective_release_date ?? first_aired ?? undefined;
}
