import { type LastActivitiesResponse, lastActivitiesResponseSchema } from '@trakt/api';
import { contractSchema } from '../api/contractSchema.ts';

const activitiesSchema = contractSchema(lastActivitiesResponseSchema);

/** A `last_activities` body, or null when it doesn't match the contract. */
export function parseLastActivities(body: unknown): LastActivitiesResponse | null {
  const parsed = activitiesSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}
