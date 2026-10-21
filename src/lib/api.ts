// Centralized API client with automatic Bearer token injection and credentials support

const TOKEN_KEY = 'luxewear_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    credentials: 'include', // send cookies if supported
    headers
  });
}
