import { returnPath } from './returnPath.ts';
import { z } from 'zod/v4';

const stateSchema = z.object({ returnTo: z.string() });

/** Where `/callback` lands: the `returnTo` that `login` put in the OIDC state, kept only if it's a local path. */
export function callbackReturnPath(state: unknown): string {
  return returnPath(stateSchema.safeParse(state).data?.returnTo);
}
