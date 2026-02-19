import { test, expect } from '@playwright/test';

test('leaderboard page loads without crash', async ({ page }) => {
  const response = await page.goto('/leaderboard');
  expect(response?.status()).toBeLessThan(500);
});
