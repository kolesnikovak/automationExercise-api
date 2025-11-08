import { test, expect, request } from '@playwright/test';
import { ProductsResponse, Product } from '../../types/api.types';
import { ProductSchema } from '../../schemas/SearchProduct';
import { ProductsResponseSchema } from '../../schemas/SearchProduct';

test.describe('API 5: POST To Search Product', () => {
  test('should return searched products when search_product parameter is provided', async ({ request }) => {

    const postToSearchProductResponse = await request.post(process.env.BASE_URL + '/searchProduct', {
      multipart: {
        search_product: 'top'
      }
    });

    expect(postToSearchProductResponse.status()).toBe(200);

    const postToSearchProductResponseBody = await postToSearchProductResponse.json();
    ProductsResponseSchema.parse(postToSearchProductResponseBody);
  });
});