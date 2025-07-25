import { fetch } from '@tauri-apps/plugin-http';

const AUTH_URL = `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}/protocol/openid-connect/token`;
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET;

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
}

class AuthService {
  private tokenExpiryTime: number | null = null;
  private refreshTokenExpiryTime: number | null = null;
  private refreshTokenTimeoutId: number | null = null;

  constructor() {
    // Initialize expiry times when service is created
    const token = this.getToken();
    if (token) {
      this.setTokenExpiry(token);
      this.scheduleTokenRefresh();
    }
  }

  // Get token from sessionStorage
  getToken(): AuthToken | null {
    const accessToken = sessionStorage.getItem('access_token');
    const refreshToken = sessionStorage.getItem('refresh_token');
    if (!accessToken || !refreshToken) return null;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 0,
      refresh_expires_in: 0,
      token_type: 'Bearer',
      scope: ''
    };
  }

  // Set token in sessionStorage and update expiry times
  setToken(token: AuthToken): void {
    sessionStorage.setItem('access_token', token.access_token);
    sessionStorage.setItem('refresh_token', token.refresh_token);
    this.setTokenExpiry(token);
    this.scheduleTokenRefresh();
  }

  // Calculate and store token expiry times
  private setTokenExpiry(token: AuthToken): void {
    const currentTime = Date.now();
    this.tokenExpiryTime = currentTime + (token.expires_in * 1000);
    this.refreshTokenExpiryTime = currentTime + (token.refresh_expires_in * 1000);
  }

  // Log out user from Keycloak and clear local data
  async logoutFromKeycloak(): Promise<void> {
    try {
      const token = this.getToken();
      
      if (token?.refresh_token) {
        // Call Keycloak logout endpoint - correct path structure
        const keycloakLogoutUrl = `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}/protocol/openid-connect/logout`;
        
        const formData = new URLSearchParams();
        formData.append('client_id', CLIENT_ID);
        formData.append('refresh_token', token.refresh_token);
        
        await fetch(keycloakLogoutUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });
        
        console.log('Successfully logged out from Keycloak');
      }
    } catch (error) {
      console.error('Error during Keycloak logout:', error);
      // Continue with local logout even if Keycloak logout fails
    } finally {
      // Always perform local cleanup
      this.logout();
    }
  }

  // Log out user by clearing token and related data (local cleanup only)
  logout(): void {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    this.tokenExpiryTime = null;
    this.refreshTokenExpiryTime = null;
    if (this.refreshTokenTimeoutId) {
      window.clearTimeout(this.refreshTokenTimeoutId);
      this.refreshTokenTimeoutId = null;
    }
    // Use postMessage to communicate logout to the app
    window.postMessage({ type: 'LOGOUT' }, '*');
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    return !this.tokenExpiryTime || Date.now() > this.tokenExpiryTime;
  }

  // Schedule token refresh before it expires
  private scheduleTokenRefresh(): void {
    if (!this.tokenExpiryTime) return;

    // Clear any existing timeout
    if (this.refreshTokenTimeoutId) {
      window.clearTimeout(this.refreshTokenTimeoutId);
    }

    // Calculate time until refresh (30 seconds before expiry)
    const timeUntilRefresh = Math.max(0, this.tokenExpiryTime - Date.now() - 30000);
    
    // Schedule refresh
    this.refreshTokenTimeoutId = window.setTimeout(() => {
      this.refreshToken();
    }, timeUntilRefresh);
  }

  // Authenticate with client credentials
  async authenticate(): Promise<AuthToken> {
    const headers = new Headers();
    headers.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "client_credentials");
    urlencoded.append("client_id", CLIENT_ID);
    urlencoded.append("client_secret", CLIENT_SECRET);

    const response = await fetch(AUTH_URL, {
      method: "POST",
      headers: headers,
      body: urlencoded.toString()
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const token = await response.json() as AuthToken;
    this.setToken(token);
    return token;
  }

  // Refresh token using the refresh_token
  async refreshToken(): Promise<void> {
    try {
      const currentToken = this.getToken();
      if (!currentToken) {
        this.logout();
        return;
      }

      // If refresh token is expired, re-authenticate
      if (this.refreshTokenExpiryTime && Date.now() > this.refreshTokenExpiryTime) {
        await this.authenticate();
        return;
      }

      const headers = new Headers();
      headers.append("Content-Type", "application/x-www-form-urlencoded");

      const urlencoded = new URLSearchParams();
      urlencoded.append("grant_type", "refresh_token");
      urlencoded.append("client_id", CLIENT_ID);
      urlencoded.append("client_secret", CLIENT_SECRET);
      urlencoded.append("refresh_token", currentToken.refresh_token);

      const response = await fetch(AUTH_URL, {
        method: "POST",
        headers: headers,
        body: urlencoded.toString()
      });

      if (!response.ok) {
        // If refresh fails, try client authentication directly
        await this.authenticate();
        return;
      }

      const token = await response.json() as AuthToken;
      this.setToken(token);
    } catch (error) {
      console.error("Failed to refresh token:", error);
      // In case of error, try to authenticate again
      try {
        await this.authenticate();
      } catch (authError) {
        console.error("Failed to re-authenticate:", authError);
        this.logout();
      }
    }
  }

  // Ensure we have a valid token
  async ensureAuthenticated(): Promise<string> {
    if (this.isTokenExpired()) {
      await this.refreshToken();
    }
    
    const token = this.getToken();
    if (!token) {
      await this.authenticate();
      const newToken = this.getToken();
      if (!newToken) throw new Error("Authentication failed");
      return newToken.access_token;
    }
    
    return token.access_token;
  }
}

export const authService = new AuthService();

/**
 * Utility function to add authorization header to fetch requests
 * @param options - The fetch options to modify
 * @returns Modified fetch options with authorization header
 */
export const  withAuthHeader = (options: RequestInit = {}): RequestInit => {
  const token = authService.getToken();
  if (token?.access_token) {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token.access_token}`);
    return { ...options, headers: Object.fromEntries(headers.entries()) };
  }
  return options;
};

/**
 * Enhanced fetch function that automatically handles 401/403 errors
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const response = await fetch(url, withAuthHeader(options));
  
  if (response.status === 401 || response.status === 403) {
    // Perform proper Keycloak logout (async, but don't wait for it to complete)
    authService.logoutFromKeycloak().catch(error => {
      console.error('Error during automatic logout:', error);
    });
    
    // Redirect to login page immediately
    window.location.href = '/login';
    
    // Throw error to prevent further processing
    throw Object.assign(new Error('Session expired. Redirecting to login...'), { 
      response,
      status: response.status
    });
  }
  
  return response;
};

export default authService;