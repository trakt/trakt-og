import { createContext, untrack } from 'svelte';

/** One demo section, as the nav lists it under the open demo. */
export type DesignTocEntry = { readonly id: string; readonly title: string };

/**
 * The open demo's sections: each `DemoSection` adds itself while it's on the page. The writes read the list untracked,
 * so a section's effect doesn't rerun on its own change.
 */
function create() {
  let entries = $state<readonly DesignTocEntry[]>([]);
  return {
    get entries() {
      return entries;
    },
    add: (entry: DesignTocEntry) => {
      entries = [...untrack(() => entries).filter(({ id }) => id !== entry.id), entry];
    },
    remove: (id: string) => {
      entries = untrack(() => entries).filter((entry) => entry.id !== id);
    },
  };
}

const [get, set] = createContext<ReturnType<typeof create>>();

export const designToc = { create, get, set };
