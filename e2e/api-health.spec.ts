import { test, expect } from '@playwright/test';

test('health endpoint returns 200', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBeDefined();
});
