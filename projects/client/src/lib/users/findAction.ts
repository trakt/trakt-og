import { resolve } from '$app/paths';
import type { EmptyAction } from '../components/empty/EmptyAction.ts';

/** Where your own empty tab starts: the trending movies or shows, or Discover on All. */
export function findAction(type: string): EmptyAction {
  if (type === 'movies') return { href: resolve('/movies/[chart=chart]', { chart: 'trending' }), text: 'Find a movie' };
  if (type === 'all') return { href: resolve('/discover'), text: 'Find something to watch' };
  return { href: resolve('/shows/[chart=chart]', { chart: 'trending' }), text: 'Find a show' };
}
