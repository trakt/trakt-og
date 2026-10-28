import { episodeResponseSchema, seasonResponseSchema } from '@trakt/api';
import type { SeasonsResponse } from '@trakt/api';

/** `@trakt/api` types a season's `first_aired` as a string, but an announced season with no date yet sends null. */
export const seasonSchema = seasonResponseSchema.extend({ first_aired: episodeResponseSchema.shape.first_aired });

export type Season = Omit<SeasonsResponse[number], 'first_aired'> & { first_aired?: string | null };
