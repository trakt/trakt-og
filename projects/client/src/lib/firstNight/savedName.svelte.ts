let name = $state<string | null>(null);

/** A display name set on this page, so the greeting and the getting-started book pick it up without a reload. */
export const savedName = {
  get value() {
    return name;
  },
  set(next: string) {
    name = next;
  },
};
