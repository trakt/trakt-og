/** Out by `now`, from `episodeReleasedAt`, the way the API counts aired episodes. */
export function hasEpisodeAired(releasedAt: string | undefined, now: number): boolean {
  return releasedAt !== undefined && Date.parse(releasedAt) <= now;
}
