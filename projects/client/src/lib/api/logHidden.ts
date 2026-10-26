const logged = new Set<string>();

/**
 * Says once per page load, in the browser console, that a section is hidden because the client ID may not call its
 * Official-only route. The page itself shows nothing, so this is where a developer finds out why.
 */
export function logHidden(what: string) {
  if (logged.has(what)) return;
  logged.add(what);
  console.info(`og hides what only Trakt's own apps may load from the API: ${what}.`);
}
