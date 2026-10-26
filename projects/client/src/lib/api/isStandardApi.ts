import { apiEnvironment } from './apiEnvironment.ts';

/**
 * og talks to api.trakt.tv for a Standard app (`PUBLIC_TRAKT_API=standard`), which may never call Official-only
 * routes. Features built on them hide up front instead of failing.
 */
export const isStandardApi = () => apiEnvironment() === apiEnvironment('standard');
