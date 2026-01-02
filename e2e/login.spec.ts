import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display the login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check headline (split across lines)
    await expect(page.getByText('Capture now,')).toBeVisible();
    
    // Check email input
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
    
    // Check continue button (be specific to avoid matching both email and google buttons)
    await expect(page.getByRole('button', { name: /continue with email/i })).toBeVisible();
  });

  test('should show validation for empty email', async ({ page }) => {
    await page.goto('/login');
    
    // Button should be disabled when email is empty
    const continueButton = page.getByRole('button', { name: /continue with email/i });
    await expect(continueButton).toBeDisabled();
  });

  test('should enable button when email is entered', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('your@email.com');
    await emailInput.fill('test@example.com');
    
    const continueButton = page.getByRole('button', { name: /continue with email/i });
    await expect(continueButton).toBeEnabled();
  });

  test('should show How it Works modal', async ({ page }) => {
    await page.goto('/login');
    
    // Click "What is Sunroof?" link
    await page.getByText('What is Sunroof?').click();
    
    // Modal should appear with content about the app
    await expect(page.getByText('How Sunroof Works')).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: 'Got it' }).click();
    
    // Modal should be closed
    await expect(page.getByText('How Sunroof Works')).not.toBeVisible();
  });

  test('should have working legal links', async ({ page }) => {
    await page.goto('/login');
    
    // Check Privacy link
    const privacyLink = page.getByRole('link', { name: 'Privacy Policy' });
    await expect(privacyLink).toBeVisible();
    
    // Check Terms link
    const termsLink = page.getByRole('link', { name: 'Terms of Service' });
    await expect(termsLink).toBeVisible();
  });

  test('should navigate to privacy policy', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('link', { name: 'Privacy Policy' }).click();
    
    await expect(page).toHaveURL(/\/privacy/);
    await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
  });

  test('should navigate to terms of service', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('link', { name: 'Terms of Service' }).click();
    
    await expect(page).toHaveURL(/\/terms/);
    await expect(page.getByRole('heading', { name: /Terms of Service/i })).toBeVisible();
  });

  test('should accept email input', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('your@email.com');
    await emailInput.fill('test@example.com');
    
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('should show Sunroof branding', async ({ page }) => {
    await page.goto('/login');
    
    // Check for logo and brand name (uppercase via CSS)
    await expect(page.getByAltText('Sunroof')).toBeVisible();
    await expect(page.getByText('Sunroof').first()).toBeVisible();
  });

  test('should show subtitle text', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByText("Sunroof saves your moments until you're ready.")).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect from profile to login when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    
    await expect(page).toHaveURL(/\/login/);
  });
});
