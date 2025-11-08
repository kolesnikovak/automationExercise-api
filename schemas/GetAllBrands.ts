import { z } from 'zod';

export const BrandSchema = z.object({
  id: z.number(),
  brand: z.string()
});

export const AllBrandsResponseSchema = z.object({
  responseCode: z.literal(200),
  brands: z.array(BrandSchema).min(1)
});