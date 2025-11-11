import { test, expect } from '@playwright/test';
import { ProductsResponse } from '../../types/api.types';

test.describe('API 6: POST To Search Product without parameter', () => {
  test('should return 400 error when search_product parameter is missing', async ({ request }) => {
    const searchProductParameterResponse = await request.post(process.env.BASE_URL + '/searchProduct');
    
    expect(searchProductParameterResponse.status()).toBe(200); 
    const searchProductParameterResponseBody = await searchProductParameterResponse.json();

    expect(searchProductParameterResponseBody.responseCode).toBe(400);
    expect(searchProductParameterResponseBody.message).toBeDefined();
    expect(searchProductParameterResponseBody.message).toContain('Bad request, search_product parameter is missing in POST request.');
  });
});
