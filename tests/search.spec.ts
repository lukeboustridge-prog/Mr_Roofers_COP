import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.describe('Command Search (Cmd+K)', () => {
    test('should open command palette with keyboard shortcut', async ({ page }) => {
      await page.goto('/');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Press Cmd+K (or Ctrl+K on Windows)
      await page.keyboard.press('Control+k');

      // Command palette should appear
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    });

    test('should open command palette with search button click', async ({ page }) => {
      await page.goto('/');

      // Click the search button in header
      const searchButton = page.getByRole('button', { name: /search/i }).first();
      await searchButton.click();

      // Command palette should appear
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('should show quick navigation items', async ({ page }) => {
      await page.goto('/');
      await page.keyboard.press('Control+k');

      // Should show navigation options
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/quick navigation/i)).toBeVisible();
      await expect(page.getByRole('option', { name: /home/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /planner/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /fixer/i })).toBeVisible();
    });

    test('should navigate when selecting an option', async ({ page }) => {
      await page.goto('/');
      await page.keyboard.press('Control+k');

      // Click on Planner option
      await page.getByRole('option', { name: /planner/i }).click();

      // Should navigate to planner
      await expect(page).toHaveURL('/planner');
    });

    test('should search and show results', async ({ page }) => {
      await page.goto('/');
      await page.keyboard.press('Control+k');

      // Type search query
      await page.getByPlaceholder(/search/i).fill('flashing');

      // Wait for results (debounced)
      await page.waitForTimeout(300);

      // Should show search results or "Search all" option
      const searchAllOption = page.getByRole('option', { name: /search all for/i });
      await expect(searchAllOption).toBeVisible({ timeout: 5000 });
    });

    test('should close with Escape key', async ({ page }) => {
      await page.goto('/');
      await page.keyboard.press('Control+k');

      await expect(page.getByRole('dialog')).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Search Page', () => {
    test('should search from search page', async ({ page }) => {
      await page.goto('/search');

      // Enter search query
      await page.getByRole('searchbox').fill('ridge');
      await page.getByRole('searchbox').press('Enter');

      // URL should update with query
      await expect(page).toHaveURL(/\/search\?q=ridge/);
    });

    test('should show search results', async ({ page }) => {
      await page.goto('/search?q=flashing');

      // Wait for results to load
      await page.waitForLoadState('networkidle');

      // Should show results or "no results" message
      const hasResults = await page.getByText(/result/i).isVisible();
      expect(hasResults).toBeTruthy();
    });
  });
});
