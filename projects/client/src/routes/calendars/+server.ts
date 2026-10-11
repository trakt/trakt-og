import { redirect } from '@sveltejs/kit';

/** `/calendars`: My Shows & Movies signed in, All Premieres signed out (OG opened All Shows). */
export function GET({ locals }) {
  redirect(302, locals.token ? '/calendars/my/shows-movies' : '/calendars/premieres');
}
