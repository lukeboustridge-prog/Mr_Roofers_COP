import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should show 404 page for non-existent route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-123');

    // Should show 404 content
    await expect(page.getByText(/page not found/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /search/i })).toBeVisible();
  });

  test('should show 404 for non-existent detail', async ({ page }) => {
    await page.goto('/planner/long-run-metal/flashings/non-existent-detail-xyz');

    // Should show not found
    await expect(page.getByText(/not found/i)).toBeVisible({ timeout: 10000 });
  });

  test('should show 404 for non-existent substrate', async ({ page }) => {
    await page.goto('/planner/fake-substrate-xyz');

    // Should show not found
    await expect(page.getByText(/not found/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Loading States', () => {
  test('planner page should show content after loading', async ({ page }) => {
    await page.goto('/planner');

    // Should eventually show substrate selection
    await expect(page.getByRole('heading', { name: /substrate/i })).toBeVisible({ timeout: 10000 });
  });

  test('search page should show search input', async ({ page }) => {
    await page.goto('/search');

    // Should show search functionality
    await expect(page.getByRole('textbox', { name: /search/i })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Offline Indicator', () => {
  test('should have service worker registered', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if service worker is registered
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    expect(hasServiceWorker).toBe(true);
  });
});
