import { UNKNOWN_DATE } from './unknownDate.ts';

const EPOCH = Date.parse(UNKNOWN_DATE);

/** Whether a date is OG's unknown-date epoch, in any ISO spelling. */
export const isUnknownDate = (date: string) => Date.parse(date) === EPOCH;
