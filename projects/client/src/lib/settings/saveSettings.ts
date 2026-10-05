import { z } from 'zod/v4';
import type { SettingsBody } from './SettingsBody.ts';

/** Sends one JSON request to the API as the viewer. */
export type SettingsRequest = (path: string, method: 'PUT', body: unknown) => Promise<Response>;

export type SaveSettingsParams = {
  readonly request: SettingsRequest;
  readonly body: SettingsBody;
};

export type SaveSettingsResult = {
  /** Whether the save went through, so the page reloads the viewer's settings. */
  readonly saved: boolean;
  /** The failed save's message, for the toast. */
  readonly errors: readonly string[];
};

// API answers a refused save with `{ message }`.
const errorSchema = z.object({ message: z.string() });

const EXPIRED = 'Your session has expired. Sign in again to save your settings.';
const FALLBACK = "Trakt couldn't save your settings. Please try again.";

async function message(response: Response): Promise<string> {
  if (response.status === 401) return EXPIRED;
  const parsed = errorSchema.safeParse(await response.json().catch(() => null));
  return response.status === 400 && parsed.success ? parsed.data.message : FALLBACK;
}

/** Saves a `PUT /users/settings` body: a header toggle or a page's view switch. */
export async function saveSettings({ request, body }: SaveSettingsParams): Promise<SaveSettingsResult> {
  try {
    const response = await request('/users/settings', 'PUT', body);
    return response.ok ? { saved: true, errors: [] } : { saved: false, errors: [await message(response)] };
  } catch {
    return { saved: false, errors: [FALLBACK] };
  }
}
