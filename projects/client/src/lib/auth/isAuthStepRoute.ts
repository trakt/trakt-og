const AUTH_STEP_ROUTES: ReadonlySet<string> = new Set(['/signin', '/callback', '/signout']);

/** The pages that only pass the browser on to sign in or out. They show og's loader alone and load no settings. */
export function isAuthStepRoute(routeId: string | null | undefined): boolean {
  return AUTH_STEP_ROUTES.has(routeId ?? '');
}
