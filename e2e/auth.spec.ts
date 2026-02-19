import { test, expect } from '@playwright/test';

test('dashboard redirects to login when not authenticated', async ({ page }) => {
  const response = await page.goto('/dashboard');
  // Should redirect to home page (sign-in)
  expect(page.url()).not.toContain('/dashboard');
});

test('profile redirects to login when not authenticated', async ({ page }) => {
  await page.goto('/profile');
  expect(page.url()).not.toContain('/profile');
});
