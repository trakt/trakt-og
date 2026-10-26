<script lang="ts">
import ProjectLink from '$lib/components/brand/ProjectLink.svelte';
import TraktMark from '$lib/components/brand/TraktMark.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';

type Layer = { ink: string; face?: string; shift?: 'left' | 'right' };

// Every page that draws the mark, with the props it passes and the ground it sits on there.
const marks: readonly { page: string; props: string; ground: string; layers: readonly Layer[] }[] = [
  {
    page: 'Home hero',
    props: 'ink="var(--brand-primary)"',
    ground: 'home',
    layers: [{ ink: 'var(--brand-primary)' }],
  },
  { page: 'Footer', props: 'ink="currentColor"', ground: 'footer', layers: [{ ink: 'currentColor' }] },
  {
    page: 'Séance seal',
    props: 'face="#fff" ink="#ed1c24"',
    ground: 'seance',
    layers: [{ face: '#fff', ink: '#ed1c24' }],
  },
  {
    page: 'Séance ghost',
    props: 'ink="var(--seance-ghost-face)"',
    ground: 'seance-ghost',
    layers: [{ ink: 'var(--seance-ghost-face)' }],
  },
  {
    page: 'VHS',
    props: 'ink="var(--vhs-text)" over red and blue ghosts',
    ground: 'vhs',
    layers: [
      { ink: 'var(--brand-primary)', shift: 'left' },
      { ink: 'var(--brand-secondary)', shift: 'right' },
      { ink: 'var(--vhs-text)' },
    ],
  },
  {
    page: 'Tabloid',
    props: 'face="#ddd" ink="#ed1c24"',
    ground: 'tabloid',
    layers: [{ face: '#ddd', ink: '#ed1c24' }],
  },
  {
    page: 'Reanimated',
    props: 'face="#c8eadf" ink="#0f5e4e"',
    ground: 'reanimated',
    layers: [{ face: '#c8eadf', ink: '#0f5e4e' }],
  },
];
</script>

<Specimen title="Inks and faces"
  note="Each tile is one page's mark on that page's ground. ink colors the mark; face fills the disc behind it.">
  <p>
    <code>TraktMark</code> draws into a parent <code>&lt;svg viewBox="0 0 98.1 98.1"&gt;</code>, so a page can scale
    and recolor it.
  </p>
  <ul>
    {#each marks as mark (mark.page)}
      <li>
        <span class={['ground', mark.ground]}>
          {#each mark.layers as layer, index (index)}
            <svg class={['layer', layer.shift, { ghost: !!layer.shift }]} viewBox="0 0 98.1 98.1" aria-hidden="true">
              <TraktMark ink={layer.ink} face={layer.face} />
            </svg>
          {/each}
        </span>
        <b>{mark.page}</b>
        <code>{mark.props}</code>
      </li>
    {/each}
  </ul>
</Specimen>

<Specimen title="Project links"
  note="The projects named in the home and about heroes' intros, on the heroes' dark ground. Hover a name: it underlines.">
  <Variant label="Home hero">
    <p class="lede">
      A rebuild of classic Trakt for big screens. <b>OG Redux</b> is forked from
      <ProjectLink kind="web">trakt-web</ProjectLink> and runs on the <ProjectLink kind="api">Trakt API</ProjectLink>.
    </p>
  </Variant>
  <Variant label="About hero">
    <p class="lede">
      <ProjectLink kind="og">OG Redux</ProjectLink> is the next chapter of <b>Trakt OG</b>. It's a fork of
      <ProjectLink kind="web">trakt-web</ProjectLink> and it runs entirely on the
      <ProjectLink kind="api">Trakt API</ProjectLink>. Every line of it is on <ProjectLink kind="github">GitHub</ProjectLink>.
    </p>
  </Variant>
</Specimen>

<style>
.lede {
  color-scheme: dark;
  max-inline-size: var(--about-lede-width);
  margin: 0;
  padding: var(--gutter);
  border-radius: var(--radius-object);
  background-color: var(--color-about-hero-bg);
  font-size: var(--font-size-lede);
  line-height: var(--line-height-lede);
  color: var(--color-home-soft);

  & b {
    color: var(--color-lede-link);
  }
}

ul {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--gutter);
  margin: var(--gutter) 0 0;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  justify-items: center;
  align-content: start;
  gap: var(--space-sm-block);
  text-align: center;
}

.ground {
  display: grid;
  place-items: center;
  inline-size: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-object);
  isolation: isolate;
}

.layer {
  grid-area: 1 / 1;
  inline-size: 96px;
  block-size: 96px;
}

.ghost {
  mix-blend-mode: screen;
  opacity: 0.9;
}

.left {
  transform: translateX(calc(-1 * var(--vhs-ghost-offset)));
}

.right {
  transform: translateX(var(--vhs-ghost-offset));
}

.home {
  background-color: var(--color-home-bg);
}

.footer {
  color-scheme: dark;
  background-color: var(--color-page);
  color: var(--color-footer-muted);

  & .layer {
    inline-size: var(--footer-mark-size);
    block-size: var(--footer-mark-size);
    opacity: var(--opacity-footer-mark);
  }
}

.seance {
  background-color: var(--seance-table);
}

.seance-ghost {
  background-color: var(--seance-ghost);
}

.vhs {
  background: var(--vhs-screen);
}

.tabloid {
  background: var(--tabloid-desk);
}

.reanimated {
  background-color: var(--brand-quaternary);
}

code {
  font-size: var(--font-size-small);
  overflow-wrap: anywhere;
}
</style>
