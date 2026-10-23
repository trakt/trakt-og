<!--
  `/about`: what OG Redux is, how to report bugs and ask for features, the team and what shipped. Dark in both themes.
  The repo's GitHub numbers, issues and latest commits stream in after the rest, from a copy each data center keeps
  for 10 minutes.
-->
<script lang="ts">
import AboutApi from './AboutApi.svelte';
import AboutAsk from './AboutAsk.svelte';
import AboutCommits from './AboutCommits.svelte';
import AboutHero from './AboutHero.svelte';
import AboutIssues from './AboutIssues.svelte';
import AboutTeam from './AboutTeam.svelte';
import type { AboutMemberPick } from './pickAboutTeam.ts';
import type { AboutGithub } from './github/fetchAboutGithub.ts';

interface Props {
  data: {
    team: readonly AboutMemberPick[];
    /** Streams in after the page; null when GitHub can't be read. */
    github: Promise<AboutGithub | null>;
    today: string;
  };
}

const { data }: Props = $props();

let github = $state<AboutGithub | null>(null);
let loading = $state(true);

$effect(() => {
  const pending = data.github;
  void pending.then((read) => {
    if (pending !== data.github) return;
    github = read;
    loading = false;
  });
});

const lines = $derived(github?.commits.map(({ sha, subject }) => `${sha} ${subject}`) ?? []);
</script>

<svelte:head>
  <title>About OG Redux - Trakt</title>
  <meta
    name="description"
    content="OG Redux is the next chapter of Trakt OG, a fork of Trakt's v3 web app rebuilt for big screens on the public Trakt API. It's open source: report bugs and request features on GitHub."
  />
</svelte:head>

<div class="about">
  <AboutHero {github} {lines} {loading} />
  <div class="content">
    <AboutApi />
    <AboutAsk />
  </div>
  {#if data.team.length > 0}
    <AboutTeam team={data.team} />
  {/if}
  <div class="content">
    <div class="log">
      <div class="main">
        <!-- TODO: a plain-language summary of each week's main themes above the commits, generated from the commit
             subjects and PR titles and kept somewhere the page can read. -->
        {#if loading || github?.commits}
          <AboutCommits commits={github?.commits ?? null} today={data.today} />
        {/if}
      </div>
      <AboutIssues open={github?.open ?? null} closed={github?.closed ?? null} {loading} />
    </div>
  </div>
</div>

<style>
/* The page follows the viewer's theme; the header stays dark over its scenes. */
.about {
  background-color: var(--color-home-bg);
  color: var(--color-home-text);
}

.content {
  container-type: inline-size;
  padding-inline: max(var(--home-gutter), calc((100% - var(--home-content-width)) / 2));
}

.log {
  display: grid;
  grid-template-columns: var(--about-log-columns);
  gap: var(--about-log-gap);
  align-items: start;
  padding-block: var(--about-log-padding-block);
}

.main {
  display: grid;
  gap: var(--about-log-gap);
  min-inline-size: 0;
}

@container (width < 1000px) {
  .log {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
