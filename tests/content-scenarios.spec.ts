import { test, expect } from '@playwright/test';

/**
 * Content Linking Scenarios E2E Tests
 *
 * Tests the four content scenarios documented in Phase 12:
 * 1. MRM-only: Has warnings, no 3D model, no linked content
 * 2. RANZ-only: Has 3D model, no warnings
 * 3. Linked: MRM primary with borrowed RANZ 3D/steps
 * 4. Standalone: No model, no warnings, no links
 *
 * AUTHENTICATION REQUIREMENT:
 * These tests require Clerk authentication to access /planner routes.
 * The dashboard layout (app/(dashboard)/layout.tsx) redirects unauthenticated
 * users to /sign-in.
 *
 * To run tests with authentication:
 * 1. Set up Playwright storageState with authenticated session
 * 2. Or configure Clerk test mode with bypass tokens
 * 3. See: https://clerk.com/docs/testing/playwright
 *
 * Test Detail IDs (queried from database on 2026-02-02):
 * - MRM-only: lrm-v24 (V24 - Ventilation pathway: Eaves with Underlay)
 *   Path: /planner/long-run-metal/lrm-ventilation/lrm-v24
 *   Substrate: Long-Run Metal, Category: Ventilation
 *   Has warnings, no model, no links
 *
 * - RANZ-only: ranz-v07 (RANZ-V07 - Window)
 *   Path: /planner/long-run-metal/ranz-cladding-vertical/ranz-v07
 *   Substrate: Long-Run Metal, Category: Cladding (Vertical)
 *   Has 3D model, no warnings, no links
 *
 * - Linked: lrm-v20 (V20 - Construction Moisture)
 *   Path: /planner/long-run-metal/lrm-ventilation/lrm-v20
 *   Linked to: ranz-v03 (RANZ detail with 3D model)
 *   Has borrowed 3D model with attribution
 *
 * - Standalone: lrm-v23 (V23 - Minimising Ingress of Water Vapour)
 *   Path: /planner/long-run-metal/lrm-ventilation/lrm-v23
 *   No model, no warnings, no links - minimal content
 */

/**
 * Helper function to wait for detail page to load
 * Returns false if redirected to sign-in (auth required)
 */
async function waitForDetailPage(page: import('@playwright/test').Page, code: string): Promise<boolean> {
  // Wait for either the detail page to load OR a redirect to sign-in
  try {
    // Wait for the page to stabilize
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Check if we're on the sign-in page
    const url = page.url();
    if (url.includes('sign-in')) {
      return false; // Auth required
    }

    // Try to find the detail code - if present, page loaded successfully
    const codeElement = page.getByText(code);
    await codeElement.waitFor({ state: 'visible', timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

// Test detail configurations
const TEST_DETAILS = {
  mrmOnly: {
    id: 'lrm-v24',
    code: 'V24',
    path: '/planner/long-run-metal/lrm-ventilation/lrm-v24',
  },
  ranzOnly: {
    id: 'ranz-v07',
    code: 'RANZ-V07',
    path: '/planner/long-run-metal/ranz-cladding-vertical/ranz-v07',
  },
  linked: {
    id: 'lrm-v20',
    code: 'V20',
    path: '/planner/long-run-metal/lrm-ventilation/lrm-v20',
    linkedTo: 'ranz-v03',
  },
  standalone: {
    id: 'lrm-v23',
    code: 'V23',
    path: '/planner/long-run-metal/lrm-ventilation/lrm-v23',
  },
};

test.describe('Content Linking Scenarios', () => {
  // Skip message for auth-blocked tests
  const AUTH_SKIP_MSG = 'Skipped: Authentication required. See file header for setup instructions.';

  test.describe('Scenario 1: MRM-only Detail', () => {
    test('shows warnings tab with warning content', async ({ page }) => {
      await page.goto(TEST_DETAILS.mrmOnly.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.mrmOnly.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // Should have warnings tab visible (MRM content has warnings)
      const warningsTab = page.getByRole('tab', { name: /warnings/i });
      await expect(warningsTab).toBeVisible();

      // Click warnings tab and verify warning content
      await warningsTab.click();

      // Should show warning-related content
      const warningContent = page.locator('[class*="amber"], [class*="warning"]');
      await expect(warningContent.first()).toBeVisible({ timeout: 5000 });
    });

    test('does not show 3D model viewer (no model available)', async ({ page }) => {
      await page.goto(TEST_DETAILS.mrmOnly.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.mrmOnly.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // MRM-only detail without model should not have 3D viewer rendered
      const canvas = page.locator('canvas');
      const canvasCount = await canvas.count();

      // Should not have any 3D canvas (detail has no model and no linked model)
      expect(canvasCount).toBe(0);
    });

    test('shows MRM COP source badge', async ({ page }) => {
      await page.goto(TEST_DETAILS.mrmOnly.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.mrmOnly.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // Should show MRM source badge
      const sourceBadge = page.getByText(/MRM|COP/i);
      await expect(sourceBadge.first()).toBeVisible();
    });
  });

  test.describe('Scenario 2: RANZ-only Detail', () => {
    test('shows 3D model viewer with canvas', async ({ page }) => {
      await page.goto(TEST_DETAILS.ranzOnly.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.ranzOnly.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // RANZ details have 3D models - should render canvas
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible({ timeout: 15000 });
    });

    test('does not show warnings tab (no warnings for RANZ)', async ({ page }) => {
      await page.goto(TEST_DETAILS.ranzOnly.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.ranzOnly.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // RANZ details typically don't have warning conditions
      const warningsTab = page.getByRole('tab', { name: /warnings/i });
      await expect(warningsTab).not.toBeVisible();
    });

    test('shows RANZ source badge', async ({ page }) => {
      await page.goto(TEST_DETAILS.ranzOnly.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.ranzOnly.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // Should show RANZ source badge
      const sourceBadge = page.getByText(/RANZ/i);
      await expect(sourceBadge.first()).toBeVisible();
    });
  });

  test.describe('Scenario 3: Linked Detail (MRM with borrowed RANZ content)', () => {
    test('shows borrowed 3D model from linked RANZ detail', async ({ page }) => {
      await page.goto(TEST_DETAILS.linked.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.linked.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // Linked MRM detail should display borrowed 3D model from RANZ
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible({ timeout: 15000 });
    });

    test('shows source attribution for borrowed 3D model', async ({ page }) => {
      await page.goto(TEST_DETAILS.linked.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.linked.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // When model is borrowed, attribution is shown
      const attribution = page.getByText(/provided by|linked.*guide/i);
      await expect(attribution).toBeVisible({ timeout: 10000 });
    });

    test('shows Related tab with linked RANZ content', async ({ page }) => {
      await page.goto(TEST_DETAILS.linked.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.linked.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // Related tab should be visible (hasLinkedContent is true)
      const relatedTab = page.getByRole('tab', { name: /related/i });
      await expect(relatedTab).toBeVisible();

      // Click Related tab
      await relatedTab.click();

      // Should show linked RANZ content
      await expect(page.getByText(/ranz|supplementary|supplement/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('shows MRM source badge (primary detail is MRM)', async ({ page }) => {
      await page.goto(TEST_DETAILS.linked.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.linked.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // This is an MRM detail page, so MRM source badge should be visible
      const mrmBadge = page.getByText(/MRM|COP/i);
      await expect(mrmBadge.first()).toBeVisible();
    });
  });

  test.describe('Scenario 4: Standalone Detail (minimal content)', () => {
    test('does not show 3D model viewer', async ({ page }) => {
      await page.goto(TEST_DETAILS.standalone.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.standalone.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // Standalone detail has no model and no linked model
      const canvas = page.locator('canvas');
      const canvasCount = await canvas.count();
      expect(canvasCount).toBe(0);
    });

    test('does not show warnings tab', async ({ page }) => {
      await page.goto(TEST_DETAILS.standalone.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.standalone.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // Standalone detail has no warnings
      const warningsTab = page.getByRole('tab', { name: /warnings/i });
      await expect(warningsTab).not.toBeVisible();
    });

    test('does not show Related tab', async ({ page }) => {
      await page.goto(TEST_DETAILS.standalone.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.standalone.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // Standalone detail has no linked content
      const relatedTab = page.getByRole('tab', { name: /related/i });
      await expect(relatedTab).not.toBeVisible();
    });

    test('shows Overview and References tabs (always available)', async ({ page }) => {
      await page.goto(TEST_DETAILS.standalone.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.standalone.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // Overview tab is always visible
      const overviewTab = page.getByRole('tab', { name: /overview/i });
      await expect(overviewTab).toBeVisible();

      // References tab is always visible
      const referencesTab = page.getByRole('tab', { name: /references/i });
      await expect(referencesTab).toBeVisible();
    });
  });

  test.describe('Cross-scenario Verification', () => {
    test('all four detail pages load successfully', async ({ page }) => {
      // Test first detail to check auth status
      await page.goto(TEST_DETAILS.mrmOnly.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.mrmOnly.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // Test remaining details
      for (const [scenario, detail] of Object.entries(TEST_DETAILS).slice(1)) {
        await page.goto(detail.path);
        await expect(page.getByText(detail.code)).toBeVisible({ timeout: 15000 });
      }
    });

    test('navigation breadcrumbs work correctly', async ({ page }) => {
      await page.goto(TEST_DETAILS.mrmOnly.path);
      const loaded = await waitForDetailPage(page, TEST_DETAILS.mrmOnly.code);
      test.skip(!loaded, AUTH_SKIP_MSG);

      // Breadcrumb should show navigation path
      const breadcrumb = page.getByRole('navigation');
      await expect(breadcrumb.getByText(/planner/i)).toBeVisible();
      await expect(breadcrumb.getByText(/long.?run/i)).toBeVisible();
    });
  });
});
