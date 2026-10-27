import { z } from 'zod/v4';

const schema = z.object({
  browsing: z
    .object({
      calendar: z
        .object({
          period: z.enum(['week', 'month']).nullish().catch(null),
          layout: z.enum(['list', 'grid']).nullish().catch(null),
          start_day: z
            .enum([
              'today',
              'yesterday',
              'two_days_ago',
              'three_days_ago',
              'tomorrow',
              'sunday',
              'monday',
              'tuesday',
              'wednesday',
              'thursday',
              'friday',
              'saturday',
            ])
            .nullish()
            .catch(null),
          image_type: z
            .enum(['logo', 'screenshot', 'fanart', 'thumb', 'banner', 'poster', 'none'])
            .nullish()
            .catch(null),
          hide_specials: z.boolean().nullish(),
        })
        .nullish(),
    })
    .nullish(),
});

/** The viewer's calendar settings, which the layout shares. */
export function toCalendarPreferences(settings: unknown) {
  const parsed = schema.safeParse(settings);
  const calendar = parsed.success ? parsed.data.browsing?.calendar : null;
  return {
    period: calendar?.period ?? 'week',
    layout: calendar?.layout ?? 'list',
    startDay: calendar?.start_day ?? 'today',
    imageType: calendar?.image_type ?? 'logo',
    hideSpecials: calendar?.hide_specials === true,
  };
}
