import { redirect } from '@sveltejs/kit';
import { calendarHome } from '$lib/calendars/calendarHome';

export function GET({ locals }) {
  redirect(302, calendarHome(!!locals.token));
}
