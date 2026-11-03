import { type UserStats, userStatsSchema } from './userStatsSchema.ts';

type StatsResponse = { readonly status: number; readonly body: unknown } | null;

const numbers = (value: unknown): readonly number[] => {
  if (typeof value === 'number') return [value];
  if (value === null || typeof value !== 'object') return [];
  return Object.values(value).flatMap(numbers);
};

/**
 * `/users/:id/stats` when the API has them: a 200 that parses with at least one count above zero. Only VIPs keep
 * stats the API sums up, so anyone else gets null (an error, an empty 204 or all zeros) and og counts them itself.
 */
export function apiUserStats(response: StatsResponse): UserStats | null {
  if (response?.status !== 200) return null;
  const parsed = userStatsSchema.safeParse(response.body);
  if (!parsed.success) return null;
  return numbers(parsed.data).some((n) => n > 0) ? parsed.data : null;
}
