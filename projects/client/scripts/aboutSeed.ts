// Seeds the local dev KV (`.wrangler/state`, where `vite dev` reads the ABOUT binding) with the about page's records,
// built from the local git log. No model calls and nothing written to Cloudflare. Repo numbers come from the public
// GitHub API without a token.
// Usage: deno task about:seed [--summaries <file.json>]
// --summaries a JSON object of summaries keyed by Monday, each {"title": "...", "themes": [{"section", "text"}]}.
import { z } from 'zod/v4';
import { aboutRecords } from './about/aboutRecords.ts';
import { buildAboutWeeks } from './about/buildAboutWeeks.ts';
import { countedCommits } from './about/countedCommits.ts';
import { fetchAboutRepo } from './about/fetchAboutRepo.ts';
import { fetchAuthors } from './about/fetchAuthors.ts';
import { readOgCommits } from './about/readOgCommits.ts';
import type { Summarize } from './about/Summarize.ts';
import { summaryDraftSchema } from './about/summaryDraftSchema.ts';

const REF = 'origin/main';
const repo = Deno.env.get('GITHUB_REPOSITORY') ?? 'trakt/trakt-og';

const summariesFlag = Deno.args.indexOf('--summaries');
const summariesPath = summariesFlag >= 0 ? Deno.args.at(summariesFlag + 1) : undefined;
if (summariesFlag >= 0 && !summariesPath) throw new Error('--summaries needs a file');

const summaries = summariesPath
  ? z.record(z.string(), summaryDraftSchema).parse(JSON.parse(await Deno.readTextFile(summariesPath)))
  : null;
const summarize: Summarize | null = summaries ? ({ week }) => Promise.resolve(summaries[week] ?? null) : null;

const now = new Date();
const commits = countedCommits(await readOgCommits(REF));
const authors = await fetchAuthors({ repo, commits });
const { weeks, index } = await buildAboutWeeks({
  commits,
  authors,
  stored: () => Promise.resolve(null),
  summarize,
  now,
});
const numbers = await fetchAboutRepo({ repo, ref: REF, now }).catch((error) => {
  console.warn(`about:seed: no repo numbers, ${error instanceof Error ? error.message : error}`);
  return null;
});

const records = aboutRecords({ weeks, index, repo: numbers });
const file = await Deno.makeTempFile({ prefix: 'og-about-seed-', suffix: '.json' });
await Deno.writeTextFile(
  file,
  JSON.stringify(records.map(({ key, value }) => ({ key, value: JSON.stringify(value) }))),
);

const { success } = await new Deno.Command('deno', {
  args: ['run', '-A', 'npm:wrangler', 'kv', 'bulk', 'put', file, '--binding', 'ABOUT', '--local'],
  stdout: 'inherit',
  stderr: 'inherit',
}).output();
await Deno.remove(file);
if (!success) Deno.exit(1);

console.log(
  `about:seed: ${weeks.length} weeks (${commits.length} commits), ${numbers ? 'with' : 'without'} repo numbers`,
);
