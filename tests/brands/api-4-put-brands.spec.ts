import { test, expect } from '@playwright/test';
import { BrandsResponse } from '../../types/api.types';

test.describe('API 4: PUT To All Brands List', () => {
  test('should return 405 method not supported for PUT request to brandsList', async ({ request }) => {
    const PutToAllBrandsListResponse = await request.put(process.env.BASE_URL + '/brandsList');

    expect(PutToAllBrandsListResponse.status()).toBe(200); 
    const PutToAllBrandsListResponseBody = await PutToAllBrandsListResponse.json();

    expect(PutToAllBrandsListResponseBody.responseCode).toBe(405);

    expect(PutToAllBrandsListResponseBody.message).toBeDefined();
    expect(PutToAllBrandsListResponseBody.message).toContain('This request method is not supported.');
  });
});
