import type { SmartListWriteRequest } from '@trakt/api';

export type SmartListFilters = NonNullable<SmartListWriteRequest['filters']>;
export type SmartListSource = SmartListWriteRequest['source'];
export type SmartListMediaType = SmartListWriteRequest['media_type'];
export type SmartListPrivacy = NonNullable<SmartListWriteRequest['privacy']>;

/** A saved set of filters over a source, which fills itself: the API's smart list definition. */
export interface SmartList {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly privacy: SmartListPrivacy;
  readonly source: SmartListSource;
  readonly mediaType: SmartListMediaType;
  readonly filters: SmartListFilters;
  /** ISO, for the Updated Date sort. */
  readonly updatedAt: string;
  readonly posters: readonly string[];
}

/** What a smart list is made from, and what an update may change. */
export type SmartListWrite = Pick<SmartList, 'name' | 'privacy' | 'source' | 'mediaType' | 'filters'>;
