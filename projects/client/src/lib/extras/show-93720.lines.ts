export type Line = {
  /** A command at the prompt, typed out; otherwise what the terminal answers. */
  readonly typed: boolean;
  readonly text: string;
};

type Viewer = {
  /** The signed-in username, or none for a guest. */
  readonly viewer?: string;
  readonly watched: number;
  readonly total: number;
};

/** What the terminal types: who you are, how far into the show you are, and a scare it takes back. */
export function terminalLines({ viewer, watched, total }: Viewer): readonly Line[] {
  const progress =
    viewer === undefined
      ? 'sign in and we keep count. we always keep count.'
      : watched >= total
        ? `${total} of ${total} episodes. you finished. we noticed.`
        : watched === 0
          ? `0 of ${total} episodes. you haven't started. we can wait.`
          : `${watched} of ${total} episodes. ${total - watched} to go. we're watching too.`;
  return [
    { typed: true, text: 'whoami' },
    { typed: false, text: viewer ?? 'guest' },
    { typed: true, text: 'trakt progress' },
    { typed: false, text: progress },
    { typed: true, text: 'sudo rm -rf ~/watchlist' },
    { typed: false, text: "just kidding. it's all still there." },
  ];
}
