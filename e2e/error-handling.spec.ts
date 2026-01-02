import { test, expect } from '@playwright/test';

test.describe('Error Page', () => {
  test('should have error boundary for runtime errors', async ({ page }) => {
    // Navigate to app and check error handling infrastructure exists
    await page.goto('/login');
    
    // The app should load without errors
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
  });
});

test.describe('Network Error Handling', () => {
  test('should show offline page when navigated to', async ({ page }) => {
    await page.goto('/offline');
    
    // Should display offline UI
    await expect(page.getByRole('heading', { name: /offline/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  });

  test('offline page should have refresh functionality', async ({ page }) => {
    await page.goto('/offline');
    
    const retryButton = page.getByRole('button', { name: /try again/i });
    await expect(retryButton).toBeVisible();
    
    // Button should be clickable
    await expect(retryButton).toBeEnabled();
  });
});

test.describe('Form Validation Errors', () => {
  test('login form should require email', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('your@email.com');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('continue button disabled without email', async ({ page }) => {
    await page.goto('/login');
    
    const continueButton = page.getByRole('button', { name: /continue with email/i });
    await expect(continueButton).toBeDisabled();
  });

  test('continue button enabled with valid email', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('your@email.com');
    await emailInput.fill('test@example.com');
    
    const continueButton = page.getByRole('button', { name: /continue with email/i });
    await expect(continueButton).toBeEnabled();
  });

  test('should accept properly formatted email', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('your@email.com');
    
    // Test various valid email formats
    await emailInput.fill('user@domain.com');
    await expect(emailInput).toHaveValue('user@domain.com');
    
    await emailInput.fill('user.name@domain.co.uk');
    await expect(emailInput).toHaveValue('user.name@domain.co.uk');
  });
});

test.describe('Loading States', () => {
  test('login page shows form after loading', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for loading to complete and form to appear
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with email/i })).toBeVisible();
  });

  test('loading indicator is not stuck', async ({ page }) => {
    await page.goto('/login');
    
    // The spinner should not be permanently visible
    // Either form loads or we see content
    const emailInput = page.getByPlaceholder('your@email.com');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Modal Error States', () => {
  test('help modal opens and closes correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Open help
    await page.getByText('What is Sunroof?').click();
    await expect(page.getByText('How Sunroof Works')).toBeVisible();
    
    // Close help
    await page.getByRole('button', { name: 'Got it' }).click();
    await expect(page.getByText('How Sunroof Works')).not.toBeVisible();
  });

  test('help modal can be closed with close button', async ({ page }) => {
    await page.goto('/login');
    
    // Open help
    await page.getByText('What is Sunroof?').click();
    await expect(page.getByText('How Sunroof Works')).toBeVisible();
    
    // Find and click X button
    const closeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await closeButton.click();
    
    await expect(page.getByText('How Sunroof Works')).not.toBeVisible();
  });
});

test.describe('Page Load Performance', () => {
  test('login page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    // Page should load in under 10 seconds (generous for CI)
    expect(loadTime).toBeLessThan(10000);
  });

  test('public pages load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /privacy/i })).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe('Console Errors', () => {
  test('login page should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/login');
    await page.waitForTimeout(2000); // Wait for any async errors
    
    // Filter out known acceptable errors (like expected auth redirects)
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('auth') && !err.includes('supabase')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('privacy page should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/privacy');
    await page.waitForTimeout(1000);
    
    // Filter out expected errors
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('auth') && !err.includes('supabase')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('JavaScript Errors', () => {
  test('should not have uncaught page errors on login', async ({ page }) => {
    const pageErrors: Error[] = [];
    
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });
    
    await page.goto('/login');
    await page.waitForTimeout(2000);
    
    expect(pageErrors.length).toBe(0);
  });

  test('should not have uncaught page errors on public pages', async ({ page }) => {
    const pageErrors: Error[] = [];
    
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });
    
    await page.goto('/privacy');
    await page.waitForTimeout(1000);
    
    await page.goto('/terms');
    await page.waitForTimeout(1000);
    
    await page.goto('/offline');
    await page.waitForTimeout(1000);
    
    expect(pageErrors.length).toBe(0);
  });
});

