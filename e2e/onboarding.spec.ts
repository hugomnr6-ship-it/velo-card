import { test, expect } from '@playwright/test';

test('onboarding redirects when not authenticated', async ({ page }) => {
  await page.goto('/onboarding');
  // Should redirect to home
  expect(page.url()).not.toContain('/onboarding');
});
