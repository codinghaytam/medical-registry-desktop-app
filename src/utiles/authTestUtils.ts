import { fetchWithAuth } from '../services/authService';
import { authService } from '../services/authService';

/**
 * Utility functions for testing authentication error handling
 * These should only be used for development/testing purposes
 */

export const authTestUtils = {
  /**
   * Test the authentication error handling by making a request with an invalid token
   */
  testInvalidToken: async () => {
    try {
      // Save current token
      const currentToken = sessionStorage.getItem('access_token');
      
      // Set an invalid token
      sessionStorage.setItem('access_token', 'invalid-token-for-testing');
      
      // Try to make a request - this should trigger the 401 error handling
      await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/patient`);
      
      // Restore original token (this line should not be reached)
      if (currentToken) {
        sessionStorage.setItem('access_token', currentToken);
      }
    } catch (error: any) {
      console.log('Authentication error test completed:', error?.message || 'Unknown error');
    }
  },

  /**
   * Clear all authentication data to simulate expired session
   */
  clearAuthData: () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
  },

  /**
   * Check current authentication state
   */
  checkAuthState: () => {
    const token = sessionStorage.getItem('access_token');
    const user = sessionStorage.getItem('user');
    
    console.log('Authentication state:', {
      hasToken: !!token,
      hasUser: !!user,
      tokenLength: token ? token.length : 0
    });
    
    return {
      isAuthenticated: !!(token && user),
      token: token ? `${token.substring(0, 10)}...` : null
    };
  },

  /**
   * Test function to simulate an authentication error
   */
  testAuthError: async (): Promise<void> => {
    try {
      // This should trigger a 401/403 and redirect to login
      console.log('Testing authentication error handling...');
      await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/patient`);
    } catch (error) {
      console.log('Auth error test completed:', error);
    }
  },

  /**
   * Test function to verify Keycloak logout functionality
   */
  testKeycloakLogout: async (): Promise<void> => {
    try {
      console.log('Testing Keycloak logout...');
      await authService.logoutFromKeycloak();
      console.log('Keycloak logout test completed');
    } catch (error) {
      console.error('Keycloak logout test failed:', error);
    }
  }
};

// Make it available in development mode
if (import.meta.env.DEV) {
  (window as any).authTestUtils = authTestUtils;
  console.log('Authentication test utilities available at window.authTestUtils');
}
