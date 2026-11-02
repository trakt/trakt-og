import { peopleResponseSchema } from '@trakt/api';
import { contractSchema } from '../api/contractSchema.ts';

/** With `extended=guest_stars`, cast is the season's regulars and guest_stars the episode's own actors. */
export const episodePeopleSchema = contractSchema(peopleResponseSchema);
