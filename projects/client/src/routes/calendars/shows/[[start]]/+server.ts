import { redirect } from '@sveltejs/kit';

/** All Shows is gone: My Shows for the same week signed in, All Premieres signed out. */
export function GET({ locals, params, url }) {
  const start = params.start ? `/${params.start}` : '';
  redirect(302, `${locals.token ? '/calendars/my/shows' : '/calendars/premieres'}${start}${url.search}`);
}
