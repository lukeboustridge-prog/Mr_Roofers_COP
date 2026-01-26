import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.describe('Three-Click Navigation (Planner Mode)', () => {
    test('should navigate from home to substrate to category to detail', async ({ page }) => {
      // Start at planner page
      await page.goto('/planner');

      // Wait for page to load
      await expect(page.getByRole('heading', { name: /select.*substrate/i })).toBeVisible({ timeout: 10000 });

      // Click on a substrate (Long Run Metal)
      await page.getByRole('link', { name: /long run metal/i }).first().click();

      // Should be on substrate page with categories
      await expect(page).toHaveURL(/\/planner\/long-run-metal/);
      await expect(page.getByRole('heading', { name: /long run metal/i })).toBeVisible();

      // Click on a category (Flashings)
      await page.getByRole('link', { name: /flashings/i }).first().click();

      // Should be on category page with details
      await expect(page).toHaveURL(/\/planner\/long-run-metal\/flashings/);

      // Click on a detail
      const detailLink = page.getByRole('link').filter({ hasText: /LRM-F/ }).first();
      await detailLink.click();

      // Should be on detail page
      await expect(page).toHaveURL(/\/planner\/long-run-metal\/flashings\/lrm-f/);
    });

    test('should show breadcrumbs on detail page', async ({ page }) => {
      await page.goto('/planner/long-run-metal/flashings');

      // Check breadcrumbs exist
      const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i });
      await expect(breadcrumb).toBeVisible();

      // Should have links to parent levels
      await expect(breadcrumb.getByRole('link', { name: /planner/i })).toBeVisible();
      await expect(breadcrumb.getByRole('link', { name: /long run metal/i })).toBeVisible();
    });

    test('back button should return to parent page', async ({ page }) => {
      await page.goto('/planner/long-run-metal/flashings');

      // Click back button
      await page.getByRole('link', { name: /back to/i }).click();

      // Should be on substrate page
      await expect(page).toHaveURL('/planner/long-run-metal');
    });
  });

  test.describe('Fixer Mode Navigation', () => {
    test('should complete two-step context selection', async ({ page }) => {
      await page.goto('/fixer');

      // Wait for page to load
      await expect(page.getByRole('heading', { name: /fixer mode/i })).toBeVisible({ timeout: 10000 });

      // Step 1: Select substrate
      await page.getByRole('button', { name: /long run metal/i }).click();

      // Step 2: Select task
      await page.getByRole('button', { name: /flashings/i }).click();

      // Should navigate to results
      await expect(page).toHaveURL(/\/fixer\/results\?substrate=long-run-metal&task=flashings/);
    });
  });

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should show mobile bottom navigation', async ({ page }) => {
      await page.goto('/');

      // Bottom nav should be visible on mobile
      const mobileNav = page.locator('nav').filter({ has: page.getByRole('link', { name: /home/i }) }).last();
      await expect(mobileNav).toBeVisible();

      // Should have main nav items
      await expect(page.getByRole('link', { name: /search/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /fixer/i })).toBeVisible();
    });

    test('touch targets should be at least 44px', async ({ page }) => {
      await page.goto('/fixer');

      // Check substrate buttons have minimum touch target
      const substrateButton = page.getByRole('button', { name: /long run metal/i });
      const boundingBox = await substrateButton.boundingBox();

      expect(boundingBox).toBeTruthy();
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    });
  });
});
