import { test, expect } from '@playwright/test';

test.describe('API 8: POST To Verify Login without email parameter', () => {
  test('should return 400 error when email parameter is missing', async ({ request }) => {
    const response = await request.post(process.env.BASE_URL + '/verifyLogin', {
      multipart: {
        password: process.env.TEST_PASSWORD!
      }
    });

    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    
    expect(responseBody.responseCode).toBe(400);
    expect(responseBody.message).toBeDefined();
    expect(responseBody.message).toContain('Bad request, email or password parameter is missing in POST request.');
  });
});
