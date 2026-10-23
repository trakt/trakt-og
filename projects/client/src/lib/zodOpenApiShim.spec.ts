import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { extendZodWithOpenApi } from './zodOpenApiShim.ts';

type WithOpenApi = { openapi: (meta: unknown) => unknown };

extendZodWithOpenApi(z);
const { ratingsResponseSchema, statusResponseSchema } = await import('@trakt/api');

describe('zodOpenApiShim', () => {
  it('should add an openapi method that returns the same schema', () => {
    const schema = z.number();

    expect((schema as unknown as WithOpenApi).openapi({ format: 'float' })).toBe(schema);
  });

  it('should leave an existing openapi method alone unless forced', () => {
    const prototype = z.ZodType.prototype as unknown as WithOpenApi;
    const installed = prototype.openapi;

    extendZodWithOpenApi(z);
    expect(prototype.openapi).toBe(installed);

    extendZodWithOpenApi(z, true);
    expect(prototype.openapi).not.toBe(installed);
  });

  it('should parse real contract schemas built through the shim', () => {
    const distribution = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10 };
    const ratings = {
      rating: 8.11106,
      votes: 15928,
      distribution,
      trakt: { rating: 8.5, votes: 3, distribution },
    };

    expect(ratingsResponseSchema.parse(ratings)).toEqual(ratings);
    expect(ratingsResponseSchema.safeParse({ rating: 'high' }).success).toBe(false);
    expect(statusResponseSchema.parse('returning series')).toBe('returning series');
    expect(statusResponseSchema.safeParse('cancelled').success).toBe(false);
  });
});
