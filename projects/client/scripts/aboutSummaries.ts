// Keeps the about page's data in the ABOUT KV namespace: a record per week of what shipped, the list of weeks and the
// repo's GitHub numbers. Run by .github/workflows/summaries.yml. It never fails: on any error it logs a warning and
// leaves the last good values in KV.
// Env: GITHUB_TOKEN, GITHUB_REPOSITORY, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, and optionally ABOUT_MODEL_URL,
// ABOUT_MODEL and ABOUT_MODEL_KEY for an OpenAI-compatible chat completions model that writes the summaries.
import { aboutWeekSchema } from '../src/lib/about/aboutWeekSchema.ts';
import { aboutRecords } from './about/aboutRecords.ts';
import { buildAboutWeeks } from './about/buildAboutWeeks.ts';
import { cloudflareKv } from './about/cloudflareKv.ts';
import { countedCommits } from './about/countedCommits.ts';
import { fetchAboutRepo } from './about/fetchAboutRepo.ts';
import { fetchAuthors } from './about/fetchAuthors.ts';
import { modelSummarize } from './about/modelSummarize.ts';
import { namespaceIdOf } from './about/namespaceIdOf.ts';
import { readOgCommits } from './about/readOgCommits.ts';

const REF = 'origin/main';

const warn = (message: string) => console.log(`::warning::about: ${message}`);
const messageOf = (error: unknown) => error instanceof Error ? error.message : String(error);

const env = (name: string) => Deno.env.get(name)?.trim() || undefined;

// One write at a time, in order, so the index never lists a week that failed to write.
const writeAll = async (kv: ReturnType<typeof cloudflareKv>, records: ReturnType<typeof aboutRecords>) => {
  await records.reduce((previous, { key, value }) => previous.then(() => kv.put(key, value)), Promise.resolve());
  console.log(`about: wrote ${records.map(({ key }) => key).join(', ') || 'nothing'}`);
};

const run = async () => {
  const [token, repo, cloudflareToken, accountId] = [
    env('GITHUB_TOKEN'),
    env('GITHUB_REPOSITORY'),
    env('CLOUDFLARE_API_TOKEN'),
    env('CLOUDFLARE_ACCOUNT_ID'),
  ];
  if (!token || !repo || !cloudflareToken || !accountId) {
    return warn('set GITHUB_TOKEN, GITHUB_REPOSITORY, CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.');
  }

  const namespaceId = namespaceIdOf({ config: await Deno.readTextFile('wrangler.jsonc'), binding: 'ABOUT' });
  if (!namespaceId) return warn('wrangler.jsonc has no ABOUT namespace id yet.');

  const kv = cloudflareKv({ accountId, namespaceId, token: cloudflareToken });
  const now = new Date();

  try {
    const commits = countedCommits(await readOgCommits(REF));
    const authors = await fetchAuthors({ repo, token, commits });
    const [url, model, apiKey] = [env('ABOUT_MODEL_URL'), env('ABOUT_MODEL'), env('ABOUT_MODEL_KEY')];
    const names = [...new Set([...authors.values()].map(({ login }) => login))];
    const summarize = url && model && apiKey
      ? modelSummarize({ url, model, apiKey, repo, githubToken: token, names })
      : null;
    if (!summarize) console.log('about: no summary model is set up, so summaries stay as they are.');

    const stored = async (week: string) => {
      const parsed = aboutWeekSchema.safeParse(await kv.get(`week:${week}`));
      return parsed.success ? parsed.data : null;
    };
    const { weeks, index } = await buildAboutWeeks({ commits, authors, stored, summarize, now });
    await writeAll(kv, aboutRecords({ weeks, index, repo: null }));
  } catch (error) {
    warn(`weeks not updated, ${messageOf(error)}`);
  }

  try {
    const numbers = await fetchAboutRepo({ repo, token, ref: REF, now });
    await writeAll(kv, aboutRecords({ weeks: [], index: null, repo: numbers }));
  } catch (error) {
    warn(`repo numbers not updated, ${messageOf(error)}`);
  }
};

await run().catch((error) => warn(messageOf(error)));
