import type { z } from 'zod/v4';
import type { qualityEpisodesSchema } from './qualityEpisodesSchema.ts';
import type { qualitySeasonsSchema } from './qualitySeasonsSchema.ts';

/** The public read behind the Quality chart: a show's seasons or a season's episodes. */
export type QualityRead =
  | { readonly type: 'show'; readonly seasons: z.infer<typeof qualitySeasonsSchema> }
  | { readonly type: 'season'; readonly season: number; readonly episodes: z.infer<typeof qualityEpisodesSchema> };
