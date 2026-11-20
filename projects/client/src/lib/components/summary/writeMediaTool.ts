import { z } from 'zod/v4';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import type { ReportTarget } from './ReportTarget.ts';
import { validateReport } from './validateReport.ts';
import { capitalize } from '../../utils/capitalize.ts';

type Action = {
  readonly kind: 'report';
  readonly target: ReportTarget;
  readonly reason: string;
  readonly message: string;
};
const errorSchema = z.object({ error: z.string().optional() });
const failed = 'Doh! We ran into some sort of error. Please try again.';

// OG's wording for each refusal the API names.
const refusal = (code: string | undefined, type: ReportTarget['type']) => {
  switch (code) {
    case 'report_pending':
      return `You already have a pending report for this ${type}!`;
    case 'recently_reported':
      return `You've recently reported this ${type}, please try again soon!`;
    case 'reporting_banned':
      return 'Your reporting privileges have been temporarily suspended. Please contact support if you have any questions.';
    case 'comment_not_found':
    case 'user_not_found':
      return `This ${type} no longer exists.`;
    case 'invalid_reason':
      return 'Please choose a different reason.';
    default:
      return undefined;
  }
};

/** Reports have no overlay slice to patch. Keep pending state in the calling control. */
export async function writeMediaTool({ fetch, action }: { fetch: typeof globalThis.fetch; action: Action }) {
  const { target } = action;
  const errors = validateReport({ type: target.type, reason: action.reason, message: action.message });
  if (errors.reason || errors.message) return { ok: false, message: 'Please choose a reason and type in a message.' };

  try {
    const response = await rawApiFetch({
      fetch,
      path: `/${target.type}s/${encodeURIComponent(target.id)}/report`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: action.reason, message: action.message.trim() }),
      },
    });
    // API returns an empty 201, or a JSON error code when it refuses the report.
    const text = await response.text();
    const body = text.trim() ? errorSchema.parse(JSON.parse(text)) : null;
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message:
          refusal(body?.error, target.type) ??
          (response.status === 403 ? 'This action requires VIP membership.' : failed),
      };
    }
    return {
      ok: true,
      message: `${capitalize(target.type)} reported! Thanks for the info, we'll investigate soon.`,
    };
  } catch {
    return { ok: false, message: failed };
  }
}
