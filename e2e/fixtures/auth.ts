import { test as base, Page } from '@playwright/test';

/**
 * Mock user data for authenticated tests
 */
export const mockUser = {
  id: 'test-user-id-12345',
  email: 'testuser@example.com',
  user_metadata: {
    display_name: 'Test User',
    full_name: 'Test User',
    avatar_url: null,
  },
  created_at: new Date().toISOString(),
};

/**
 * Mock journey data for dashboard tests
 */
export const mockActiveJourney = {
  id: 'journey-1',
  user_id: mockUser.id,
  name: 'Hawaii Trip',
  unlock_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
  status: 'active',
  memory_count: 5,
  created_at: new Date().toISOString(),
};

export const mockPastJourney = {
  id: 'journey-2',
  user_id: mockUser.id,
  name: 'Paris Adventure',
  unlock_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  status: 'completed',
  memory_count: 12,
  created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * Helper to set up mock auth state in localStorage
 * This simulates a logged-in user by setting the Supabase auth token
 */
export async function setupMockAuth(page: Page) {
  await page.addInitScript(() => {
    // Mock Supabase auth storage key
    const mockSession = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600 * 1000,
      user: {
        id: 'test-user-id-12345',
        email: 'testuser@example.com',
        user_metadata: {
          display_name: 'Test User',
          full_name: 'Test User',
        },
      },
    };
    
    // Store in localStorage with Supabase's expected key format
    localStorage.setItem('supabase-auth', JSON.stringify(mockSession));
    
    // Also mark intro as seen so we go straight to dashboard
    localStorage.setItem('sunroof_intro', 'true');
  });
}

/**
 * Extended test fixture with authenticated context
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await setupMockAuth(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';

