import { test, expect } from '@playwright/test';

test.describe('API 9: DELETE To Verify Login', () => {
  test('should return 405 method not supported for DELETE request to verifyLogin', async ({ request }) => {
    const response = await request.delete(process.env.BASE_URL + '/verifyLogin');

    expect(response.status()).toBe(200); 

    const responseBody = await response.json();
    
    expect(responseBody.responseCode).toBe(405);
    expect(responseBody.message).toBeDefined();
    expect(responseBody.message).toContain('This request method is not supported.');
  });
});
