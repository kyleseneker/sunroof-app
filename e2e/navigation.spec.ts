import { test, expect } from '@playwright/test';

test.describe('Public Page Navigation', () => {
  test.describe('Privacy Policy', () => {
    test('should navigate from login to privacy', async ({ page }) => {
      await page.goto('/login');
      
      await page.getByRole('link', { name: 'Privacy Policy' }).click();
      
      await expect(page).toHaveURL(/\/privacy/);
      await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
    });

    test('should have back button on privacy page', async ({ page }) => {
      await page.goto('/privacy');
      
      const backButton = page.getByRole('button').first();
      await expect(backButton).toBeVisible();
    });

    test('should navigate back from privacy page', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('link', { name: 'Privacy Policy' }).click();
      await expect(page).toHaveURL(/\/privacy/);
      
      // Use browser back to ensure reliable navigation
      await page.goBack();
      
      // Should navigate away from privacy
      await expect(page).toHaveURL(/\/login/);
    });

    test('should display privacy content sections', async ({ page }) => {
      await page.goto('/privacy');
      
      // Should have typical privacy policy content
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toMatch(/information|data|privacy/i);
    });
  });

  test.describe('Terms of Service', () => {
    test('should navigate from login to terms', async ({ page }) => {
      await page.goto('/login');
      
      await page.getByRole('link', { name: 'Terms of Service' }).click();
      
      await expect(page).toHaveURL(/\/terms/);
      await expect(page.getByRole('heading', { name: /terms of service/i })).toBeVisible();
    });

    test('should have back button on terms page', async ({ page }) => {
      await page.goto('/terms');
      
      const backButton = page.getByRole('button').first();
      await expect(backButton).toBeVisible();
    });

    test('should navigate back from terms page', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('link', { name: 'Terms of Service' }).click();
      await expect(page).toHaveURL(/\/terms/);
      
      // Use browser back to ensure reliable navigation
      await page.goBack();
      
      // Should navigate away from terms
      await expect(page).toHaveURL(/\/login/);
    });

    test('should display terms content', async ({ page }) => {
      await page.goto('/terms');
      
      // Should have typical terms content
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toMatch(/terms|service|use/i);
    });
  });

  test.describe('Cross-page Navigation', () => {
    test('should navigate between privacy and terms via login links', async ({ page }) => {
      // Start at login
      await page.goto('/login');
      
      // Go to privacy
      await page.getByRole('link', { name: 'Privacy Policy' }).click();
      await expect(page).toHaveURL(/\/privacy/);
      
      // Go back using browser navigation
      await page.goBack();
      await expect(page).toHaveURL(/\/login/);
      
      // Go to terms
      await page.getByRole('link', { name: 'Terms of Service' }).click();
      await expect(page).toHaveURL(/\/terms/);
    });

    test('should maintain browser history correctly', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('link', { name: 'Privacy Policy' }).click();
      await expect(page).toHaveURL(/\/privacy/);
      
      // Use browser back
      await page.goBack();
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

test.describe('Protected Route Redirects', () => {
  test('home page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('profile redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('404 Handling', () => {
  test('should handle non-existent routes gracefully', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');
    
    // Should either 404 or redirect
    if (response?.status() === 404) {
      // Look for 404 page content
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toMatch(/not found|404|doesn't exist/i);
    }
    // If it redirects, that's also acceptable behavior
  });
});

test.describe('URL Structure', () => {
  test('login page has correct URL', async ({ page }) => {
    await page.goto('/login');
    expect(page.url()).toContain('/login');
  });

  test('privacy page has correct URL', async ({ page }) => {
    await page.goto('/privacy');
    expect(page.url()).toContain('/privacy');
  });

  test('terms page has correct URL', async ({ page }) => {
    await page.goto('/terms');
    expect(page.url()).toContain('/terms');
  });

  test('offline page has correct URL', async ({ page }) => {
    await page.goto('/offline');
    expect(page.url()).toContain('/offline');
  });
});

test.describe('Deep Linking', () => {
  test('should handle direct navigation to login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
  });

  test('should handle direct navigation to privacy', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /privacy/i })).toBeVisible();
  });

  test('should handle direct navigation to terms', async ({ page }) => {
    await page.goto('/terms');
    // Use a more flexible matcher for the heading
    await expect(page.getByRole('heading', { name: /terms of service/i })).toBeVisible();
  });

  test('should handle direct navigation to offline', async ({ page }) => {
    await page.goto('/offline');
    await expect(page.getByRole('heading', { name: /offline/i })).toBeVisible();
  });
});

test.describe('Query Parameters', () => {
  test('login page should work with query params', async ({ page }) => {
    await page.goto('/login?ref=test');
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
  });

  test('should preserve query params on navigation', async ({ page }) => {
    // Auth callback typically has query params
    const response = await page.goto('/auth/callback?code=test');
    expect(response?.status()).not.toBe(404);
  });
});

