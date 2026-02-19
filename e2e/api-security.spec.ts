import { test, expect } from '@playwright/test';

test('protected endpoints return 401 without auth', async ({ request }) => {
  const endpoints = ['/api/profile', '/api/duels', '/api/coins', '/api/quests'];

  for (const endpoint of endpoints) {
    const response = await request.get(endpoint);
    expect(response.status()).toBe(401);
  }
});

test('POST without valid origin returns 403', async ({ request }) => {
  const response = await request.post('/api/duels', {
    headers: { origin: 'https://evil.com' },
    data: {},
  });
  expect(response.status()).toBe(403);
});
