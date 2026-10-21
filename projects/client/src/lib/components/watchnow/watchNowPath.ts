type Target = {
  readonly type: string;
  readonly id: number;
  readonly season?: { readonly show: number; readonly number: number; readonly episode?: number };
};

/** The API path a quick icon's Watch Now loads from, by Trakt id: an episode or season needs its show and number. */
export function watchNowPath({ type, id, season }: Target): string | undefined {
  if (type === 'movie') return `/movies/${id}`;
  if (type === 'show') return `/shows/${id}`;
  if (!season) return undefined;
  const seasonPath = `/shows/${season.show}/seasons/${season.number}`;
  if (type === 'season') return seasonPath;
  if (type === 'episode' && season.episode !== undefined) return `${seasonPath}/episodes/${season.episode}`;
  return undefined;
}
