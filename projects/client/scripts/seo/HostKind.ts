/** og.trakt.tv is `production`. Every other host (workers.dev previews, localhost) is kept out of search. */
export type HostKind = 'production' | 'preview';
