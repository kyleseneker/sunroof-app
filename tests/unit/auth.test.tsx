import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/auth';

// Mock supabase
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithOtp = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (callback: any) => {
        mockOnAuthStateChange(callback);
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      },
      signInWithOtp: (params: any) => mockSignInWithOtp(params),
      signOut: () => mockSignOut(),
    },
  },
}));

// Test component to access auth context
function TestConsumer() {
  const { user, session, loading, signInWithEmail, signOut } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="user">{user?.email || 'no user'}</div>
      <div data-testid="session">{session ? 'has session' : 'no session'}</div>
      <button onClick={() => signInWithEmail('test@example.com')}>Sign In</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}

describe('Auth Context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignInWithOtp.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({ error: null });
  });

  it('provides auth context to children', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('starts with loading state', async () => {
    mockGetSession.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });
    
    expect(screen.getByTestId('loading').textContent).toBe('loading');
  });

  it('shows no user when not authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('no user');
    });
  });

  it('shows user when authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { email: 'test@example.com' },
        },
      },
    });
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
    });
  });

  it('throws error when useAuth is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleError.mockRestore();
  });

  it('calls signInWithOtp with correct params', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('loaded');
    });
    
    const signInButton = screen.getByText('Sign In');
    
    await act(async () => {
      signInButton.click();
    });
    
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: expect.objectContaining({
        emailRedirectTo: expect.stringContaining('/auth/callback'),
      }),
    });
  });

  it('calls signOut on sign out button click', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { email: 'test@example.com' },
        },
      },
    });
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
    });
    
    const signOutButton = screen.getByText('Sign Out');
    
    await act(async () => {
      signOutButton.click();
    });
    
    expect(mockSignOut).toHaveBeenCalled();
  });
});

