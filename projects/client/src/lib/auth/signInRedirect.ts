import { redirect } from '@sveltejs/kit';
import { signInHref } from './signInHref.ts';

/** A loader's 302 to sign in for a page that needs the viewer, coming back to it afterwards. */
export function signInRedirect(url: URL): never {
  redirect(302, signInHref(url));
}
