import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.string().regex(/^Rs\. \d+$/),
  brand: z.string(),
  category: z.object({
    usertype: z.object({
      usertype: z.string()
    }),
    category: z.string()
  })
});

export const ProductsResponseSchema = z.object({
  responseCode: z.literal(200),
  products: z.array(ProductSchema)
});

