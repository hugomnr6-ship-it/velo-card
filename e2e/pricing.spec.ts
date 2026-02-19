import { test, expect } from '@playwright/test';

test('pricing page loads and shows plans', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.locator('body')).toContainText('Gratuit');
  await expect(page.locator('body')).toContainText('Pro');
});
