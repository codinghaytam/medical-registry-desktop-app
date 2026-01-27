import { fetch } from '@tauri-apps/plugin-http';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_API_URL = `${API_BASE_URL}/auth`;

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope?: string;
}

export interface AuthenticatedUser {
  id: string | null;
  email: string | null;
  username: string | null;
  roles: string[];
  fallbackRole?: string | null;
  keycloakId?: string | null;
}

export interface AuthResponse extends AuthToken {
  user?: AuthenticatedUser;
}

class AuthService {
  private refreshing: Promise<void> | null = null;
  private tokenExpiryTime: number | null = null;
  private refreshTokenExpiryTime: number | null = null;
  private refreshTokenTimeoutId: number | null = null;

  constructor() {
    const token = this.getToken();
    if (token) {
      this.scheduleTokenRefresh();
    }
  }

  getToken(): AuthToken | null {
    const accessToken = sessionStorage.getItem('access_token');
    const refreshToken = sessionStorage.getItem('refresh_token');
    const expiresAt = sessionStorage.getItem('expires_at');
    const refreshExpiresAt = sessionStorage.getItem('refresh_expires_at');

    if (!accessToken || !refreshToken || !expiresAt) return null;

    const currentTime = Date.now();
    this.tokenExpiryTime = parseInt(expiresAt);
    this.refreshTokenExpiryTime = refreshExpiresAt ? parseInt(refreshExpiresAt) : null;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: Math.max(0, Math.floor((this.tokenExpiryTime - currentTime) / 1000)),
      refresh_expires_in: this.refreshTokenExpiryTime ? Math.max(0, Math.floor((this.refreshTokenExpiryTime - currentTime) / 1000)) : 0,
      token_type: 'Bearer',
      scope: ''
    };
  }

  setToken(token: AuthToken): void {
    const currentTime = Date.now();
    this.tokenExpiryTime = currentTime + token.expires_in * 1000;
    this.refreshTokenExpiryTime = currentTime + token.refresh_expires_in * 1000;

    sessionStorage.setItem('access_token', token.access_token);
    sessionStorage.setItem('refresh_token', token.refresh_token);
    sessionStorage.setItem('expires_at', this.tokenExpiryTime.toString());
    sessionStorage.setItem('refresh_expires_at', this.refreshTokenExpiryTime.toString());

    this.scheduleTokenRefresh();
        // Notify other parts of the app (same window) that auth changed
        try {
          window.dispatchEvent(new Event('auth:changed'));
        } catch (e) {
          // ignore in non-browser environments
        }
  }

  async loginWithCredentials(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${AUTH_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data = (await response.json()) as AuthResponse;
    this.setToken(data);
    if (data.user) {
      sessionStorage.setItem('user', JSON.stringify({ user: data.user }));
    }
    return data;
  }

  async logoutFromKeycloak(): Promise<void> {
    try {
      const token = this.getToken();
      if (token?.refresh_token) {
        await fetch(`${AUTH_API_URL}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: token.refresh_token })
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.logout();
    }
  }

  logout(): void {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('expires_at');
    sessionStorage.removeItem('refresh_expires_at');

    this.tokenExpiryTime = null;
    this.refreshTokenExpiryTime = null;
    if (this.refreshTokenTimeoutId) {
      window.clearTimeout(this.refreshTokenTimeoutId);
      this.refreshTokenTimeoutId = null;
    }
    window.postMessage({ type: 'LOGOUT' }, '*');
    try {
      window.dispatchEvent(new Event('auth:changed'));
    } catch (e) {
      // ignore in non-browser environments
    }
  }

  isTokenExpired(): boolean {
    // Check if token expires within the next 10 seconds (buffer)
    return !this.tokenExpiryTime || Date.now() > (this.tokenExpiryTime - 10000);
  }

  private scheduleTokenRefresh(): void {
    if (!this.tokenExpiryTime) return;

    if (this.refreshTokenTimeoutId) {
      window.clearTimeout(this.refreshTokenTimeoutId);
    }

    // Refresh 30 seconds before expiry
    const timeUntilRefresh = Math.max(0, this.tokenExpiryTime - Date.now() - 30000);

    this.refreshTokenTimeoutId = window.setTimeout(() => {
      this.refreshToken().catch((error) => {
        console.error('Automatic refresh failed:', error);
        this.logout();
      });
    }, timeUntilRefresh);
  }

  async refreshToken(): Promise<void> {
    // If a refresh is already in progress, wait for it
    if (this.refreshing) {
      return this.refreshing;
    }

    const currentToken = this.getToken();
    if (!currentToken) {
      this.logout();
      return;
    }

    if (this.refreshTokenExpiryTime && Date.now() > this.refreshTokenExpiryTime) {
      this.logout();
      throw new Error('Session expired');
    }

    this.refreshing = (async () => {
      try {
        const response = await fetch(`${AUTH_API_URL}/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: currentToken.refresh_token })
        });

        if (!response.ok) {
          throw new Error('Refresh failed');
        }

        const data = (await response.json()) as AuthResponse;
        this.setToken(data);

        if (data.user) {
          const existingUserStr = sessionStorage.getItem('user');
          const existingUser = existingUserStr ? JSON.parse(existingUserStr).user : {};

          // Merge: priority to new data, but keep existing specific fields
          const mergedUser = {
            ...existingUser,
            ...data.user
          };

          sessionStorage.setItem('user', JSON.stringify({ user: mergedUser }));
        }
      } catch (error) {
        this.logout();
        throw new Error('Session expired');
      } finally {
        this.refreshing = null;
      }
    })();

    return this.refreshing;
  }

  async ensureAuthenticated(): Promise<string> {
    if (this.isTokenExpired()) {
      await this.refreshToken();
    }

    const token = this.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    return token.access_token;
  }
}

export const authService = new AuthService();

export const withAuthHeader = (options: RequestInit = {}): RequestInit => {
  const token = authService.getToken();
  if (token?.access_token) {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token.access_token}`);
    return { ...options, headers: Object.fromEntries(headers.entries()) };
  }
  return options;
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  try {
    // Proactively refresh if token is expired or about to expire
    await authService.ensureAuthenticated();
  } catch (authError) {
    console.error('Authentication check failed before fetch:', authError);
    window.location.href = '/login';
    throw authError; // Stop the fetch
  }

  const response = await fetch(url, withAuthHeader(options));

  if (response.status === 401 || response.status === 403) {
    // If we still get a 401, the token might have been revoked server-side
    authService.logoutFromKeycloak().catch((error) => {
      console.error('Error during automatic logout:', error);
    });

    window.location.href = '/login';
    throw Object.assign(new Error('Session expired. Redirecting to login...'), {
      response,
      status: response.status
    });
  }

  return response;
};

export default authService;
