import { test, expect } from '@playwright/test';

test.describe('API 2: POST To All Products List', () => {
  test('should return 405 method not supported for POST request to productsList', async ({ request }) => {
    const response = await request.post(process.env.BASE_URL + '/productsList', {
      multipart: {}
    });

    expect(response.status()).toBe(200); 

    const responseBody = await response.json();
    
    expect(responseBody.responseCode).toBe(405);
    expect(responseBody.message).toBeDefined();
    expect(responseBody.message).toContain('This request method is not supported.');
    
  });
});
