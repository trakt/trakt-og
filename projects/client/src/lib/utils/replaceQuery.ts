import { goto } from '$app/navigation';
import { page } from '$app/state';
import { untrack } from 'svelte';

// A shallow goto leaves page.url behind (the new URL lands on page.shallow.url) and gives page.state a fresh object,
// so an effect comparing against page.url or reading page.state would navigate forever.
export function replaceQuery(search: string) {
  const url = page.shallow?.url ?? page.url;
  if (search === url.search) return;

  // eslint-disable-next-line svelte/no-navigation-without-resolve -- the same page, with only its query changed
  goto(`${url.pathname}${search}${url.hash}`, { shallow: true, replace: true, state: untrack(() => page.state) });
}
