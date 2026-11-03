/** trakt-web's search position bucket for a 1-based result position. */
export function toSearchResultPosition(position: number): '1-3' | '4-10' | '11+' {
  if (position <= 3) return '1-3';
  if (position <= 10) return '4-10';

  return '11+';
}
