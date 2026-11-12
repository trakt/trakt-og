import { z } from 'zod/v4';

export const promotionSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  label: z.string(),
  theme: z.string(),
  starts_at: z.iso.datetime(),
  ends_at: z.iso.datetime(),
  plan: z.object({
    duration: z.string().min(1),
    currency: z.string().length(3),
    amount: z.number(),
    discounted_amount: z.number(),
    months_in_term: z.number().int().positive(),
    first_term_only: z.boolean(),
  }),
});

/** One entry of `GET /vip/promotions`, the fields the strip and the header pill read. */
export type Promotion = z.infer<typeof promotionSchema>;
