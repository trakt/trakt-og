import { designPrefs } from '../../lib/design/designPrefs.ts';

/** The shell's saved theme and nav, painted onto `<html>` by hooks.server.ts in place of the viewer's Dark Knight. */
export async function load({ cookies, url, locals, parent }) {
  await parent();
  const prefs = designPrefs.read({ cookie: cookies.get(designPrefs.COOKIE), query: url.searchParams.get('theme') });
  locals.theme = prefs.theme;
  return { designPrefs: prefs };
}
