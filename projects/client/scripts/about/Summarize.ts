import type { SummaryDraft } from './SummaryDraft.ts';

interface SummarizeInput {
  readonly week: string;
  readonly from: string;
  readonly to: string;
  readonly subjects: ReadonlyArray<string>;
}

/** Writes a week's summary from its commit subjects, or null when it couldn't write one that passes the checks. */
export type Summarize = (input: SummarizeInput) => Promise<SummaryDraft | null>;
