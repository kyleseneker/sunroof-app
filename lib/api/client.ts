/**
 * API client with automatic CSRF headers and error handling
 */

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

const CSRF_HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  'X-Sunroof-Client': '1',
};

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {} } = options;

  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        ...CSRF_HEADERS,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        error: data?.error || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return {
      data: data as T,
      status: response.status,
    };
  } catch (err) {
    console.error('[API Client] Request failed:', err);
    return {
      error: 'Network error. Please check your connection.',
      status: 0,
    };
  }
}

export const api = {
  get: <T = unknown>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'GET', headers }),

  post: <T = unknown>(endpoint: string, body: Record<string, unknown>, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'POST', body, headers }),

  put: <T = unknown>(endpoint: string, body: Record<string, unknown>, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'PUT', body, headers }),

  delete: <T = unknown>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'DELETE', headers }),
};
