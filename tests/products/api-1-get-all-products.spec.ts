import { test, expect } from '@playwright/test';
import { ProductsResponse } from '../../types/api.types';
import { ProductSchema, AllProductsResponseSchema } from '../../schemas/GetAllProducts';

test.describe('API 1: GET All Products List', () => {
  test('should return all products successfully', async ({ request }) => {
    const GetAllProductsResponse = await request.get(process.env.BASE_URL + '/productsList');

    expect(GetAllProductsResponse.status()).toBe(200);

    const GetAllProductsResponseBody = await GetAllProductsResponse.json();
    AllProductsResponseSchema.parse(GetAllProductsResponseBody);
    expect(GetAllProductsResponseBody.products).toBeDefined();
    
  });
});
