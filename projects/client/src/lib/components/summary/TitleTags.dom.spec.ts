import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import TitleTags from './TitleTags.svelte';

const mounted: Record<string, unknown>[] = [];

afterEach(() => {
  mounted.splice(0).forEach((component) => unmount(component));
  document.body.innerHTML = '';
});

describe('component: TitleTags', () => {
  it('should render a season titled like its show', () => {
    const links = [
      { title: 'Yu-Gi-Oh! Duel Monsters', href: '/shows/yu-gi-oh-duel-monsters' },
      { title: 'Season 1', href: '/shows/yu-gi-oh-duel-monsters/seasons/1' },
      { title: 'Yu-Gi-Oh! Duel Monsters', href: '/shows/yu-gi-oh-duel-monsters/seasons/1' },
    ];
    mounted.push(mount(TitleTags, { target: document.body, props: { links } }));

    const rendered = [...document.querySelectorAll('a')].map((link) => [link.textContent, link.getAttribute('href')]);
    expect(rendered).toEqual(links.map(({ title, href }) => [title, href]));
  });
});
