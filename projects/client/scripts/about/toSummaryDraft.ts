import { hasCodeTalk } from './hasCodeTalk.ts';
import { summaryDraftSchema } from './summaryDraftSchema.ts';
import type { SummaryDraft } from './SummaryDraft.ts';

interface ToSummaryDraftParams {
  /** The model's reply, which should be the summary as JSON. */
  readonly content: string;
  /** GitHub logins of the week's authors. Summaries never name people. */
  readonly names: ReadonlyArray<string>;
}

type SummaryDraftResult = { ok: true; draft: SummaryDraft } | { ok: false; reason: string };

const parseJson = (content: string): unknown => {
  try {
    return JSON.parse(content.trim().replace(/^```(?:json)?\s*|\s*```$/g, ''));
  } catch {
    return undefined;
  }
};

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A model reply checked against the summary shape, the banned words and the rule against naming people. */
export function toSummaryDraft({ content, names }: ToSummaryDraftParams): SummaryDraftResult {
  const parsed = summaryDraftSchema.safeParse(parseJson(content));
  if (!parsed.success) return { ok: false, reason: `the reply isn't a valid summary: ${parsed.error.message}` };

  const draft = parsed.data;
  const lines = [draft.title, ...draft.themes.map(({ text }) => text)];
  if (lines.some(hasCodeTalk)) return { ok: false, reason: 'the summary uses developer words' };

  const named = names.length > 0 && new RegExp(`\\b(?:${names.map(escape).join('|')})\\b`, 'i');
  if (named && lines.some((line) => named.test(line))) return { ok: false, reason: 'the summary names a person' };

  return { ok: true, draft };
}
