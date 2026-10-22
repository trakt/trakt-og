import { error } from '@sveltejs/kit';

/**
 * A list summary read the viewer may see, or the error page: a missing, hidden or unreadable list is a 404, anything
 * else that isn't a 200 is Trakt's trouble.
 */
export function assertListFound<T extends { status: number }>(
  summary: T | null,
): asserts summary is Extract<T, { status: 200 }> {
  if (!summary || [204, 401, 403, 404].includes(summary.status)) error(404, 'Page Not Found');
  if (summary.status !== 200) error(502, 'Trakt is having trouble loading this list.');
}
