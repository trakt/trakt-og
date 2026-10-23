// The one check-in modal: the summary button and the poster popover open it, <CheckinDialog /> in the root layout
// renders it. Call it from interactions only: this module is shared by every request on the server.
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { login } from '../../auth/login.ts';
import { userManager } from '../../auth/userManager.ts';
import { toast } from '../toast/toast.svelte.ts';
import type { CheckinTarget } from './CheckinTarget.ts';
import { loadCheckinTarget } from './loadCheckinTarget.ts';
import { GENERIC_ERROR } from '../../utils/genericError.ts';

let target = $state<CheckinTarget | null>(null);
let loading = $state(false);
let opening = 0;

export const checkin = {
  get target() {
    return target;
  },
  /** The dialog is already up while the target loads. */
  get loading() {
    return loading;
  },
  /** Logged out, it sends the viewer to sign in instead, like OG. */
  async open(item: Pick<CheckinTarget, 'type' | 'id'>): Promise<void> {
    if (!(await userManager().getUser())?.access_token) return login();
    const attempt = ++opening;
    loading = true;
    const loaded = await loadCheckinTarget({ ...item, fetch: (path) => rawApiFetch({ path }) }).catch(() => null);
    if (attempt !== opening) return;
    loading = false;
    if (loaded) target = loaded;
    else toast.error(GENERIC_ERROR);
  },
  close() {
    opening++;
    loading = false;
    target = null;
  },
};
