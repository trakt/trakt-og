import { aboutWeekSchema } from '../../src/lib/about/aboutWeekSchema.ts';

/** The part of a week's summary the model writes: the title and themes, without what it covers or when. */
export const summaryDraftSchema = aboutWeekSchema.shape.summary.unwrap().pick({ title: true, themes: true });
