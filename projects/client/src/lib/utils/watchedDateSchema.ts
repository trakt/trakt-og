import { z } from 'zod/v4';
import { UNKNOWN_DATE } from './unknownDate.ts';

/** A play's date. The API sends null for an unknown one, read here as OG's epoch so it shows as "Unknown date". */
export const watchedDateSchema = z
  .string()
  .nullable()
  .transform((at) => at ?? UNKNOWN_DATE);
