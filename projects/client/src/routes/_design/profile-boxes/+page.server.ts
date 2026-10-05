import { boxPersonas } from '../../../lib/users/profile/boxes/boxPersonas.ts';
import { profileBoxes } from '../../../lib/users/profile/boxes/profileBoxes.ts';
import { toProfileBoxes } from '../../../lib/users/profile/boxes/toProfileBoxes.ts';

/**
 * The profile's stat boxes on four made-up users: each persona's picked strip with every box's score, then every box
 * alone, in each persona's state and in its empty states.
 */
export async function load() {
  const personas = Object.values(boxPersonas);

  const strips = await Promise.all(personas.map(async ({ input, extras, label }) => {
    const loader = extras();
    const evaluated = await Promise.all(profileBoxes.map((box) => box.evaluate(input, loader)));
    return {
      name: input.profile.displayName,
      label,
      scores: evaluated.map(({ key, score }) => ({ key, score })),
      boxes: await toProfileBoxes(input, loader),
    };
  }));

  const { maya, sam } = boxPersonas;
  const alone = await Promise.all(profileBoxes.map(async (box) => ({
    key: box.key,
    variants: [
      ...await Promise.all(personas.map(async ({ input, extras }) => ({
        caption: input.profile.displayName,
        entry: (await box.evaluate(input, extras())).entry,
      }))),
      { caption: 'Your own, empty', entry: (await box.evaluate({ ...maya.input, isSelf: true }, maya.extras())).entry },
      {
        caption: 'Nothing yet',
        entry:
          (await box.evaluate({ ...sam.input, latest: {}, watchlist: { count: 0, rows: [] } }, sam.extras())).entry,
      },
    ],
  })));

  return { strips, alone };
}
