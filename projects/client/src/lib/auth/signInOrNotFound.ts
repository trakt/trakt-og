import { error } from '@sveltejs/kit';
import { signInRedirect } from './signInRedirect.ts';

type Params = {
  locals: { token: string | null; crawler?: App.Locals['crawler'] };
  url: URL;
  message?: string;
};

/**
 * A page the visitor can't see. Signed out, it may be theirs or shared with them, so they sign in and come back; once
 * signed in it's a 404. Crawlers get the 404 straight away, so a deleted page doesn't read as a sign-in page.
 */
export function signInOrNotFound({ locals, url, message = 'Page Not Found' }: Params): never {
  if (!locals.token && !locals.crawler?.bot) signInRedirect(url);
  error(404, message);
}
