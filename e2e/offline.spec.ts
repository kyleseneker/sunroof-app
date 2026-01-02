import { test, expect } from '@playwright/test';

test.describe('Offline Page', () => {
  test('should display offline message and retry button', async ({ page }) => {
    await page.goto('/offline');
    
    // Check for offline icon indication (WifiOff in the component)
    await expect(page.getByRole('heading', { name: /offline/i })).toBeVisible();
    
    // Check for retry button
    const retryButton = page.getByRole('button', { name: /try again/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();
  });

  test('should display helpful message', async ({ page }) => {
    await page.goto('/offline');
    
    await expect(page.getByText(/check your internet connection/i)).toBeVisible();
  });

  test('should have proper styling on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/offline');
    
    await expect(page.getByRole('heading', { name: /offline/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  });

  test('should have proper styling on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/offline');
    
    await expect(page.getByRole('heading', { name: /offline/i })).toBeVisible();
  });

  test('should have centered content', async ({ page }) => {
    await page.goto('/offline');
    
    // The main container should be flex with centered content
    const container = page.locator('.fixed.inset-0');
    await expect(container).toBeVisible();
  });
});

test.describe('Service Worker', () => {
  test('should have service worker file accessible', async ({ page }) => {
    const response = await page.goto('/sw.js');
    expect(response?.status()).toBe(200);
  });

  test('should have valid manifest', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    
    const manifest = await response?.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('start_url');
    expect(manifest).toHaveProperty('display');
  });
});

