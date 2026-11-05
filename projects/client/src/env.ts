import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  PUBLIC_TRAKT_API: { public: true, schema: (input) => input ?? '' },
});
