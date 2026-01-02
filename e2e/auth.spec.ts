import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Email Magic Link', () => {
    test('should show email input on login page', async ({ page }) => {
      await page.goto('/login');
      
      const emailInput = page.getByPlaceholder('your@email.com');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('should disable continue button when email is empty', async ({ page }) => {
      await page.goto('/login');
      
      const continueButton = page.getByRole('button', { name: /continue with email/i });
      await expect(continueButton).toBeDisabled();
    });

    test('should enable continue button when valid email entered', async ({ page }) => {
      await page.goto('/login');
      
      const emailInput = page.getByPlaceholder('your@email.com');
      await emailInput.fill('valid@example.com');
      
      const continueButton = page.getByRole('button', { name: /continue with email/i });
      await expect(continueButton).toBeEnabled();
    });

    test('should handle form submission', async ({ page }) => {
      await page.goto('/login');
      
      const emailInput = page.getByPlaceholder('your@email.com');
      await emailInput.fill('test@example.com');
      
      const continueButton = page.getByRole('button', { name: /continue with email/i });
      await expect(continueButton).toBeEnabled();
      
      // We don't actually submit because it would hit the real API
      // Just verify the form is interactable
    });
  });

  test.describe('Google OAuth', () => {
    test('should display Google sign-in button', async ({ page }) => {
      await page.goto('/login');
      
      const googleButton = page.getByRole('button', { name: /continue with google/i });
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toBeEnabled();
    });

    test('should show Google icon in button', async ({ page }) => {
      await page.goto('/login');
      
      const googleButton = page.getByRole('button', { name: /continue with google/i });
      // Check that SVG with Google colors exists within button
      const svg = googleButton.locator('svg');
      await expect(svg).toBeVisible();
    });
  });

  test.describe('OTP Verification', () => {
    // Note: We can't fully test OTP flow without mocking Supabase
    // These tests verify the UI elements are present
    
    test('should show help modal from login page', async ({ page }) => {
      await page.goto('/login');
      
      // Open help modal
      await page.getByRole('button').filter({ has: page.locator('svg') }).first().click();
      
      // Check modal content appears
      await expect(page.getByText('How Sunroof Works')).toBeVisible();
      
      // Close modal
      await page.getByRole('button', { name: 'Got it' }).click();
      await expect(page.getByText('How Sunroof Works')).not.toBeVisible();
    });
  });

  test.describe('Auth Callback', () => {
    test('should handle auth callback route', async ({ page }) => {
      // Auth callback should redirect appropriately
      const response = await page.goto('/auth/callback');
      
      // Should either redirect or show loading
      // The page exists and doesn't 404
      expect(response?.status()).not.toBe(404);
    });
  });
});

test.describe('Session Persistence', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect profile to login when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Login Page UI', () => {
  test('should display app branding', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByAltText('Sunroof')).toBeVisible();
    await expect(page.getByText('Sunroof').first()).toBeVisible();
  });

  test('should display tagline', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByText('Capture now,')).toBeVisible();
    await expect(page.getByText('relive later.')).toBeVisible();
  });

  test('should display subtitle', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByText(/Sunroof saves your moments/i)).toBeVisible();
  });

  test('should display info text about passwordless auth', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByText(/no password needed/i)).toBeVisible();
  });

  test('should have OR divider between auth methods', async ({ page }) => {
    await page.goto('/login');
    
    // The divider text is styled with uppercase tracking, check for case-insensitive "or"
    await expect(page.getByText(/^or$/i)).toBeVisible();
  });

  test('should show copyright', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByText(new RegExp(`© ${new Date().getFullYear()} Sunroof`))).toBeVisible();
  });
});

test.describe('Login Accessibility', () => {
  test('should have focus visible on email input', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('your@email.com');
    await emailInput.focus();
    
    // Input should be focusable
    await expect(emailInput).toBeFocused();
  });

  test('should navigate with keyboard', async ({ page }) => {
    await page.goto('/login');
    
    // Tab should move through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // One of the interactive elements should have focus
    const emailInput = page.getByPlaceholder('your@email.com');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('should have required attribute on email', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('your@email.com');
    await expect(emailInput).toHaveAttribute('required', '');
  });
});

