import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import NavigationProgress from './NavigationProgress.svelte';

describe('component: NavigationProgress', () => {
  it('should draw a line hidden from assistive tech while the next page loads', () => {
    const { body } = render(NavigationProgress, { props: { active: true } });

    expect(body).toMatch(/<div class="navigation-progress[^"]*" aria-hidden="true">/);
  });

  it('should draw nothing between navigations', () => {
    const { body } = render(NavigationProgress, { props: { active: false } });

    expect(body).not.toContain('navigation-progress');
  });
});
