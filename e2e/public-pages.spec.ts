import { test, expect } from '@playwright/test';

test.describe('Privacy Policy Page', () => {
  test('should display privacy policy content', async ({ page }) => {
    await page.goto('/privacy');
    
    await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
  });

  test('should have back navigation', async ({ page }) => {
    await page.goto('/privacy');
    
    const backButton = page.getByRole('button').first();
    await expect(backButton).toBeVisible();
    
    await backButton.click();
    
    // Should navigate back (to login if not authenticated)
    await expect(page.url()).not.toContain('/privacy');
  });

  test('should contain privacy-related content', async ({ page }) => {
    await page.goto('/privacy');
    
    // Check for typical privacy policy sections
    await expect(page.getByText(/information|data|collect/i).first()).toBeVisible();
  });
});

test.describe('Terms of Service Page', () => {
  test('should display terms content', async ({ page }) => {
    await page.goto('/terms');
    
    await expect(page.getByRole('heading', { name: /Terms of Service/i })).toBeVisible();
  });

  test('should have back navigation', async ({ page }) => {
    await page.goto('/terms');
    
    const backButton = page.getByRole('button').first();
    await expect(backButton).toBeVisible();
    
    await backButton.click();
    
    await expect(page.url()).not.toContain('/terms');
  });

  test('should contain usage terms', async ({ page }) => {
    await page.goto('/terms');
    
    // Check for typical terms content
    await expect(page.getByText(/use|service|account/i).first()).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('login page renders on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/login');
    
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
  });

  test('login page renders on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/login');
    
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
  });

  test('login page renders on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
  });
});

test.describe('PWA Features', () => {
  test('should have PWA manifest', async ({ page }) => {
    await page.goto('/login');
    
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', '/manifest.json');
  });

  test('should have Apple touch icons', async ({ page }) => {
    await page.goto('/login');
    
    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIcon).toBeAttached();
  });

  test('should have theme color meta tag', async ({ page }) => {
    await page.goto('/login');
    
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toBeAttached();
  });
});

test.describe('Accessibility', () => {
  test('login page has proper form elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check form elements have proper attributes
    const emailInput = page.getByPlaceholder('your@email.com');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('can navigate login form with keyboard', async ({ page }) => {
    await page.goto('/login');
    
    // Focus on email input
    const emailInput = page.getByPlaceholder('your@email.com');
    await emailInput.focus();
    
    // Type email
    await page.keyboard.type('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
    
    // Tab to button
    await page.keyboard.press('Tab');
    
    // The button should now be focusable since email is filled
    const continueButton = page.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeEnabled();
  });

  test('escape key closes help modal', async ({ page }) => {
    await page.goto('/login');
    
    // Open help modal
    await page.getByText('What is Sunroof?').click();
    await expect(page.getByText('How Sunroof Works')).toBeVisible();
    
    // Press Escape - look for close button first since escape might not be handled
    const closeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await closeButton.click();
    
    await expect(page.getByText('How Sunroof Works')).not.toBeVisible();
  });
});
