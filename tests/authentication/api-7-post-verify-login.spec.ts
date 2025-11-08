import { test, expect } from '@playwright/test';

test.describe('API 7: POST To Verify Login with valid details', () => {
  test('should successfully verify login with valid credentials', async ({ request }) => {
    const loginWithValidDetailsResponse = await request.post(process.env.BASE_URL + '/verifyLogin', {
      multipart: {
        email: process.env.TEST_EMAIL!,
        password: process.env.TEST_PASSWORD!
      }
    });

    expect(loginWithValidDetailsResponse.status()).toBe(200);

    const loginWithValidDetailsResponseBody = await loginWithValidDetailsResponse.json();

    expect(loginWithValidDetailsResponseBody.responseCode).toBe(200);
    expect(loginWithValidDetailsResponseBody.message).toBeDefined();
    expect(loginWithValidDetailsResponseBody.message).toContain('User exists!');
  });
});
