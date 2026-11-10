import { z } from 'zod/v4';
const errorSchema = z.object({ error: z.string() });
const FIELD_ERRORS: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  list_name_taken: { name: ['You already have a list with this name.'] },
  invalid_request_body: { name: ['Use a name with at least one letter, up to 255 characters.'] },
};
export class ListWriteError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code || 'Could not save this list.');
  }
  get fields(): Readonly<Record<string, readonly string[]>> {
    return FIELD_ERRORS[this.code] ?? {};
  }
  static async from(response: Response) {
    const parsed = errorSchema.safeParse(await response.json().catch(() => null));
    return new ListWriteError(response.status, parsed.success ? parsed.data.error : '');
  }
}
