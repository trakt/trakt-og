import { capitalize } from '../../utils/capitalize.ts';
import type { AboutSection } from '../AboutSection.ts';
import { sectionOfScope } from '../sectionOfScope.ts';
import type { githubCommitsSchema } from './githubCommitsSchema.ts';
import type { z } from 'zod/v4';

type GithubCommit = z.infer<typeof githubCommitsSchema>[number];

/** One commit in the about page's feed of the latest. */
export type AboutCommit = {
  readonly sha: string;
  readonly href: string;
  /** The UTC day it landed, `YYYY-MM-DD`. */
  readonly day: string;
  /** The conventional type (`feat`, `fix`, `chore`), or null for a free-form message. */
  readonly type: string | null;
  readonly section: AboutSection;
  readonly subject: string;
  readonly author: { readonly login: string; readonly avatar: string } | null;
};

/** A commit from GitHub, its conventional `type(scope): subject` read into a type, a site section and the subject. */
export function toAboutCommit(commit: GithubCommit): AboutCommit {
  const firstLine = commit.commit.message.split('\n', 1).at(0) ?? '';
  const match = /^(\w+)(?:\(([^)]+)\))?!?:\s*(.*)$/.exec(firstLine);
  const [, type = '', scope = '', subject = firstLine] = match ?? [];

  return {
    sha: commit.sha.slice(0, 7),
    href: commit.html_url,
    day: commit.commit.committer?.date.slice(0, 10) ?? '',
    type: type || null,
    section: sectionOfScope(scope),
    subject: capitalize(subject),
    author: commit.author ? { login: commit.author.login, avatar: commit.author.avatar_url } : null,
  };
}
