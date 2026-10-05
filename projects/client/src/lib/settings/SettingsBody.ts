type Value = string | boolean | readonly string[];
type Branch = { readonly [key: string]: Value | Branch };

/** The `PUT /users/settings` body: only what changed, since API leaves a missing (null) key alone. */
export type SettingsBody = Readonly<Partial<Record<'user' | 'account' | 'browsing', Branch>>>;
