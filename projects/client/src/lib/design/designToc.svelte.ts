import { createContext, untrack } from 'svelte';

/** One demo section, as the section list shows it. */
export type DesignTocEntry = { readonly id: string; readonly title: string };

/**
 * The open demo's sections: each `Specimen` adds itself while it's on the page, and marks itself current as it
 * scrolls into the top of the view. The writes read the list untracked, so a section's effect doesn't rerun on its
 * own change.
 */
function create() {
  let entries = $state<readonly DesignTocEntry[]>([]);
  let current = $state<string>();
  return {
    get entries() {
      return entries;
    },
    get current() {
      return current;
    },
    add: (entry: DesignTocEntry) => {
      entries = [...untrack(() => entries).filter(({ id }) => id !== entry.id), entry];
    },
    remove: (id: string) => {
      entries = untrack(() => entries).filter((entry) => entry.id !== id);
    },
    show: (id: string) => {
      current = id;
    },
  };
}

const [get, set] = createContext<ReturnType<typeof create>>();

export const designToc = { create, get, set };
