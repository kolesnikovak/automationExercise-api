import { test, expect } from '@playwright/test';
import { BrandsResponse } from '../../types/api.types';
import { BrandSchema, AllBrandsResponseSchema } from '../../schemas/GetAllBrands';

test.describe('API 3: GET All Brands List', () => {
  test('should return all brands successfully', async ({ request }) => {
    const getAllBrandsResponse = await request.get(process.env.BASE_URL + '/brandsList');

    expect(getAllBrandsResponse.status()).toBe(200);

    const getAllBrandsResponseBody = await getAllBrandsResponse.json();

    AllBrandsResponseSchema.parse(getAllBrandsResponseBody);
    expect(getAllBrandsResponseBody.brands).toBeDefined();
  });
});
