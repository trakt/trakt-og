import { z } from 'zod/v4';
import { fetchMergedPullTitles } from './fetchMergedPullTitles.ts';
import { passesLeakCheck } from './passesLeakCheck.ts';
import type { Summarize } from './Summarize.ts';
import { summaryDraftSchema } from './summaryDraftSchema.ts';
import { summaryMessages } from './summaryMessages.ts';
import { toSummaryDraft } from './toSummaryDraft.ts';

interface ModelSummarizeParams {
  /** An OpenAI-compatible chat completions URL. */
  readonly url: string;
  readonly model: string;
  readonly apiKey: string;
  readonly repo: string;
  readonly githubToken?: string;
  /** GitHub logins of og's authors. Summaries never name people. */
  readonly names: ReadonlyArray<string>;
}

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
});

const responseFormat = {
  type: 'json_schema',
  json_schema: { name: 'week_summary', schema: z.toJSONSchema(summaryDraftSchema) },
};

const warn = (week: string, reason: string) =>
  console.log(`::warning::about: no new summary for the week of ${week}, ${reason}. Keeping the last one.`);

/** Summarizes a week with a chat model. Any failure is logged and gives null, so the last summary stays. */
export function modelSummarize({ url, model, apiKey, repo, githubToken, names }: ModelSummarizeParams): Summarize {
  return async ({ week, from, to, subjects }) => {
    try {
      const pullTitles = await fetchMergedPullTitles({ repo, token: githubToken, from, to }).catch(() => []);
      const response = await fetch(url, {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: summaryMessages({ subjects, pullTitles }),
          temperature: 0.3,
          response_format: responseFormat,
        }),
      });
      if (!response.ok) {
        await response.body?.cancel();
        warn(week, `the model answered ${response.status}`);
        return null;
      }

      const content = completionSchema.parse(await response.json()).choices.at(0)?.message.content ?? '';
      const result = toSummaryDraft({ content, names });
      if (!result.ok) {
        warn(week, result.reason);
        return null;
      }

      const text = [result.draft.title, ...result.draft.themes.map((theme) => theme.text)].join('\n');
      if (!await passesLeakCheck(text)) {
        warn(week, 'the summary failed the leak check');
        return null;
      }
      return result.draft;
    } catch (error) {
      warn(week, error instanceof Error ? error.message : String(error));
      return null;
    }
  };
}
