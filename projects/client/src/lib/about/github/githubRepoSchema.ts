import { z } from 'zod/v4';

/** The fields of GitHub's `GET /repos/{owner}/{repo}` the about page reads. */
export const githubRepoSchema = z.object({ stargazers_count: z.number().int(), forks_count: z.number().int() });
